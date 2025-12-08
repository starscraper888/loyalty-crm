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
        .select('id, full_name, phone')
        .eq('tenant_id', tenantId)
        .eq('role', 'owner')
        .single()

    // If owner found, get email from auth.users
    let ownerWithEmail = owner
    if (owner) {
        const { data: authUser } = await adminClient.auth.admin.getUserById(owner.id)
        ownerWithEmail = {
            ...owner,
            email: authUser?.user?.email || ''
        }
    }

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
        owner: ownerWithEmail,
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
export async function suspendTenant(tenantId: string, reason: string, adminId: string) {
    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('tenants')
        .update({
            status: 'suspended',
            suspended_at: new Date().toISOString(),
            suspension_reason: reason,
            suspended_by: adminId
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
        actor_id: adminId,
        metadata: { reason }
    })

    return { success: true }
}

/**
 * Resume suspended tenant
 */
export async function resumeTenant(tenantId: string, adminId: string) {
    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('tenants')
        .update({
            status: 'active',
            suspended_at: null,
            suspension_reason: null,
            suspended_by: null
        })
        .eq('id', tenantId)

    if (error) {
        console.error('[Platform] Error resuming tenant:', error)
        return { error: error.message }
    }

    // Log action
    await adminClient.from('audit_logs').insert({
        tenant_id: tenantId,
        action: 'TENANT_RESUMED',
        actor_id: adminId
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

/**
 * Generate impersonation token for a tenant
 */
export async function generateImpersonationToken(tenantId: string, adminId: string) {
    const adminClient = createAdminClient()

    // Get tenant owner
    const { data: owner, error: ownerError } = await adminClient
        .from('profiles')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('role', 'owner')
        .single()

    if (ownerError || !owner) {
        return { error: 'Tenant owner not found' }
    }

    // Generate token (UUID)
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now

    // Insert token
    const { data, error } = await adminClient
        .from('impersonation_tokens')
        .insert({
            token,
            tenant_id: tenantId,
            admin_id: adminId,
            target_user_id: owner.id,
            expires_at: expiresAt.toISOString()
        })
        .select()
        .single()

    if (error) {
        console.error('[Platform] Error creating impersonation token:', error)
        return { error: error.message }
    }

    // Log in audit logs
    await adminClient.from('audit_logs').insert({
        tenant_id: tenantId,
        action: 'IMPERSONATION_STARTED',
        actor_id: adminId,
        metadata: { target_user_id: owner.id, expires_at: expiresAt.toISOString() }
    })

    return { success: true, token }
}

/**
 * Validate and use impersonation token
 */
export async function validateImpersonationToken(token: string) {
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
        .from('impersonation_tokens')
        .select('*')
        .eq('token', token)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single()

    if (error || !data) {
        return { error: 'Invalid or expired token' }
    }

    // Mark token as used
    await adminClient
        .from('impersonation_tokens')
        .update({ used_at: new Date().toISOString(), last_activity_at: new Date().toISOString() })
        .eq('id', data.id)

    return { success: true, targetUserId: data.target_user_id, tenantId: data.tenant_id }
}

/**
 * Toggle developer mode for a tenant
 */
export async function toggleDeveloperMode(tenantId: string, enabled: boolean, adminId: string) {
    const adminClient = createAdminClient()

    const updateData = enabled
        ? {
            is_developer_mode: true,
            developer_mode_enabled_at: new Date().toISOString(),
            developer_mode_enabled_by: adminId
        }
        : {
            is_developer_mode: false,
            developer_mode_enabled_at: null,
            developer_mode_enabled_by: null
        }

    const { error } = await adminClient
        .from('tenants')
        .update(updateData)
        .eq('id', tenantId)

    if (error) {
        console.error('[Platform] Error toggling developer mode:', error)
        return { error: error.message }
    }

    // Log action
    await adminClient.from('audit_logs').insert({
        tenant_id: tenantId,
        action: enabled ? 'DEVELOPER_MODE_ENABLED' : 'DEVELOPER_MODE_DISABLED',
        actor_id: adminId,
        metadata: { enabled }
    })

    return { success: true }
}

/**
 * Cancel tenant subscription (immediate)
 */
export async function cancelTenantSubscription(tenantId: string, adminId: string, reason: string) {
    const adminClient = createAdminClient()

    // Get subscription
    const { data: subscription } = await adminClient
        .from('tenant_subscriptions')
        .select('stripe_subscription_id')
        .eq('tenant_id', tenantId)
        .single()

    if (!subscription?.stripe_subscription_id) {
        return { error: 'No active subscription found' }
    }

    // Cancel in Stripe (would need Stripe SDK integration)
    // For now, just update DB
    const { error } = await adminClient
        .from('tenant_subscriptions')
        .update({ status: 'canceled' })
        .eq('tenant_id', tenantId)

    if (error) {
        console.error('[Platform] Error canceling subscription:', error)
        return { error: error.message }
    }

    // Log action
    await adminClient.from('audit_logs').insert({
        tenant_id: tenantId,
        action: 'SUBSCRIPTION_FORCE_CANCELED',
        actor_id: adminId,
        metadata: { reason }
    })

    return { success: true }
}

/**
 * Change tenant plan
 */
export async function changeTenantPlan(tenantId: string, newTier: string, adminId: string) {
    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('tenant_subscriptions')
        .update({ tier: newTier })
        .eq('tenant_id', tenantId)

    if (error) {
        console.error('[Platform] Error changing plan:', error)
        return { error: error.message }
    }

    // Log action
    await adminClient.from('audit_logs').insert({
        tenant_id: tenantId,
        action: 'FORCE_PLAN_CHANGE',
        actor_id: adminId,
        metadata: { new_tier: newTier }
    })

    return { success: true }
}

/**
 * Extend trial period
 */
export async function extendTrial(tenantId: string, days: number, adminId: string) {
    const adminClient = createAdminClient()

    const newTrialEnd = new Date()
    newTrialEnd.setDate(newTrialEnd.getDate() + days)

    const { error } = await adminClient
        .from('tenant_subscriptions')
        .update({
            status: 'trialing',
            trial_end: newTrialEnd.toISOString()
        })
        .eq('tenant_id', tenantId)

    if (error) {
        console.error('[Platform] Error extending trial:', error)
        return { error: error.message }
    }

    // Log action
    await adminClient.from('audit_logs').insert({
        tenant_id: tenantId,
        action: 'TRIAL_EXTENDED',
        actor_id: adminId,
        metadata: { days, new_trial_end: newTrialEnd.toISOString() }
    })

    return { success: true }
}

/**
 * Get tenant user listing for export
 */
export async function getTenantUsers(tenantId: string) {
    const adminClient = createAdminClient()

    // Get all member profiles for this tenant
    const { data: profiles, error } = await adminClient
        .from('profiles')
        .select('id, full_name, phone, points_balance, created_at')
        .eq('tenant_id', tenantId)
        .eq('role', 'member')
        .order('created_at', { ascending: false })

    if (error || !profiles) {
        console.error('[Platform] Error fetching tenant users:', error)
        return []
    }

    console.log(`[Platform] Found ${profiles.length} members for tenant ${tenantId}`)

    // Enrich with email from auth.users
    const enrichedUsers = await Promise.all(
        profiles.map(async (profile) => {
            try {
                const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(profile.id)
                if (authError) {
                    console.error(`[Platform] Error fetching user ${profile.id}:`, authError)
                }
                return {
                    ...profile,
                    email: authUser?.user?.email || 'No email'
                }
            } catch (err) {
                console.error(`[Platform] Exception fetching user ${profile.id}:`, err)
                return {
                    ...profile,
                    email: 'Error'
                }
            }
        })
    )

    return enrichedUsers
}
