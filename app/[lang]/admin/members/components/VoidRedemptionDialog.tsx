'use client'

import { useState } from 'react'
import { voidRedemption } from '@/app/admin/actions'

interface VoidRedemptionDialogProps {
    redemptionId: string
    rewardName: string
    points: number
    onSuccess: () => void
    onCancel: () => void
}

export default function VoidRedemptionDialog({
    redemptionId,
    rewardName,
    points,
    onSuccess,
    onCancel
}: VoidRedemptionDialogProps) {
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleVoid = async () => {
        if (!reason.trim()) {
            setError('Please enter a reason for voiding this redemption')
            return
        }

        setLoading(true)
        setError('')

        const result = await voidRedemption(redemptionId, reason)

        setLoading(false)

        if (result.error) {
            setError(result.error)
        } else if (result.success) {
            onSuccess()
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Void Redemption
                </h3>

                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                        ⚠️ <strong>Warning:</strong> This will refund points to the customer.
                    </p>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                        <p><strong>Reward:</strong> {rewardName}</p>
                        <p><strong>Points to refund:</strong> {points} pts</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Reason for voiding *
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Wrong reward selected, Customer complaint, Staff error..."
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleVoid}
                        disabled={loading || !reason.trim()}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                    >
                        {loading ? 'Voiding...' : 'Void & Refund'}
                    </button>
                </div>
            </div>
        </div>
    )
}
