import { DollarSign, TrendingUp, Users, Activity } from 'lucide-react'

interface MetricCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon: 'dollar' | 'trending' | 'users' | 'activity'
    trend?: number
}

export default function MetricCard({ title, value, subtitle, icon, trend }: MetricCardProps) {
    const icons = {
        dollar: DollarSign,
        trending: TrendingUp,
        users: Users,
        activity: Activity
    }

    const Icon = icons[icon]

    const iconColors = {
        dollar: 'text-green-400 bg-green-500/10',
        trending: 'text-blue-400 bg-blue-500/10',
        users: 'text-purple-400 bg-purple-500/10',
        activity: 'text-orange-400 bg-orange-500/10'
    }

    return (
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400">{title}</h3>
                <div className={`p-2 rounded-lg ${iconColors[icon]}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>

            <div className="space-y-1">
                <p className="text-3xl font-bold text-white">{value}</p>
                {subtitle && (
                    <p className="text-sm text-slate-500">{subtitle}</p>
                )}
                {trend !== undefined && (
                    <p className={`text-sm font-medium ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trend >= 0 ? '+' : ''}{trend}% from last month
                    </p>
                )}
            </div>
        </div>
    )
}
