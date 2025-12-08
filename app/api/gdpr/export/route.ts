import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = await createClient()

    // 1. Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // 2. Get profile data
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        // 3. Get points ledger (transaction history)
        const { data: pointsLedger } = await supabase
            .from('points_ledger')
            .select('*')
            .eq('profile_id', user.id)
            .order('created_at', { ascending: false })

        // 4. Get redemptions
        const { data: redemptions } = await supabase
            .from('redemptions')
            .select(`
                id,
                status,
                created_at,
                redeemed_at,
                reward:reward_id (
                    name,
                    cost,
                    description
                )
            `)
            .eq('profile_id', user.id)
            .order('created_at', { ascending: false })

        // 5. Get audit logs if user is admin/staff
        let auditLogs = null
        if (profile?.role && ['admin', 'owner', 'manager', 'staff'].includes(profile.role)) {
            const { data } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('actor_id', user.id)
                .order('created_at', { ascending: false })
            auditLogs = data
        }

        // 6. Compile export data
        const exportData = {
            export_date: new Date().toISOString(),
            user_id: user.id,
            profile: {
                full_name: profile?.full_name,
                email: user.email,
                phone: profile?.phone,
                role: profile?.role,
                points_balance: profile?.points_balance,
                created_at: profile?.created_at,
                updated_at: profile?.updated_at
            },
            points_history: pointsLedger || [],
            redemptions: redemptions || [],
            audit_logs: auditLogs,
            metadata: {
                total_points_earned: pointsLedger?.filter(t => t.points > 0).reduce((sum, t) => sum + t.points, 0) || 0,
                total_points_redeemed: Math.abs(pointsLedger?.filter(t => t.points < 0).reduce((sum, t) => sum + t.points, 0) || 0),
                total_redemptions: redemptions?.length || 0
            }
        }

        // 7. Return as JSON for download
        return new NextResponse(JSON.stringify(exportData, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="data-export-${user.id}-${new Date().toISOString().split('T')[0]}.json"`
            }
        })

    } catch (error) {
        console.error('Export error:', error)
        return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
    }
}
