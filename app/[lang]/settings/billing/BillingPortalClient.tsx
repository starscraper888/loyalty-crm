'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { openBillingPortal, changePlan, buyCredits } from '@/app/settings/actions'

export default function BillingPortalClient({ subscription, usage, limits, credits, lang }: any) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [changingPlan, setChangingPlan] = useState(false)
    const [buyingCredits, setBuyingCredits] = useState(false)

    // ... (keep helper functions same) ...

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
        try {
            const result = await changePlan(newTier)
            if (result.error) {
                alert(result.error)
            } else {
                window.location.reload()
            }
        } catch (error) {
            alert('An unexpected error occurred. Please try again.')
        }
        setChangingPlan(false)
    }

    const handleBuyCredits = async (amount: number) => {
        if (!confirm(`Purchase $${amount} worth of credits?`)) return

        setBuyingCredits(true)
        try {
            const result = await buyCredits(amount)
            if (result.url) {
                window.location.href = result.url
            } else {
                alert(result.error)
            }
        } catch (error) {
            alert('Failed to start purchase. Please try again.')
        }
        setBuyingCredits(false)
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
            {/* Header / Back Button */}
            <div className="flex items-center gap-4">
                <Link
                    href={`/${lang}/admin/dashboard`}
                    className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Subscription</h1>
            </div>

            {/* Current Plan */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-white capitalize">{subscription.tier} Plan</h2>
                        <p className="text-slate-400 mt-1">
                            Status: <span className={`font-medium ${subscription.status === 'active' ? 'text-green-400' :
                                subscription.status === 'trialing' ? 'text-blue-400' :
                                    subscription.status === 'past_due' ? 'text-red-400' :
                                        'text-slate-400'
                                }`}>
                                {subscription.status === 'trialing' ? 'Free Trial' : subscription.status}
                            </span>
                        </p>
                        {subscription.trial_ends_at && subscription.status === 'trialing' && (
                            <p className="text-sm text-slate-500 mt-1">
                                Trial ends: {new Date(subscription.trial_ends_at).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                    {subscription.tier !== 'developer' && (
                        <button
                            onClick={handleOpenPortal}
                            disabled={loading}
                            className="bg-blue-600/10 text-blue-400 border border-blue-600/20 px-4 py-2 rounded-lg hover:bg-blue-600/20 transition disabled:opacity-50 text-sm font-medium"
                        >
                            {loading ? 'Opening Portal...' : 'Manage Subscription'}
                        </button>
                    )}
                </div>
            </div>

            {/* Usage Metrics */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-6">Current Usage</h3>
                <div className="space-y-6">
                    {/* Members */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-400">Members</span>
                            <span className="font-medium text-white">
                                {usage.members_count} / {limits.max_members === -1 ? '∞' : limits.max_members.toLocaleString()}
                            </span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                style={{ width: `${getUsagePercentage(usage.members_count, limits.max_members)}%` }}
                            />
                        </div>
                    </div>

                    {/* Transactions */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-400">Transactions (this month)</span>
                            <span className="font-medium text-white">
                                {usage.transactions_count} / {limits.max_transactions_per_month === -1 ? '∞' : limits.max_transactions_per_month.toLocaleString()}
                            </span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 transition-all shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                style={{ width: `${getUsagePercentage(usage.transactions_count, limits.max_transactions_per_month)}%` }}
                            />
                        </div>
                    </div>

                    {/* WhatsApp Messages */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-400">WhatsApp Messages (this month)</span>
                            <span className="font-medium text-white">
                                {usage.messages_sent} {limits.max_messages_per_month === -1 ? '(Pay-as-you-go)' : `/ ${limits.max_messages_per_month.toLocaleString()}`}
                            </span>
                        </div>
                        {limits.max_messages_per_month !== -1 && (
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 transition-all shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                    style={{ width: `${getUsagePercentage(usage.messages_sent, limits.max_messages_per_month)}%` }}
                                />
                            </div>
                        )}
                        {limits.max_messages_per_month === -1 && (
                            <p className="text-xs text-slate-500 mt-1">
                                Cost this month: {formatCurrency(usage.whatsapp_cost_cents)}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* WhatsApp Credits */}
            {subscription.tier !== 'developer' && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4">WhatsApp Credits</h3>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <p className="text-3xl font-bold text-white">{formatCurrency(credits.balance_cents)}</p>
                            <p className="text-sm text-slate-400">Available balance</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBuyCredits(10)}
                                disabled={buyingCredits}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition disabled:opacity-50 shadow-lg shadow-green-600/20"
                            >
                                {buyingCredits ? '...' : '+ $10'}
                            </button>
                            <button
                                onClick={() => handleBuyCredits(50)}
                                disabled={buyingCredits}
                                className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition disabled:opacity-50"
                            >
                                {buyingCredits ? '...' : '+ $50'}
                            </button>
                            <button
                                onClick={() => handleBuyCredits(100)}
                                disabled={buyingCredits}
                                className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition disabled:opacity-50"
                            >
                                {buyingCredits ? '...' : '+ $100'}
                            </button>
                        </div>
                    </div>
                    {credits.auto_recharge_enabled && (
                        <p className="text-xs text-slate-500 mt-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Auto-recharge enabled: Add {formatCurrency(credits.auto_recharge_amount_cents)} when balance drops below {formatCurrency(credits.auto_recharge_threshold_cents)}
                        </p>
                    )}
                </div>
            )}

            {/* Available Plans */}
            {subscription.tier !== 'enterprise' && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6">Upgrade Your Plan</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Starter */}
                        {subscription.tier !== 'starter' && (
                            <div className="border border-slate-600 bg-slate-900/50 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
                                <h4 className="font-bold text-lg text-white">Starter</h4>
                                <p className="text-3xl font-bold mt-2 text-blue-400">$29<span className="text-sm font-normal text-slate-400">/mo</span></p>
                                <ul className="mt-4 space-y-2 text-sm text-slate-400">
                                    <li>✓ 1,000 members</li>
                                    <li>✓ 5,000 transactions/mo</li>
                                </ul>
                                <button
                                    onClick={() => handleChangePlan('starter')}
                                    disabled={changingPlan}
                                    className="w-full mt-6 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-500/10 transition disabled:opacity-50"
                                >
                                    {changingPlan ? 'Processing...' : (subscription.tier === 'pro' || subscription.tier === 'enterprise' ? 'Downgrade' : 'Upgrade')}
                                </button>
                            </div>
                        )}

                        {/* Pro */}
                        {subscription.tier !== 'pro' && (
                            <div className="border border-blue-500 bg-blue-900/10 rounded-xl p-6 relative shadow-lg shadow-blue-900/20">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                    POPULAR
                                </div>
                                <h4 className="font-bold text-lg text-white">Pro</h4>
                                <p className="text-3xl font-bold mt-2 text-blue-400">$99<span className="text-sm font-normal text-slate-400">/mo</span></p>
                                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                                    <li>✓ 10,000 members</li>
                                    <li>✓ 50,000 transactions/mo</li>
                                    <li>✓ Advanced analytics</li>
                                </ul>
                                <button
                                    onClick={() => handleChangePlan('pro')}
                                    disabled={changingPlan}
                                    className="w-full mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition disabled:opacity-50 shadow-lg shadow-blue-600/20"
                                >
                                    {changingPlan ? 'Processing...' : (subscription.tier === 'enterprise' ? 'Downgrade' : 'Upgrade')}
                                </button>
                            </div>
                        )}

                        {/* Enterprise */}
                        {subscription.tier !== 'enterprise' && (
                            <div className="border border-slate-600 bg-slate-900/50 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
                                <h4 className="font-bold text-lg text-white">Enterprise</h4>
                                <p className="text-3xl font-bold mt-2 text-purple-400">$299<span className="text-sm font-normal text-slate-400">/mo</span></p>
                                <ul className="mt-4 space-y-2 text-sm text-slate-400">
                                    <li>✓ Unlimited everything</li>
                                    <li>✓ White-label</li>
                                    <li>✓ Dedicated support</li>
                                </ul>
                                <button
                                    onClick={() => handleChangePlan('enterprise')}
                                    disabled={changingPlan}
                                    className="w-full mt-6 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition disabled:opacity-50"
                                >
                                    {changingPlan ? 'Processing...' : 'Upgrade'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
