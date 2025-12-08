'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import RewardItem from './RewardItem'

interface RewardsGridProps {
    rewards: any[]
    isManager?: boolean
}

export default function RewardsGrid({ rewards, isManager }: RewardsGridProps) {
    const [searchQuery, setSearchQuery] = useState('')

    const filteredRewards = useMemo(() => {
        if (!searchQuery) return rewards

        const lowerQuery = searchQuery.toLowerCase()
        return rewards.filter(reward =>
            reward.name?.toLowerCase().includes(lowerQuery) ||
            reward.description?.toLowerCase().includes(lowerQuery)
        )
    }, [rewards, searchQuery])

    return (
        <>
            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search rewards by name or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Row Count */}
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredRewards.length} of {rewards.length} rewards
            </div>

            {/* Rewards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRewards.map((reward: any) => (
                    <RewardItem key={reward.id} reward={reward} isManager={isManager} />
                ))}
                {filteredRewards.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                        No rewards found matching "{searchQuery}"
                    </div>
                )}
            </div>
        </>
    )
}
