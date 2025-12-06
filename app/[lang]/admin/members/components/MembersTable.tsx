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
    }, [initialMembers, search, roleFilter, sortConfig])

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

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'members_export.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <div className="flex gap-4 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Search name, email, phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white w-full md:w-64"
                    />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                        <option value="all">All Roles</option>
                        <option value="member">Member</option>
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
                >
                    <span>Download CSV</span>
                </button>
            </div>

            {/* Table Header with Sort */}
            <div className="bg-gray-800 text-white p-4 rounded-t-xl grid grid-cols-12 gap-4 font-semibold text-sm uppercase tracking-wider">
                <div className="col-span-3 cursor-pointer hover:text-blue-300" onClick={() => handleSort('full_name')}>Name {sortConfig?.key === 'full_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                <div className="col-span-3 cursor-pointer hover:text-blue-300" onClick={() => handleSort('email')}>Email {sortConfig?.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                <div className="col-span-2">Phone</div>
                <div className="col-span-1 cursor-pointer hover:text-blue-300" onClick={() => handleSort('role')}>Role {sortConfig?.key === 'role' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                <div className="col-span-1 cursor-pointer hover:text-blue-300" onClick={() => handleSort('points_balance')}>Points {sortConfig?.key === 'points_balance' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* List */}
            <div className="space-y-2">
                {filteredMembers.map((member) => (
                    <MemberItem key={member.id} member={member} isManager={isManager} />
                ))}
                {filteredMembers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No members found matching your criteria.</div>
                )}
            </div>
        </div>
    )
}
