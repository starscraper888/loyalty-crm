import { createAdminClient } from '@/lib/supabase/admin'

export async function handleWhatsAppMessage(from: string, body: string) {
    const supabase = createAdminClient()
    const message = body.trim().toLowerCase()

    // Parse command and tenant slug
    // Format: "GET coffee-shop" or "BALANCE" or "GET"
    const parts = message.split(' ')
    const command = parts[0]
    const tenantSlug = parts[1] // Could be undefined

    if (command === 'balance') {
        // Show balance across ALL tenant memberships
        const { data: profile } = await supabase
            .from('profiles')
            .select(`
                id,
                full_name,
                member_tenants (
                    active_points,
                    lifetime_points,
                    tenant:tenants(name)
                )
            `)
            .eq('phone', from)
            .single()

        if (!profile || !profile.member_tenants || profile.member_tenants.length === 0) {
            return "Welcome! You don't have any memberships yet. Scan a QR code at a store to get started!"
        }

        let response = `Hi ${profile.full_name || 'there'}!\n\n`
        response += `Your Points:\n`

        profile.member_tenants.forEach((membership: any) => {
            response += `• ${membership.tenant.name}: ${membership.active_points} pts\n`
        })

        return response.trim()

    } else if (command === 'get' || command === 'otp') {
        // Generate OTP for specific tenant
        if (!tenantSlug) {
            return "Please scan the QR code at the store to get your OTP.\n\nFormat: GET {store-name}"
        }

        // Get tenant by slug
        const { data: tenant } = await supabase
            .from('tenants')
            .select('id, name, slug')
            .eq('slug', tenantSlug)
            .single()

        if (!tenant) {
            return `Store '${tenantSlug}' not found. Please scan the QR code at the store.`
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

        // Check if member exists (platform-level)
        let { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('phone', from)
            .single()

        // Create member if doesn't exist (platform-level)
        if (!profile) {
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                phone: from,
                password: from, // Temporary password
                email_confirm: true,
                user_metadata: {
                    full_name: `Customer ${from}`,
                    role: 'member'
                }
            })

            if (authError || !authUser.user) {
                console.error('Failed to create user:', authError)
                return "Sorry, registration failed. Please try again or contact staff."
            }

            // Update profile with member info
            await supabase
                .from('profiles')
                .update({
                    full_name: `Customer ${from}`,
                    phone: from,
                    role: 'member'
                })
                .eq('id', authUser.user.id)

            profile = { id: authUser.user.id, full_name: `Customer ${from}` }
        }

        // Create or update membership in member_tenants
        const { data: membership, error: membershipError } = await supabase
            .from('member_tenants')
            .upsert({
                member_id: profile.id,
                tenant_id: tenant.id,
                otp_code: otp,
                otp_expires_at: expiresAt
            }, {
                onConflict: 'member_id,tenant_id'
            })
            .select()
            .single()

        if (membershipError) {
            console.error('Failed to create/update membership:', membershipError)
            return "Sorry, something went wrong. Please try again."
        }

        return `Welcome to ${tenant.name}!\n\nYour OTP: *${otp}*\n\nShow this to staff. Valid for 5 minutes.`

    } else if (message.startsWith('redeem')) {
        return "To redeem points, visit the store and show your OTP to staff."
    }

    return "Commands:\n• GET {store} - Get OTP\n• BALANCE - Check points\n\nOr scan the QR code at a store!"
}
