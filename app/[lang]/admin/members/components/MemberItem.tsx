'use client'

import { useState } from 'react'
import { updateMember, deleteMember } from '@/app/admin/actions'
import Link from 'next/link'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

export interface Member {
    id: string
    full_name: string
    email?: string
    phone: string
    points_balance: number
    role: string
    created_at: string
}

export default function MemberItem({ member, isManager }: { member: Member, isManager?: boolean }) {
    const [isEditing, setIsEditing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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
        const res = await deleteMember(member.id)
        if (res?.error) {
            alert(res.error)
        }
        setShowDeleteDialog(false)
    }

    if (isEditing) {
        return (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <form action={handleUpdate} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-12 md:col-span-3">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Name</label>
                        <input name="full_name" type="text" defaultValue={member.full_name} required className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
                        <input type="text" value={member.email || 'N/A'} disabled className="w-full px-2 py-1 border rounded text-sm bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed" />
                    </div>
                    <div className="col-span-12 md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Phone</label>
                        <input name="phone" type="text" defaultValue={member.phone} required className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div className="col-span-6 md:col-span-1">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Role</label>
                        <select name="role" defaultValue={member.role} className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white">
                            <option value="member">Member</option>
                            <option value="staff">Staff</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                            <option value="owner">Owner</option>
                        </select>
                    </div>
                    <div className="col-span-6 md:col-span-1">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Points</label>
                        <input name="points" type="number" defaultValue={member.points_balance} required className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div className="col-span-12 md:col-span-2 flex justify-end gap-2 items-end h-full pb-1">
                        <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                        <button type="submit" className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                    </div>
                </form>
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </div>
        )
    }

    return (
        <div className="group grid grid-cols-12 gap-4 items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
            <div className="col-span-3 text-sm font-medium group-hover:font-bold text-gray-900 dark:text-white truncate transition-all" title={member.full_name}>
                <Link href={`/en/admin/members/${member.id}`} className="hover:underline hover:text-blue-600">
                    {member.full_name || 'N/A'}
                </Link>
            </div>
            <div className="col-span-3 text-sm text-gray-500 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white group-hover:font-semibold truncate transition-all" title={member.email}>{member.email || 'N/A'}</div>
            <div className="col-span-2 text-sm text-gray-500 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white group-hover:font-semibold truncate transition-all">{member.phone}</div>
            <div className="col-span-1 text-sm text-gray-500 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white group-hover:font-semibold capitalize transition-all">{member.role}</div>
            <div className="col-span-1 text-sm text-gray-500 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white group-hover:font-semibold transition-all">{member.points_balance}</div>
            <div className="col-span-2 text-right text-sm font-medium">
                {!isManager && (
                    <>
                        <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                        <button onClick={() => setShowDeleteDialog(true)} className="text-red-600 hover:text-red-900">Delete</button>
                    </>
                )}
            </div>

            <ConfirmDialog
                open={showDeleteDialog}
                title="Delete Member?"
                message={`Are you sure you want to delete ${member.full_name}? This will remove their login and all point transaction history. This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                danger={true}
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteDialog(false)}
            />
        </div>
    )
}
