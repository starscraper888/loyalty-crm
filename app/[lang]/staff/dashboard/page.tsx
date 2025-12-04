import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get tenant_id
    const { data: staffProfile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .single()

    if (!staffProfile) return <div>Unauthorized</div>

    // 1. Total Members
    const { count: memberCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', staffProfile.tenant_id)
        .eq('role', 'member')

    // 2. Points Issued (Earned)
    // Summing requires a different approach or RPC, but for now let's just count transactions or fetch all and sum (not scalable but works for MVP)
    // Better: Create a view or RPC. For MVP, let's use a simple query.
    const { data: earnedPoints } = await supabase
        .from('points_ledger')
        .select('points')
        .eq('tenant_id', staffProfile.tenant_id)
        .eq('type', 'earn')

    const totalPointsIssued = earnedPoints?.reduce((acc, curr) => acc + curr.points, 0) || 0

    // 3. Redemptions
    const { count: redemptionCount } = await supabase
        .from('redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', staffProfile.tenant_id)

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Dashboard</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total Members</h3>
                        <p className="text-3xl font-bold text-blue-600 mt-2">{memberCount || 0}</p>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Points Issued</h3>
                        <p className="text-3xl font-bold text-green-600 mt-2">{totalPointsIssued.toLocaleString()}</p>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Redemptions</h3>
                        <p className="text-3xl font-bold text-purple-600 mt-2">{redemptionCount || 0}</p>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <a href="/en/staff/redeem" className="flex items-center justify-center p-8 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition">
                        <span className="text-xl font-bold">Scan / Redeem</span>
                    </a>
                    <a href="/en/staff/issue" className="flex items-center justify-center p-8 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 transition">
                        <span className="text-xl font-bold">Issue Points</span>
                    </a>
                </div>
            </div>
        </div>
    )
}
