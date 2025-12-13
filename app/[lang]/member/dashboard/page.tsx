import { getMyProfile, getMyTransactions } from '@/app/member/actions'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getMemberTier, getNextTier, getTierProgress, getPointsToNextTier } from '@/lib/tiers'
import TierBadge from '@/components/TierBadge'
import TierProgress from '@/components/TierProgress'
import OnboardingTour from '@/components/OnboardingTour'
import { memberTourSteps } from '@/lib/tour-steps'

export default async function MemberDashboardPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    const profileResult = await getMyProfile()
    const transactionsResult = await getMyTransactions()

    if (profileResult.error) {
        redirect(`/${lang}/auth/login`)
    }

    const profile = profileResult.profile!
    const transactions = transactionsResult.transactions || []

    // Get tier information
    const tier = await getMemberTier(profile.id)
    const nextTier = tier ? await getNextTier(tier.name) : null
    const lifetimePoints = profile.member_tenants?.[0]?.lifetime_points || 0
    const progress = tier && lifetimePoints ? getTierProgress(lifetimePoints, tier, nextTier) : 0
    const pointsToNext = tier ? getPointsToNextTier(lifetimePoints, nextTier) : 0

    // Calculate stats
    const totalEarned = transactions
        .filter(t => t.type === 'earn')
        .reduce((sum, t) => sum + t.points, 0)

    const totalRedeemed = transactions
        .filter(t => t.type === 'redeem')
        .reduce((sum, t) => sum + Math.abs(t.points), 0)

    const thisMonth = transactions.filter(t => {
        const date = new Date(t.created_at)
        const now = new Date()
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length

    const recentTransactions = transactions.slice(0, 5)

    return (
        <div className="px-4 sm:px-0">
            <OnboardingTour steps={memberTourSteps} tourKey="member-dashboard" />

            {/* Welcome Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Welcome back, {profile.full_name}!
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Member since {new Date(profile.created_at).toLocaleDateString('en-GB', {
                                timeZone: 'Asia/Singapore',
                                year: 'numeric',
                                month: 'long'
                            })}
                        </p>
                    </div>
                    {tier && <div data-tour="tier-badge"><TierBadge tier={tier} size="lg" /></div>}
                </div>
            </div>

            {/* Hero - Points Balance */}
            <div data-tour="points-balance" className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-8">
                <div className="text-white">
                    <p className="text-lg opacity-90">Current Balance</p>
                    <h2 className="text-6xl font-bold mt-2">{profile.member_tenants?.[0]?.active_points || profile.points_balance || 0}</h2>
                    <p className="text-2xl opacity-90">points</p>
                </div>
            </div>

            {/* Tier Progress */}
            {tier && (
                <div className="mb-8">
                    <TierProgress
                        tier={tier}
                        nextTier={nextTier}
                        lifetimePoints={profile.lifetime_points || 0}
                        progress={progress}
                        pointsToNext={pointsToNext}
                    />
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Earned</div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                        +{totalEarned}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">All time</div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Redeemed</div>
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                        -{totalRedeemed}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">All time</div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400">This Month</div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                        {thisMonth}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Transactions</div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h3>
                    <Link
                        href={`/${lang}/member/history`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                        View All →
                    </Link>
                </div>

                {recentTransactions.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        No transactions yet. Start earning points!
                    </p>
                ) : (
                    <div className="space-y-4">
                        {recentTransactions.map((t) => (
                            <div key={t.id} className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {t.description || (t.type === 'earn' ? 'Points Earned' : 'Points Redeemed')}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(t.created_at).toLocaleDateString('en-GB', {
                                            timeZone: 'Asia/Singapore',
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div className={`text-lg font-bold ${t.type === 'earn' ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === 'earn' ? '+' : ''}{t.points}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                    href={`/${lang}/member/rewards`}
                    data-tour="browse-rewards"
                    className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 hover:border-blue-500 transition-colors text-center"
                >
                    <div className="text-4xl mb-2">🎁</div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">Browse Rewards</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">See what you can redeem</p>
                </Link>

                <Link
                    href={`/${lang}/member/qr-code`}
                    data-tour="qr-code"
                    className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 hover:border-blue-500 transition-colors text-center"
                >
                    <div className="text-4xl mb-2">📱</div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">Get QR Code</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Show at counter</p>
                </Link>

                <Link
                    href={`/${lang}/member/history`}
                    className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 hover:border-blue-500 transition-colors text-center"
                >
                    <div className="text-4xl mb-2">📜</div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">Full History</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">View all transactions</p>
                </Link>
            </div>
        </div>
    )
}
