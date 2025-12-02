'use client'

import { useState } from 'react'

export default function PosEarnPage() {
    const [phone, setPhone] = useState('')
    const [points, setPoints] = useState('')
    const [pin, setPin] = useState('')
    const [showPin, setShowPin] = useState(false)
    const [status, setStatus] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setStatus('Processing...')

        if (Number(points) > 500 && !pin) {
            setShowPin(true)
            setStatus('Please enter Staff PIN for high value transaction')
            return
        }

        try {
            const res = await fetch('/api/earn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, points: Number(points), pin })
            })

            const data = await res.json()

            if (res.ok) {
                setStatus('Success! Points issued.')
                setPhone('')
                setPoints('')
                setPin('')
                setShowPin(false)
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
                <h1 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">POS: Issue Points</h1>

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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Points Amount</label>
                        <input
                            type="number"
                            value={points}
                            onChange={e => setPoints(e.target.value)}
                            className="w-full px-4 py-3 text-lg border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="0"
                            required
                        />
                    </div>

                    {showPin && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800">
                            <label className="block text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Staff PIN Required (&gt;500 pts)</label>
                            <input
                                type="password"
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Enter PIN"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full py-4 text-xl font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:scale-95 transition-transform"
                    >
                        Issue Points
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
