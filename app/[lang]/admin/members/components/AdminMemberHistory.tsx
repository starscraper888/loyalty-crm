'use client'

import { useState } from 'react'
import VoidRedemptionDialog from './VoidRedemptionDialog'
import { useRouter } from 'next/navigation'

interface Transaction {
    id: string
    created_at: string
    points: number
    type: 'earn' | 'redeem'
    description: string
    status?: string
    reward_name?: string
    redemption_id?: string
}

interface AdminMemberHistoryProps {
    transactions: Transaction[]
    memberId: string
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
    return { dateStr, timeStr }
}

export default function AdminMemberHistory({ transactions, memberId }: AdminMemberHistoryProps) {
    const router = useRouter()
    const [voidDialog, setVoidDialog] = useState<{ id: string; name: string; points: number } | null>(null)
    const [successMessage, setSuccessMessage] = useState('')

    const handleVoidSuccess = () => {
        setVoidDialog(null)
        setSuccessMessage('Redemption voided successfully! Points refunded.')
        setTimeout(() => setSuccessMessage(''), 5000)
        router.refresh()
    }

    return (
        <div>
            {successMessage && (
                <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
                    ✅ {successMessage}
                </div>
            )}

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date/Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Points</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reference</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {transactions.map((t) => {
                            const { dateStr, timeStr } = formatDateTimeGMT8(t.created_at)
                            const isVoided = t.status === 'voided'
                            const canVoid = t.type === 'redeem' && !isVoided && t.redemption_id

                            return (
                                <tr key={t.id} className={`${isVoided ? 'opacity-60' : ''} hover:bg-gray-50 dark:hover:bg-gray-700/50`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{dateStr}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{timeStr}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${isVoided
                                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                            : t.type === 'earn'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                            }`}>
                                            {isVoided ? 'VOIDED' : t.type.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`text-sm font-bold ${isVoided
                                            ? 'text-gray-500 line-through'
                                            : t.type === 'earn'
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-red-600 dark:text-red-400'
                                            }`}>
                                            {t.type === 'earn' ? '+' : '-'}{Math.abs(t.points)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={t.description}>
                                            {t.description || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        {canVoid && (
                                            <button
                                                onClick={() => setVoidDialog({
                                                    id: t.redemption_id!,
                                                    name: t.reward_name || t.description || 'Reward',
                                                    points: Math.abs(t.points)
                                                })}
                                                className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                                            >
                                                Void
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No transactions found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-2">
                {transactions.map((t) => {
                    const { dateStr, timeStr } = formatDateTimeGMT8(t.created_at)
                    const isVoided = t.status === 'voided'
                    const canVoid = t.type === 'redeem' && !isVoided && t.redemption_id

                    return (
                        <div key={t.id} className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 ${isVoided ? 'opacity-60' : ''}`}>
                            {/* Top Row: Type Badge and Points */}
                            <div className="flex items-center justify-between mb-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${isVoided
                                    ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                    : t.type === 'earn'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                    }`}>
                                    {isVoided ? 'VOIDED' : t.type.toUpperCase()}
                                </span>
                                <div className={`text-lg font-bold ${isVoided
                                    ? 'text-gray-500 line-through'
                                    : t.type === 'earn'
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-red-600 dark:text-red-400'
                                    }`}>
                                    {t.type === 'earn' ? '+' : '-'}{Math.abs(t.points)} pts
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-gray-900 dark:text-white font-medium mb-1 line-clamp-2">
                                {t.description || 'No description'}
                            </p>

                            {/* Date/Time */}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                📅 {dateStr} • 🕐 {timeStr}
                            </p>

                            {/* Void Button */}
                            {canVoid && (
                                <button
                                    onClick={() => setVoidDialog({
                                        id: t.redemption_id!,
                                        name: t.reward_name || t.description || 'Reward',
                                        points: Math.abs(t.points)
                                    })}
                                    className="w-full px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs font-medium border border-red-200 dark:border-red-800 transition-colors"
                                >
                                    Void Transaction
                                </button>
                            )}
                        </div>
                    )
                })}
                {transactions.length === 0 && (
                    <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg">
                        <p className="text-gray-500">No transactions found.</p>
                    </div>
                )}
            </div>

            {voidDialog && (
                <VoidRedemptionDialog
                    redemptionId={voidDialog.id}
                    rewardName={voidDialog.name}
                    points={voidDialog.points}
                    onSuccess={handleVoidSuccess}
                    onCancel={() => setVoidDialog(null)}
                />
            )}
        </div>
    )
}
