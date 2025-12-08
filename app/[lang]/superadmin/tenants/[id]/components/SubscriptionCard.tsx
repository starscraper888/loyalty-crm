'use client'

import { useState } from 'react'
import { CreditCard, Calendar, DollarSign, Code, RefreshCw } from 'lucide-react'
import { toggleDeveloperModeAction, changePlanAction, extendTrialAction } from '../actions'

interface SubscriptionCardProps {
    subscription: any
    tenant: any
}

export default function SubscriptionCard({ subscription, tenant }: SubscriptionCardProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [showPlanModal, setShowPlanModal] = useState(false)
    const [showTrialModal, setShowTrialModal] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState('')
    const [trialDays, setTrialDays] = useState(14)

    if (!subscription) {
        return (
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-4">Subscription</h2>
                <p className="text-slate-400">No active subscription</p>
            </div>
        )
    }

    const getPriceForTier = (tier: string) => {
        const prices = {
            enterprise: 299,
            pro: 99,
            starter: 29
        }
        return prices[tier as keyof typeof prices] || 0
    }

    const price = getPriceForTier(subscription.tier)

    const handleToggleDeveloperMode = async () => {
        setIsLoading(true)
        setMessage(null)

        const result = await toggleDeveloperModeAction(tenant.id, !tenant.is_developer_mode)

        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: 'Developer mode updated' })
            setTimeout(() => window.location.reload(), 1000)
        }

        setIsLoading(false)
    }

    const handleChangePlan = async () => {
        if (!selectedPlan) return

        setIsLoading(true)
        const result = await changePlanAction(tenant.id, selectedPlan)

        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: 'Plan changed successfully' })
            setTimeout(() => window.location.reload(), 1000)
        }

        setIsLoading(false)
        setShowPlanModal(false)
    }

    const handleExtendTrial = async () => {
        setIsLoading(true)
        const result = await extendTrialAction(tenant.id, trialDays)

        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: 'Trial extended successfully' })
            setTimeout(() => window.location.reload(), 1000)
        }

        setIsLoading(false)
        setShowTrialModal(false)
    }

    return (
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-6">Subscription Details</h2>

            {/* Message */}
            {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                    : 'bg-red-500/10 border border-red-500/20 text-red-300'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Current Plan */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <h3 className="text-sm font-medium text-slate-400">Current Plan</h3>
                    </div>
                    <p className="text-2xl font-bold text-white">{subscription.tier?.toUpperCase()}</p>
                    <p className="text-sm text-slate-500 mt-1">${price}/month</p>
                </div>

                {/* Next Billing */}
                {subscription.current_period_end && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-5 h-5 text-blue-400" />
                            <h3 className="text-sm font-medium text-slate-400">Next Billing</h3>
                        </div>
                        <p className="text-lg font-semibold text-white">
                            {new Date(subscription.current_period_end).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                            {Math.ceil((new Date(subscription.current_period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
                        </p>
                    </div>
                )}

                {/* Developer Mode Toggle */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Code className="w-5 h-5 text-purple-400" />
                        <h3 className="text-sm font-medium text-slate-400">Developer Mode</h3>
                    </div>
                    <button
                        onClick={handleToggleDeveloperMode}
                        disabled={isLoading}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${tenant.is_developer_mode ? 'bg-green-600' : 'bg-slate-600'
                            } disabled:opacity-50`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${tenant.is_developer_mode ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                    </button>
                    <p className="text-xs text-slate-500 mt-1">
                        {tenant.is_developer_mode ? 'Enabled' : 'Disabled'}
                    </p>
                </div>

                {/* Stripe Customer ID */}
                {subscription.stripe_customer_id && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="w-5 h-5 text-orange-400" />
                            <h3 className="text-sm font-medium text-slate-400">Stripe Customer</h3>
                        </div>
                        <p className="text-sm font-mono text-slate-300 break-all">
                            {subscription.stripe_customer_id}
                        </p>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-slate-700 flex gap-3">
                <button
                    onClick={() => setShowPlanModal(true)}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                    <RefreshCw className="w-4 h-4" />
                    Change Plan
                </button>

                {subscription.status === 'trialing' && (
                    <button
                        onClick={() => setShowTrialModal(true)}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Calendar className="w-4 h-4" />
                        Extend Trial
                    </button>
                )}
            </div>

            {/* Change Plan Modal */}
            {showPlanModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-xl border-2 border-blue-500/40 max-w-md w-full mx-4 p-6">
                        <h3 className="text-2xl font-bold text-white mb-4">Change Subscription Plan</h3>

                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Select New Plan
                            </label>
                            <select
                                value={selectedPlan}
                                onChange={(e) => setSelectedPlan(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Choose plan...</option>
                                <option value="starter">Starter ($29/mo)</option>
                                <option value="pro">Pro ($99/mo)</option>
                                <option value="enterprise">Enterprise ($299/mo)</option>
                            </select>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowPlanModal(false)}
                                disabled={isLoading}
                                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleChangePlan}
                                disabled={isLoading || !selectedPlan}
                                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Changing...' : 'Change Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Extend Trial Modal */}
            {showTrialModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-xl border-2 border-purple-500/40 max-w-md w-full mx-4 p-6">
                        <h3 className="text-2xl font-bold text-white mb-4">Extend Trial Period</h3>

                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Add Days to Trial
                            </label>
                            <input
                                type="number"
                                value={trialDays}
                                onChange={(e) => setTrialDays(Number(e.target.value))}
                                min="1"
                                max="90"
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">Trial will be extended by {trialDays} days</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowTrialModal(false)}
                                disabled={isLoading}
                                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExtendTrial}
                                disabled={isLoading}
                                className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg disabled:opacity-50"
                            >
                                {isLoading ? 'Extending...' : 'Extend Trial'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
