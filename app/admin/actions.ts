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

// --- Member Actions ---

import { createAdminClient } from '@/lib/supabase/admin'

export async function createMember(formData: FormData) {
    const supabase = createAdminClient()
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const fullName = formData.get('full_name') as string
    const points = parseInt(formData.get('points') as string) || 0
    const role = formData.get('role') as string || 'member'

    const allowedRoles = ['owner', 'manager', 'admin', 'staff', 'member']
    if (!allowedRoles.includes(role)) {
        return { error: "Invalid role selected" }
    }

    // 1. Create Auth User
    // We use phone as password for simplicity in this MVP, or auto-confirm
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: phone, // Temporary password
        email_confirm: true,
        user_metadata: { full_name: fullName }
    })

    if (authError) {
        return { error: `Auth Error: ${authError.message}` }
    }

    if (!authUser.user) {
        return { error: "Failed to create user" }
    }

    // 2. Update Profile (Trigger might have created it, but we need to set phone and points)
    // The trigger usually sets id, email. We need to update the rest.
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            full_name: fullName,
            phone: phone,
            points_balance: points,
            role: role
        })
        .eq('id', authUser.user.id)

    if (profileError) {
        return { error: `Profile Error: ${profileError.message}` }
    }

    revalidatePath('/admin/members')
    return { success: true }
}

export async function updateMember(id: string, formData: FormData) {
    const supabase = await createClient() // Use regular client for RLS checks if possible, or admin if needed
    // Admin client is safer for updating other users' data if RLS is strict
    const adminSupabase = createAdminClient()

    const fullName = formData.get('full_name') as string
    const phone = formData.get('phone') as string
    const points = parseInt(formData.get('points') as string)
    const role = formData.get('role') as string

    const allowedRoles = ['owner', 'manager', 'admin', 'staff', 'member']
    if (role && !allowedRoles.includes(role)) {
        return { error: "Invalid role selected" }
    }

    const updates: any = {
        full_name: fullName,
        phone: phone,
        points_balance: points
    }

    if (role) {
        updates.role = role
    }

    const { error } = await adminSupabase
        .from('profiles')
        .update(updates)
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/members')
    return { success: true }
}

export async function deleteMember(id: string) {
    const supabase = createAdminClient()

    const { error } = await supabase.auth.admin.deleteUser(id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/members')
    return { success: true }
}
