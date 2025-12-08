'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCampaign(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const startDate = formData.get('start_date') as string
    const endDate = formData.get('end_date') as string
    const budget = parseFloat(formData.get('budget') as string) || 0
    const targetPoints = parseInt(formData.get('target_points') as string) || 0
    const targetMembers = parseInt(formData.get('target_members') as string) || 0

    if (!name || !startDate || !endDate) {
        return { error: 'Name and dates are required' }
    }

    // Get tenant ID
    const { data: tenantId } = await supabase.rpc('get_my_tenant_id')

    const { error } = await supabase
        .from('campaigns')
        .insert({
            tenant_id: tenantId,
            name,
            description,
            start_date: startDate,
            end_date: endDate,
            budget,
            target_points: targetPoints,
            target_members: targetMembers,
            status: 'draft'
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/campaigns')
    return { success: true }
}

export async function updateCampaignStatus(campaignId: string, status: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('campaigns')
        .update({ status })
        .eq('id', campaignId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/campaigns')
    revalidatePath(`/admin/campaigns/${campaignId}`)
    return { success: true }
}

export async function deleteCampaign(campaignId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/campaigns')
    return { success: true }
}
