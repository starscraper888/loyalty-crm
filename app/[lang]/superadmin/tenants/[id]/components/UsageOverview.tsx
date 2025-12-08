import { Users, Activity, MessageSquare, Coins } from 'lucide-react'

interface UsageOverviewProps {
    currentUsage: any
    tierLimits: any
    usageHistory: any[]
}

export default function UsageOverview({ currentUsage, tierLimits, usageHistory }: UsageOverviewProps) {
    const getUsagePercentage = (used: number, limit: number) => {
        if (!limit || limit === 0) return 0
        return Math.min((used / limit) * 100, 100)
    }

    const getProgressColor = (percentage: number) => {
        if (percentage >= 90) return 'bg-red-500'
        if (percentage >= 75) return 'bg-yellow-500'
        return 'bg-green-500'
    }

    const currentMonthUsage = currentUsage || {
        members_count: 0,
        transactions_count: 0,
        messages_sent: 0,
        whatsapp_cost_cents: 0
    }

    const limits = tierLimits || {
        max_members: 100,
        max_transactions_per_month: 1000,
        max_messages_per_month: 500
    }

    const usageMetrics = [
        {
            icon: Users,
            label: 'Members',
            current: currentMonthUsage.members_count || 0,
            limit: limits.max_members,
            color: 'text-blue-400'
        },
        {
            icon: Activity,
            label: 'Transactions',
            current: currentMonthUsage.transactions_count || 0,
            limit: limits.max_transactions_per_month,
            color: 'text-green-400'
        },
        {
            icon: MessageSquare,
            label: 'WhatsApp Messages',
            current: currentMonthUsage.messages_sent || 0,
            limit: limits.max_messages_per_month,
            color: 'text-purple-400'
        }
    ]

    return (
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-6">Current Month Usage</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {usageMetrics.map((metric) => {
                    const Icon = metric.icon
                    const percentage = getUsagePercentage(metric.current, metric.limit)

                    return (
                        <div key={metric.label}>
                            <div className="flex items-center gap-2 mb-3">
                                <Icon className={`w-5 h-5 ${metric.color}`} />
                                <h3 className="text-sm font-medium text-slate-400">{metric.label}</h3>
                            </div>

                            <div className="mb-2">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-white">
                                        {metric.current.toLocaleString()}
                                    </span>
                                    <span className="text-slate-500">/ {metric.limit.toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    {percentage.toFixed(0)}% used
                                </p>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all ${getProgressColor(percentage)}`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Credits Balance */}
            {currentMonthUsage.credits_balance !== undefined && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                    <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-yellow-400" />
                        <h3 className="text-sm font-medium text-slate-400">Credits Balance</h3>
                    </div>
                    <p className="text-2xl font-bold text-white mt-2">
                        {currentMonthUsage.credits_balance || 0} credits
                    </p>
                </div>
            )}

            {/* Usage History Summary */}
            {usageHistory && usageHistory.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                    <h3 className="text-sm font-medium text-slate-400 mb-3">Last 6 Months Trend</h3>
                    <div className="grid grid-cols-6 gap-2">
                        {usageHistory.map((month, idx) => (
                            <div key={idx} className="text-center">
                                <p className="text-xs text-slate-500 mb-1">
                                    {new Date(month.period_start).toLocaleDateString('en', { month: 'short' })}
                                </p>
                                <p className="text-sm font-semibold text-white">
                                    {month.transactions_count || 0}
                                </p>
                                <p className="text-xs text-slate-500">txns</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
