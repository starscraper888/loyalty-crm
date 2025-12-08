import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
    const supabase = await createClient()

    // 1. Verify Staff Session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate Limit (10 per minute per staff)
    const canRequest = await rateLimit({
        key: `redeem:${user.id}`,
        limit: 10,
        window: 60
    })

    if (!canRequest) {
        return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    // 2. Parse Body
    const body = await request.json()
    const { phone, otp } = body

    if (!phone || !otp) {
        return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 })
    }

    // 3. Find Pending Redemption for Phone
    // First get profile_id from phone
    const { data: member } = await supabase
        .from('profiles')
        .select('id, tenant_id')
        .eq('phone', phone)
        .single()

    if (!member) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Check for pending redemption with matching OTP
    const { data: redemption } = await supabase
        .from('redemptions')
        .select('id, reward_id, otp_expires_at')
        .eq('profile_id', member.id)
        .eq('status', 'pending')
        .eq('otp_code', otp)
        .gt('otp_expires_at', new Date().toISOString()) // Check expiry
        .single()

    if (!redemption) {
        return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
    }

    // 4. Process Redemption Atomically
    const { data: result, error: rpcError } = await supabase
        .rpc('complete_redemption', {
            p_redemption_id: redemption.id,
            p_otp: otp
        })

    if (rpcError) {
        console.error('Redemption RPC error:', rpcError)
        return NextResponse.json({ error: 'System error processing redemption' }, { status: 500 })
    }

    if (!result.success) {
        return NextResponse.json({ error: result.error || 'Redemption failed' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Redemption successful' })
}
