import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = await createClient()

    // 1. Verify Staff Session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // 4. Process Redemption
    // Mark as completed
    const { error: updateError } = await supabase
        .from('redemptions')
        .update({
            status: 'completed',
            redeemed_at: new Date().toISOString(),
            otp_code: null
        })
        .eq('id', redemption.id)

    if (updateError) {
        return NextResponse.json({ error: 'Failed to process redemption' }, { status: 500 })
    }

    // Deduct Points (Add negative ledger entry)
    // We need to know the cost. 
    // The cost was likely checked when creating the redemption?
    // Or we check reward cost now.
    const { data: reward } = await supabase
        .from('rewards')
        .select('cost, name')
        .eq('id', redemption.reward_id)
        .single()

    if (reward) {
        await supabase
            .from('points_ledger')
            .insert({
                tenant_id: member.tenant_id,
                profile_id: member.id,
                points: -reward.cost,
                type: 'redeem',
                description: `Redeemed: ${reward.name}`
            })
    }

    return NextResponse.json({ success: true, message: 'Redemption successful' })
}
