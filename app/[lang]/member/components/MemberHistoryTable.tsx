'use client'

import { useState, useMemo } from 'react'

interface Transaction {
    id: string
    created_at: string
    points: number
    type: 'earn' | 'redeem'
    description: string
}

interface MemberHistoryTableProps {
    transactions: Transaction[]
}

// Helper to format date/time in GMT+8
function formatDateTimeGMT8(dateString: string) {
    const date = new Date(dateString)
    const dateStr = date.toLocaleDateString('en-GB', {
        timeZone: 'Asia/Singapore',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
    const timeStr = date.toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Singapore',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    })
    return { dateStr, timeStr, full: `${dateStr} ${timeStr}` }
}

export default function MemberHistoryTable({ transactions }: MemberHistoryTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'asc' | 'desc' } | null>({ key: 'created_at', direction: 'desc' })

    const sortedTransactions = useMemo(() => {
        let items = [...transactions]
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
    }, [transactions, sortConfig])

    const handleSort = (key: keyof Transaction) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 grid grid-cols-12 gap-4 font-semibold text-sm uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    <div className="col-span-3 cursor-pointer hover:text-blue-500" onClick={() => handleSort('created_at')}>
                        Date/Time {sortConfig?.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                    <div className="col-span-2 cursor-pointer hover:text-blue-500" onClick={() => handleSort('type')}>
                        Type {sortConfig?.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                    <div className="col-span-2 cursor-pointer hover:text-blue-500" onClick={() => handleSort('points')}>
                        Points {sortConfig?.key === 'points' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                    <div className="col-span-5 cursor-pointer hover:text-blue-500" onClick={() => handleSort('description')}>
                        Reference {sortConfig?.key === 'description' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedTransactions.map((t) => {
                        const { dateStr, timeStr } = formatDateTimeGMT8(t.created_at)
                        return (
                            <div key={t.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                <div className="col-span-3 text-sm text-gray-900 dark:text-white">
                                    <div className="font-medium">{dateStr}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{timeStr}</div>
                                </div>
                                <div className="col-span-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.type === 'earn'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                        }`}>
                                        {t.type.toUpperCase()}
                                    </span>
                                </div>
                                <div className={`col-span-2 text-sm font-bold ${t.type === 'earn' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {t.type === 'earn' ? '+' : '-'}{Math.abs(t.points)}
                                </div>
                                <div className="col-span-5 text-sm text-gray-500 dark:text-gray-400 truncate" title={t.description}>
                                    {t.description || '-'}
                                </div>
                            </div>
                        )
                    })}
                    {sortedTransactions.length === 0 && (
                        <div className="p-8 text-center text-gray-500">No transactions found.</div>
                    )}
                </div>
            </div>
        </div>
    )
}
