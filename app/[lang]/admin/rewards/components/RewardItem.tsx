'use client'

import { useState } from 'react'
import { toggleReward, updateReward, deleteReward } from '@/app/admin/actions'

interface Reward {
    id: string
    name: string
    cost: number
    description: string
    is_active: boolean
}

export default function RewardItem({ reward, isManager }: { reward: Reward, isManager?: boolean }) {
    const [isEditing, setIsEditing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleUpdate = async (formData: FormData) => {
        const res = await updateReward(reward.id, formData)
        if (res?.error) {
            setError(res.error)
        } else {
            setIsEditing(false)
            setError(null)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this reward? This cannot be undone.')) return

        const res = await deleteReward(reward.id)
        if (res?.error) {
            alert(res.error) // Simple alert for delete error
        }
    }

    if (isEditing) {
        return (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow border border-blue-200 dark:border-blue-800">
                <form action={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                        <input name="name" type="text" defaultValue={reward.name} required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cost</label>
                        <input name="cost" type="number" defaultValue={reward.cost} required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <input name="description" type="text" defaultValue={reward.description} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1 text-gray-600 hover:text-gray-800">Cancel</button>
                        <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                    </div>
                </form>
            </div>
        )
    }

    return (
        <div className={`p-6 rounded-xl shadow border ${reward.is_active ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800 opacity-75'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{reward.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{reward.description}</p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">{reward.cost} pts</span>
            </div>

            {!isManager && (
                <div className="mt-4 flex justify-end gap-2 items-center">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                        Edit
                    </button>
                    <span className="text-gray-300">|</span>
                    <form action={async () => {
                        await toggleReward(reward.id, !reward.is_active)
                    }}>
                        <button className={`text-sm font-medium ${reward.is_active ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}>
                            {reward.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                    </form>
                    <span className="text-gray-300">|</span>
                    <button
                        onClick={handleDelete}
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    )
}
