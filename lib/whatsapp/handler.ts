import { createAdminClient } from '@/lib/supabase/admin'

export async function handleWhatsAppMessage(from: string, body: string) {
    const supabase = createAdminClient()
    const message = body.trim().toLowerCase()

    // Simple command parser
    if (message === 'balance') {
        // Lookup user by phone (from)
        // 'from' is usually in format 'whatsapp:+1234567890' or just '+1234567890'
        // We assume the DB stores it as '+1234567890' (E.164)
        // So we might need to strip 'whatsapp:' if it wasn't done by the caller.
        // The caller (route.ts) already does .replace('whatsapp:', ''), so 'from' is '+...'

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('full_name, points_balance')
            .eq('phone', from)
            .single()

        if (error || !profile) {
            console.error('Profile lookup failed:', error)
            return "Welcome! We couldn't find a member profile for this number. Please register at our store to earn points."
        }

        return `Hi ${profile.full_name || 'there'}! Your current balance is: ${profile.points_balance} points.`
    } else if (message === 'get' || message === 'otp') {
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        // 5 minutes expiry
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

        // First, check if profile exists
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id, tenant_id')
            .eq('phone', from)
            .single()

        if (!existingProfile) {
            // New customer - create a basic profile first
            // We need a tenant_id. For now, we'll use a default tenant or the first one
            // In production, you might handle this differently
            const { data: firstTenant } = await supabase
                .from('profiles')
                .select('tenant_id')
                .limit(1)
                .single()

            if (!firstTenant) {
                return "Sorry, system not configured properly. Please contact support."
            }

            // Create auth user for this phone
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                phone: from,
                password: from, // Default password = phone
                email_confirm: true,
                user_metadata: {
                    full_name: `Customer ${from}`,
                    tenant_id: firstTenant.tenant_id,
                    role: 'member'
                }
            })

            if (authError || !authUser.user) {
                console.error('Failed to create user for OTP:', authError)
                return "Sorry, registration failed. Please try again or contact staff."
            }

            // Update the newly created profile
            await supabase
                .from('profiles')
                .update({
                    full_name: `Customer ${from}`,
                    phone: from,
                    role: 'member',
                    tenant_id: firstTenant.tenant_id,
                    otp_code: otp,
                    otp_expires_at: expiresAt
                })
                .eq('id', authUser.user.id)

            return `Welcome! Your One-Time Code is: *${otp}*\n\nShow this to the staff to verify your identity. Valid for 5 minutes.`
        }

        // Existing customer - just update OTP
        const { error } = await supabase
            .from('profiles')
            .update({
                otp_code: otp,
                otp_expires_at: expiresAt
            })
            .eq('phone', from)

        if (error) {
            console.error('Failed to set OTP:', error)
            return "Sorry, something went wrong generating your code. Please try again."
        }

        return `Your One-Time Code is: *${otp}*\n\nShow this to the staff to verify your identity. Valid for 5 minutes.`
    } else if (message.startsWith('redeem')) {
        return "To redeem points, please visit our store and tell the staff your phone number."
    }

    return "Type 'Balance' to check your points."
}
