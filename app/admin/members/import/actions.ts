'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type ImportRow = {
    phone: string
    name?: string
    points?: number
}

type ValidationResult = {
    valid: number
    invalid: number
    duplicates: number
    errors: string[]
}

export async function validateImport(rows: any[], columnMap: Record<string, string>) {
    const supabase = await createClient()
    const adminAuthClient = createAdminClient() // Use admin for checking auth users if needed, but RLS might suffice for profiles

    const result: ValidationResult = {
        valid: 0,
        invalid: 0,
        duplicates: 0,
        errors: []
    }

    const phonesToCheck: string[] = []
    const validRows: ImportRow[] = []

    // 1. Parse and Basic Validation
    rows.forEach((row, index) => {
        const phone = row[columnMap['phone']]
        const name = row[columnMap['name']]
        const points = row[columnMap['points']] ? Number(row[columnMap['points']]) : 0

        if (!phone) {
            result.invalid++
            if (result.errors.length < 5) result.errors.push(`Row ${index + 1}: Missing phone number`)
            return
        }

        // Basic E.164 regex (very loose)
        if (!/^\+?[1-9]\d{1,14}$/.test(phone)) {
            result.invalid++
            if (result.errors.length < 5) result.errors.push(`Row ${index + 1}: Invalid phone format (${phone})`)
            return
        }

        validRows.push({ phone, name, points })
        phonesToCheck.push(phone)
    })

    // 2. Check Duplicates in DB
    // We check 'profiles' table. 
    // Note: In a real huge import, we might chunk this check.
    // For 1K rows, checking all at once is fine.
    const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('phone')
        .in('phone', phonesToCheck)

    const existingPhones = new Set(existingProfiles?.map(p => p.phone) || [])

    validRows.forEach(row => {
        if (existingPhones.has(row.phone)) {
            result.duplicates++
        } else {
            result.valid++
        }
    })

    return result
}

export async function processImport(rows: any[], columnMap: Record<string, string>) {
    const supabase = createAdminClient() // Must use admin to create users
    const tenantId = '00000000-0000-0000-0000-000000000000' // TODO: Get actual tenant ID from session or context. 
    // Since we are in a server action, we can get the current user's tenant.

    const sessionClient = await createClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Fetch tenant_id of the current user
    const { data: profile } = await sessionClient
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) throw new Error('Tenant not found')
    const currentTenantId = profile.tenant_id

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Process in batches of 50
    const BATCH_SIZE = 50
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE)

        await Promise.all(batch.map(async (row: any) => {
            try {
                const phone = row[columnMap['phone']]
                const name = row[columnMap['name']]
                const points = row[columnMap['points']] ? Number(row[columnMap['points']]) : 0

                if (!phone) return // Skip invalid

                // 1. Create/Get Auth User
                // We try to create. If exists, we fetch.
                // Since we don't have email, we generate a dummy one.
                const email = `${phone.replace(/\D/g, '')}@${currentTenantId}.local` // Scoped to tenant to avoid collisions if needed, or just generic

                let userId = ''

                // Try to get user by email first (Admin API)
                // Actually, listUsers is expensive. 
                // Better to try create and catch error?
                // Or just use 'phone' as identifier if configured. 
                // Let's assume email is required for now.

                const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
                    email: email,
                    phone: phone,
                    email_confirm: true,
                    phone_confirm: true,
                    user_metadata: { full_name: name }
                })

                if (createError) {
                    // If user already exists, we need to find their ID.
                    // Unfortunately createUser doesn't return the ID if it fails.
                    // We have to search.
                    // This is slow. 
                    // Optimization: For bulk, maybe we just skip existing users or assume they are in profiles?
                    // Let's try to find them in profiles first? No, need auth ID.
                    // Let's assume if create fails, it's because they exist.
                    // We can try to fetch by phone?
                    // Admin API doesn't have getUserByPhone easily without listUsers.
                    // Actually, we can assume if they exist in 'profiles' we have their ID.

                    // Fallback: Check profiles table for this phone
                    const { data: existingProfile } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('phone', phone)
                        .single()

                    if (existingProfile) {
                        userId = existingProfile.id
                    } else {
                        // User exists in Auth but not in Profiles? Or some other error.
                        // Log and skip
                        throw new Error(`User creation failed: ${createError.message}`)
                    }
                } else {
                    userId = createdUser.user.id
                }

                // 2. Upsert Profile
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        tenant_id: currentTenantId,
                        phone: phone,
                        full_name: name,
                        role: 'member'
                    })

                if (profileError) throw profileError

                // 3. Add Points (if > 0)
                if (points > 0) {
                    await supabase.from('points_ledger').insert({
                        tenant_id: currentTenantId,
                        profile_id: userId,
                        points: points,
                        type: 'earn',
                        description: 'Initial Import'
                    })
                }

                successCount++
            } catch (err: any) {
                errorCount++
                if (errors.length < 10) errors.push(err.message)
            }
        }))
    }

    return { success: successCount, errors: errorCount, errorDetails: errors }
}
