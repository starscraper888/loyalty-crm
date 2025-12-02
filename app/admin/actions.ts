'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createReward(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const cost = parseInt(formData.get('cost') as string)
    const description = formData.get('description') as string

    const { error } = await supabase
        .from('rewards')
        .insert({ name, cost, description, tenant_id: (await supabase.rpc('get_my_tenant_id')).data })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/rewards')
    return { success: true }
}

export async function toggleReward(id: string, isActive: boolean) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('rewards')
        .update({ is_active: isActive })
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/rewards')
    return { success: true }
}
