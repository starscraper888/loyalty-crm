'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { uploadRewardImage, deleteRewardImage } from '@/lib/storage/images'

export async function createReward(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const cost = parseInt(formData.get('cost') as string)
    const description = formData.get('description') as string
    const imageFile = formData.get('image') as File | null

    // Insert reward first to get ID
    const { data: reward, error } = await supabase
        .from('rewards')
        .insert({ name, cost, description, tenant_id: (await supabase.rpc('get_my_tenant_id')).data })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    // Upload image if provided
    if (imageFile && imageFile.size > 0) {
        const { url, error: imageError } = await uploadRewardImage(imageFile, reward.id)
        if (imageError) {
            return { error: imageError }
        }
        if (url) {
            await supabase
                .from('rewards')
                .update({ image_url: url })
                .eq('id', reward.id)
        }
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
    const imageFile = formData.get('image') as File | null

    const updates: any = { name, cost, description }

    // Upload new image if provided
    if (imageFile && imageFile.size > 0) {
        const { url, error: imageError } = await uploadRewardImage(imageFile, id)
        if (imageError) {
            return { error: imageError }
        }
        if (url) {
            updates.image_url = url
        }
    }

    const { error } = await supabase
        .from('rewards')
        .update(updates)
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/rewards')
    return { success: true }
}

export async function deleteReward(id: string) {
    const supabase = await createClient()

    // Get image URL before deleting
    const { data: reward } = await supabase
        .from('rewards')
        .select('image_url')
        .eq('id', id)
        .single()

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

    // Delete image from storage
    if (reward?.image_url) {
        await deleteRewardImage(reward.image_url)
    }

    revalidatePath('/admin/rewards')
    return { success: true }
}

// --- Member Actions ---

import { createAdminClient } from '@/lib/supabase/admin'

export async function createMember(formData: FormData) {
    const supabase = createAdminClient()
    const userSupabase = await createClient() // For getting current admin's context

    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const fullName = formData.get('full_name') as string
    const points = parseInt(formData.get('points') as string) || 0
    const role = formData.get('role') as string || 'member'
    let password = formData.get('password') as string

    // 1. Role Validation
    const allowedRoles = ['manager', 'admin', 'staff', 'member'] // Owner removed
    if (!allowedRoles.includes(role)) {
        return { error: "Invalid role selected. You cannot create an Owner." }
    }

    // 2. Conditional Field Validation
    const isStaffOrHigher = ['admin', 'manager', 'staff'].includes(role)

    if (isStaffOrHigher) {
        if (!email) return { error: "Email is required for Staff, Manager, and Admin." }
        if (!password || password.length < 6) return { error: "Password (min 6 chars) is required for Staff, Manager, and Admin." }
    } else {
        // For Members
        if (!password) {
            password = phone // Default password for members is phone number
        }
    }

    // 3. Duplicate Check (Friendly Message)
    if (email) {
        const { data: existingEmail } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email) // Assuming email column exists in profiles or we check auth.users via admin
        // Actually profiles might not have email synced yet if we didn't add it. 
        // But we can check auth.users using admin client.

        // Better to check profiles if we sync email there, but we only sync phone/name.
        // Let's check auth.users directly for email.
        const { data: usersWithEmail } = await supabase.auth.admin.listUsers()
        const duplicateEmail = usersWithEmail.users.find(u => u.email === email)
        if (duplicateEmail) {
            return { error: "This email address is already registered." }
        }
    }

    // Check Phone in Profiles (since we sync it and have unique constraint)
    const { data: existingPhone } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .single()

    if (existingPhone) {
        return { error: "This phone number is already registered." }
    }

    // Get Admin's Tenant ID
    const { data: tenantId, error: tenantError } = await userSupabase.rpc('get_my_tenant_id')
    if (tenantError || !tenantId) {
        return { error: "Could not determine your tenant ID." }
    }

    // 4. Create Auth User
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: email || undefined, // Allow undefined if empty for members (though Supabase Auth usually requires email, we might need a dummy if phone auth isn't primary)
        // Note: If Supabase requires email, we might need to generate a dummy one for members: `member_${phone}@placeholder.com`
        // For now, assuming email is optional or provided. If Supabase enforces it, we'll need to handle that.
        // Actually, for this system, let's assume members might just use phone. But createUser requires email OR phone.
        // If we pass email: undefined, it might fail if phone is not set as phone_number.
        // Let's pass phone as phone_number as well.
        phone: phone,
        password: password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            tenant_id: tenantId,
            role: role
        }
    })

    if (authError) {
        return { error: `Auth Error: ${authError.message}` }
    }

    if (!authUser.user) {
        return { error: "Failed to create user" }
    }

    // 2. Update Profile (Trigger SHOULD have created it now)
    // We still update to ensure phone and points are set if the trigger missed them or for redundancy
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            full_name: fullName,
            phone: phone,
            points_balance: points,
            role: role,
            tenant_id: tenantId
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

    // 1. Duplicate Check (Phone)
    // Check if another user already has this phone number
    const { data: existingPhone } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .neq('id', id) // Exclude current user
        .single()

    if (existingPhone) {
        return { error: "This phone number is already registered to another user." }
    }

    // 2. Update Auth User (Sync Phone & Metadata)
    const { error: authError } = await adminSupabase.auth.admin.updateUserById(id, {
        phone: phone,
        user_metadata: {
            full_name: fullName,
            role: role
        }
    })

    if (authError) {
        return { error: `Auth Update Failed: ${authError.message}` }
    }

    // 3. Fetch Current Points Balance (Before Update)
    const { data: currentProfile } = await adminSupabase
        .from('profiles')
        .select('points_balance, tenant_id')
        .eq('id', id)
        .single()

    // 4. Log Manual Point Adjustment (if points changed)
    if (currentProfile && currentProfile.points_balance !== points) {
        const pointsDelta = points - currentProfile.points_balance
        const adjustmentType = pointsDelta > 0 ? 'earn' : 'redeem'
        const absoluteDelta = Math.abs(pointsDelta)

        // Get current admin user
        const { data: { user: admin } } = await supabase.auth.getUser()

        await adminSupabase
            .from('points_ledger')
            .insert({
                profile_id: id,
                tenant_id: currentProfile.tenant_id,
                points: adjustmentType === 'earn' ? absoluteDelta : -absoluteDelta,
                type: adjustmentType,
                description: `Manual adjustment by admin (${admin?.email || 'unknown'})`
            })
    }

    // 5. Update Profile (This will trigger sync_points_balance, but since we're setting it explicitly, it's redundant)
    // Actually, we should NOT update points_balance directly if we're logging to ledger, as the trigger handles it
    // Remove points_balance from updates
    delete updates.points_balance

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
