'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { notifyPointsIssued, notifyRewardRedeemed, notifyWelcome } from '@/lib/whatsapp/notifications'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit/middleware'
import { trackUsage } from '@/lib/usage/tracking'
import { canPerformTransaction, recordTransaction } from '@/lib/billing/usage'

/**
 * Lookup customer by OTP or phone number
 * Updated for multi-tenant: Returns membership for current staff's tenant
 */
export async function lookupCustomer(identifier: string) {
    const supabase = await createClient()

    // Get staff's tenant context
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: staffProfile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!staffProfile?.tenant_id) {
        return { error: "Staff profile not found" }
    }

    // Check if it's an OTP (6 digits)
    if (/^\d{6}$/.test(identifier)) {
        // Query member_tenants for OTP verification
        const { data: membership, error } = await supabase
            .from('member_tenants')
            .select(`
                *,
                member:profiles(id, full_name, phone, email, role)
            `)
            .eq('otp_code', identifier)
            .eq('tenant_id', staffProfile.tenant_id)
            .gt('otp_expires_at', new Date().toISOString())
            .single()

        if (error || !membership) {
            return { error: "Invalid or expired OTP" }
        }

        // Record OTP verification as a transaction
        await recordTransaction(
            staffProfile.tenant_id,
            'otp',
            membership.member.id
        )

        // Return in format expected by UI
        return {
            success: true,
            profile: {
                id: membership.member.id,
                full_name: membership.member.full_name,
                phone: membership.member.phone,
                email: membership.member.email,
                points_balance: membership.active_points, // For backward compat
                active_points: membership.active_points,
                lifetime_points: membership.lifetime_points,
                tier_id: membership.tier_id,
                membership_id: membership.id
            }
        }
    }

    // Assume it's a phone number - lookup member and their membership
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, email, role')
        .eq('phone', identifier)
        .eq('role', 'member')
        .single()

    if (profileError || !profile) {
        return { error: "Customer not found" }
    }

    // Get membership for this tenant
    const { data: membership } = await supabase
        .from('member_tenants')
        .select('*')
        .eq('member_id', profile.id)
        .eq('tenant_id', staffProfile.tenant_id)
        .single()

    if (!membership) {
        return { error: "Customer not registered with your store. Ask them to scan QR code first." }
    }

    return {
        success: true,
        profile: {
            id: profile.id,
            full_name: profile.full_name,
            phone: profile.phone,
            email: profile.email,
            points_balance: membership.active_points,
            active_points: membership.active_points,
            lifetime_points: membership.lifetime_points,
            tier_id: membership.tier_id,
            membership_id: membership.id
        }
    }
}

/**
 * Issue points to a member
 * Updated for multi-tenant: Updates member_tenants table
 */
