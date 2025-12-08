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
    const [currentPoints, setCurrentPoints] = useState(member.points_balance)

    // Track if points changed and by how much
    const pointsDelta = currentPoints - member.points_balance
    const showReasonField = pointsDelta !== 0
    const requireReason = Math.abs(pointsDelta) > 100

    const handleUpdate = async (formData: FormData) => {
        // Validate reason if points changed significantly
        const reason = formData.get('adjustment_reason') as string
        if (requireReason && (!reason || reason.trim().length < 5)) {
            setError('Adjustment reason required for changes >100 points (min 5 characters)')
            return
        }

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
                        <input
                            name="points"
                            type="number"
                            defaultValue={member.points_balance}
                            onChange={(e) => setCurrentPoints(parseInt(e.target.value) || 0)}
                            required
                            className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    {/* Adjustment Reason Field - Shows when points change */}
                    {showReasonField && (
                        <div className="col-span-12 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Adjustment Reason {requireReason && <span className="text-red-500">*</span>}
                                <span className="text-xs font-normal text-gray-500 ml-2">
                                    ({pointsDelta > 0 ? '+' : ''}{pointsDelta} points)
                                </span>
                            </label>
                            <textarea
                                name="adjustment_reason"
                                placeholder="Why are you adjusting this member's points? (e.g., Customer complaint, Data correction, Promotion bonus)"
                                required={requireReason}
                                minLength={5}
                                rows={2}
                                className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white"
                            />
                            {requireReason && (
                                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                    ⚠️ Large adjustments (&gt;100 points) require a reason
                                </p>
                            )}
                        </div>
                    )}

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
