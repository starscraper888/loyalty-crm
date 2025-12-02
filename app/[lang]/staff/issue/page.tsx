'use client'

import { issuePoints } from '@/app/staff/actions'
import { useState } from 'react'

export default function IssuePointsPage() {
    const [message, setMessage] = useState('')

    async function handleSubmit(formData: FormData) {
        const result = await issuePoints(formData)
        if (result?.error) {
            alert(result.error)
        } else if (result?.success) {
            setMessage(result.message || 'Success')
            // Reset form?
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 flex items-center justify-center">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Issue Points</h1>

                {message && (
                    <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
                        {message}
                    </div>
                )}

                <form action={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Member Phone</label>
                        <input
                            name="phone"
                            type="tel"
                            placeholder="+1234567890"
                            required
                            className="w-full px-4 py-2 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Points Amount</label>
                        <input
                            name="points"
                            type="number"
                            placeholder="100"
                            required
                            min="1"
                            className="w-full px-4 py-2 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <input
                            name="description"
                            type="text"
                            placeholder="Purchase #1234"
                            className="w-full px-4 py-2 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full px-4 py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Issue Points
                    </button>

                    <a href="/en/staff/dashboard" className="block text-center text-gray-500 hover:underline">
                        Cancel
                    </a>
                </form>
            </div>
        </div>
    )
}
