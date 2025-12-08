import { createClient } from '@/lib/supabase/server'

export interface MemberTier {
    id: string
    name: string
    min_points: number
    max_points: number | null
    multiplier: number
    color: string
    icon: string
    benefits: {
        description: string
        perks: string[]
    }
}

export async function getMemberTier(userId: string): Promise<MemberTier | null> {
    const supabase = await createClient()

    const { data: profile } = await supabase
        .from('profiles')
        .select(`
            tier_id,
            lifetime_points,
            tier:member_tiers (
                id,
                name,
                min_points,
                max_points,
                multiplier,
                color,
                icon,
                benefits
            )
        `)
        .eq('id', userId)
        .single()

    if (!profile?.tier) return null

    return profile.tier as any
}

export async function getNextTier(currentTierName: string): Promise<MemberTier | null> {
    const supabase = await createClient()

    const { data: currentTier } = await supabase
        .from('member_tiers')
        .select('min_points')
        .eq('name', currentTierName)
        .single()

    if (!currentTier) return null

    const { data: nextTier } = await supabase
        .from('member_tiers')
        .select('*')
        .gt('min_points', currentTier.min_points)
        .order('min_points', { ascending: true })
        .limit(1)
        .single()

    return nextTier as MemberTier | null
}

export async function getAllTiers(): Promise<MemberTier[]> {
    const supabase = await createClient()

    const { data } = await supabase
        .from('member_tiers')
        .select('*')
        .order('min_points', { ascending: true })

    return (data || []) as MemberTier[]
}

export function getTierProgress(lifetimePoints: number, tier: MemberTier, nextTier: MemberTier | null) {
    if (!nextTier || !tier.max_points) {
        return 100 // Max tier reached
    }

    const tierRange = tier.max_points - tier.min_points
    const currentProgress = lifetimePoints - tier.min_points

    return Math.min(100, (currentProgress / tierRange) * 100)
}

export function getPointsToNextTier(lifetimePoints: number, nextTier: MemberTier | null) {
    if (!nextTier) return 0
    return Math.max(0, nextTier.min_points - lifetimePoints)
}
