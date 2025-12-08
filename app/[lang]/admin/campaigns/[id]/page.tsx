import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Users, DollarSign, Award } from 'lucide-react'
import CampaignAnalytics from '../components/CampaignAnalytics'

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch campaign
    const { data: campaign } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single()

    if (!campaign) {
        notFound()
    }

    // Fetch campaign participants
    const { data: participants } = await supabase
        .from('campaign_participants')
        .select(`
            *,
            profile:profile_id (
                full_name,
                email
            )
        `)
        .eq('campaign_id', id)

    // Calculate metrics
    const totalParticipants = participants?.length || 0
    const pointsDistributed = participants?.reduce((sum, p) => sum + p.points_earned, 0) || 0
    const engagementRate = campaign.target_members > 0
        ? ((totalParticipants / campaign.target_members) * 100).toFixed(1)
        : '0.0'

    // Estimated revenue (assume $1 per point for simplicity - you can adjust)
    const estimatedRevenue = pointsDistributed * 0.1 // $0.10 per point
    const cost = campaign.budget || 0
    const roi = cost > 0 ? (((estimatedRevenue - cost) / cost) * 100).toFixed(1) : '0.0'
    const cpa = totalParticipants > 0 ? (cost / totalParticipants).toFixed(2) : '0.00'

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto">
                <Link href="/en/admin/campaigns" className="text-blue-600 hover:text-blue-800 mb-6 inline-flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Campaigns
                </Link>

                {/* Campaign Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mt-4 mb-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{campaign.name}</h1>
                            <p className="text-gray-600 dark:text-gray-400">{campaign.description}</p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${campaign.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            campaign.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                            {campaign.status}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="text-sm">
                            <p className="text-gray-500 dark:text-gray-400">Start Date</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                                {new Date(campaign.start_date).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="text-sm">
                            <p className="text-gray-500 dark:text-gray-400">End Date</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                                {new Date(campaign.end_date).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="text-sm">
                            <p className="text-gray-500 dark:text-gray-400">Budget</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                                ${campaign.budget?.toFixed(2) || '0.00'}
                            </p>
                        </div>
                        <div className="text-sm">
                            <p className="text-gray-500 dark:text-gray-400">Target Members</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                                {campaign.target_members}
                            </p>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Participants</h3>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalParticipants}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {engagementRate}% of target
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">ROI</h3>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{roi}%</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Return on investment
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Points Distributed</h3>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{pointsDistributed.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Total points earned
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">CPA</h3>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">${cpa}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Cost per acquisition
                        </p>
                    </div>
                </div>

                {/* Analytics Component */}
                <CampaignAnalytics
                    campaignId={id}
                    participants={participants || []}
                />
            </div>
        </div>
    )
}
