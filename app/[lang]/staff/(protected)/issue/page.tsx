'use client'

import { lookupCustomer, issuePoints, quickCreateAndIssuePoints } from '@/app/staff/actions'
import { useState } from 'react'

export default function IssuePointsPage() {
    const [step, setStep] = useState<'lookup' | 'issue' | 'quickreg'>('lookup')
    const [profile, setProfile] = useState<any>(null)
    const [message, setMessage] = useState('')
    const [newMemberPhone, setNewMemberPhone] = useState('')

    async function handleLookup(formData: FormData) {
        const identifier = formData.get('identifier') as string
        const result = await lookupCustomer(identifier)

        if (result.error) {
            // If customer not found, offer quick registration
            if (result.error === "Customer not found") {
                setNewMemberPhone(identifier)
                setStep('quickreg')
                setMessage('')
            } else {
                alert(result.error)
            }
        } else if (result.success) {
            setProfile(result.profile)
            setStep('issue')
            setMessage('')
        }
    }

    async function handleQuickCreate(formData: FormData) {
        const fullName = formData.get('full_name') as string
        const points = parseInt(formData.get('points') as string)
        const description = formData.get('description') as string

        const result = await quickCreateAndIssuePoints(
            newMemberPhone,
            fullName,
            points,
            description
        )

        if (result?.error) {
            alert(result.error)
        } else if (result?.success) {
            setMessage(result.message || 'Success')
            setStep('lookup')
            setProfile(null)
            setNewMemberPhone('')
        }
    }

    async function handleIssue(formData: FormData) {
        if (!profile) return

        const points = parseInt(formData.get('points') as string)
        const description = formData.get('description') as string

        const result = await issuePoints(profile.id, points, description)

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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Issue Points</h1>

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
                ) : step === 'quickreg' ? (
                    <form action={handleQuickCreate} className="space-y-6">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-4">
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">📱 New Customer</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{newMemberPhone}</p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">This phone number is not registered. Create a new member below.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Name</label>
                            <input
                                name="full_name"
                                type="text"
                                placeholder="Enter customer name"
                                required
                                className="w-full px-4 py-2 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Customer's full name</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Points to Issue</label>
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
                                placeholder="First purchase"
                                className="w-full px-4 py-2 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => { setStep('lookup'); setNewMemberPhone('') }}
                                className="w-1/3 px-4 py-3 font-bold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                className="w-2/3 px-4 py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                Create & Issue Points
                            </button>
                        </div>
                    </form>
                ) : (
                    <form action={handleIssue} className="space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Customer</p>
                            <p className="font-bold text-lg text-gray-900 dark:text-white">{profile.full_name || 'Unknown Name'}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{profile.phone}</p>
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">Current Balance: {profile.points_balance} pts</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Points to Issue</label>
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
                                Confirm Issue
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
