'use server'

import { createClient } from '@/lib/supabase/server'

export async function getMyProfile() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, email, points_balance, created_at, role')
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

export async function getMyTransactions() {
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

    const { data: transactions, error } = await supabase
        .from('points_ledger')
        .select('id, created_at, points, type, description')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        return { error: error.message }
    }

    return { success: true, transactions: transactions || [] }
}

export async function getAvailableRewards() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    // Get member's tenant_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role, points_balance')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'member') {
        return { error: "Access denied" }
    }

    // Get active rewards for this tenant
    const { data: rewards, error } = await supabase
        .from('rewards')
        .select('id, name, description, cost, image_url, is_active')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .order('cost', { ascending: true })

    if (error) {
        return { error: error.message }
    }

    return {
        success: true,
        rewards: rewards || [],
        myBalance: profile.points_balance
    }
}

export async function generateMyOTP() {
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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes

    // Save OTP
    const { error } = await supabase
        .from('profiles')
        .update({
            otp_code: otp,
            otp_expires_at: expiresAt
        })
        .eq('id', user.id)

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
