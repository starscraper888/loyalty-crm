'use client'

import { useState } from 'react'
import { updateMember, deleteMember } from '@/app/admin/actions'

interface Member {
    id: string
    full_name: string
    email?: string
    phone: string
    points_balance: number
    role: string
    created_at: string
}

export default function MemberItem({ member }: { member: Member }) {
    const [isEditing, setIsEditing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleUpdate = async (formData: FormData) => {
        const res = await updateMember(member.id, formData)
        if (res?.error) {
            setError(res.error)
        } else {
            setIsEditing(false)
            setError(null)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this member? This will remove their login and points history.')) return

        const res = await deleteMember(member.id)
        if (res?.error) {
            alert(res.error)
        }
    }

    if (isEditing) {
        return (
            <tr className="bg-blue-50 dark:bg-blue-900/20">
                <td colSpan={6} className="px-6 py-4">
                    <form action={handleUpdate} className="flex gap-4 items-center flex-wrap">
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Name</label>
                            <input name="full_name" type="text" defaultValue={member.full_name} required className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white" />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Email (Read-only)</label>
                            <input type="text" value={member.email || 'N/A'} disabled className="w-full px-2 py-1 border rounded text-sm bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed" />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Phone</label>
                            <input name="phone" type="text" defaultValue={member.phone} required className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white" />
                        </div>
                        <div className="w-24">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Points</label>
                            <input name="points" type="number" defaultValue={member.points_balance} required className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white" />
                        </div>
                        <div className="w-32">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Role</label>
                            <select name="role" defaultValue={member.role} className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white">
                                <option value="member">Member</option>
                                <option value="staff">Staff</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                                <option value="owner">Owner</option>
                            </select>
                        </div>
                        <div className="flex gap-2 mt-4 sm:mt-0">
                            <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                            <button type="submit" className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                        </div>
                    </form>
                    {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                </td>
            </tr>
        )
    }

    return (
        <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{member.full_name || 'N/A'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{member.email || 'N/A'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{member.phone}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{member.role}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{member.points_balance}</td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                <button onClick={handleDelete} className="text-red-600 hover:text-red-900">Delete</button>
            </td>
        </tr>
    )
}
