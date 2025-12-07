import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isPlatformAdmin, getPlatformTenantOverview } from '@/lib/platform/admin'
import Link from 'next/link'
import { Users, TrendingUp, CreditCard, Activity } from 'lucide-react'
import TenantTable from './components/TenantTable'

export default async function SuperadminDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/en')
    }

    // Check if user is platform admin
    const isAdmin = await isPlatformAdmin(user.id)
    if (!isAdmin) {
        redirect('/en/admin/dashboard')
    }

    // Get all tenants overview
    const tenants = await getPlatformTenantOverview()

    // Calculate platform metrics
    const totalTenants = tenants.length
    const activeTenants = tenants.filter(t => t.subscription_status === 'active').length
    const totalMembers = tenants.reduce((sum, t) => sum + (t.members_count || 0), 0)
    const totalTransactions = tenants.reduce((sum, t) => sum + (t.transactions_count || 0), 0)

    // Revenue by tier
    const tierRevenue = {
        starter: tenants.filter(t => t.tier === 'starter' && t.subscription_status === 'active').length * 29,
        pro: tenants.filter(t => t.tier === 'pro' && t.subscription_status === 'active').length * 99,
        enterprise: tenants.filter(t => t.tier === 'enterprise' && t.subscription_status === 'active').length * 299,
    }
    const monthlyRevenue = tierRevenue.starter + tierRevenue.pro + tierRevenue.enterprise

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Platform Admin</h1>
                        <p className="text-slate-400 text-sm">Superadmin Dashboard</p>
                    </div>
                    <Link
                        href="/en/admin/dashboard"
                        className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        Back to Tenant Dashboard
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Platform Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Tenants */}
                    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-lg">
                                <Users className="w-6 h-6 text-blue-400" />
                            </div>
                            <span className="text-xs text-slate-400">
                                {activeTenants} active
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">{totalTenants}</h3>
                        <p className="text-slate-400 text-sm">Total Tenants</p>
                    </div>

                    {/* Monthly Revenue */}
                    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-500/10 rounded-lg">
                                <CreditCard className="w-6 h-6 text-green-400" />
                            </div>
                            <TrendingUp className="w-4 h-4 text-green-400" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">${monthlyRevenue}</h3>
                        <p className="text-slate-400 text-sm">Monthly Revenue (MRR)</p>
                    </div>

                    {/* Total Members */}
                    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-500/10 rounded-lg">
                                <Users className="w-6 h-6 text-purple-400" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">{totalMembers.toLocaleString()}</h3>
                        <p className="text-slate-400 text-sm">Total Platform Members</p>
                    </div>

                    {/* Total Transactions */}
                    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-orange-500/10 rounded-lg">
                                <Activity className="w-6 h-6 text-orange-400" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">{totalTransactions.toLocaleString()}</h3>
                        <p className="text-slate-400 text-sm">Transactions This Month</p>
                    </div>
                </div>

                {/* Revenue Breakdown */}
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700 mb-8">
                    <h2 className="text-xl font-bold text-white mb-6">Revenue by Tier</h2>
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <div className="text-sm text-slate-400 mb-2">Starter</div>
                            <div className="text-2xl font-bold text-white">${tierRevenue.starter}</div>
                            <div className="text-xs text-slate-500 mt-1">
                                {tenants.filter(t => t.tier === 'starter' && t.subscription_status === 'active').length} tenants × $29
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-slate-400 mb-2">Pro</div>
                            <div className="text-2xl font-bold text-white">${tierRevenue.pro}</div>
                            <div className="text-xs text-slate-500 mt-1">
                                {tenants.filter(t => t.tier === 'pro' && t.subscription_status === 'active').length} tenants × $99
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-slate-400 mb-2">Enterprise</div>
                            <div className="text-2xl font-bold text-white">${tierRevenue.enterprise}</div>
                            <div className="text-xs text-slate-500 mt-1">
                                {tenants.filter(t => t.tier === 'enterprise' && t.subscription_status === 'active').length} tenants × $299
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tenants Table */}
                <TenantTable tenants={tenants} />
            </div>
        </div>
    )
}
