'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import OnboardingTour from '@/components/OnboardingTour'
import { adminTourSteps } from '@/lib/tour-steps'
import { createClient } from '@/lib/supabase/client'

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        memberCount: 0,
        rewardCount: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return

            const { data: staffProfile } = await supabase
                .from('profiles')
                .select('tenant_id')
                .eq('id', user.id)
                .maybeSingle()

            if (!staffProfile) return

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

            setStats({
                memberCount: memberCount || 0,
                rewardCount: rewardCount || 0
            })
            setLoading(false)
        }

        fetchStats()
    }, [])

    if (loading) {
        return <div className="p-8">Loading...</div>
    }

    return (
        <div className="p-8">
            <OnboardingTour steps={adminTourSteps} tourKey="admin-dashboard" />
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Admin Dashboard</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700" data-tour="members">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total Members</h3>
                        <p className="text-3xl font-bold text-blue-600 mt-2">{stats.memberCount}</p>
                        <Link href="/en/admin/members" className="text-sm text-blue-500 hover:text-blue-700 mt-4 inline-block">Manage Members &rarr;</Link>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700" data-tour="rewards">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Active Rewards</h3>
                        <p className="text-3xl font-bold text-green-600 mt-2">{stats.rewardCount}</p>
                        <Link href="/en/admin/rewards" className="text-sm text-green-500 hover:text-green-700 mt-4 inline-block">Manage Rewards &rarr;</Link>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700" data-tour="campaigns">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Campaigns</h3>
                        <p className="text-3xl font-bold text-purple-600 mt-2">-</p>
                        <Link href="/en/admin/campaigns" className="text-sm text-purple-500 hover:text-purple-700 mt-4 inline-block">Manage Campaigns &rarr;</Link>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Links</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link href="/en/admin/analytics" className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-center" data-tour="analytics">
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
