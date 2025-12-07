'use client'

import { X, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface UpgradePromptProps {
    message: string
    currentUsage?: number
    limit?: number
    tier?: string
    onClose?: () => void
}

export default function UpgradePrompt({
    message,
    currentUsage,
    limit,
    tier = 'starter',
    onClose
}: UpgradePromptProps) {
    const [isVisible, setIsVisible] = useState(true)

    const handleClose = () => {
        setIsVisible(false)
        onClose?.()
    }

    if (!isVisible) return null

    // Determine next tier
    const nextTier = tier === 'starter' ? 'Pro' : tier === 'pro' ? 'Enterprise' : null

    return (
        <div className="fixed bottom-6 right-6 max-w-md z-50 animate-slide-up">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-2xl border border-orange-400/50 overflow-hidden">
                {/* Header */}
                <div className="p-4 pb-3 flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Limit Reached</h3>
                            <p className="text-xs text-orange-100">Time to upgrade!</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-4 pb-4">
                    <p className="text-white text-sm mb-3">
                        {message}
                    </p>

                    {currentUsage !== undefined && limit !== undefined && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-3">
                            <div className="flex justify-between text-xs text-white mb-1">
                                <span>Current Usage</span>
                                <span className="font-semibold">{currentUsage.toLocaleString()} / {limit.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-white h-full rounded-full transition-all"
                                    style={{ width: `${Math.min((currentUsage / limit) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {nextTier && (
                        <Link
                            href="/en/settings/billing"
                            className="block w-full bg-white text-orange-600 font-semibold py-2.5 px-4 rounded-lg text-center hover:bg-orange-50 transition-colors shadow-lg"
                        >
                            Upgrade to {nextTier} →
                        </Link>
                    )}

                    {!nextTier && (
                        <Link
                            href="/en/settings/billing"
                            className="block w-full bg-white text-orange-600 font-semibold py-2.5 px-4 rounded-lg text-center hover:bg-orange-50 transition-colors shadow-lg"
                        >
                            View Billing Options →
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}

// Inline error banner for inline display (alternative to toast)
export function UpgradeInlineBanner({
    message,
    currentUsage,
    limit,
    tier = 'starter'
}: UpgradePromptProps) {
    const nextTier = tier === 'starter' ? 'Pro' : tier === 'pro' ? 'Enterprise' : null

    return (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-orange-900 mb-1">Limit Reached</h4>
                    <p className="text-sm text-orange-800 mb-3">{message}</p>

                    {currentUsage !== undefined && limit !== undefined && (
                        <div className="bg-white/60 rounded-lg p-2 mb-3">
                            <div className="flex justify-between text-xs text-orange-900 mb-1 font-medium">
                                <span>Current Usage</span>
                                <span>{currentUsage.toLocaleString()} / {limit.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-orange-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-orange-600 h-full rounded-full"
                                    style={{ width: `${Math.min((currentUsage / limit) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <Link
                        href="/en/settings/billing"
                        className="inline-block bg-orange-600 text-white font-medium py-2 px-4 rounded-lg text-sm hover:bg-orange-700 transition-colors"
                    >
                        {nextTier ? `Upgrade to ${nextTier} →` : 'View Billing Options →'}
                    </Link>
                </div>
            </div>
        </div>
    )
}
