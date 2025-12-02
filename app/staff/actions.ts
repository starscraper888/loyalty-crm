'use server'

import { verifyOTP } from '@/lib/auth/otp'
import { revalidatePath } from 'next/cache'

export async function redeemReward(formData: FormData) {
    const otp = formData.get('otp') as string
    const redemptionId = formData.get('redemptionId') as string

    if (!redemptionId) {
        return { error: "Redemption ID missing. Please scan QR code." }
    }

    const success = await verifyOTP(redemptionId, otp)

    if (success) {
        revalidatePath('/staff/dashboard')
        return { success: true }
    } else {
        return { error: "Invalid or expired OTP" }
    }
}

export async function issuePoints(formData: FormData) {
    const phone = formData.get('phone') as string
    const points = parseInt(formData.get('points') as string)
    const description = formData.get('description') as string

    if (!phone || !points) {
        return { error: "Phone and Points are required" }
    }

    // Simulate DB delay
    await new Promise(resolve => setTimeout(resolve, 500))

    revalidatePath('/staff/dashboard')
    return { success: true, message: `Issued ${points} points to ${phone}` }
}
