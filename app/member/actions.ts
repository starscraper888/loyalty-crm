'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Get member's profile with all tenant memberships
 * Multi-tenant: Returns platform profile + all memberships
 */
export async function getMyProfile() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
            id, 
            full_name, 
            phone, 
            email, 
            role,
            created_at,
            member_tenants (
                id,
                active_points,
                lifetime_points,
                tier_id,
                created_at,
                tenant:tenants(id, name, slug),
                tier:member_tiers(name, icon, color)
            )
        `)
        .eq('id', user.id)
        .single()

    if (error || !profile) {
        return { error: "Profile not found" }
    }

    // Verify user is a member
    if (profile.role !== 'member') {
        return { error: "Access denied - Members only" }
    }

    return { success: true, profile }
}

/**
 * Get member's transactions for a specific tenant
 * Multi-tenant: Requires tenant_id parameter
 */
export async function getMyTransactions(tenantId?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    // Verify member role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'member') {
        return { error: "Access denied" }
    }

    // Build query
    let query = supabase
        .from('points_ledger')
        .select('id, created_at, points, type, description, tenant_id')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })

    // Filter by tenant if specified
    if (tenantId) {
        query = query.eq('tenant_id', tenantId)
    }

    const { data: transactions, error } = await query

    if (error) {
        return { error: error.message }
    }

    return { success: true, transactions: transactions || [] }
}

/**
 * Get available rewards for a specific tenant
 * Multi-tenant: Requires tenant_id, returns member's balance for that tenant
 */
export async function getAvailableRewards(tenantId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    // Verify member role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'member') {
        return { error: "Access denied" }
    }

    // Get member's membership for this tenant
    const { data: membership } = await supabase
        .from('member_tenants')
        .select('active_points')
        .eq('member_id', user.id)
        .eq('tenant_id', tenantId)
        .single()

    if (!membership) {
        return { error: "You are not a member of this store" }
    }

    // Get active rewards for this tenant
    const { data: rewards, error } = await supabase
        .from('rewards')
        .select('id, name, description, cost, image_url, is_active')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('cost', { ascending: true })

    if (error) {
        return { error: error.message }
    }

    return {
        success: true,
        rewards: rewards || [],
        myBalance: membership.active_points
    }
}

/**
 * Generate OTP for a specific tenant membership
 * Multi-tenant: Stores OTP in member_tenants table
 */
export async function generateMyOTP(tenantId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    // Verify member role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, phone')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'member') {
        return { error: "Access denied" }
    }

    // Get membership for this tenant
    const { data: membership, error: membershipError } = await supabase
        .from('member_tenants')
        .select('id')
        .eq('member_id', user.id)
        .eq('tenant_id', tenantId)
        .single()

    if (membershipError || !membership) {
        return { error: "You are not a member of this store" }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes

    // Save OTP to member_tenants
    const { error } = await supabase
        .from('member_tenants')
        .update({
            otp_code: otp,
            otp_expires_at: expiresAt
        })
        .eq('id', membership.id)

    if (error) {
        return { error: "Failed to generate OTP" }
    }

    return {
        success: true,
        otp,
        expiresAt,
        phone: profile.phone
    }
}
