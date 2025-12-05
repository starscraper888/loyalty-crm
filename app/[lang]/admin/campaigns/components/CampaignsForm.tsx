'use client'

import { sendCampaign } from '@/app/admin/campaigns/actions'
import { useState } from 'react'

export default function CampaignsForm() {
    const [status, setStatus] = useState('')

    async function handleSubmit(formData: FormData) {
        setStatus('Sending...')
        const result = await sendCampaign(formData)
        if (result?.error) {
            setStatus(`Error: ${result.error}`)
        } else if (result?.success) {
            setStatus(result.message || 'Campaign Sent!')
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <form action={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Audience</label>
                    <select name="segment" className="w-full px-4 py-2 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option value="all">All Members</option>
                        <option value="vip">VIP Members (&gt;1000 pts)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message Content</label>
                    <textarea
                        name="message"
                        rows={5}
                        required
                        placeholder="Hello! Check out our new rewards..."
                        className="w-full px-4 py-2 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Note: Marketing messages must use approved templates in production.</p>
                </div>

                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        className="px-6 py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        Send Broadcast
                    </button>

                    {status && (
                        <span className={`font-medium ${status.startsWith('Error') ? 'text-red-600' : 'text-blue-600'}`}>
                            {status}
                        </span>
                    )}
                </div>
            </form>
        </div>
    )
}
