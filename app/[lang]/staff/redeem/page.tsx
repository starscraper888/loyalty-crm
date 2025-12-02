'use client'

import { redeemReward } from '@/app/staff/actions'
import { useActionState } from 'react'

const initialState = {
    message: '',
}

export default function RedeemPage() {
    // Using a simple form for now. In Next.js 15/React 19 useActionState is available but might need polyfill or useFormState.
    // Let's stick to simple form submission for this MVP or standard server actions.

    async function handleSubmit(formData: FormData) {
        const result = await redeemReward(formData)
        if (result?.error) {
            alert(result.error)
        } else if (result?.success) {
            alert("Redemption Successful!")
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 flex items-center justify-center">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Redeem Reward</h1>

                <form action={handleSubmit} className="space-y-6">
                    {/* Hidden ID for demo purposes, in real life this comes from URL or lookup */}
                    <input type="hidden" name="redemptionId" value="demo-id" />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">OTP Code</label>
                        <input
                            name="otp"
                            type="text"
                            placeholder="123456"
                            className="w-full text-center text-3xl tracking-widest px-4 py-4 mt-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                            maxLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full px-4 py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        Verify & Redeem
                    </button>

                    <a href="/en/staff/dashboard" className="block text-center text-gray-500 hover:underline">
                        Cancel
                    </a>
                </form>
            </div>
        </div>
    )
}
