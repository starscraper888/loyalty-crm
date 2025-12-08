'use client'

import { useState, useRef } from 'react'
import { createMember } from '@/app/admin/actions'
import { SubmitButton } from '@/components/ui/SubmitButton'

export default function AddMemberForm() {
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [role, setRole] = useState('member')
    const formRef = useRef<HTMLFormElement>(null)

    const isStaffOrHigher = ['admin', 'manager', 'staff'].includes(role)

    const handleSubmit = async (formData: FormData) => {
        setError(null)
        const res = await createMember(formData)
        if (res?.error) {
            setError(res.error)
        } else {
            formRef.current?.reset()
            setRole('member') // Reset role to default
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New User</h3>
            <form ref={formRef} action={handleSubmit} className="space-y-4">

                {/* Role Selection - First Decision */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Role</label>
                    <select
                        name="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                        <option value="member">Member (Customer)</option>
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        {role === 'member' ? 'Regular customer with points and rewards.' : 'Internal user with access to the dashboard.'}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                        <input name="full_name" type="text" placeholder="John Doe" required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                        <input name="phone" type="text" placeholder="+1234567890" required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email {isStaffOrHigher ? '(Required)' : '(Optional)'}
                        </label>
                        <input
                            name="email"
                            type="email"
                            placeholder="john@example.com"
                            required={isStaffOrHigher}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    {/* Password only for Staff+ */}
                    {isStaffOrHigher && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password (Required)</label>
                            <input
                                name="password"
                                type="text"
                                placeholder="SecurePassword123"
                                required
                                minLength={6}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    )}

                    {/* Points only for Members (usually staff don't need initial points, but keeping it optional) */}
                    {!isStaffOrHigher && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Initial Points</label>
                            <input name="points" type="number" defaultValue="0" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
                        </div>
                    )}
                </div>

                <div className="flex justify-end items-center gap-4 pt-2">
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    {success && <p className="text-green-600 text-sm font-medium">Successfully added!</p>}
                    <SubmitButton
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        loadingText={`Adding ${role}...`}
                    >
                        Add {role.charAt(0).toUpperCase() + role.slice(1)}
                    </SubmitButton>
                </div>
            </form>
        </div>
    )
}
