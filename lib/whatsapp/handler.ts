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
