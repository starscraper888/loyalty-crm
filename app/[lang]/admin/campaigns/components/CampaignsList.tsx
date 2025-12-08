'use client'

import { useState } from 'react'
import { TrendingUp, Calendar, DollarSign, Users, BarChart } from 'lucide-react'
import Link from 'next/link'
import { updateCampaignStatus, deleteCampaign } from '@/app/admin/campaigns/actions'

interface Campaign {
    id: string
    name: string
    description: string
    start_date: string
    end_date: string
    budget: number
    target_points: number
    target_members: number
    status: string
    created_at: string
}

export default function CampaignsList({ campaigns }: { campaigns: Campaign[] }) {
    const [filter, setFilter] = useState<string>('all')

    const filteredCampaigns = campaigns.filter(c =>
        filter === 'all' ? true : c.status === filter
    )

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const handleStatusChange = async (campaignId: string, newStatus: string) => {
        await updateCampaignStatus(campaignId, newStatus)
    }

    const handleDelete = async (campaignId: string) => {
        if (confirm('Are you sure you want to delete this campaign?')) {
            await deleteCampaign(campaignId)
        }
    }

    if (campaigns.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No campaigns yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first marketing campaign to track ROI and engagement.</p>
                <Link
                    href="/en/admin/campaigns/new"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Create Campaign
                </Link>
            </div>
        )
    }

    return (
        <>
            {/* Filters */}
            <div className="mb-6 flex gap-3">
                {['all', 'draft', 'active', 'completed', 'cancelled'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg capitalize ${filter === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                            }`}
                    >
                        {status} ({campaigns.filter(c => status === 'all' ? true : c.status === status).length})
                    </button>
                ))}
            </div>

            {/* Campaigns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCampaigns.map(campaign => (
                    <div key={campaign.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    <Link href={`/en/admin/campaigns/${campaign.id}`} className="hover:text-blue-600">
                                        {campaign.name}
                                    </Link>
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{campaign.description}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                                {campaign.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(campaign.start_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <DollarSign className="w-4 h-4" />
                                <span>${campaign.budget?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Users className="w-4 h-4" />
                                <span>{campaign.target_members} target</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <TrendingUp className="w-4 h-4" />
                                <span>{campaign.target_points} pts</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                            <Link
                                href={`/en/admin/campaigns/${campaign.id}`}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center text-sm flex items-center justify-center gap-1"
                            >
                                <BarChart className="w-4 h-4" />
                                View Analytics
                            </Link>
                            {campaign.status === 'draft' && (
                                <button
                                    onClick={() => handleStatusChange(campaign.id, 'active')}
                                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                >
                                    Activate
                                </button>
                            )}
                            {campaign.status !== 'completed' && campaign.status !== 'cancelled' && (
                                <button
                                    onClick={() => handleDelete(campaign.id)}
                                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}
