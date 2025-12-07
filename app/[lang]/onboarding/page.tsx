'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createTenant } from '@/app/onboarding/actions'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Form data
    const [ownerEmail, setOwnerEmail] = useState('')
    const [businessName, setBusinessName] = useState('')
    const [ownerName, setOwnerName] = useState('')
    const [ownerPassword, setOwnerPassword] = useState('')
    const [selectedTier, setSelectedTier] = useState<'starter' | 'pro' | 'enterprise'>('starter')

    const handleNext = () => {
        setError('')

        // Step 1: Email validation
        if (step === 1 && !ownerEmail.trim()) {
            setError('Email is required')
            return
        }
        if (step === 1 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
            setError('Please enter a valid email address')
            return
        }

        // Step 2: Business details validation
        if (step === 2 && (!businessName.trim() || !ownerName.trim() || !ownerPassword.trim())) {
            setError('All fields are required')
            return
        }
        if (step === 2 && ownerPassword.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        setStep(step + 1)
    }

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1)
            setError('')
        }
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

        // Auto-login the user
        try {
            const supabase = createClient()
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: ownerEmail,
                password: ownerPassword,
            })

            if (signInError) {
                console.error('Auto-login failed:', signInError)
                // We don't block the flow, but user might need to login manually
            }
        } catch (e) {
            console.error('Auto-login error:', e)
        }

        // Redirect to payment
        if (selectedTier === 'starter' || selectedTier === 'pro' || selectedTier === 'enterprise') {
            router.push(`/onboarding/payment?tier=${selectedTier}&tenant=${result.tenantId}`)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl max-w-2xl w-full p-8 border border-slate-700">
                {/* Back Button */}
                <div className="mb-6">
                    {step === 1 ? (
                        <Link
                            href="/en"
                            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="text-sm font-medium">Back to Home</span>
                        </Link>
                    ) : (
                        <button
                            onClick={handleBack}
                            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="text-sm font-medium">Back</span>
                        </button>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between mb-2">
                        <span className={`text-sm font-medium ${step >= 1 ? 'text-blue-400' : 'text-slate-500'}`}>
                            Email
                        </span>
                        <span className={`text-sm font-medium ${step >= 2 ? 'text-blue-400' : 'text-slate-500'}`}>
                            Business Details
                        </span>
                        <span className={`text-sm font-medium ${step >= 3 ? 'text-blue-400' : 'text-slate-500'}`}>
                            Choose Plan
                        </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full">
                        <div
                            className="h-2 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-300"
                            style={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Step 1: Email Capture */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold text-white">
                                Start Your Free Trial
                            </h2>
                            <p className="text-slate-400 mt-2">Enter your email to get started</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={ownerEmail}
                                onChange={(e) => setOwnerEmail(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="you@company.com"
                                autoFocus
                            />
                            <p className="text-slate-500 text-xs mt-2">We'll use this for your account and updates</p>
                        </div>

                        {error && <div className="text-red-400 text-sm font-medium bg-red-900/20 px-4 py-2 rounded-lg border border-red-800">{error}</div>}

                        <button
                            onClick={handleNext}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-blue-500/50 transform hover:-translate-y-0.5"
                        >
                            Continue
                        </button>
                    </div>
                )}

                {/* Step 2: Business Details */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold text-white">
                                Tell us about your business
                            </h2>
                            <p className="text-slate-400 mt-2">Complete your account setup</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Business Name
                            </label>
                            <input
                                type="text"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="e.g., Acme Coffee Shop"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Your Full Name</label>
                            <input
                                type="text"
                                value={ownerName}
                                onChange={(e) => setOwnerName(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                            <input
                                type="password"
                                value={ownerPassword}
                                onChange={(e) => setOwnerPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Min. 8 characters"
                            />
                        </div>

                        {error && <div className="text-red-400 text-sm font-medium bg-red-900/20 px-4 py-2 rounded-lg border border-red-800">{error}</div>}

                        <button
                            onClick={handleNext}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-blue-500/50 transform hover:-translate-y-0.5"
                        >
                            Continue
                        </button>
                    </div>
                )}

                {/* Step 3: Choose Plan */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold text-white">
                                Choose your plan
                            </h2>
                            <p className="text-slate-400 mt-2">Start with a 30-day free trial</p>
                        </div>

                        <div className="space-y-4">
                            {/* Starter Plan */}
                            <div
                                onClick={() => setSelectedTier('starter')}
                                className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${selectedTier === 'starter'
                                    ? 'border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-900/20'
                                    : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Starter</h3>
                                        <p className="text-slate-400 text-sm mt-1">Perfect for small businesses</p>
                                        <div className="mt-3 space-y-1 text-sm text-slate-300">
                                            <p>✓ 1,000 members</p>
                                            <p>✓ 5,000 transactions/month</p>
                                            <p>✓ Basic analytics</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-white">$29</p>
                                        <p className="text-slate-400 text-sm">/month</p>
                                    </div>
                                </div>
                            </div>

                            {/* Pro Plan */}
                            <div
                                onClick={() => setSelectedTier('pro')}
                                className={`p-6 rounded-xl border-2 cursor-pointer transition-all relative ${selectedTier === 'pro'
                                    ? 'border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-900/20'
                                    : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                                    }`}
                            >
                                <div className="absolute -top-3 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                    POPULAR
                                </div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Pro</h3>
                                        <p className="text-slate-400 text-sm mt-1">For growing businesses</p>
                                        <div className="mt-3 space-y-1 text-sm text-slate-300">
                                            <p>✓ 10,000 members</p>
                                            <p>✓ 50,000 transactions/month</p>
                                            <p>✓ Advanced analytics</p>
                                            <p>✓ Priority support</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-white">$99</p>
                                        <p className="text-slate-400 text-sm">/month</p>
                                    </div>
                                </div>
                            </div>

                            {/* Enterprise Plan */}
                            <div
                                onClick={() => setSelectedTier('enterprise')}
                                className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${selectedTier === 'enterprise'
                                    ? 'border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-900/20'
                                    : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Enterprise</h3>
                                        <p className="text-slate-400 text-sm mt-1">For large organizations</p>
                                        <div className="mt-3 space-y-1 text-sm text-slate-300">
                                            <p>✓ Unlimited members</p>
                                            <p>✓ Unlimited transactions</p>
                                            <p>✓ White-label branding</p>
                                            <p>✓ Dedicated support</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-white">$299</p>
                                        <p className="text-slate-400 text-sm">/month</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && <div className="text-red-400 text-sm font-medium bg-red-900/20 px-4 py-2 rounded-lg border border-red-800">{error}</div>}

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-blue-500/50 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Account...' : 'Start Free Trial'}
                        </button>

                        <p className="text-center text-slate-500 text-sm">
                            30-day free trial • No credit card required • Cancel anytime
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
