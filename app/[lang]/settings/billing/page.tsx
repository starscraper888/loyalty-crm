import { getSubscriptionDetails, openBillingPortal, changePlan } from '@/app/settings/actions'
import { redirect } from 'next/navigation'
import BillingPortalClient from './BillingPortalClient'

export default async function BillingPage({ params }: { params: { lang: string } }) {
    const result = await getSubscriptionDetails()

    if (result.error) {
        redirect('/admin/dashboard')
    }

    const { subscription, usage, limits, credits } = result

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Billing & Usage</h1>
                <p className="text-gray-600 mt-1">Manage your subscription and view usage</p>
            </div>

            <BillingPortalClient
                subscription={subscription}
                usage={usage}
                limits={limits}
                credits={credits}
                lang={params.lang}
            />
        </div>
    )
}
