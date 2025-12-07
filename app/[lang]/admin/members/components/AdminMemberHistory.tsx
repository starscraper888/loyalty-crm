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

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 grid grid-cols-12 gap-4 font-semibold text-sm uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    <div className="col-span-3">Date/Time</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Points</div>
                    <div className="col-span-4">Reference</div>
                    <div className="col-span-1">Action</div>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {transactions.map((t) => {
                        const { dateStr, timeStr } = formatDateTimeGMT8(t.created_at)
                        const isVoided = t.status === 'voided'
                        const canVoid = t.type === 'redeem' && !isVoided && t.redemption_id

                        return (
                            <div key={t.id} className={`p-4 grid grid-cols-12 gap-4 items-center ${isVoided ? 'opacity-60' : ''}`}>
                                <div className="col-span-3 text-sm text-gray-900 dark:text-white">
                                    <div className="font-medium">{dateStr}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{timeStr}</div>
                                </div>

                                <div className="col-span-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isVoided
                                        ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                        : t.type === 'earn'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                        }`}>
                                        {isVoided ? 'VOIDED' : t.type.toUpperCase()}
                                    </span>
                                </div>

                                <div className={`col-span-2 text-sm font-bold ${isVoided
                                    ? 'text-gray-500 line-through'
                                    : t.type === 'earn'
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                    }`}>
                                    {t.type === 'earn' ? '+' : '-'}{Math.abs(t.points)}
                                </div>

                                <div className="col-span-4 text-sm text-gray-500 dark:text-gray-400 truncate" title={t.description}>
                                    {t.description || '-'}
                                </div>

                                <div className="col-span-1">
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
                                    {isVoided && (
                                        <span className="text-xs text-gray-400">—</span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                    {transactions.length === 0 && (
                        <div className="p-8 text-center text-gray-500">No transactions found.</div>
                    )}
                </div>
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
