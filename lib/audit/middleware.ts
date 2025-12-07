import { createAdminClient } from '@/lib/supabase/admin'

export interface AuditLogParams {
    action: string
    tenantId: string
    actorId: string
    details?: Record<string, any>
}

/**
 * Log an audit entry for traceability
 * All critical actions should be logged with actor (WHO), action (WHAT), and timestamp (WHEN)
 */
export async function logAudit({
    action,
    tenantId,
    actorId,
    details,
}: AuditLogParams) {
    try {
        const adminClient = createAdminClient()

        const { error } = await adminClient.from('audit_logs').insert({
            tenant_id: tenantId,
            actor_id: actorId,
            action,
            details,
            created_at: new Date().toISOString(),
        })

        if (error) {
            console.error('[Audit Log] Failed to log action:', error)
            // Don't throw - audit logging should not break the main operation
        }
    } catch (err) {
        console.error('[Audit Log] Unexpected error:', err)
        // Silent fail - audit is important but not critical
    }
}

/**
 * Common audit action types for consistency
 */
export const AUDIT_ACTIONS = {
    // Points Management
    POINTS_ISSUE: 'points.issue',
    POINTS_REDEEM: 'points.redeem',
    POINTS_ADJUST: 'points.adjust',
    REDEMPTION_VOID: 'redemption.void',

    // Member Management
    MEMBER_CREATE: 'member.create',
    MEMBER_EDIT: 'member.edit',
    MEMBER_DELETE: 'member.delete',
    MEMBER_IMPORT: 'member.import',

    // Rewards Management
    REWARD_CREATE: 'reward.create',
    REWARD_EDIT: 'reward.edit',
    REWARD_DELETE: 'reward.delete',

    // Subscription & Billing
    SUBSCRIPTION_CHANGE: 'subscription.change_plan',
    CREDITS_PURCHASE: 'credits.purchase',
    BILLING_UPDATE: 'billing.update',

    // Tenant Settings
    SETTINGS_UPDATE: 'settings.update',
    STAFF_MANAGE: 'staff.manage',
} as const
