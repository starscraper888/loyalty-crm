import { NextRequest, NextResponse } from 'next/server'
import { handleWhatsAppMessage } from '@/lib/whatsapp/handler'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
    try {
        // Twilio sends data as form-urlencoded
        const text = await request.text()
        const params = new URLSearchParams(text)

        const From = params.get('From') // e.g., whatsapp:+1234567890
        const Body = params.get('Body')

        if (From && Body) {
            // Remove 'whatsapp:' prefix for internal logic if needed
            const phone = From.replace('whatsapp:', '')

            // Rate Limit Check
            const supabase = createAdminClient()
            const { data: allowed, error: rateError } = await supabase.rpc('check_rate_limit', {
                p_key: `whatsapp:${phone}`,
                p_cost: 1,
                p_capacity: 10,
                p_refill_rate: 1 // 1 token per second
            })

            if (rateError) {
                console.error('Rate Limit Error:', rateError)
                // Fail open or closed? Let's fail open for now but log it, or just continue.
                // But if it's a real error, maybe we shouldn't block.
            }

            if (allowed === false) {
                return new NextResponse('Too Many Requests', { status: 429 })
            }

            const responseText = await handleWhatsAppMessage(phone, Body)

            // Respond with TwiML
            const xmlResponse = `
                <Response>
                    <Message>${responseText}</Message>
                </Response>
            `

            return new NextResponse(xmlResponse, {
                headers: { 'Content-Type': 'text/xml' }
            })
        }

        return new NextResponse('OK', { status: 200 })
    } catch (error) {
        console.error('Twilio Webhook Error:', error)
        return new NextResponse('Error', { status: 500 })
    }
}