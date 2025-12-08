'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
    generateImpersonationToken,
    suspendTenant,
    resumeTenant,
    toggleDeveloperMode,
    cancelTenantSubscription,
    changeTenantPlan,
    extendTrial,
    getTenantUsers
} from '@/lib/platform/admin'
import { revalidatePath } from 'next/cache'

export async function impersonateTenant(tenantId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const result = await generateImpersonationToken(tenantId, user.id)

    if (result.error) {
        return { error: result.error }
    }

    // Return the impersonation URL with language prefix
    return { success: true, url: `/en/impersonate?token=${result.token}` }
}

export async function suspendTenantAction(tenantId: string, confirmPhrase: string, reason: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Validate confirmation phrase
    if (confirmPhrase !== 'SUSPEND') {
        return { error: 'Invalid confirmation phrase' }
    }

    const result = await suspendTenant(tenantId, reason, user.id)

    if (result.error) {
        return { error: result.error }
    }

    revalidatePath(`/superadmin/tenants/${tenantId}`)
    return { success: true }
}

export async function resumeTenantAction(tenantId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const result = await resumeTenant(tenantId, user.id)

    if (result.error) {
        return { error: result.error }
    }

    revalidatePath(`/superadmin/tenants/${tenantId}`)
    return { success: true }
}

export async function toggleDeveloperModeAction(tenantId: string, enabled: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const result = await toggleDeveloperMode(tenantId, enabled, user.id)

    if (result.error) {
        return { error: result.error }
    }

    revalidatePath(`/superadmin/tenants/${tenantId}`)
    return { success: true }
}

export async function cancelSubscriptionAction(tenantId: string, reason: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const result = await cancelTenantSubscription(tenantId, user.id, reason)

    if (result.error) {
        return { error: result.error }
    }

    revalidatePath(`/superadmin/tenants/${tenantId}`)
    return { success: true }
}

export async function changePlanAction(tenantId: string, newTier: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const result = await changeTenantPlan(tenantId, newTier, user.id)

    if (result.error) {
        return { error: result.error }
    }

    revalidatePath(`/superadmin/tenants/${tenantId}`)
    return { success: true }
}

export async function extendTrialAction(tenantId: string, days: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const result = await extendTrial(tenantId, days, user.id)

    if (result.error) {
        return { error: result.error }
    }

    revalidatePath(`/superadmin/tenants/${tenantId}`)
    return { success: true }
}

export async function exportTenantUsers(tenantId: string) {
    const users = await getTenantUsers(tenantId)

    // Convert to CSV
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Points Balance', 'Created At']
    const rows = users.map(u => [
        u.id,
        u.full_name || '',
        u.email || '',
        u.phone || '',
        u.points_balance || 0,
        u.created_at
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')

    return { success: true, csv }
}
