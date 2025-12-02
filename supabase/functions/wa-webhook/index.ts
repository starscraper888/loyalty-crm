import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts"
import { encodeHex } from "https://deno.land/std@0.177.0/encoding/hex.ts"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_SECRET = Deno.env.get('APP_SECRET')!
const VERIFY_TOKEN = Deno.env.get('VERIFY_TOKEN')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
    // 1. GET Request (Verification)
    if (req.method === 'GET') {
        const url = new URL(req.url)
        const mode = url.searchParams.get('hub.mode')
        const token = url.searchParams.get('hub.verify_token')
        const challenge = url.searchParams.get('hub.challenge')

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            return new Response(challenge, { status: 200 })
        }
        return new Response('Forbidden', { status: 403 })
    }

    // 2. POST Request (Event Notification)
    if (req.method === 'POST') {
        const signature = req.headers.get('X-Hub-Signature-256')
        if (!signature) {
            return new Response('No signature', { status: 401 })
        }

        const body = await req.text()

        // Verify Signature
        const encoder = new TextEncoder()
        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(APP_SECRET),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
        )
        const signatureBytes = hexToBytes(signature.split('sha256=')[1])
        const verified = await crypto.subtle.verify(
            "HMAC",
            key,
            signatureBytes,
            encoder.encode(body)
        )

        if (!verified) {
            return new Response('Invalid signature', { status: 401 })
        }

        const payload = JSON.parse(body)

        // Process Events
        if (payload.object === 'whatsapp_business_account') {
            for (const entry of payload.entry) {
                for (const change of entry.changes) {
                    const value = change.value
                    const eventId = change.id + '_' + (value.messages?.[0]?.id || Date.now()) // Unique ID construction

                    // Idempotency Check
                    const { error: idempotencyError } = await supabase
                        .from('webhook_events')
                        .insert({ event_id: eventId, payload: value })
                        .select()
                        .single()

                    if (idempotencyError) {
                        // If duplicate (constraint violation), return 200 immediately
                        console.log('Duplicate event:', eventId)
                        continue
                    }

                    // Process Message
                    if (value.messages) {
                        for (const message of value.messages) {
                            const from = message.from
                            const text = message.text?.body

                            // Upsert Member (simplified)
                            // In reality, we'd check if profile exists, if not create with 'member' role
                            // For now, we just log or enqueue

                            // Enqueue Automation
                            await supabase.from('job_queue').insert({
                                job_type: 'process_message',
                                payload: { from, text, message_id: message.id }
                            })
                        }
                    }
                }
            }
        }

        return new Response('OK', { status: 200 })
    }

    return new Response('Method not allowed', { status: 405 })
})

function hexToBytes(hex: string) {
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
    }
    return bytes
}
