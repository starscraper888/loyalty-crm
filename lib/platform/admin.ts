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
 * Get platform-level tenant overview with accurate member/transaction counts
 */
export async function getPlatformTenantOverview() {
    const adminClient = createAdminClient()

    // Get basic tenant + subscription data from the view
    const { data: tenants, error } = await adminClient
        .from('platform_tenant_overview')
        .select('*')

    if (error) {
        console.error('[Platform] Error fetching tenant overview:', error)
        return []
    }

    if (!tenants || tenants.length === 0) {
        return []
    }

    // For each tenant, get accurate member and transaction counts
    const enrichedTenants = await Promise.all(
        tenants.map(async (tenant) => {
            // Get total member count for this tenant
            const { count: memberCount } = await adminClient
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenant.tenant_id)
                .eq('role', 'member')

            // Get total transaction count (points issued)
            const { count: transactionCount } = await adminClient
                .from('points_ledger')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenant.tenant_id)

            return {
                ...tenant,
                members_count: memberCount || 0,
                transactions_count: transactionCount || 0
            }
        })
    )

    return enrichedTenants
}

/**
 * Get detailed tenant information for platform admin
 */
export async function getTenantDetails(tenantId: string) {
    const adminClient = createAdminClient()

    // Get basic tenant info
    const { data: tenant, error: tenantError } = await adminClient
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single()

    if (tenantError || !tenant) {
        console.error('[Platform] Error fetching tenant:', tenantError)
        return null
    }

    // Get subscription info
    const { data: subscription } = await adminClient
        .from('tenant_subscriptions')
        .select('*')
        .eq('tenant_id', tenantId)
        .single()

    // Get current month usage
    const { data: currentUsage } = await adminClient
        .from('tenant_usage')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('period_start', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .single()

    // Get usage history (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: usageHistory } = await adminClient
        .from('tenant_usage')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('period_start', sixMonthsAgo.toISOString())
        .order('period_start', { ascending: true })

    // Get owner profile
    const { data: owner } = await adminClient
        .from('profiles')
        .select('id, full_name, email, phone')
        .eq('tenant_id', tenantId)
        .eq('role', 'owner')
        .single()

    // Get member count
    const { count: memberCount } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('role', 'member')

    // Get recent audit logs (last 50)
    const { data: auditLogs } = await adminClient
        .from('audit_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50)

    // Calculate tier limits
    const { data: tierLimits } = await adminClient
        .from('tier_limits')
        .select('*')
        .eq('tier', subscription?.tier || 'starter')
        .single()

    // Get total revenue (this would require a payments table or Stripe API call)
    // For now, estimate based on subscription
    const monthlyPrice = subscription?.tier === 'enterprise' ? 299 :
        subscription?.tier === 'pro' ? 99 : 29

    const monthsSinceCreation = Math.floor(
        (new Date().getTime() - new Date(tenant.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
    )

    const estimatedRevenue = monthlyPrice * Math.max(monthsSinceCreation, 0)

    return {
        tenant,
        subscription,
        currentUsage,
        usageHistory: usageHistory || [],
        owner,
        memberCount: memberCount || 0,
        auditLogs: auditLogs || [],
        tierLimits,
        estimatedRevenue
    }
}

/**
 * Get usage history for charts
 */
export async function getTenantUsageHistory(tenantId: string, months: number = 6) {
    const adminClient = createAdminClient()

    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    const { data, error } = await adminClient
        .from('tenant_usage')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('period_start', startDate.toISOString())
        .order('period_start', { ascending: true })

    if (error) {
        console.error('[Platform] Error fetching usage history:', error)
        return []
    }

    return data || []
}

/**
 * Suspend a tenant account
 */
export async function suspendTenant(tenantId: string, reason: string) {
    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('tenants')
        .update({
            status: 'suspended',
            suspended_at: new Date().toISOString(),
            suspension_reason: reason
        })
        .eq('id', tenantId)

    if (error) {
        console.error('[Platform] Error suspending tenant:', error)
        return { error: error.message }
    }

    // Log the action
    await adminClient.from('audit_logs').insert({
        tenant_id: tenantId,
        action: 'TENANT_SUSPENDED',
        actor_id: (await adminClient.auth.getUser()).data.user?.id,
        metadata: { reason }
    })

    return { success: true }
}

/**
 * Delete a tenant (permanent)
 */
export async function deleteTenant(tenantId: string) {
    const adminClient = createAdminClient()

    // This will cascade delete due to foreign key constraints
    const { error } = await adminClient
        .from('tenants')
        .delete()
        .eq('id', tenantId)

    if (error) {
        console.error('[Platform] Error deleting tenant:', error)
        return { error: error.message }
    }

    return { success: true }
}