export async function issuePoints(profileId: string, points: number, description: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "User not logged in" }
    }

    // Get tenant_id from staff profile
    const { data: staffProfile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (profileError || !staffProfile) {
        return { error: `Profile Error: ${profileError?.message}` }
    }

    // Enforce role check
    if (!['staff', 'admin', 'owner', 'manager'].includes(staffProfile.role)) {
        return { error: `Insufficient Role: ${staffProfile.role}` }
    }

    // Check transaction limit (new billing system)
    const limitCheck = await canPerformTransaction(staffProfile.tenant_id)

    if (!limitCheck.allowed) {
        return { error: limitCheck.errorMessage || 'Transaction limit reached. Please upgrade your plan.' }
    }

    // Get member's membership for this tenant
    const { data: membership, error: membershipError } = await supabase
        .from('member_tenants')
        .select('id, active_points, lifetime_points')
        .eq('member_id', profileId)
        .eq('tenant_id', staffProfile.tenant_id)
        .single()

    if (membershipError || !membership) {
        return { error: "Member not found in your store. Ask them to scan QR code first." }
    }

    // Calculate points with expiry (365 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 365)

    // Insert points transaction
    const { error: ledgerError } = await supabase
        .from('points_ledger')
        .insert({
            tenant_id: staffProfile.tenant_id,
            profile_id: profileId,
            points: points,
            type: 'earn',
            description: description || 'In-store Purchase',
            expires_at: expiresAt.toISOString()
        })

    if (ledgerError) {
        return { error: `Transaction failed: ${ledgerError.message}` }
    }

    // Update member_tenants with new points
    const newActivePoints = membership.active_points + points
    const newLifetimePoints = membership.lifetime_points + points

    const { error: updateError } = await supabase
        .from('member_tenants')
        .update({
            active_points: newActivePoints,
            lifetime_points: newLifetimePoints,
            updated_at: new Date().toISOString()
        })
        .eq('id', membership.id)

    if (updateError) {
        return { error: `Points update failed: ${updateError.message}` }
    }

    // Audit log
    await logAudit({
        action: AUDIT_ACTIONS.POINTS_ISSUE,
        tenantId: staffProfile.tenant_id,
        actorId: user.id,
        details: { profileId, points, description, newBalance: newActivePoints }
    })

    // Usage tracking
    await trackUsage({
        tenantId: staffProfile.tenant_id,
        increment: { transactions_count: 1 }
    })

    // Fetch customer for notification
    const { data: customerProfile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', profileId)
        .single()

    // Send WhatsApp notification
    if (customerProfile?.phone) {
        notifyPointsIssued(
            customerProfile.phone,
            customerProfile.full_name || 'Customer',
            points,
            newActivePoints,
            description
        ).catch(err => console.error('Notification failed:', err))
    }

    revalidatePath('/staff/dashboard')
    return {
        success: true,
        message: `Issued ${points} points`,
        newBalance: newActivePoints
    }
}

/**
 * Redeem reward
 * Updated for multi-tenant: Checks member_tenants.active_points
 */
export async function redeemReward(profileId: string, rewardId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "User not logged in" }

    // Get tenant_id from staff profile
    const { data: staffProfile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .single()

    if (!staffProfile) return { error: "Unauthorized" }

    // Check transaction limit (new billing system)
    const limitCheck = await canPerformTransaction(staffProfile.tenant_id)
    if (!limitCheck.allowed) {
        return { error: limitCheck.errorMessage || 'Transaction limit reached. Please upgrade your plan.' }
    }

    // Get reward details
    const { data: reward } = await supabase
        .from('rewards')
        .select('cost, name')
        .eq('id', rewardId)
        .eq('tenant_id', staffProfile.tenant_id)
        .single()

    if (!reward) return { error: "Reward not found" }

    // Check member's balance for this tenant
    const { data: membership } = await supabase
        .from('member_tenants')
        .select('id, active_points, lifetime_points')
        .eq('member_id', profileId)
        .eq('tenant_id', staffProfile.tenant_id)
        .single()

    if (!membership) {
        return { error: "Member not found in your store" }
    }

    if (membership.active_points < reward.cost) {
        return { error: "Insufficient points" }
    }

    // Deduct Points
    const { error: ledgerError } = await supabase
        .from('points_ledger')
        .insert({
            tenant_id: staffProfile.tenant_id,
            profile_id: profileId,
            points: -reward.cost,
            type: 'redeem',
            description: `Redeemed: ${reward.name}`
        })

    if (ledgerError) return { error: ledgerError.message }

    // Update member_tenants
    const newActivePoints = membership.active_points - reward.cost

    await supabase
        .from('member_tenants')
        .update({
            active_points: newActivePoints,
            updated_at: new Date().toISOString()
        })
        .eq('id', membership.id)

    // Record Redemption
    const { data: redemption, error: redemptionError } = await supabase
        .from('redemptions')
        .insert({
            tenant_id: staffProfile.tenant_id,
            profile_id: profileId,
            reward_id: rewardId,
            status: 'completed',
            redeemed_at: new Date().toISOString(),
            performed_by: user.id
        })
        .select('redemption_number')
        .single()

    if (redemptionError) {
        console.error("Redemption record failed", redemptionError)
        return { error: "Failed to record redemption" }
    }

    // Audit log
    await logAudit({
        action: AUDIT_ACTIONS.POINTS_REDEEM,
        tenantId: staffProfile.tenant_id,
        actorId: user.id,
        details: { profileId, rewardId, rewardName: reward.name, cost: reward.cost }
    })

    // Usage tracking
    await trackUsage({
        tenantId: staffProfile.tenant_id,
        increment: { transactions_count: 1 }
    })

    // Fetch customer for notification
    const { data: customerProfile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', profileId)
        .single()

    // Send WhatsApp notification
    if (customerProfile?.phone) {
        notifyRewardRedeemed(
            customerProfile.phone,
            customerProfile.full_name || 'Customer',
            reward.name,
            reward.cost,
            newActivePoints,
            redemption?.redemption_number
        ).catch(err => console.error('Notification failed:', err))
    }

    revalidatePath('/staff/dashboard')
    return {
        success: true,
        message: `Redeemed ${reward.name} (Ref #${redemption?.redemption_number})`,
        newBalance: newActivePoints
    }
}

export async function getRewards() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get tenant_id
    const { data: staffProfile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .single()

    if (!staffProfile) return []

    const { data } = await supabase
        .from('rewards')
        .select('*')
        .eq('tenant_id', staffProfile.tenant_id)
        .eq('is_active', true)
        .order('cost', { ascending: true })

    return data || []
}

/**
 * Quick create member and issue points
 * Updated for multi-tenant: Creates member_tenants entry
 */
export async function quickCreateAndIssuePoints(
    phone: string,
    fullName: string,
    points: number,
    description: string
) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Get staff context
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "User not logged in" }
    }

    const { data: staffProfile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!staffProfile) {
        return { error: "Unauthorized" }
    }

    // Verify staff has permission
    if (!['staff', 'admin', 'owner', 'manager'].includes(staffProfile.role)) {
        return { error: "Insufficient permissions" }
    }

    // Check if member already exists (platform-level)
    const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .eq('role', 'member')
        .single()

    let memberId: string

    if (existing) {
        // Member exists, check if they have membership for this tenant
        const { data: membership } = await supabase
            .from('member_tenants')
            .select('id')
            .eq('member_id', existing.id)
            .eq('tenant_id', staffProfile.tenant_id)
            .single()

        if (membership) {
            return { error: "Customer already exists in your store. Please use phone lookup instead." }
        }

        memberId = existing.id
    } else {
        // Create new member (platform-level)
        const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
            phone: phone,
            password: phone, // Temporary password
            email_confirm: true,
            user_metadata: {
                full_name: fullName || `Customer ${phone}`,
                role: 'member'
            }
        })

        if (authError || !authUser.user) {
            return { error: `Failed to create user: ${authError?.message}` }
        }

        // Update profile
        await adminSupabase
            .from('profiles')
            .update({
                full_name: fullName || `Customer ${phone}`,
                phone: phone,
                role: 'member'
            })
            .eq('id', authUser.user.id)

        memberId = authUser.user.id
    }

    // Create membership for this tenant with ZERO points initially
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 365)

    const { data: membership, error: membershipError } = await supabase
        .from('member_tenants')
        .insert({
            member_id: memberId,
            tenant_id: staffProfile.tenant_id,
            active_points: 0,  // Start with 0
            lifetime_points: 0  // Start with 0
        })
        .select('id')
        .single()

    if (membershipError) {
        return { error: `Failed to create membership: ${membershipError.message}` }
    }

    // Now issue points via ledger (proper flow)
    const { error: ledgerError } = await supabase
        .from('points_ledger')
        .insert({
            tenant_id: staffProfile.tenant_id,
            profile_id: memberId,
            points: points,
            type: 'earn',
            description: description || 'First purchase',
            expires_at: expiresAt.toISOString()
        })

    if (ledgerError) {
        return { error: `Failed to issue points: ${ledgerError.message}` }
    }

    // Update membership with points
    await supabase
        .from('member_tenants')
        .update({
            active_points: points,
            lifetime_points: points
        })
        .eq('id', membership.id)

    // Send welcome notification
    notifyWelcome(
        phone,
        fullName || 'Customer',
        points
    ).catch(err => console.error('Welcome notification failed:', err))

    revalidatePath('/staff/issue')
    revalidatePath('/admin/members')

    return {
        success: true,
        message: `New member created and ${points} points issued!`,
        newBalance: points
    }
}
