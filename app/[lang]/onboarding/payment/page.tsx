'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createOnboardingCheckout } from '@/app/onboarding/actions'

export default function PaymentPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const tier = searchParams.get('tier') as 'starter' | 'pro' | 'enterprise'
    const tenantId = searchParams.get('tenant')

    useEffect(() => {
        if (!tier || !tenantId) {
            router.push('/onboarding')
            return
        }

        // Create checkout session
        createOnboardingCheckout({ tenantId, tier }).then((result) => {
            if (result.error) {
                setError(result.error)
                setLoading(false)
            } else if (result.sessionUrl) {
                // Redirect to Stripe Checkout
                window.location.href = result.sessionUrl
            }
        })
    }, [tier, tenantId, router])

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
                {loading && !error && (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <h2 className="text-xl font-bold text-gray-900">Redirecting to payment...</h2>
                        <p className="text-gray-600 mt-2">Please wait while we set up your checkout</p>
                    </>
                )}

                {error && (
                    <>
                        <div className="text-red-600 text-5xl mb-4">⚠️</div>
                        <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
                        <p className="text-gray-600 mt-2">{error}</p>
                        <button
                            onClick={() => router.push('/onboarding')}
                            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                        >
                            Go Back
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
