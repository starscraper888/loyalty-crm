'use client'

import { useState, useMemo } from 'react'
import { Member } from '@/app/[lang]/admin/members/components/MemberItem'
import MemberItem from '@/app/[lang]/admin/members/components/MemberItem'

interface MembersTableProps {
    initialMembers: Member[]
    isManager?: boolean
    currentUserRole?: string
}

export default function MembersTable({ initialMembers, isManager, currentUserRole }: MembersTableProps) {
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [sortConfig, setSortConfig] = useState<{ key: keyof Member; direction: 'asc' | 'desc' } | null>(null)

    // Filter and Sort Logic
    const filteredMembers = useMemo(() => {
        let items = [...initialMembers]

        // 0. Hide Owner from Non-Owners
        if (currentUserRole !== 'owner') {
            items = items.filter(member => member.role !== 'owner')
        }

        // 1. Filter by Role
        if (roleFilter !== 'all') {
            items = items.filter(member => member.role === roleFilter)
        }

        // 2. Search (Name, Email, Phone)
        if (search) {
            const lowerSearch = search.toLowerCase()
            items = items.filter(member =>
                member.full_name?.toLowerCase().includes(lowerSearch) ||
                member.email?.toLowerCase().includes(lowerSearch) ||
                member.phone?.toLowerCase().includes(lowerSearch)
            )
        }

        // 3. Sort
        if (sortConfig) {
            items.sort((a, b) => {
                const aValue = a[sortConfig.key] || ''
                const bValue = b[sortConfig.key] || ''

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            })
        }

        return items
    }, [initialMembers, search, roleFilter, sortConfig, currentUserRole])

    // Sort Handler
    const handleSort = (key: keyof Member) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    // Export to CSV
    const handleExport = () => {
        const headers = ['Name', 'Email', 'Phone', 'Role', 'Points', 'Joined']
        const csvContent = [
            headers.join(','),
            ...filteredMembers.map(m => [
                `"${m.full_name}"`,
                `"${m.email || ''}"`,
                `"${m.phone}"`,
                m.role,
                m.points_balance,
                `"${new Date(m.created_at).toLocaleDateString()}"`
            ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `members-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
    }

    return (
        <div className="space-y-4">
            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <input
                    type="text"
                    placeholder="🔍 Search by name, email, or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white flex-1 md:max-w-md"
                />

                <div className="flex gap-2 flex-wrap">
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    >
                        <option value="all">All Roles</option>
                        <option value="member">Members</option>
                        <option value="staff">Staff</option>
                        <option value="manager">Managers</option>
                        {currentUserRole === 'owner' && <option value="owner">Owners</option>}
                    </select>

                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                    >
                        📥 Export CSV
                    </button>
                </div>
            </div>

            {/* Count */}
            <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredMembers.length} of {initialMembers.length} members
            </p>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th
                                onClick={() => handleSort('full_name')}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                                Name {sortConfig?.key === 'full_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Contact
                            </th>
                            <th
                                onClick={() => handleSort('points_balance')}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                                Points {sortConfig?.key === 'points_balance' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Tier
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredMembers.map((member) => (
                            <MemberItem key={member.id} member={member} isManager={isManager} />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {filteredMembers.map((member) => (
                    <MemberItem key={member.id} member={member} isManager={isManager} isMobileCard />
                ))}
            </div>

            {filteredMembers.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                    <p className="text-gray-500 dark:text-gray-400">No members found matching your filters.</p>
                </div>
            )}
        </div>
    )
}
