import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isPlatformAdmin, getPlatformTenantOverview } from '@/lib/platform/admin'
import Link from 'next/link'
import { ArrowRight, Users, TrendingUp, CreditCard, Activity } from 'lucide-react'

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

                {/* Tenants List */}
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">All Tenants</h2>
                        <div className="text-sm text-slate-400">
                            {tenants.length} total
                        </div>
                    </div>

                    <div className="space-y-3">
                        {tenants.map((tenant) => (
                            <Link
                                key={tenant.tenant_id}
                                href={`/en/superadmin/tenants/${tenant.tenant_id}`}
                                className="block bg-slate-700/50 hover:bg-slate-700/80 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-all group"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                                                {tenant.business_name || 'Unnamed Business'}
                                            </h3>
                                            <span className={`text-xs px-2 py-1 rounded-full ${tenant.tier === 'enterprise'
                                                    ? 'bg-purple-500/20 text-purple-300'
                                                    : tenant.tier === 'pro'
                                                        ? 'bg-blue-500/20 text-blue-300'
                                                        : 'bg-gray-500/20 text-gray-300'
                                                }`}>
                                                {tenant.tier?.toUpperCase() || 'NO PLAN'}
                                            </span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${tenant.subscription_status === 'active'
                                                    ? 'bg-green-500/20 text-green-300'
                                                    : 'bg-red-500/20 text-red-300'
                                                }`}>
                                                {tenant.subscription_status || 'inactive'}
                                            </span>
                                        </div>
                                        <div className="flex gap-6 text-sm text-slate-400">
                                            <span>Owner: {tenant.owner_name || tenant.owner_email || 'Unknown'}</span>
                                            <span>Members: {tenant.members_count || 0}</span>
                                            <span>Transactions: {tenant.transactions_count || 0}</span>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>

                    {tenants.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            No tenants found
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
