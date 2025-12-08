import { createClient } from '@/lib/supabase/server'

export async function getMyReferralCode(userId: string): Promise<string | null> {
    const supabase = await createClient()

    // Check if user already has a referral code
    const { data: existing } = await supabase
        .from('referrals')
        .select('referral_code')
        .eq('referrer_id', userId)
        .limit(1)
        .single()

    if (existing?.referral_code) {
        return existing.referral_code
    }

    // Generate new code
    const { data: code } = await supabase
        .rpc('generate_referral_code', { profile_id: userId })

    if (!code) return null

    // Create referral record
    await supabase
        .from('referrals')
        .insert({
            referrer_id: userId,
            referral_code: code,
            status: 'pending'
        })

    return code
}

export async function getReferralStats(userId: string) {
    const supabase = await createClient()

    const { data: referrals } = await supabase
        .from('referrals')
        .select(`
            *,
            referee:referee_id (
                full_name,
                created_at
            )
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })

    const total = referrals?.length || 0
    const completed = referrals?.filter(r => r.status === 'completed').length || 0
    const pending = referrals?.filter(r => r.status === 'pending').length || 0
    const totalRewards = referrals?.reduce((sum, r) => sum + (r.referrer_reward || 0), 0) || 0

    return {
        total,
        completed,
        pending,
        totalRewards,
        referrals: referrals || []
    }
}

export async function applyReferralCode(referralCode: string, refereeId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .rpc('complete_referral', {
            p_referral_code: referralCode.toUpperCase(),
            p_referee_id: refereeId
        })

    if (error) {
        return { success: false, error: error.message }
    }

    return data
}
