import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * Check if the current user is a platform admin
 */
export async function isPlatformAdmin(userId?: string): Promise<boolean> {
    try {
        const adminClient = createAdminClient()

        // If no userId provided, get from current session
        if (!userId) {
            const supabase = await createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return false
            userId = user.id
        }

        const { data } = await adminClient
            .from('platform_admins')
            .select('user_id')
            .eq('user_id', userId)
            .single()

        return !!data
    } catch (err) {
        console.error('[Platform Admin Check] Error:', err)
        return false
    }
}

/**
 * Get all platform admins
 */
export async function getPlatformAdmins() {
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
        .from('platform_admins')
        .select(`
            id,
            user_id,
            created_at,
            created_by
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('[Platform Admins] Error fetching admins:', error)
        return []
    }

    return data || []
}

/**
 * Add a user as platform admin
 */
export async function addPlatformAdmin(userId: string, createdBy: string) {
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
        .from('platform_admins')
        .insert({
            user_id: userId,
            created_by: createdBy
        })
        .select()
        .single()

    if (error) {
        console.error('[Platform Admin] Error adding admin:', error)
        return { error: error.message }
    }

    return { success: true, data }
}

/**
 * Remove a platform admin
 */
export async function removePlatformAdmin(userId: string) {
    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('platform_admins')
        .delete()
        .eq('user_id', userId)

    if (error) {
        console.error('[Platform Admin] Error removing admin:', error)
        return { error: error.message }
    }

    return { success: true }
}

/**
 * Get platform-level tenant overview
 */
export async function getPlatformTenantOverview() {
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
        .from('platform_tenant_overview')
        .select('*')

    if (error) {
        console.error('[Platform] Error fetching tenant overview:', error)
        return []
    }

    return data || []
}

/**
 * Get detailed tenant information for platform admin
 */
export async function getTenantDetails(tenantId: string) {
    const adminClient = createAdminClient()

    // Get basic tenant info
    const { data: tenant } = await adminClient
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single()

    // Get subscription info
    const { data: subscription } = await adminClient
        .from('tenant_subscriptions')
        .select('*')
        .eq('tenant_id', tenantId)
        .single()

    // Get current usage
    const { data: usage } = await adminClient
        .from('tenant_usage')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('period_start', { ascending: false })
        .limit(1)
        .single()

    // Get member count
    const { count: memberCount } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)

    // Get recent audit logs
    const { data: auditLogs } = await adminClient
        .from('audit_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(10)

    return {
        tenant,
        subscription,
        usage,
        memberCount,
        auditLogs
    }
}
