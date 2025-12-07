'use client'

import { useState, useEffect } from 'react'
import { generateMyOTP } from '@/app/member/actions'
import QRCodeDisplay from '../components/QRCodeDisplay'

export default function MemberQRCodePage() {
    const [otp, setOtp] = useState<string | null>(null)
    const [expiresAt, setExpiresAt] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [timeLeft, setTimeLeft] = useState<number>(0)

    const fetchOTP = async () => {
        setLoading(true)
        setError(null)

        const result = await generateMyOTP()

        if (result.error) {
            setError(result.error)
            setOtp(null)
        } else {
            setOtp(result.otp!)
            setExpiresAt(result.expiresAt!)
        }

        setLoading(false)
    }

    // Calculate time left
    useEffect(() => {
        if (!expiresAt) return

        const interval = setInterval(() => {
            const now = new Date().getTime()
            const expiry = new Date(expiresAt).getTime()
            const diff = Math.max(0, Math.floor((expiry - now) / 1000))

            setTimeLeft(diff)

            if (diff === 0) {
                setOtp(null)
                setExpiresAt(null)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [expiresAt])

    // Format time remaining
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="px-4 sm:px-0">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">QR Code</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Show this to staff for verification
                </p>
            </div>

            <div className="max-w-md mx-auto">
                {!otp ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">
                        {error && (
                            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="text-6xl mb-6">📱</div>

                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Generate Your Code
                        </h3>

                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Click below to generate a one-time verification code
                        </p>

                        <button
                            onClick={fetchOTP}
                            disabled={loading}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Generating...' : 'Generate Code'}
                        </button>

                        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                            Code expires in 5 minutes
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8">
                        {/* QR Code */}
                        <div className="mb-6">
                            <QRCodeDisplay value={otp} />
                        </div>

                        {/* OTP Display */}
                        <div className="text-center mb-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                Or show this code:
                            </p>
                            <div className="text-5xl font-mono font-bold text-gray-900 dark:text-white tracking-wider">
                                {otp}
                            </div>
                        </div>

                        {/* Timer */}
                        <div className="text-center mb-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Expires in
                            </p>
                            <p className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatTime(timeLeft)}
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
                            <div
                                className={`h-2 rounded-full transition-all ${timeLeft < 60 ? 'bg-red-600' : 'bg-green-600'}`}
                                style={{ width: `${(timeLeft / 300) * 100}%` }}
                            />
                        </div>

                        {/* Instructions */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                💡 <strong>Instructions:</strong> Show this QR code or 6-digit code to the staff at the counter to verify your identity.
                            </p>
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={fetchOTP}
                            className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                            Generate New Code
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
