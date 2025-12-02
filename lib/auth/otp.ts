import { createClient } from '@/lib/supabase/server'

export async function generateOTP(redemptionId: string) {
    const supabase = await createClient()
    const code = Math.floor(100000 + Math.random() * 900000).toString() // 6 digit OTP
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    const { error } = await supabase
        .from('redemptions')
        .update({ otp_code: code, otp_expires_at: expiresAt.toISOString() })
        .eq('id', redemptionId)

    if (error) throw error
    return code
}

export async function verifyOTP(redemptionId: string, code: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('redemptions')
        .select('otp_code, otp_expires_at')
        .eq('id', redemptionId)
        .single()

    if (error || !data) return false

    if (new Date(data.otp_expires_at) < new Date()) return false
    if (data.otp_code !== code) return false

    // Mark as completed
    await supabase
        .from('redemptions')
        .update({ status: 'completed', otp_code: null, otp_expires_at: null })
        .eq('id', redemptionId)

    return true
}
