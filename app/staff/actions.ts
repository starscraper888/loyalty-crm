'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

    // Get tenant_id from staff profile
    const { data: staffProfile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .single()

    if (!staffProfile) return { error: "Unauthorized" }

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

    revalidatePath('/staff/dashboard')
    return { success: true, message: `Issued ${points} points` }
}

export async function redeemReward(profileId: string, rewardId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

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
    const { error: redemptionError } = await supabase
        .from('redemptions')
        .insert({
            tenant_id: staffProfile.tenant_id,
            profile_id: profileId,
            reward_id: rewardId,
            status: 'completed',
            redeemed_at: new Date().toISOString()
        })

    if (redemptionError) console.error("Redemption record failed", redemptionError)

    revalidatePath('/staff/dashboard')
    return { success: true, message: `Redeemed ${reward.name}` }
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
