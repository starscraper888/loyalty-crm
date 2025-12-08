import { Building2, Mail, Phone, Calendar } from 'lucide-react'

interface TenantHeaderProps {
    tenant: any
    subscription: any
    owner: any
}

export default function TenantHeader({ tenant, subscription, owner }: TenantHeaderProps) {
    const getTierBadge = (tier: string) => {
        const colors = {
            enterprise: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            pro: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            starter: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
        }
        return colors[tier as keyof typeof colors] || colors.starter
    }

    const getStatusBadge = (status: string) => {
        const colors = {
            active: 'bg-green-500/20 text-green-300 border-green-500/30',
            trialing: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
            canceled: 'bg-red-500/20 text-red-300 border-red-500/30',
            past_due: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
        }
        return colors[status as keyof typeof colors] || colors.active
    }

    return (
        <div>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Building2 className="w-8 h-8 text-blue-400" />
                        <h1 className="text-3xl font-bold text-white">
                            {tenant.name || 'Unnamed Business'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-sm rounded-full border ${getTierBadge(subscription?.tier)}`}>
                            {subscription?.tier?.toUpperCase() || 'NO PLAN'}
                        </span>
                        <span className={`px-3 py-1 text-sm rounded-full border ${getStatusBadge(subscription?.status)}`}>
                            {subscription?.status || 'inactive'}
                        </span>
                    </div>
                </div>
            </div>

            {owner && (
                <div className="flex flex-wrap gap-4 text-sm">
                    {owner.full_name && (
                        <div className="flex items-center gap-2 text-slate-300">
                            <span className="text-slate-500">Owner:</span>
                            <span className="font-medium">{owner.full_name}</span>
                        </div>
                    )}
                    {owner.email && (
                        <div className="flex items-center gap-2 text-slate-300">
                            <Mail className="w-4 h-4 text-slate-500" />
                            <span>{owner.email}</span>
                        </div>
                    )}
                    {owner.phone && (
                        <div className="flex items-center gap-2 text-slate-300">
                            <Phone className="w-4 h-4 text-slate-500" />
                            <span>{owner.phone}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span>Joined {new Date(tenant.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            )}
        </div>
    )
}
