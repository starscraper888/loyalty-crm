import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = createAdminClient()

    try {
        // Get tenant ID
        const { data: tenants } = await supabase.from('tenants').select('id').limit(1)
        const tenantId = tenants?.[0]?.id

        if (!tenantId) {
            return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
        }

        // Seed 10 test members
        const testMembers = [
            { name: 'Alice Tan', phone: '+60123456001', monthsAgo: 6 },
            { name: 'Bob Lee', phone: '+60123456002', monthsAgo: 5 },
            { name: 'Charlie Wong', phone: '+60123456003', monthsAgo: 4 },
            { name: 'Diana Lim', phone: '+60123456004', monthsAgo: 3 },
            { name: 'Ethan Ng', phone: '+60123456005', monthsAgo: 3 },
            { name: 'Fiona Chen', phone: '+60123456006', monthsAgo: 2 },
            { name: 'George Ooi', phone: '+60123456007', monthsAgo: 2 },
            { name: 'Hannah Tan', phone: '+60123456008', monthsAgo: 1 },
            { name: 'Isaac Koh', phone: '+60123456009', monthsAgo: 1 },
            { name: 'Julia Loh', phone: '+60123456010', monthsAgo: 1 }
        ]

        const createdMembers = []

        for (const member of testMembers) {
            // Check if already exists
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .eq('phone', member.phone)
                .single()

            if (existing) {
                createdMembers.push({ ...member, id: existing.id, skipped: true })
                continue
            }

            // Create auth user
            const createdAt = new Date()
            createdAt.setMonth(createdAt.getMonth() - member.monthsAgo)

            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                phone: member.phone,
                phone_confirm: true,
                user_metadata: {
                    full_name: member.name,
                    tenant_id: tenantId,
                    role: 'member'
                }
            })

            if (authError) {
                console.error(`Failed to create ${member.name}:`, authError)
                continue
            }

            // Update profile with correct created_at
            await supabase
                .from('profiles')
                .update({ created_at: createdAt.toISOString() })
                .eq('id', authUser.user!.id)

            createdMembers.push({ ...member, id: authUser.user!.id, skipped: false })

            // Add sample transactions
            const transactions = generateTransactions(member.name, authUser.user!.id, tenantId, member.monthsAgo)
            for (const tx of transactions) {
                await supabase.from('points_ledger').insert(tx)
            }
        }

        return NextResponse.json({
            success: true,
            message: `Seeded ${createdMembers.filter(m => !m.skipped).length} members with transaction history`,
            members: createdMembers
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

function generateTransactions(name: string, profileId: string, tenantId: string, monthsAgo: number) {
    const transactions = []
    const now = new Date()

    // Generate 3-5 transactions per member
    const txCount = Math.floor(Math.random() * 3) + 3

    for (let i = 0; i < txCount; i++) {
        const daysBack = Math.floor(Math.random() * (monthsAgo * 30))
        const txDate = new Date()
        txDate.setDate(txDate.getDate() - daysBack)

        const isEarn = Math.random() > 0.3 // 70% earn, 30% redeem
        const points = isEarn
            ? Math.floor(Math.random() * 80) + 20  // 20-100 points
            : -(Math.floor(Math.random() * 60) + 30) // -30 to -90 points

        transactions.push({
            profile_id: profileId,
            tenant_id: tenantId,
            points,
            type: isEarn ? 'earn' : 'redeem',
            description: isEarn ? 'Purchase' : 'Reward Redemption',
            created_at: txDate.toISOString()
        })
    }

    return transactions.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}
