import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import CampaignsList from './components/CampaignsList'

export default async function CampaignsPage() {
    const supabase = await createClient()

    // Fetch campaigns
    const { data: campaigns } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Marketing Campaigns</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Create and track campaign performance</p>
                    </div>
                    <Link
                        href="/en/admin/campaigns/new"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        New Campaign
                    </Link>
                </div>

                <CampaignsList campaigns={campaigns || []} />
            </div>
        </div>
    )
}
