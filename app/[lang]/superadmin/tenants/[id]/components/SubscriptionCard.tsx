import { CreditCard, Calendar, DollarSign } from 'lucide-react'

interface SubscriptionCardProps {
    subscription: any
    tenant: any
}

export default function SubscriptionCard({ subscription, tenant }: SubscriptionCardProps) {
    if (!subscription) {
        return (
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-4">Subscription</h2>
                <p className="text-slate-400">No active subscription</p>
            </div>
        )
    }

    const getPriceForTier = (tier: string) => {
        const prices = {
            enterprise: 299,
            pro: 99,
            starter: 29
        }
        return prices[tier as keyof typeof prices] || 0
    }

    const price = getPriceForTier(subscription.tier)

    return (
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-6">Subscription Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Plan */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <h3 className="text-sm font-medium text-slate-400">Current Plan</h3>
                    </div>
                    <p className="text-2xl font-bold text-white">{subscription.tier?.toUpperCase()}</p>
                    <p className="text-sm text-slate-500 mt-1">${price}/month</p>
                </div>

                {/* Next Billing */}
                {subscription.current_period_end && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-5 h-5 text-blue-400" />
                            <h3 className="text-sm font-medium text-slate-400">Next Billing</h3>
                        </div>
                        <p className="text-lg font-semibold text-white">
                            {new Date(subscription.current_period_end).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                            {Math.ceil((new Date(subscription.current_period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
                        </p>
                    </div>
                )}

                {/* Stripe Customer ID */}
                {subscription.stripe_customer_id && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="w-5 h-5 text-purple-400" />
                            <h3 className="text-sm font-medium text-slate-400">Stripe Customer</h3>
                        </div>
                        <p className="text-sm font-mono text-slate-300 break-all">
                            {subscription.stripe_customer_id}
                        </p>
                    </div>
                )}

                {/* Subscription ID */}
                {subscription.stripe_subscription_id && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="w-5 h-5 text-orange-400" />
                            <h3 className="text-sm font-medium text-slate-400">Subscription ID</h3>
                        </div>
                        <p className="text-sm font-mono text-slate-300 break-all">
                            {subscription.stripe_subscription_id}
                        </p>
                    </div>
                )}
            </div>

            {/* Action Buttons - Coming Soon */}
            <div className="mt-6 pt-6 border-t border-slate-700">
                <p className="text-xs text-slate-500">Admin actions coming soon: Change Plan, Cancel, Extend Trial</p>
            </div>
        </div>
    )
}
