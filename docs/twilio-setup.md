# Twilio WhatsApp Setup Guide

This guide explains how to switch from Meta's direct API to Twilio for WhatsApp.

## Difficulty Assessment: Low
- **Business Logic**: No changes needed. The core logic in `lib/whatsapp/handler.ts` is provider-agnostic.
- **Webhook Handler**: Needs to be rewritten. Twilio uses a simpler format than Meta.
- **Dependencies**: Need to install `twilio` package (optional but recommended for verification and sending messages).

## 1. Twilio Console Setup

1. **Create Account**: Sign up at [Twilio](https://www.twilio.com/).
2. **Get a Number**: Buy a phone number with WhatsApp capabilities or use the **Twilio Sandbox for WhatsApp** for development.
   - *Sandbox*: Go to Messaging -> Try it out -> Send a WhatsApp message.
3. **Get Credentials**:
   - Go to the Console Dashboard.
   - Copy **Account SID** and **Auth Token**.

## 2. Configure Webhook

1. Go to **Messaging** -> **Settings** -> **WhatsApp Sandbox Settings** (or your specific number's settings).
2. **When a message comes in**: Set the URL to your deployed app URL + `/api/whatsapp`.
   - Example: `https://your-project.vercel.app/api/whatsapp`
   - Method: `POST`

## 3. Environment Variables

Update your `.env.local` file:

```bash
# Remove Meta variables
# WHATSAPP_VERIFY_TOKEN=...
# WHATSAPP_API_TOKEN=...

# Add Twilio variables
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+1234567890
```

## 4. Code Changes Required

You need to replace `app/api/whatsapp/route.ts` with a Twilio-compatible handler.

### New `app/api/whatsapp/route.ts` (Conceptual)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { handleWhatsAppMessage } from '@/lib/whatsapp/handler'
import querystring from 'querystring'

export async function POST(request: NextRequest) {
    try {
        // Twilio sends data as form-urlencoded
        const text = await request.text()
        const params = querystring.parse(text)

        const From = params.From as string // e.g., whatsapp:+1234567890
        const Body = params.Body as string

        if (From && Body) {
            // Remove 'whatsapp:' prefix for internal logic if needed
            const phone = From.replace('whatsapp:', '')
            
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
```
