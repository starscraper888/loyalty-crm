'use server'

import { broadcastMessage } from '@/lib/whatsapp/broadcast'
import { revalidatePath } from 'next/cache'

export async function sendCampaign(formData: FormData) {
    const message = formData.get('message') as string
    const segment = formData.get('segment') as 'all' | 'vip'

    if (!message) {
        return { error: "Message content is required" }
    }

    const result = await broadcastMessage(message, segment)

    if (!result.success) {
        return { error: result.error || "Failed to send broadcast" }
    }

    revalidatePath('/admin/campaigns')
    return { success: true, message: `Campaign sent to ${result.sentCount} members` }
}
