'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getRates() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('whatsapp_rates')
        .select('*')
        .order('country_code', { ascending: true })

    if (error) throw error
    return data
}

export async function updateRate(id: string, rate: number) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('whatsapp_rates')
        .update({ rate, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) throw error
    revalidatePath('/admin/calculator')
    return { success: true }
}
