'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function validateImport(rows: any[], map: Record<string, string>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const stats = {
        valid: 0,
        invalid: 0,
        duplicates: 0,
        errors: [] as string[]
    }

    const seenPhones = new Set<string>()
    const phonesToCheck: string[] = []

    // 1. Local Validation
    rows.forEach((row, index) => {
        const phone = row[map.phone]?.toString().trim()
        const name = row[map.name]?.toString().trim()

        if (!phone) {
            stats.invalid++
            if (stats.errors.length < 5) stats.errors.push(`Row ${index + 1}: Missing phone number`)
            return
        }

        if (seenPhones.has(phone)) {
            stats.duplicates++
            if (stats.errors.length < 5) stats.errors.push(`Row ${index + 1}: Duplicate phone in file (${phone})`)
            return
        }

        seenPhones.add(phone)
        phonesToCheck.push(phone)
        stats.valid++
    })

    // 2. DB Validation (Check for existing users)
    // We'll just warn about them, or maybe count them as duplicates?
    // For now, let's just return the local stats.
    // In a real app, we might query `profiles` to see which phones already exist.

    const adminClient = createAdminClient()
    const { data: existingProfiles } = await adminClient
        .from('profiles')
        .select('phone')
        .in('phone', phonesToCheck)

    if (existingProfiles && existingProfiles.length > 0) {
        const existingSet = new Set(existingProfiles.map(p => p.phone))
        // Adjust stats: move from valid to duplicates (or "existing")
        // For simplicity, we'll just leave them as valid but maybe the UI should know.
        // Or we can subtract them from valid and add to duplicates.
        // Let's keep it simple: they are valid rows, but will be UPDATED instead of INSERTED.
    }

    return stats
}

export async function processImport(rows: any[], map: Record<string, string>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get tenant_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) throw new Error('No tenant found')

    const adminClient = createAdminClient()
    const stats = {
        success: 0,
        errors: 0
    }

    for (const row of rows) {
        const phone = row[map.phone]?.toString().trim()
        const name = row[map.name]?.toString().trim()
        const points = parseInt(row[map.points]?.toString() || '0')

        if (!phone) continue

        try {
            // 1. Create/Get Auth User (Mocking this part or using admin API)
            // Since we can't easily create a real auth user with a password via API without sending emails etc.,
            // we might just create a profile linked to a placeholder auth user or just a profile if the system allows.
            // BUT, profiles references auth.users.
            // So we MUST create an auth user.

            // For this MVP, let's assume we create a dummy user or find existing.
            const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
                phone: phone,
                email: `${phone}@example.com`, // Dummy email
                email_confirm: true,
                phone_confirm: true,
                user_metadata: { full_name: name }
            })

            let userId = authUser?.user?.id

            if (authError) {
                // If user already exists, try to find them
                // Error message usually contains "User already registered"
                // We can try to fetch by phone? Admin API doesn't have getUserByPhone easily exposed in all versions.
                // But we can query profiles if we assume they exist.
                // If auth user exists but profile doesn't?
                // Let's assume if create fails, we skip or try to find profile.
                if (authError.message.includes('already registered')) {
                    // We need the ID. 
                    // admin.listUsers? Too slow.
                    // We'll skip auth creation and try to find profile by phone.
                    const { data: existingProfile } = await adminClient
                        .from('profiles')
                        .select('id')
                        .eq('phone', phone)
                        .single()

                    if (existingProfile) {
                        userId = existingProfile.id
                    } else {
                        // Auth exists but no profile? Tricky without ID.
                        // We'll count as error for now.
                        console.error(`User ${phone} exists in Auth but ID unknown.`)
                        stats.errors++
                        continue
                    }
                } else {
                    console.error(`Failed to create user ${phone}:`, authError)
                    stats.errors++
                    continue
                }
            }

            if (!userId) {
                stats.errors++
                continue
            }

            // 2. Upsert Profile
            const { error: profileError } = await adminClient
                .from('profiles')
                .upsert({
                    id: userId,
                    tenant_id: profile.tenant_id,
                    phone: phone,
                    full_name: name,
                    role: 'member'
                })

            if (profileError) {
                console.error(`Failed to upsert profile ${phone}:`, profileError)
                stats.errors++
                continue
            }

            // 3. Add Points (if any)
            if (points > 0) {
                const { error: pointsError } = await adminClient
                    .from('points_ledger')
                    .insert({
                        tenant_id: profile.tenant_id,
                        profile_id: userId,
                        points: points,
                        type: 'earn',
                        description: 'Bulk Import'
                    })

                if (pointsError) {
                    console.error(`Failed to add points for ${phone}:`, pointsError)
                    // Don't fail the whole row, just log
                }
            }

            stats.success++

        } catch (err) {
            console.error(`Error processing ${phone}:`, err)
            stats.errors++
        }
    }

    return stats
}
