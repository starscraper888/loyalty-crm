import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isPlatformAdmin, getTenantDetails } from '@/lib/platform/admin'
import Link from 'next/link'
import { ArrowLeft, Users, CreditCard, Activity, TrendingUp, AlertCircle } from 'lucide-react'
import TenantHeader from './components/TenantHeader'
import SubscriptionCard from './components/SubscriptionCard'
import UsageOverview from './components/UsageOverview'
import AuditLogTable from './components/AuditLogTable'

interface PageProps {
    params: Promise<{
        id: string
        lang: string
    }>
}

export default async function TenantDetailPage({ params }: PageProps) {
    const { id: tenantId, lang } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect(`/${lang}`)
    }

    // Check if user is platform admin
    const isAdmin = await isPlatformAdmin(user.id)
    if (!isAdmin) {
        redirect(`/${lang}/admin/dashboard`)
    }

    // Get tenant details
    const tenantData = await getTenantDetails(tenantId)

    if (!tenantData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Tenant Not Found</h2>
                        <p className="text-slate-400 mb-4">The tenant you're looking for doesn't exist.</p>
                        <Link
                            href={`/${lang}/superadmin`}
                            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <Link
                        href={`/${lang}/superadmin`}
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Platform Dashboard
                    </Link>

                    <TenantHeader
                        tenant={tenantData.tenant}
                        subscription={tenantData.subscription}
                        owner={tenantData.owner}
                    />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Subscription Card */}
                    <div className="lg:col-span-2">
                        <SubscriptionCard
                            subscription={tenantData.subscription}
                            tenant={tenantData.tenant}
                        />
                    </div>

                    {/* Quick Stats */}
                    <div className="space-y-4">
                        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                            <div className="flex items-center gap-3 mb-2">
                                <Users className="w-5 h-5 text-blue-400" />
                                <h3 className="text-sm font-medium text-slate-400">Total Members</h3>
                            </div>
                            <p className="text-3xl font-bold text-white">{tenantData.memberCount}</p>
                        </div>

                        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                            <div className="flex items-center gap-3 mb-2">
                                <CreditCard className="w-5 h-5 text-green-400" />
                                <h3 className="text-sm font-medium text-slate-400">Est. Revenue</h3>
                            </div>
                            <p className="text-3xl font-bold text-white">${tenantData.estimatedRevenue}</p>
                            <p className="text-xs text-slate-500 mt-1">Lifetime total</p>
                        </div>

                        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                            <div className="flex items-center gap-3 mb-2">
                                <Activity className="w-5 h-5 text-purple-400" />
                                <h3 className="text-sm font-medium text-slate-400">Activity</h3>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {tenantData.auditLogs.length}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Recent actions</p>
                        </div>
                    </div>
                </div>

                {/* Usage Overview */}
                <div className="mb-8">
                    <UsageOverview
                        currentUsage={tenantData.currentUsage}
                        tierLimits={tenantData.tierLimits}
                        usageHistory={tenantData.usageHistory}
                    />
                </div>

                {/* Audit Logs */}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
                    <AuditLogTable logs={tenantData.auditLogs} />
                </div>
            </div>
        </div>
    )
}
