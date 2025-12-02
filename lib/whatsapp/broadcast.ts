import { createClient } from '@/lib/supabase/server'

// Mock sending message to Meta API
async function sendWhatsAppMessage(to: string, message: string) {
    // In production, this would make a fetch call to:
    // https://graph.facebook.com/v17.0/{phone_number_id}/messages
    console.log(`Sending WhatsApp to ${to}: ${message}`)
    return true
}

export async function broadcastMessage(message: string, segment: 'all' | 'vip' = 'all') {
    const supabase = await createClient()

    let query = supabase.from('profiles').select('phone')

    if (segment === 'vip') {
        // Assuming we have a way to identify VIPs, e.g. points > 1000
        // For now, let's just query all since we don't have a VIP flag yet
        // query = query.gt('points_balance', 1000)
    }

    const { data: profiles, error } = await query

    if (error || !profiles) {
        console.error('Error fetching profiles for broadcast:', error)
        return { success: false, error: error?.message }
    }

    let sentCount = 0

    // Process in chunks to avoid rate limits
    for (const profile of profiles) {
        if (profile.phone) {
            await sendWhatsAppMessage(profile.phone, message)
            sentCount++
            // Add small delay to be safe
            await new Promise(resolve => setTimeout(resolve, 50))
        }
    }

    return { success: true, sentCount }
}
