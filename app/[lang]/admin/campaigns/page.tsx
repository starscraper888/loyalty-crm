import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CampaignsForm from './components/CampaignsForm'

export default async function CampaignsPage() {
    const supabase = await createClient()

    // Fetch profile to get role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single()

    if (profile?.role === 'manager') {
        redirect('/en/admin/dashboard')
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">WhatsApp Campaigns</h1>
                <CampaignsForm />
            </div>
        </div>
    )
}
