'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { notifyPointsIssued, notifyRewardRedeemed, notifyWelcome } from '@/lib/whatsapp/notifications'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit/middleware'
import { trackUsage } from '@/lib/usage/tracking'

export async function lookupCustomer(identifier: string) {
    const supabase = await createClient()

    // Check if it's an OTP (6 digits)
    if (/^\d{6}$/.test(identifier)) {
        const { data, error } = await supabase.rpc('verify_otp', { p_otp: identifier })
        if (error) return { error: error.message }
        if (!data) return { error: "Invalid or expired OTP" }
        return { success: true, profile: data }
    }

    // Assume it's a phone number
    // Normalize phone? Assuming input matches DB format for now.
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, points_balance, tenant_id')
        .eq('phone', identifier)
        .single()

    if (error || !data) return { error: "Customer not found" }
    return { success: true, profile: data }
}

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

    if (profileError) {
        return { error: `Profile Error: ${profileError.message} (Code: ${profileError.code})` }
    }

    if (!staffProfile) {
        return { error: "Profile not found" }
    }

    // Optional: Enforce role check here if RLS doesn't cover it enough
    if (!['staff', 'admin', 'owner', 'manager'].includes(staffProfile.role)) {
        return { error: `Insufficient Role: ${staffProfile.role}` }
    }

    // Check transaction limit before processing
    const { checkUsageLimit } = await import('@/lib/usage/tracking')
    const limitCheck = await checkUsageLimit({
        tenantId: staffProfile.tenant_id,
        limitType: 'transactions'
    })

    if (!limitCheck.allowed) {
        return { error: limitCheck.message }
    }

    const { error } = await supabase
        .from('points_ledger')
        .insert({
            tenant_id: staffProfile.tenant_id,
            profile_id: profileId,
            points: points,
            type: 'earn',
            description: description || 'In-store Purchase'
        })

    if (error) return { error: error.message }

    // Audit log: Track who issued points
    await logAudit({
        action: AUDIT_ACTIONS.POINTS_ISSUE,
        tenantId: staffProfile.tenant_id,
        actorId: user.id,
        details: { profileId, points, description }
    })

    // Usage tracking: Increment transaction count
    await trackUsage({
        tenantId: staffProfile.tenant_id,
        increment: { transactions_count: 1 }
    })

    // Fetch updated customer profile for notification
    const { data: customerProfile } = await supabase
        .from('profiles')
        .select('full_name, phone, points_balance')
        .eq('id', profileId)
        .single()

    // Send WhatsApp notification (async, don't wait)
    if (customerProfile?.phone) {
        notifyPointsIssued(
            customerProfile.phone,
            customerProfile.full_name || 'Customer',
            points,
            customerProfile.points_balance,
            description
        ).catch(err => console.error('Notification failed:', err))
    }

    revalidatePath('/staff/dashboard')
    return {
        success: true,
        message: `Issued ${points} points`,
        newBalance: customerProfile?.points_balance
    }
}

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

    // 1. Check Balance
    const { data: profile } = await supabase
        .from('profiles')
        .select('points_balance')
        .eq('id', profileId)
        .single()

    const { data: reward } = await supabase
        .from('rewards')
        .select('cost, name')
        .eq('id', rewardId)
        .single()

    if (!profile || !reward) return { error: "Profile or Reward not found" }
    if (profile.points_balance < reward.cost) return { error: "Insufficient points" }

    // 2. Deduct Points
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

    // 3. Record Redemption
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

    // Audit log: Track who redeemed the reward
    await logAudit({
        action: AUDIT_ACTIONS.POINTS_REDEEM,
        tenantId: staffProfile.tenant_id,
        actorId: user.id,
        details: { profileId, rewardId, rewardName: reward.name, cost: reward.cost }
    })

    // Usage tracking: Increment transaction count
    await trackUsage({
        tenantId: staffProfile.tenant_id,
        increment: { transactions_count: 1 }
    })

    // Fetch updated customer profile for notification
    const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('full_name, phone, points_balance')
        .eq('id', profileId)
        .single()

    // Send WhatsApp notification (async, don't wait)
    if (updatedProfile?.phone) {
        notifyRewardRedeemed(
            updatedProfile.phone,
            updatedProfile.full_name || 'Customer',
            reward.name,
            reward.cost,
            updatedProfile.points_balance,
            redemption?.redemption_number
        ).catch(err => console.error('Notification failed:', err))
    }

    revalidatePath('/staff/dashboard')
    return {
        success: true,
        message: `Redeemed ${reward.name} (Ref #${redemption?.redemption_number})`,
        newBalance: updatedProfile?.points_balance
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

    // Check if member already exists
    const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .single()

    if (existing) {
        return { error: "Customer already exists. Please use phone lookup instead." }
    }

    try {
        // Create auth user with phone
        const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
            phone: phone,
            password: phone, // Default password = phone number
            email_confirm: true,
            user_metadata: {
                full_name: fullName || `Customer ${phone}`,
                tenant_id: staffProfile.tenant_id,
                role: 'member'
            }
        })

        if (authError || !authUser.user) {
            return { error: `Failed to create user: ${authError?.message}` }
        }

        // Update profile with full details
        const { error: profileError } = await adminSupabase
            .from('profiles')
            .update({
                full_name: fullName || `Customer ${phone}`,
                phone: phone,
                role: 'member',
                tenant_id: staffProfile.tenant_id
            })
            .eq('id', authUser.user.id)

        if (profileError) {
            return { error: `Profile update failed: ${profileError.message}` }
        }

        // Issue points immediately
        const { error: ledgerError } = await supabase
            .from('points_ledger')
            .insert({
                tenant_id: staffProfile.tenant_id,
                profile_id: authUser.user.id,
                points: points,
                type: 'earn',
                description: description || 'First purchase'
            })

        if (ledgerError) {
            return { error: `Failed to issue points: ${ledgerError.message}` }
        }

        // Get final profile with updated balance
        const { data: newProfile } = await supabase
            .from('profiles')
            .select('id, full_name, phone, points_balance')
            .eq('id', authUser.user.id)
            .single()

        if (!newProfile) {
            return { error: "Failed to retrieve new member profile" }
        }

        // Send welcome notification (async, don't wait)
        if (newProfile.phone) {
            notifyWelcome(
                newProfile.phone,
                newProfile.full_name || 'Customer',
                newProfile.points_balance
            ).catch(err => console.error('Welcome notification failed:', err))
        }

        revalidatePath('/staff/issue')
        revalidatePath('/admin/members')

        return {
            success: true,
            message: `New member created and ${points} points issued!`,
            profile: newProfile,
            newBalance: newProfile.points_balance
        }

    } catch (error: any) {
        console.error('Quick create error:', error)
        return { error: error.message || "Unknown error occurred" }
    }
}
