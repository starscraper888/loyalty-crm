import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Get tenant by slug
 */
export async function getTenantBySlug(slug: string) {
    const supabase = createAdminClient()

    const { data: tenant, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single()

    if (error || !tenant) {
        return null
    }

    return tenant
}

/**
 * Get tenant by ID
 */
export async function getTenantById(id: string) {
    const supabase = createAdminClient()

    const { data: tenant, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !tenant) {
        return null
    }

    return tenant
}

/**
 * Get all tenants
 */
export async function getAllTenants() {
    const supabase = createAdminClient()

    const { data: tenants, error } = await supabase
        .from('tenants')
        .select('*')
        .order('name')

    if (error) {
        return []
    }

    return tenants || []
}

/**
 * Generate WhatsApp QR code link for tenant
 * When scanned, opens WhatsApp with pre-filled "GET {tenant-slug}" message
 */
export function generateTenantWhatsAppLink(tenantSlug: string, platformWhatsAppNumber: string) {
    // Format: whatsapp://send?phone=+1234567890&text=GET%20coffee-shop
    const message = `GET ${tenantSlug}`
    const encodedMessage = encodeURIComponent(message)

    // Clean phone number (remove + if present for WhatsApp URL)
    const cleanNumber = platformWhatsAppNumber.replace('+', '')

    return `https://wa.me/${cleanNumber}?text=${encodedMessage}`
}

/**
 * Get tenant settings with defaults
 */
export function getTenantSettings(tenant: any) {
    const defaultSettings = {
        points_expiry_enabled: true,
        points_expiry_days: 365,
        expiry_warning_days: 30,
        points_per_dollar: 1,
        min_redemption_points: 100,
        whatsapp_notifications: true,
        theme_color: '#3B82F6'
    }

    return {
        ...defaultSettings,
        ...(tenant.settings || {})
    }
}

/**
 * Get member's membership for a specific tenant
 */
export async function getMemberTenantMembership(memberId: string, tenantId: string) {
    const supabase = createAdminClient()

    const { data: membership, error } = await supabase
        .from('member_tenants')
        .select(`
            *,
            tier:member_tiers(*)
        `)
        .eq('member_id', memberId)
        .eq('tenant_id', tenantId)
        .single()

    if (error || !membership) {
        return null
    }

    return membership
}

/**
 * Get all tenant memberships for a member
 */
export async function getMemberAllMemberships(memberId: string) {
    const supabase = createAdminClient()

    const { data: memberships, error } = await supabase
        .from('member_tenants')
        .select(`
            *,
            tenant:tenants(*),
            tier:member_tiers(*)
        `)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })

    if (error) {
        return []
    }

    return memberships || []
}

/**
 * Create or ensure member-tenant membership exists
 */
export async function ensureMembership(memberId: string, tenantId: string) {
    const supabase = createAdminClient()

    // Check if exists
    const { data: existing } = await supabase
        .from('member_tenants')
        .select('id')
        .eq('member_id', memberId)
        .eq('tenant_id', tenantId)
        .single()

    if (existing) {
        return existing.id
    }

    // Create new membership
    const { data: newMembership, error } = await supabase
        .from('member_tenants')
        .insert({
            member_id: memberId,
            tenant_id: tenantId,
            active_points: 0,
            lifetime_points: 0
        })
        .select('id')
        .single()

    if (error || !newMembership) {
        throw new Error('Failed to create membership')
    }

    return newMembership.id
}
