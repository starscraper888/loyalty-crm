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

export async function updateReward(id: string, formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const cost = parseInt(formData.get('cost') as string)
    const description = formData.get('description') as string

    const { error } = await supabase
        .from('rewards')
        .update({ name, cost, description })
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/rewards')
    return { success: true }
}

export async function deleteReward(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', id)

    if (error) {
        // Check for foreign key constraint violation (code 23503)
        if (error.code === '23503') {
            return { error: "Cannot delete this reward because it has already been redeemed by customers. Deactivate it instead." }
        }
        return { error: error.message }
    }

    revalidatePath('/admin/rewards')
    return { success: true }
}
