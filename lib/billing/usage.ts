// Transaction-Based Billing Utilities
// Handles usage tracking, limit enforcement, and tier management

import { createClient } from '@/lib/supabase/server'

export type SubscriptionTier = 'starter' | 'growth' | 'business' | 'enterprise'
export type TransactionType = 'earn' | 'redeem' | 'otp'

// Tier configurations
export const TIER_LIMITS = {
    starter: 250,
    growth: 1000,
    business: 3000,
    enterprise: 10000
} as const

export const TIER_PRICES = {
    starter: 29,
    growth: 79,
    business: 149,
    enterprise: 299
} as const

export interface UsageStats {
    tier: SubscriptionTier
    limit: number
    used: number
    remaining: number
    usagePercent: number
    periodStart: string
    periodEnd: string
    isActive: boolean
    price: number
}

export interface TransactionCheckResult {
    allowed: boolean
    usage: number
    limit: number
    tier: SubscriptionTier
    errorMessage?: string
}

/**
 * Check if tenant can perform a transaction
 * Returns current usage and limit status
 */
export async function canPerformTransaction(tenantId: string): Promise<TransactionCheckResult> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .rpc('can_perform_transaction', { p_tenant_id: tenantId })
        .single()

    if (error || !data) {
        return {
            allowed: false,
            usage: 0,
            limit: 0,
            tier: 'starter',
            errorMessage: 'Failed to check transaction limit'
        }
    }

    const result: TransactionCheckResult = {
        allowed: data.allowed,
        usage: data.current_usage,
        limit: data.limit_amount,
        tier: data.tier as SubscriptionTier
    }

    if (!result.allowed) {
        result.errorMessage = `Transaction limit reached (${result.usage}/${result.limit}). Please upgrade your plan to continue.`
    }

    return result
}

/**
 * Record a transaction in usage logs
 * Automatically increments counter via database trigger
 */
export async function recordTransaction(
    tenantId: string,
    type: TransactionType,
    memberId: string,
    points?: number,
    metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    // Check limit first (though trigger will also enforce)
    const check = await canPerformTransaction(tenantId)

    if (!check.allowed) {
        return {
            success: false,
            error: check.errorMessage
        }
    }

    // Log the transaction
    const { error } = await supabase
        .from('usage_logs')
        .insert({
            tenant_id: tenantId,
            transaction_type: type,
            member_id: memberId,
            points: points || 0,
            metadata: metadata || {}
        })

    if (error) {
        return {
            success: false,
            error: `Failed to record transaction: ${error.message}`
        }
    }

    // Counter is incremented automatically by trigger on points_ledger
    // For OTP transactions, we need to manually increment
    if (type === 'otp') {
        await supabase.rpc('increment_transaction_counter', { p_tenant_id: tenantId })
    }

    return { success: true }
}

/**
 * Get comprehensive usage statistics for a tenant
 */
export async function getUsageStats(tenantId: string): Promise<UsageStats | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .rpc('get_usage_stats', { p_tenant_id: tenantId })
        .single()

    if (error || !data) {
        console.error('Failed to get usage stats:', error)
        return null
    }

    return {
        tier: data.tier as SubscriptionTier,
        limit: data.limit_amount,
        used: data.used,
        remaining: data.remaining,
        usagePercent: parseFloat(data.usage_percent) || 0,
        periodStart: data.period_start,
        periodEnd: data.period_end,
        isActive: data.is_active,
        price: TIER_PRICES[data.tier as SubscriptionTier]
    }
}

/**
 * Check if tenant should be prompted to upgrade
 * Suggests upgrade when >80% of limit used
 */
export async function shouldSuggestUpgrade(tenantId: string): Promise<{
    suggest: boolean
    currentTier: SubscriptionTier
    suggestedTier?: SubscriptionTier
    usage: number
    limit: number
    usagePercent: number
}> {
    const stats = await getUsageStats(tenantId)

    if (!stats) {
        return {
            suggest: false,
            currentTier: 'starter',
            usage: 0,
            limit: 0,
            usagePercent: 0
        }
    }

    const suggest = stats.usagePercent > 80
    let suggestedTier: SubscriptionTier | undefined

    if (suggest) {
        // Suggest next tier up
        const tierOrder: SubscriptionTier[] = ['starter', 'growth', 'business', 'enterprise']
        const currentIndex = tierOrder.indexOf(stats.tier)
        if (currentIndex < tierOrder.length - 1) {
            suggestedTier = tierOrder[currentIndex + 1]
        }
    }

    return {
        suggest,
        currentTier: stats.tier,
        suggestedTier,
        usage: stats.used,
        limit: stats.limit,
        usagePercent: stats.usagePercent
    }
}

/**
 * Get usage breakdown by transaction type
 */
export async function getUsageBreakdown(tenantId: string, days: number = 30) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('usage_logs')
        .select('transaction_type, points')
        .eq('tenant_id', tenantId)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

    if (error || !data) {
        return { earn: 0, redeem: 0, otp: 0 }
    }

    const breakdown = data.reduce((acc, log) => {
        acc[log.transaction_type] = (acc[log.transaction_type] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    return {
        earn: breakdown.earn || 0,
        redeem: breakdown.redeem || 0,
        otp: breakdown.otp || 0
    }
}

/**
 * Get billing history for a tenant
 */
export async function getBillingHistory(tenantId: string, limit: number = 12) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('billing_history')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('period_start', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Failed to get billing history:', error)
        return []
    }

    return data
}

/**
 * Check if tenant needs urgent attention (>95% usage)
 */
export async function needsUrgentAttention(tenantId: string): Promise<boolean> {
    const stats = await getUsageStats(tenantId)
    return stats ? stats.usagePercent >= 95 : false
}
