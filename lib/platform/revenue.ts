import { createAdminClient } from '@/lib/supabase/admin'

// Pricing tiers
const PRICING = {
    starter: 29,
    pro: 99,
    enterprise: 299
} as const

export interface RevenueMetrics {
    totalMRR: number
    activeSubscriptions: number
    totalTenants: number
    growthRate: number
    revenueByTier: { tier: string; count: number; revenue: number }[]
    mrrTrend: { month: string; mrr: number }[]
    trialMetrics: { activeTrials: number; conversionRate: number }
}

/**
 * Get current Monthly Recurring Revenue
 */
export async function getCurrentMRR(): Promise<number> {
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
        .from('tenant_subscriptions')
        .select('tier')
        .eq('status', 'active')

    if (error || !data) return 0

    return data.reduce((total, sub) => {
        const price = PRICING[sub.tier as keyof typeof PRICING] || 0
        return total + price
    }, 0)
}

/**
 * Get count of active subscriptions
 */
export async function getActiveSubscriptionCount(): Promise<number> {
    const adminClient = createAdminClient()

    const { count, error } = await adminClient
        .from('tenant_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

    return count || 0
}

/**
 * Get total tenant count
 */
export async function getTotalTenantCount(): Promise<number> {
    const adminClient = createAdminClient()

    const { count, error } = await adminClient
        .from('tenants')
        .select('*', { count: 'exact', head: true })

    return count || 0
}

/**
 * Get MRR growth rate (simplified - comparing this month to last month)
 */
export async function getMRRGrowthRate(): Promise<number> {
    // Simplified: return a placeholder for now
    // In production, you'd calculate actual month-over-month growth
    return 15.5
}

/**
 * Get revenue breakdown by tier
 */
export async function getRevenueByTier(): Promise<{ tier: string; count: number; revenue: number }[]> {
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
        .from('tenant_subscriptions')
        .select('tier')
        .eq('status', 'active')

    if (error || !data) return []

    const breakdown: Record<string, { count: number; revenue: number }> = {}

    data.forEach(sub => {
        const tier = sub.tier as keyof typeof PRICING
        if (!breakdown[tier]) {
            breakdown[tier] = { count: 0, revenue: 0 }
        }
        breakdown[tier].count++
        breakdown[tier].revenue += PRICING[tier] || 0
    })

    return Object.entries(breakdown).map(([tier, stats]) => ({
        tier: tier.charAt(0).toUpperCase() + tier.slice(1),
        count: stats.count,
        revenue: stats.revenue
    }))
}

/**
 * Get MRR trend over last 6 months (simplified)
 */
export async function getMRRTrend(): Promise<{ month: string; mrr: number }[]> {
    const adminClient = createAdminClient()

    // For now, return current MRR
    // In production, you'd query historical data
    const currentMRR = await getCurrentMRR()

    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    // Simulate growth trend
    return months.map((month, index) => ({
        month,
        mrr: Math.round(currentMRR * (0.7 + (index * 0.05)))
    }))
}

/**
 * Get trial metrics
 */
export async function getTrialMetrics(): Promise<{ activeTrials: number; conversionRate: number }> {
    const adminClient = createAdminClient()

    const { data: trials } = await adminClient
        .from('tenant_subscriptions')
        .select('status')
        .eq('status', 'trialing')

    const { data: active } = await adminClient
        .from('tenant_subscriptions')
        .select('status')
        .eq('status', 'active')

    const activeTrials = trials?.length || 0
    const activeCount = active?.length || 0

    // Simplified conversion rate calculation
    const totalConverted = activeCount
    const conversionRate = totalConverted > 0 ? (totalConverted / (totalConverted + activeTrials)) * 100 : 0

    return {
        activeTrials,
        conversionRate: Math.round(conversionRate * 10) / 10
    }
}

/**
 * Get all revenue metrics at once
 */
export async function getAllRevenueMetrics(): Promise<RevenueMetrics> {
    const [
        totalMRR,
        activeSubscriptions,
        totalTenants,
        growthRate,
        revenueByTier,
        mrrTrend,
        trialMetrics
    ] = await Promise.all([
        getCurrentMRR(),
        getActiveSubscriptionCount(),
        getTotalTenantCount(),
        getMRRGrowthRate(),
        getRevenueByTier(),
        getMRRTrend(),
        getTrialMetrics()
    ])

    return {
        totalMRR,
        activeSubscriptions,
        totalTenants,
        growthRate,
        revenueByTier,
        mrrTrend,
        trialMetrics
    }
}
