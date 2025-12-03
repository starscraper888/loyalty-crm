'use client'

import { lookupCustomer, redeemReward, getRewards } from '@/app/staff/actions'
import { useState, useEffect } from 'react'

export default function RedeemPage() {
    const [step, setStep] = useState<'lookup' | 'redeem'>('lookup')
    const [profile, setProfile] = useState<any>(null)
    const [rewards, setRewards] = useState<any[]>([])
    const [message, setMessage] = useState('')

    useEffect(() => {
        getRewards().then(setRewards)
    }, [])

    async function handleLookup(formData: FormData) {
        const identifier = formData.get('identifier') as string
        const result = await lookupCustomer(identifier)

        if (result.error) {
            alert(result.error)
        } else if (result.success) {
            setProfile(result.profile)
            setStep('redeem')
            setMessage('')
        }
    }

    async function handleRedeem(formData: FormData) {
        if (!profile) return
        const rewardId = formData.get('rewardId') as string

        const result = await redeemReward(profile.id, rewardId)

        if (result?.error) {
            alert(result.error)
        } else if (result?.success) {
            setMessage(result.message || 'Success')
            setStep('lookup')
            setProfile(null)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 flex items-center justify-center">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Redeem Reward</h1>

                {message && (
                    <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg text-center">
                        {message}
                    </div>
                )}

                {step === 'lookup' ? (
                    <form action={handleLookup} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer OTP or Phone</label>
                            <input
                                name="identifier"
                                type="text"
                                placeholder="Enter 6-digit OTP or Phone"
                                required
                                className="w-full px-4 py-2 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Ask customer to send "Get" on WhatsApp for OTP.</p>
                        </div>

                        <button
                            type="submit"
                            className="w-full px-4 py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Find Customer
                        </button>

                        <a href="/en/staff/dashboard" className="block text-center text-gray-500 hover:underline">
                            Cancel
                        </a>
                    </form>
                ) : (
                    <form action={handleRedeem} className="space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Customer</p>
                            <p className="font-bold text-lg text-gray-900 dark:text-white">{profile.full_name || 'Unknown Name'}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{profile.phone}</p>
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">Current Balance: {profile.points_balance} pts</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Reward</label>
                            <select
                                name="rewardId"
                                required
                                className="w-full px-4 py-2 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Choose a Reward --</option>
                                {rewards.map(reward => (
                                    <option
                                        key={reward.id}
                                        value={reward.id}
                                        disabled={profile.points_balance < reward.cost}
                                    >
                                        {reward.name} ({reward.cost} pts) {profile.points_balance < reward.cost ? '(Insufficient Points)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setStep('lookup')}
                                className="w-1/3 px-4 py-3 font-bold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                className="w-2/3 px-4 py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                Confirm Redemption
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
