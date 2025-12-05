'use client'

import { useState, useRef } from 'react'
import { createMember } from '@/app/admin/actions'

export default function AddMemberForm() {
    const [error, setError] = useState<string | null>(null)
    const formRef = useRef<HTMLFormElement>(null)

    const handleSubmit = async (formData: FormData) => {
        setError(null)
        const res = await createMember(formData)
        if (res?.error) {
            setError(res.error)
        } else {
            formRef.current?.reset()
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Member</h3>
            <form ref={formRef} action={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                    <input name="full_name" type="text" placeholder="John Doe" required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                    <input name="phone" type="text" placeholder="+1234567890" required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (Optional)</label>
                    <input name="email" type="email" placeholder="john@example.com" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Initial Points</label>
                    <input name="points" type="number" defaultValue="0" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                    <select name="role" defaultValue="member" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white">
                        <option value="member">Member</option>
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                    </select>
                </div>
                <div className="md:col-span-4 flex justify-end items-center gap-4">
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Add Member</button>
                </div>
            </form>
        </div>
    )
}
