import { getAvailableRewards } from '@/app/member/actions'
import { redirect } from 'next/navigation'

export default async function MemberRewardsPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    const result = await getAvailableRewards()

    if (result.error) {
        redirect(`/${lang}/auth/login`)
    }

    const rewards = result.rewards || []
    const myBalance = result.myBalance || 0

    return (
        <div className="px-4 sm:px-0">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rewards Catalog</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Your balance: <span className="font-bold text-blue-600">{myBalance} points</span>
                </p>
            </div>

            {rewards.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                        No rewards available at the moment. Check back soon!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rewards.map((reward) => {
                        const canAfford = myBalance >= reward.cost
                        const pointsNeeded = Math.max(0, reward.cost - myBalance)

                        return (
                            <div
                                key={reward.id}
                                className={`bg-white dark:bg-gray-800 rounded-xl shadow border ${canAfford
                                        ? 'border-green-200 dark:border-green-800'
                                        : 'border-gray-100 dark:border-gray-700'
                                    } overflow-hidden transition-transform hover:scale-105`}
                            >
                                {/* Reward Image */}
                                {reward.image_url ? (
                                    <img
                                        src={reward.image_url}
                                        alt={reward.name}
                                        className="w-full h-48 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                        <span className="text-6xl">🎁</span>
                                    </div>
                                )}

                                {/* Reward Info */}
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {reward.name}
                                    </h3>

                                    {reward.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                            {reward.description}
                                        </p>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {reward.cost} pts
                                        </div>

                                        {canAfford ? (
                                            <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-sm font-medium">
                                                ✓ Available
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full text-xs">
                                                Need {pointsNeeded} more
                                            </span>
                                        )}
                                    </div>

                                    {!canAfford && (
                                        <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all"
                                                style={{ width: `${Math.min((myBalance / reward.cost) * 100, 100)}%` }}
                                            />
                                        </div>
                                    )}

                                    <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                                        Visit store to redeem
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
