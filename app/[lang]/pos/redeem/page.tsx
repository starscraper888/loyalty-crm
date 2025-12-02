'use client'

import { useState } from 'react'

export default function PosRedeemPage() {
    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState('')
    const [status, setStatus] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setStatus('Verifying...')

        try {
            const res = await fetch('/api/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp })
            })

            const data = await res.json()

            if (res.ok) {
                setStatus('Success! Redemption Completed.')
                setPhone('')
                setOtp('')
            } else {
                setStatus(`Error: ${data.error}`)
            }
        } catch (err) {
            setStatus('Network error')
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 flex flex-col items-center justify-center">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                <h1 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">POS: Redeem Reward</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Customer Phone</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="w-full px-4 py-3 text-lg border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="+1234567890"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">OTP Code</label>
                        <input
                            type="text"
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
                            className="w-full px-4 py-3 text-lg border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white tracking-widest text-center"
                            placeholder="000000"
                            maxLength={6}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 text-xl font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 active:scale-95 transition-transform"
                    >
                        Verify & Redeem
                    </button>

                    {status && (
                        <p className={`text-center font-medium ${status.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                            {status}
                        </p>
                    )}
                </form>
            </div>
        </div>
    )
}
