import { createClient } from '@/lib/supabase/server'
import { getMyReferralCode, getReferralStats } from '@/lib/referrals'
import { Gift, Users, Award, Copy } from 'lucide-react'
import CopyCodeButton from './components/CopyCodeButton'

export default async function ReferralsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div>Please log in</div>
    }

    const referralCode = await getMyReferralCode(user.id)
    const stats = await getReferralStats(user.id)

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com'}/signup?ref=${referralCode}`

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Refer & Earn</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">Share your code and earn rewards when friends join!</p>

                {/* Referral Code Card */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 mb-6 text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <Gift className="w-6 h-6" />
                        <h2 className="text-2xl font-bold">Your Referral Code</h2>
                    </div>
                    <div className="bg-white/20 backdrop-blur rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="text-4xl font-mono font-bold tracking-wider">{referralCode}</div>
                            <CopyCodeButton code={referralCode || ''} />
                        </div>
                    </div>
                    <p className="text-sm opacity-90">
                        Share this code with friends. You get 100 points, they get 50 points when they join!
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Referrals</h3>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stats.pending} pending</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Rewards Earned</h3>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalRewards}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">points earned</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Gift className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Next Reward</h3>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">100</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">per referral</p>
                    </div>
                </div>

                {/* Share Options */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Share Your Code</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Share Link</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={shareUrl}
                                    readOnly
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                />
                                <CopyCodeButton code={shareUrl} label="Copy Link" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Share</label>
                            <div className="flex gap-2">
                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent(`Join me on this amazing loyalty program! Use my code ${referralCode} to get 50 bonus points: ${shareUrl}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center text-sm font-medium"
                                >
                                    WhatsApp
                                </a>
                                <button
                                    onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({
                                                title: 'Join my loyalty program!',
                                                text: `Use code ${referralCode} to get 50 bonus points!`,
                                                url: shareUrl
                                            })
                                        }
                                    }}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center text-sm font-medium"
                                >
                                    Share
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Referral History */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Referral History</h3>
                    {stats.referrals.length > 0 ? (
                        <div className="space-y-3">
                            {stats.referrals.map((referral: any) => (
                                <div key={referral.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {referral.referee?.full_name || 'Pending'}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(referral.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${referral.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                referral.status === 'rewarded' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                    'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                                            }`}>
                                            {referral.status}
                                        </span>
                                        {referral.referrer_reward > 0 && (
                                            <p className="text-sm font-semibold text-green-600 dark:text-green-400 mt-1">
                                                +{referral.referrer_reward} pts
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">No referrals yet</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Start sharing your code to earn rewards!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
