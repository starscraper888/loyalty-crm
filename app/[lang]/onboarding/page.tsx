'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTenant } from '@/app/onboarding/actions'

export default function OnboardingPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Form data
    const [businessName, setBusinessName] = useState('')
    const [ownerName, setOwnerName] = useState('')
    const [ownerEmail, setOwnerEmail] = useState('')
    const [ownerPassword, setOwnerPassword] = useState('')
    const [selectedTier, setSelectedTier] = useState<'starter' | 'pro' | 'enterprise'>('starter')

    const handleNext = () => {
        setError('')
        if (step === 1 && !businessName.trim()) {
            setError('Business name is required')
            return
        }
        if (step === 2 && (!ownerName.trim() || !ownerEmail.trim() || !ownerPassword.trim())) {
            setError('All fields are required')
            return
        }
        if (step === 2 && ownerPassword.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }
        setStep(step + 1)
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError('')

        const result = await createTenant({
            businessName,
            ownerName,
            ownerEmail,
            ownerPassword,
            tier: selectedTier,
        })

        if (result.error) {
            setError(result.error)
            setLoading(false)
            return
        }

        // Redirect to payment or dashboard
        if (selectedTier === 'starter' || selectedTier === 'pro' || selectedTier === 'enterprise') {
            router.push(`/onboarding/payment?tier=${selectedTier}&tenant=${result.tenantId}`)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between mb-2">
                        <span className={`text-sm font-medium ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                            Business Info
                        </span>
                        <span className={`text-sm font-medium ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                            Owner Account
                        </span>
                        <span className={`text-sm font-medium ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                            Choose Plan
                        </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                        <div
                            className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Step 1: Business Info */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Welcome! Let's get started</h2>
                            <p className="text-gray-600 mt-2">Tell us about your business</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Business Name
                            </label>
                            <input
                                type="text"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Acme Coffee Shop"
                            />
                        </div>

                        {error && <div className="text-red-600 text-sm">{error}</div>}

                        <button
                            onClick={handleNext}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                        >
                            Continue
                        </button>
                    </div>
                )}

                {/* Step 2: Owner Account */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
                            <p className="text-gray-600 mt-2">You'll be the owner of {businessName}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                value={ownerName}
                                onChange={(e) => setOwnerName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                value={ownerEmail}
                                onChange={(e) => setOwnerEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="john@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <input
                                type="password"
                                value={ownerPassword}
                                onChange={(e) => setOwnerPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Min. 8 characters"
                            />
                        </div>

                        {error && <div className="text-red-600 text-sm">{error}</div>}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleNext}
                                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Choose Plan */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Choose your plan</h2>
                            <p className="text-gray-600 mt-2">30-day free trial • Cancel anytime</p>
                        </div>

                        <div className="grid gap-4">
                            {/* Starter */}
                            <div
                                onClick={() => setSelectedTier('starter')}
                                className={`border-2 rounded-lg p-6 cursor-pointer transition ${selectedTier === 'starter'
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-gray-200 hover:border-blue-300'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold">Starter</h3>
                                        <p className="text-gray-600 text-sm mt-1">Perfect for small businesses</p>
                                        <p className="text-2xl font-bold mt-3">$29<span className="text-sm font-normal text-gray-600">/month</span></p>
                                        <ul className="mt-4 space-y-2 text-sm text-gray-600">
                                            <li>✓ 1,000 members</li>
                                            <li>✓ 5,000 transactions/month</li>
                                            <li>✓ WhatsApp (pay-as-you-go)</li>
                                        </ul>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 ${selectedTier === 'starter' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                                        }`}>
                                        {selectedTier === 'starter' && <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>}
                                    </div>
                                </div>
                            </div>

                            {/* Pro */}
                            <div
                                onClick={() => setSelectedTier('pro')}
                                className={`border-2 rounded-lg p-6 cursor-pointer transition ${selectedTier === 'pro'
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-gray-200 hover:border-blue-300'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold">Pro</h3>
                                        <p className="text-gray-600 text-sm mt-1">For growing businesses</p>
                                        <p className="text-2xl font-bold mt-3">$99<span className="text-sm font-normal text-gray-600">/month</span></p>
                                        <ul className="mt-4 space-y-2 text-sm text-gray-600">
                                            <li>✓ 10,000 members</li>
                                            <li>✓ 50,000 transactions/month</li>
                                            <li>✓ Advanced analytics + API</li>
                                        </ul>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 ${selectedTier === 'pro' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                                        }`}>
                                        {selectedTier === 'pro' && <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>}
                                    </div>
                                </div>
                            </div>

                            {/* Enterprise */}
                            <div
                                onClick={() => setSelectedTier('enterprise')}
                                className={`border-2 rounded-lg p-6 cursor-pointer transition ${selectedTier === 'enterprise'
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-gray-200 hover:border-blue-300'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold">Enterprise</h3>
                                        <p className="text-gray-600 text-sm mt-1">Unlimited everything</p>
                                        <p className="text-2xl font-bold mt-3">$299<span className="text-sm font-normal text-gray-600">/month</span></p>
                                        <ul className="mt-4 space-y-2 text-sm text-gray-600">
                                            <li>✓ Unlimited members</li>
                                            <li>✓ White-label + Custom domain</li>
                                            <li>✓ Dedicated support</li>
                                        </ul>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 ${selectedTier === 'enterprise' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                                        }`}>
                                        {selectedTier === 'enterprise' && <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && <div className="text-red-600 text-sm">{error}</div>}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(2)}
                                disabled={loading}
                                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {loading ? 'Creating account...' : 'Start Free Trial'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
