'use client'

import { useState } from 'react'
import { openBillingPortal, changePlan } from '@/app/settings/actions'

export default function BillingPortalClient({ subscription, usage, limits, credits }: any) {
    const [loading, setLoading] = useState(false)
    const [changingPlan, setChangingPlan] = useState(false)

    const handleOpenPortal = async () => {
        setLoading(true)
        const result = await openBillingPortal()
        if (result.url) {
            window.location.href = result.url
        } else {
            alert(result.error)
            setLoading(false)
        }
    }

    const handleChangePlan = async (newTier: 'starter' | 'pro' | 'enterprise') => {
        if (!confirm(`Switch to ${newTier.charAt(0).toUpperCase() + newTier.slice(1)} plan?`)) return

        setChangingPlan(true)
        const result = await changePlan(newTier)
        if (result.error) {
            alert(result.error)
        } else {
            window.location.reload()
        }
        setChangingPlan(false)
    }

    const getUsagePercentage = (current: number, max: number) => {
        if (max === -1) return 0 // Unlimited
        return Math.min((current / max) * 100, 100)
    }

    const formatCurrency = (cents: number) => {
        return `$${(cents / 100).toFixed(2)}`
    }

    return (
        <div className="space-y-6">
            {/* Current Plan */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 capitalize">{subscription.tier} Plan</h2>
                        <p className="text-gray-600 mt-1">
                            Status: <span className={`font-medium ${subscription.status === 'active' ? 'text-green-600' :
                                    subscription.status === 'trialing' ? 'text-blue-600' :
                                        subscription.status === 'past_due' ? 'text-red-600' :
                                            'text-gray-600'
                                }`}>
                                {subscription.status === 'trialing' ? 'Free Trial' : subscription.status}
                            </span>
                        </p>
                        {subscription.trial_ends_at && subscription.status === 'trialing' && (
                            <p className="text-sm text-gray-500 mt-1">
                                Trial ends: {new Date(subscription.trial_ends_at).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                    {subscription.tier !== 'developer' && (
                        <button
                            onClick={handleOpenPortal}
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'Manage Billing'}
                        </button>
                    )}
                </div>
            </div>

            {/* Usage Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Current Usage</h3>
                <div className="space-y-4">
                    {/* Members */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Members</span>
                            <span className="font-medium">
                                {usage.members_count} / {limits.max_members === -1 ? '∞' : limits.max_members.toLocaleString()}
                            </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all"
                                style={{ width: `${getUsagePercentage(usage.members_count, limits.max_members)}%` }}
                            />
                        </div>
                    </div>

                    {/* Transactions */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Transactions (this month)</span>
                            <span className="font-medium">
                                {usage.transactions_count} / {limits.max_transactions_per_month === -1 ? '∞' : limits.max_transactions_per_month.toLocaleString()}
                            </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-600 transition-all"
                                style={{ width: `${getUsagePercentage(usage.transactions_count, limits.max_transactions_per_month)}%` }}
                            />
                        </div>
                    </div>

                    {/* WhatsApp Messages */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">WhatsApp Messages (this month)</span>
                            <span className="font-medium">
                                {usage.messages_sent} {limits.max_messages_per_month === -1 ? '(Pay-as-you-go)' : `/ ${limits.max_messages_per_month.toLocaleString()}`}
                            </span>
                        </div>
                        {limits.max_messages_per_month !== -1 && (
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-600 transition-all"
                                    style={{ width: `${getUsagePercentage(usage.messages_sent, limits.max_messages_per_month)}%` }}
                                />
                            </div>
                        )}
                        {limits.max_messages_per_month === -1 && (
                            <p className="text-xs text-gray-500 mt-1">
                                Cost this month: {formatCurrency(usage.whatsapp_cost_cents)}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* WhatsApp Credits */}
            {subscription.tier !== 'developer' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">WhatsApp Credits</h3>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(credits.balance_cents)}</p>
                            <p className="text-sm text-gray-600">Available balance</p>
                        </div>
                        <button
                            onClick={handleOpenPortal}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                            Add Credits
                        </button>
                    </div>
                    {credits.auto_recharge_enabled && (
                        <p className="text-xs text-gray-500 mt-3">
                            ✓ Auto-recharge enabled: Add {formatCurrency(credits.auto_recharge_amount_cents)} when balance drops below {formatCurrency(credits.auto_recharge_threshold_cents)}
                        </p>
                    )}
                </div>
            )}

            {/* Available Plans */}
            {subscription.tier !== 'enterprise' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Upgrade Your Plan</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        {/* Starter */}
                        {subscription.tier !== 'starter' && (
                            <div className="border-2 border-gray-200 rounded-lg p-4">
                                <h4 className="font-bold text-lg">Starter</h4>
                                <p className="text-2xl font-bold mt-2">$29<span className="text-sm font-normal text-gray-600">/mo</span></p>
                                <ul className="mt-3 space-y-1 text-sm text-gray-600">
                                    <li>✓ 1,000 members</li>
                                    <li>✓ 5,000 transactions/mo</li>
                                </ul>
                                <button
                                    onClick={() => handleChangePlan('starter')}
                                    disabled={changingPlan}
                                    className="w-full mt-4 border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition disabled:opacity-50"
                                >
                                    {subscription.tier === 'pro' || subscription.tier === 'enterprise' ? 'Downgrade' : 'Upgrade'}
                                </button>
                            </div>
                        )}

                        {/* Pro */}
                        {subscription.tier !== 'pro' && (
                            <div className="border-2 border-blue-600 rounded-lg p-4 relative">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                                    Popular
                                </div>
                                <h4 className="font-bold text-lg">Pro</h4>
                                <p className="text-2xl font-bold mt-2">$99<span className="text-sm font-normal text-gray-600">/mo</span></p>
                                <ul className="mt-3 space-y-1 text-sm text-gray-600">
                                    <li>✓ 10,000 members</li>
                                    <li>✓ 50,000 transactions/mo</li>
                                    <li>✓ Advanced analytics</li>
                                </ul>
                                <button
                                    onClick={() => handleChangePlan('pro')}
                                    disabled={changingPlan}
                                    className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {subscription.tier === 'enterprise' ? 'Downgrade' : 'Upgrade'}
                                </button>
                            </div>
                        )}

                        {/* Enterprise */}
                        {subscription.tier !== 'enterprise' && (
                            <div className="border-2 border-gray-200 rounded-lg p-4">
                                <h4 className="font-bold text-lg">Enterprise</h4>
                                <p className="text-2xl font-bold mt-2">$299<span className="text-sm font-normal text-gray-600">/mo</span></p>
                                <ul className="mt-3 space-y-1 text-sm text-gray-600">
                                    <li>✓ Unlimited everything</li>
                                    <li>✓ White-label</li>
                                    <li>✓ Dedicated support</li>
                                </ul>
                                <button
                                    onClick={() => handleChangePlan('enterprise')}
                                    disabled={changingPlan}
                                    className="w-full mt-4 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                                >
                                    Upgrade
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
