'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SuccessPage() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to dashboard after 3 seconds
        const timer = setTimeout(() => {
            router.push('/admin/dashboard')
        }, 3000)

        return () => clearTimeout(timer)
    }, [router])

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
                <div className="text-green-600 text-6xl mb-4">✓</div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome aboard!</h2>
                <p className="text-gray-600 mt-2">Your account has been created successfully</p>

                <div className="mt-6 bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-900 font-medium">
                        🎉 Your 30-day free trial starts now
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                        No charges until {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                </div>

                <p className="text-sm text-gray-500 mt-6">Redirecting to your dashboard...</p>
            </div>
        </div>
    )
}
