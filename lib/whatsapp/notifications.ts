import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_PHONE_NUMBER

let client: ReturnType<typeof twilio> | null = null

function getTwilioClient() {
    if (!accountSid || !authToken || !fromNumber) {
        console.warn('Twilio credentials not configured')
        return null
    }

    if (!client) {
        client = twilio(accountSid, authToken)
    }
    return client
}

interface NotificationParams {
    to: string
    message: string
}

/**
 * Send a WhatsApp notification via Twilio
 * @param to - Phone number in E.164 format (e.g., '+60123456789')
 * @param message - Message content
 */
export async function sendWhatsAppNotification({ to, message }: NotificationParams) {
    const client = getTwilioClient()

    if (!client) {
        console.warn('Twilio not configured, notification not sent:', message)
        return { success: false, error: 'Twilio not configured' }
    }

    try {
        // Ensure 'to' number is in WhatsApp format
        const toWhatsApp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

        const messageResponse = await client.messages.create({
            from: fromNumber,
            to: toWhatsApp,
            body: message
        })

        console.log('WhatsApp notification sent:', messageResponse.sid)
        return { success: true, sid: messageResponse.sid }
    } catch (error: any) {
        console.error('Failed to send WhatsApp notification:', error.message)
        return { success: false, error: error.message }
    }
}

/**
 * Send points issued notification
 */
export async function notifyPointsIssued(
    phone: string,
    customerName: string,
    pointsIssued: number,
    newBalance: number,
    description?: string
) {
    const message = `✅ *Points Earned!*

Hi ${customerName}! 

You've earned *${pointsIssued} points*${description ? ` for ${description}` : ''}.

💎 New Balance: *${newBalance} points*

Thank you for your loyalty! 🎉`

    return await sendWhatsAppNotification({ to: phone, message })
}

/**
 * Send reward redeemed notification
 */
export async function notifyRewardRedeemed(
    phone: string,
    customerName: string,
    rewardName: string,
    pointsDeducted: number,
    newBalance: number,
    redemptionNumber?: string
) {
    const message = `🎁 *Reward Redeemed!*

Hi ${customerName}!

You've redeemed: *${rewardName}*
Points used: ${pointsDeducted}

💎 Remaining Balance: *${newBalance} points*
${redemptionNumber ? `\n📝 Reference: #${redemptionNumber}` : ''}

Enjoy your reward! 🎉`

    return await sendWhatsAppNotification({ to: phone, message })
}

/**
 * Send welcome notification for new members
 */
export async function notifyWelcome(
    phone: string,
    customerName: string,
    initialPoints: number
) {
    const message = `🎉 *Welcome to Our Loyalty Program!*

Hi ${customerName}!

Your account has been created.
💎 Current Balance: *${initialPoints} points*

💬 Message us:
• "Balance" - Check your points
• "OTP" - Get verification code

Start earning rewards today! 🌟`

    return await sendWhatsAppNotification({ to: phone, message })
}
