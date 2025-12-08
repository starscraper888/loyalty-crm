import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface WelcomeEmailData {
    memberName: string
    memberEmail: string
    pointsBalance: number
}

export interface PointsEarnedData {
    memberName: string
    memberEmail: string
    pointsEarned: number
    newBalance: number
    description: string
}

export interface RedemptionEmailData {
    memberName: string
    memberEmail: string
    rewardName: string
    pointsCost: number
    newBalance: number
    otp?: string
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
    if (!process.env.RESEND_API_KEY) {
        console.log('Resend API key not configured, skipping email')
        return { success: false, skipped: true }
    }

    try {
        await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Loyalty CRM <onboarding@resend.dev>',
            to: data.memberEmail,
            subject: '🎉 Welcome to Our Loyalty Program!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome ${data.memberName}! 🎉</h1>
                    </div>
                    <div style="padding: 40px 20px; background: #f9fafb;">
                        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                            We're thrilled to have you join our loyalty program!
                        </p>
                        <div style="background: white; border-radius: 8px; padding: 24px; margin: 24px 0; border: 2px solid #e5e7eb;">
                            <h2 style="margin: 0 0 12px 0; color: #1f2937;">Your Current Balance</h2>
                            <div style="font-size: 48px; font-weight: bold; color: #3b82f6;">${data.pointsBalance} points</div>
                        </div>
                        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                            Start earning points with every purchase and redeem them for amazing rewards!
                        </p>
                        <div style="text-align: center; margin-top: 32px;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/en/member/dashboard" 
                               style="display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                View My Dashboard
                            </a>
                        </div>
                    </div>
                    <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                        <p>If you have any questions, reply to this email.</p>
                    </div>
                </div>
            `
        })
        return { success: true }
    } catch (error) {
        console.error('Failed to send welcome email:', error)
        return { success: false, error }
    }
}

export async function sendPointsEarnedEmail(data: PointsEarnedData) {
    if (!process.env.RESEND_API_KEY) {
        console.log('Resend API key not configured, skipping email')
        return { success: false, skipped: true }
    }

    try {
        await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Loyalty CRM <points@resend.dev>',
            to: data.memberEmail,
            subject: `✨ You earned ${data.pointsEarned} points!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">Points Earned! ✨</h1>
                    </div>
                    <div style="padding: 40px 20px; background: #f9fafb;">
                        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                            Hi ${data.memberName},
                        </p>
                        <div style="background: white; border-radius: 8px; padding: 24px; margin: 24px 0; border: 2px solid #10b981;">
                            <h2 style="margin: 0 0 12px 0; color: #1f2937;">You Earned</h2>
                            <div style="font-size: 48px; font-weight: bold; color: #10b981;">+${data.pointsEarned} points</div>
                            <p style="color: #6b7280; margin: 12px 0 0 0;">${data.description}</p>
                        </div>
                        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #6b7280;">New Balance:</span>
                                <span style="font-size: 24px; font-weight: bold; color: #3b82f6;">${data.newBalance} points</span>
                            </div>
                        </div>
                        <div style="text-align: center; margin-top: 32px;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/en/member/rewards" 
                               style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                Browse Rewards
                            </a>
                        </div>
                    </div>
                </div>
            `
        })
        return { success: true }
    } catch (error) {
        console.error('Failed to send points earned email:', error)
        return { success: false, error }
    }
}

export async function sendRedemptionEmail(data: RedemptionEmailData) {
    if (!process.env.RESEND_API_KEY) {
        console.log('Resend API key not configured, skipping email')
        return { success: false, skipped: true }
    }

    try {
        await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Loyalty CRM <rewards@resend.dev>',
            to: data.memberEmail,
            subject: `🎁 Reward Redeemed: ${data.rewardName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">Reward Redeemed! 🎁</h1>
                    </div>
                    <div style="padding: 40px 20px; background: #f9fafb;">
                        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                            Hi ${data.memberName},
                        </p>
                        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                            Congratulations! You've successfully redeemed:
                        </p>
                        <div style="background: white; border-radius: 8px; padding: 24px; margin: 24px 0; border: 2px solid #f59e0b;">
                            <h2 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px;">${data.rewardName}</h2>
                            <p style="color: #6b7280; margin: 0;">Cost: ${data.pointsCost} points</p>
                        </div>
                        ${data.otp ? `
                        <div style="background: #fef3c7; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
                            <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600;">YOUR REDEMPTION CODE</p>
                            <div style="font-size: 36px; font-weight: bold; color: #b45309; letter-spacing: 4px;">${data.otp}</div>
                            <p style="margin: 8px 0 0 0; color: #92400e; font-size: 12px;">Show this code at the store</p>
                        </div>
                        ` : ''}
                        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #6b7280;">Remaining Balance:</span>
                                <span style="font-size: 24px; font-weight: bold; color: #3b82f6;">${data.newBalance} points</span>
                            </div>
                        </div>
                    </div>
                </div>
            `
        })
        return { success: true }
    } catch (error) {
        console.error('Failed to send redemption email:', error)
        return { success: false, error }
    }
}
