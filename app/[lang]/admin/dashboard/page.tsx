import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Unauthorized</div>

    // Get tenant_id
    const { data: staffProfile, error } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()

    if (error || !staffProfile) return <div>Unauthorized (No Profile)</div>

    // Fetch some quick stats
    const { count: memberCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', staffProfile.tenant_id)
        .eq('role', 'member')

    const { count: rewardCount } = await supabase
        .from('rewards')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', staffProfile.tenant_id)
        .eq('is_active', true)

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Admin Dashboard</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total Members</h3>
                        <p className="text-3xl font-bold text-blue-600 mt-2">{memberCount || 0}</p>
                        <Link href="/en/admin/members" className="text-sm text-blue-500 hover:text-blue-700 mt-4 inline-block">Manage Members &rarr;</Link>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Active Rewards</h3>
                        <p className="text-3xl font-bold text-green-600 mt-2">{rewardCount || 0}</p>
                        <Link href="/en/admin/rewards" className="text-sm text-green-500 hover:text-green-700 mt-4 inline-block">Manage Rewards &rarr;</Link>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Campaigns</h3>
                        <p className="text-3xl font-bold text-purple-600 mt-2">-</p>
                        <Link href="/en/admin/campaigns" className="text-sm text-purple-500 hover:text-purple-700 mt-4 inline-block">Manage Campaigns &rarr;</Link>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Links</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link href="/en/admin/analytics" className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-center">
                            <span className="font-semibold text-gray-700 dark:text-gray-200">View Analytics</span>
                        </Link>
                        <Link href="/en/admin/calculator" className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-center">
                            <span className="font-semibold text-gray-700 dark:text-gray-200">Cost Calculator</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
