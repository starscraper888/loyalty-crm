'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowUpDown, Search, Filter } from 'lucide-react'

interface Tenant {
    tenant_id: string
    business_name: string
    tier: string
    subscription_status: string
    owner_name: string
    owner_email: string
    members_count: number
    transactions_count: number
    tenant_created_at: string
}

export default function TenantTable({ tenants }: { tenants: Tenant[] }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [sortField, setSortField] = useState<keyof Tenant>('tenant_created_at')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
    const [filterTier, setFilterTier] = useState<string>('all')
    const [filterStatus, setFilterStatus] = useState<string>('all')

    const handleSort = (field: keyof Tenant) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const filteredAndSortedTenants = useMemo(() => {
        let filtered = tenants.filter(tenant => {
            const matchesSearch =
                tenant.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tenant.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tenant.owner_email?.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesTier = filterTier === 'all' || tenant.tier === filterTier
            const matchesStatus = filterStatus === 'all' || tenant.subscription_status === filterStatus

            return matchesSearch && matchesTier && matchesStatus
        })

        filtered.sort((a, b) => {
            const aVal = a[sortField]
            const bVal = b[sortField]

            if (aVal === null || aVal === undefined) return 1
            if (bVal === null || bVal === undefined) return -1

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortDirection === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal)
            }

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
            }

            return 0
        })

        return filtered
    }, [tenants, searchTerm, sortField, sortDirection, filterTier, filterStatus])

    const SortButton = ({ field, label }: { field: keyof Tenant, label: string }) => (
        <button
            onClick={() => handleSort(field)}
            className="flex items-center gap-1 hover:text-white transition-colors"
        >
            {label}
            <ArrowUpDown className={`w-4 h-4 ${sortField === field ? 'text-blue-400' : 'text-slate-500'}`} />
        </button>
    )

    return (
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700">
            {/* Filters */}
            <div className="p-6 border-b border-slate-700">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by business name, owner..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    {/* Tier Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-slate-400" />
                        <select
                            value={filterTier}
                            onChange={(e) => setFilterTier(e.target.value)}
                            className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="all">All Tiers</option>
                            <option value="starter">Starter</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="trialing">Trialing</option>
                            <option value="canceled">Canceled</option>
                            <option value="past_due">Past Due</option>
                        </select>
                    </div>
                </div>

                <div className="mt-3 text-sm text-slate-400">
                    Showing {filteredAndSortedTenants.length} of {tenants.length} tenants
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-700/50">
                        <tr className="text-left text-sm text-slate-400">
                            <th className="px-6 py-4 font-medium">
                                <SortButton field="business_name" label="Business" />
                            </th>
                            <th className="px-6 py-4 font-medium">
                                <SortButton field="tier" label="Tier" />
                            </th>
                            <th className="px-6 py-4 font-medium">
                                <SortButton field="subscription_status" label="Status" />
                            </th>
                            <th className="px-6 py-4 font-medium">
                                <SortButton field="owner_name" label="Owner" />
                            </th>
                            <th className="px-6 py-4 font-medium">
                                <SortButton field="members_count" label="Members" />
                            </th>
                            <th className="px-6 py-4 font-medium">
                                <SortButton field="transactions_count" label="Transactions" />
                            </th>
                            <th className="px-6 py-4 font-medium">
                                <SortButton field="tenant_created_at" label="Created" />
                            </th>
                            <th className="px-6 py-4 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {filteredAndSortedTenants.map((tenant) => (
                            <tr
                                key={tenant.tenant_id}
                                className="hover:bg-slate-700/30 transition-colors text-sm"
                            >
                                <td className="px-6 py-4">
                                    <div className="font-medium text-white">
                                        {tenant.business_name || 'Unnamed Business'}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        {tenant.owner_email || 'No email'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${tenant.tier === 'enterprise'
                                            ? 'bg-purple-500/20 text-purple-300'
                                            : tenant.tier === 'pro'
                                                ? 'bg-blue-500/20 text-blue-300'
                                                : 'bg-gray-500/20 text-gray-300'
                                        }`}>
                                        {tenant.tier?.toUpperCase() || 'NO PLAN'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${tenant.subscription_status === 'active'
                                            ? 'bg-green-500/20 text-green-300'
                                            : tenant.subscription_status === 'trialing'
                                                ? 'bg-yellow-500/20 text-yellow-300'
                                                : 'bg-red-500/20 text-red-300'
                                        }`}>
                                        {tenant.subscription_status || 'inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-300">
                                    {tenant.owner_name || 'Unknown'}
                                </td>
                                <td className="px-6 py-4 text-slate-300">
                                    {tenant.members_count || 0}
                                </td>
                                <td className="px-6 py-4 text-slate-300">
                                    {tenant.transactions_count || 0}
                                </td>
                                <td className="px-6 py-4 text-slate-400 text-xs">
                                    {new Date(tenant.tenant_created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <Link
                                        href={`/en/superadmin/tenants/${tenant.tenant_id}`}
                                        className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                                    >
                                        View Details →
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredAndSortedTenants.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        No tenants found matching your criteria
                    </div>
                )}
            </div>
        </div>
    )
}
