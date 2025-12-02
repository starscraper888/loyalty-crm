import { createClient } from '@/lib/supabase/server'

/**
 * Check for suspicious activity when a user earns points.
 * Rule: Earning > 500 points in the last 5 minutes is suspicious.
 */
export async function checkTransactionAnomaly(userId: string, amount: number) {
    const supabase = await createClient()

    // 1. Check recent velocity
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data: recentTxns } = await supabase
        .from('points_ledger')
        .select('points')
        .eq('profile_id', userId)
        .eq('type', 'earn')
        .gte('created_at', fiveMinutesAgo)

    const recentTotal = (recentTxns?.reduce((sum, txn) => sum + txn.points, 0) || 0) + amount

    if (recentTotal > 500) {
        // Log anomaly
        console.warn(`[Anomaly] User ${userId} earned ${recentTotal} points in 5 mins.`)

        await supabase.from('audit_logs').insert({
            action: 'ANOMALY_DETECTED',
            details: {
                reason: 'High Velocity',
                userId,
                recentTotal,
                threshold: 500
            }
        })

        // In a real app, we might flag the user or block the transaction.
        // For now, we just return true (isAnomaly)
        return true
    }

    return false
}
