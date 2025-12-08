import { createAdminClient } from '@/lib/supabase/admin'

export interface AuditLog {
    id: string
    admin_id: string | null
    admin_email?: string
    action: string
    target_type: string | null
    target_id: string | null
    tenant_name?: string
    metadata: Record<string, any> | null
    created_at: string
}

export interface AuditLogFilters {
    action?: string
    adminId?: string
    startDate?: string
    endDate?: string
    search?: string
}

/**
 * Get paginated audit logs with optional filters
 */
export async function getAuditLogs(
    limit: number = 20,
    offset: number = 0,
    filters?: AuditLogFilters
): Promise<{ logs: AuditLog[]; total: number }> {
    const adminClient = createAdminClient()

    let query = adminClient
        .from('admin_audit_logs')
        .select(`
            *,
            admin:admin_id(email),
            tenant:target_id(name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    // Apply filters
    if (filters?.action) {
        query = query.eq('action', filters.action)
    }

    if (filters?.adminId) {
        query = query.eq('admin_id', filters.adminId)
    }

    if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate)
    }

    if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate)
    }

    const { data, error, count } = await query

    if (error || !data) {
        return { logs: [], total: 0 }
    }

    // Format the data
    const logs: AuditLog[] = data.map((log: any) => ({
        id: log.id,
        admin_id: log.admin_id,
        admin_email: log.admin?.email || 'Unknown',
        action: log.action,
        target_type: log.target_type,
        target_id: log.target_id,
        tenant_name: log.tenant?.name || null,
        metadata: log.metadata,
        created_at: log.created_at
    }))

    return { logs, total: count || 0 }
}

/**
 * Get unique action types for filtering
 */
export async function getAuditLogActions(): Promise<string[]> {
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
        .from('admin_audit_logs')
        .select('action')
        .order('action')

    if (error || !data) return []

    // Get unique actions
    const uniqueActions = [...new Set(data.map(log => log.action))]
    return uniqueActions
}

/**
 * Get all platform admins for filtering
 */
export async function getPlatformAdmins(): Promise<{ id: string; email: string }[]> {
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
        .from('platform_admins')
        .select(`
            user_id,
            user:user_id(email)
        `)

    if (error || !data) return []

    return data.map((admin: any) => ({
        id: admin.user_id,
        email: admin.user?.email || 'Unknown'
    }))
}

/**
 * Format action name for display
 */
export function formatActionName(action: string): string {
    return action
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

/**
 * Get color class for action badge
 */
export function getActionColor(action: string): string {
    const colors: Record<string, string> = {
        suspend_tenant: 'bg-red-500/10 text-red-300 border-red-500/20',
        resume_tenant: 'bg-green-500/10 text-green-300 border-green-500/20',
        change_plan: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
        extend_trial: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
        toggle_developer_mode: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
        generate_impersonation_token: 'bg-orange-500/10 text-orange-300 border-orange-500/20'
    }

    return colors[action] || 'bg-slate-500/10 text-slate-300 border-slate-500/20'
}

/**
 * Format relative time
 */
export function formatRelativeTime(timestamp: string): string {
    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

    return then.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    })
}
