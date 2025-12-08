import { Suspense } from 'react'
import { BarChart3, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getAllRevenueMetrics } from '@/lib/platform/revenue'
import MetricCard from '../components/MetricCard'
import MRRTrendChart from '../components/charts/MRRTrendChart'
import RevenueByTierChart from '../components/charts/RevenueByTierChart'

export const dynamic = 'force-dynamic'

export default async function RevenuePage() {
    const metrics = await getAllRevenueMetrics()

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/en/superadmin"
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-6 h-6 text-green-400" />
                                <h1 className="text-2xl font-bold text-white">Revenue Analytics</h1>
                            </div>
                            <p className="text-slate-400 text-sm">Track platform revenue and growth metrics</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Top Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricCard
                        title="Monthly Recurring Revenue"
                        value={`$${metrics.totalMRR.toLocaleString()}`}
                        subtitle="Total MRR"
                        icon="dollar"
                        trend={metrics.growthRate}
                    />
                    <MetricCard
                        title="Active Subscriptions"
                        value={metrics.activeSubscriptions}
                        subtitle="Paying tenants"
                        icon="activity"
                    />
                    <MetricCard
                        title="Total Tenants"
                        value={metrics.totalTenants}
                        subtitle="All tenants"
                        icon="users"
                    />
                    <MetricCard
                        title="Growth Rate"
                        value={`+${metrics.growthRate}%`}
                        subtitle="Month over month"
                        icon="trending"
                    />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <Suspense fallback={<div className="bg-slate-800 rounded-xl h-96 animate-pulse" />}>
                        <RevenueByTierChart data={metrics.revenueByTier} />
                    </Suspense>
                    <Suspense fallback={<div className="bg-slate-800 rounded-xl h-96 animate-pulse" />}>
                        <MRRTrendChart data={metrics.mrrTrend} />
                    </Suspense>
                </div>

                {/* Trial Metrics */}
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-4">Trial Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-slate-400 mb-1">Active Trials</p>
                            <p className="text-2xl font-bold text-white">{metrics.trialMetrics.activeTrials}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400 mb-1">Conversion Rate</p>
                            <p className="text-2xl font-bold text-green-400">{metrics.trialMetrics.conversionRate}%</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400 mb-1">Status</p>
                            <p className="text-sm text-slate-300">
                                {metrics.trialMetrics.conversionRate > 50
                                    ? '✅ Healthy conversion rate'
                                    : '⚠️ Below target conversion'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-300">
                        💡 <strong>Note:</strong> Revenue metrics are calculated in real-time based on active subscriptions.
                        Growth trends are estimated based on subscription creation dates.
                    </p>
                </div>
            </div>
        </div>
    )
}
