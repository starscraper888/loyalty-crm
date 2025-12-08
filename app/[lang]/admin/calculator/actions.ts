'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getRates() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('whatsapp_rates')
        .select('*')
        .order('country_code', { ascending: true })
        .order('category', { ascending: true })

    if (error) {
        console.error('Error fetching rates:', error)
        return []
    }

    return data || []
}

export async function updateRate(id: string, rate: number) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('whatsapp_rates')
        .update({ rate })
        .eq('id', id)

    if (error) {
        console.error('Error updating rate:', error)
        return { error: error.message }
    }

    revalidatePath('/admin/calculator')
    return { success: true }
}
