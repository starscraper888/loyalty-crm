import { createAdminClient } from '@/lib/supabase/admin'
import { startOfMonth } from 'date-fns'

export interface UsageIncrementParams {
    tenantId: string
    increment: {
        members_count?: number
        transactions_count?: number
        messages_sent?: number
        whatsapp_cost_cents?: number
    }
}

/**
 * Track usage metrics for subscription tier enforcement
 * Updates tenant_usage table for the current billing period
 */
export async function trackUsage({
    tenantId,
    increment,
}: UsageIncrementParams) {
    try {
        const adminClient = createAdminClient()

        // Get current period (month start)
        const periodStart = startOfMonth(new Date()).toISOString()

        // Get existing usage for this period
        const { data: existing } = await adminClient
            .from('tenant_usage')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('period_start', periodStart)
            .single()

        if (existing) {
            // Update existing record
            const updates: any = {}
            if (increment.members_count) {
                updates.members_count = (existing.members_count || 0) + increment.members_count
            }
            if (increment.transactions_count) {
                updates.transactions_count = (existing.transactions_count || 0) + increment.transactions_count
            }
            if (increment.messages_sent) {
                updates.messages_sent = (existing.messages_sent || 0) + increment.messages_sent
            }
            if (increment.whatsapp_cost_cents) {
                updates.whatsapp_cost_cents = (existing.whatsapp_cost_cents || 0) + increment.whatsapp_cost_cents
            }

            await adminClient
                .from('tenant_usage')
                .update(updates)
                .eq('id', existing.id)
        } else {
            // Create new record for this period
            await adminClient
                .from('tenant_usage')
                .insert({
                    tenant_id: tenantId,
                    period_start: periodStart,
                    members_count: increment.members_count || 0,
                    transactions_count: increment.transactions_count || 0,
                    messages_sent: increment.messages_sent || 0,
                    whatsapp_cost_cents: increment.whatsapp_cost_cents || 0,
                })
        }
    } catch (err) {
        console.error('[Usage Tracking] Failed to track usage:', err)
        // Don't throw - tracking shouldn't break operations
    }
}

/**
 * Get current usage for a tenant
 */
export async function getCurrentUsage(tenantId: string) {
    const adminClient = createAdminClient()
    const periodStart = startOfMonth(new Date()).toISOString()

    const { data } = await adminClient
        .from('tenant_usage')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('period_start', periodStart)
        .single()

    return data || {
        members_count: 0,
        transactions_count: 0,
        messages_sent: 0,
        whatsapp_cost_cents: 0,
    }
}

/**
 * Get tier limits for a subscription tier
 */
export async function getTierLimits(tier: string) {
    const adminClient = createAdminClient()

    const { data } = await adminClient
        .from('tier_limits')
        .select('*')
        .eq('tier', tier)
        .single()

    return data
}

/**
 * Check if action is allowed based on tier limits
 */
export async function checkUsageLimit({
    tenantId,
    limitType,
}: {
    tenantId: string
    limitType: 'members' | 'transactions' | 'messages'
}) {
    try {
        const adminClient = createAdminClient()

        // Get subscription tier
        const { data: subscription } = await adminClient
            .from('tenant_subscriptions')
            .select('tier')
            .eq('tenant_id', tenantId)
            .single()

        if (!subscription) {
            return { allowed: false, message: 'No subscription found' }
        }

        // Get tier limits
        const limits = await getTierLimits(subscription.tier)
        if (!limits) {
            return { allowed: true } // No limits defined, allow
        }

        // Get current usage
        const usage = await getCurrentUsage(tenantId)

        // Check specific limit
        switch (limitType) {
            case 'members':
                if (limits.max_members !== -1 && usage.members_count >= limits.max_members) {
                    return {
                        allowed: false,
                        message: `Member limit reached (${limits.max_members}). Upgrade your plan to add more members.`,
                        currentUsage: usage.members_count,
                        limit: limits.max_members,
                    }
                }
                break

            case 'transactions':
                if (limits.max_transactions_per_month !== -1 &&
                    usage.transactions_count >= limits.max_transactions_per_month) {
                    return {
                        allowed: false,
                        message: `Monthly transaction limit reached (${limits.max_transactions_per_month}). Upgrade your plan for more transactions.`,
                        currentUsage: usage.transactions_count,
                        limit: limits.max_transactions_per_month,
                    }
                }
                break

            case 'messages':
                if (limits.max_messages_per_month !== -1 &&
                    usage.messages_sent >= limits.max_messages_per_month) {
                    return {
                        allowed: false,
                        message: `Monthly WhatsApp message limit reached (${limits.max_messages_per_month}). Upgrade your plan or purchase credits.`,
                        currentUsage: usage.messages_sent,
                        limit: limits.max_messages_per_month,
                    }
                }
                break
        }

        return { allowed: true }
    } catch (err) {
        console.error('[Usage Limit] Failed to check limit:', err)
        // On error, allow the action (fail open)
        return { allowed: true }
    }
}
