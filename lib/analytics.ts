import { createHash } from 'crypto'

// k-anonymity helper
const SALT = process.env.ANALYTICS_SALT || 'default-salt-change-me'

export function anonymizeUser(userId: string) {
    return createHash('sha256').update(userId + SALT).digest('hex')
}

export async function logAnalyticsEvent(event: string, userId: string, metadata: any = {}) {
    const anonymizedId = await anonymizeUser(userId)
    // In production, send to PostHog / Mixpanel / Supabase Table
    console.log(`[Analytics] ${event} - User: ${anonymizedId}`, metadata)
}

import { createClient } from '@/lib/supabase/server'

export async function getAnalyticsData(range: '7d' | '30d' = '7d') {
    const supabase = await createClient()
    const days = range === '7d' ? 7 : 30
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - days)

    // 1. Get Total Members and Active Rewards
    const { data: profiles } = await supabase.from('profiles').select('id, role, created_at')
    const totalMembers = profiles?.filter(p => p.role === 'member').length || 0
    const { data: rewards } = await supabase.from('rewards').select('id, is_active')
    const activeRewards = rewards?.filter(r => r.is_active).length || 0

    // 2. Get Points Ledger Data for Metrics
    const { data: ledgerData } = await supabase
        .from('points_ledger')
        .select('created_at, points, type')
        .gte('created_at', daysAgo.toISOString())
        .order('created_at', { ascending: true })

    // 3. Calculate Daily Metrics
    const dailyMap = new Map<string, any>()

    for (let i = 0; i < days; i++) {
        const date = new Date()
        date.setDate(date.getDate() - (days - i - 1))
        const dateStr = date.toISOString().slice(0, 10)

        dailyMap.set(dateStr, {
            date: dateStr,
            points_earned: 0,
            points_redeemed: 0,
            transactions: 0,
            active_members: 0
        })
    }

    // Populate daily metrics from ledger
    ledgerData?.forEach(entry => {
        const dateStr = entry.created_at.slice(0, 10)
        const metrics = dailyMap.get(dateStr)
        if (metrics) {
            metrics.transactions++
            if (entry.type === 'earn' && entry.points > 0) {
                metrics.points_earned += entry.points
            } else if (entry.type === 'redeem' && entry.points < 0) {
                metrics.points_redeemed += Math.abs(entry.points)
            }
        }
    })

    // Convert to array
    const dailyMetrics = Array.from(dailyMap.values())

    // 4. Calculate Summary Metrics
    const totalPointsEarned = dailyMetrics.reduce((sum, day) => sum + day.points_earned, 0)
    const totalPointsRedeemed = dailyMetrics.reduce((sum, day) => sum + day.points_redeemed, 0)
    const totalTransactions = dailyMetrics.reduce((sum, day) => sum + day.transactions, 0)

    // Redemption Rate: (Points Redeemed / Points Earned) * 100
    const redemptionRate = totalPointsEarned > 0
        ? Math.round((totalPointsRedeemed / totalPointsEarned) * 100)
        : 0

    // 5. Member Growth (members created in period)
    const newMembersInPeriod = profiles?.filter(p =>
        p.role === 'member' && new Date(p.created_at) >= daysAgo
    ).length || 0

    return {
        dailyMetrics: dailyMetrics.map(day => ({
            date: day.date,
            points_earned: day.points_earned,
            points_redeemed: day.points_redeemed,
            transactions: day.transactions
        })),
        summary: {
            totalMembers,
            activeRewards,
            totalPointsEarned,
            totalPointsRedeemed,
            redemptionRate,
            totalTransactions,
            newMembersInPeriod
        }
    }
}
