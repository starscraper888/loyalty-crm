'use client'

import { MemberTier } from '@/lib/tiers'
import { TrendingUp, Award } from 'lucide-react'

interface TierProgressProps {
    tier: MemberTier
    nextTier: MemberTier | null
    lifetimePoints: number
    progress: number
    pointsToNext: number
}

export default function TierProgress({ tier, nextTier, lifetimePoints, progress, pointsToNext }: TierProgressProps) {
    const isMaxTier = !nextTier

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Tier Progress</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {lifetimePoints.toLocaleString()} lifetime points earned
                    </p>
                </div>
                <div className="text-4xl">{tier.icon}</div>
            </div>

            {!isMaxTier ? (
                <>
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium" style={{ color: tier.color }}>{tier.name}</span>
                            <span className="font-medium" style={{ color: nextTier.color }}>{nextTier.name}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${progress}%`,
                                    background: `linear-gradient(to right, ${tier.color}, ${nextTier.color})`
                                }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {progress.toFixed(1)}% to {nextTier.name}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>{pointsToNext.toLocaleString()} points</strong> until {nextTier.name}
                        </span>
                    </div>
                </>
            ) : (
                <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                    <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Maximum Tier Reached!</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            You're in our elite {tier.name} tier 🎉
                        </p>
                    </div>
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Your Benefits:</p>
                <ul className="space-y-1">
                    {tier.benefits.perks.map((perk, index) => (
                        <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <span>{perk}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
