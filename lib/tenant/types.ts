/**
 * Tenant type definition based on database schema
 */
export interface Tenant {
    id: string
    name: string
    slug: string
    settings: TenantSettings
    created_at: string
    updated_at: string
}

/**
 * Tenant settings configuration
 */
export interface TenantSettings {
    // Points Configuration
    points_expiry_enabled: boolean
    points_expiry_days: number
    expiry_warning_days: number

    // Earning Rules
    points_per_dollar: number
    minimum_transaction?: number
    bonus_multipliers?: Record<string, number>

    // Redemption Rules
    min_redemption_points: number
    redemption_increment?: number
    max_redemption_percent?: number

    // Tier System
    custom_tiers_enabled?: boolean
    tier_benefits?: Record<string, any>

    // Notifications
    whatsapp_notifications: boolean
    expiry_reminders?: boolean

    // Branding
    theme_color: string
    logo_url?: string
}

/**
 * Member-Tenant membership
 */
export interface MemberTenantMembership {
    id: string
    member_id: string
    tenant_id: string
    active_points: number
    lifetime_points: number
    tier_id: string | null
    otp_code: string | null
    otp_expires_at: string | null
    created_at: string
    updated_at: string
}

/**
 * Member profile (platform-level)
 */
export interface MemberProfile {
    id: string
    phone: string
    full_name: string
    email: string | null
    role: 'member' | 'staff' | 'admin' | 'owner'
    password_setup_completed: boolean
    created_at: string
    updated_at: string
}
