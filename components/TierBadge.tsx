'use client'

import { MemberTier } from '@/lib/tiers'

interface TierBadgeProps {
    tier: MemberTier
    size?: 'sm' | 'md' | 'lg'
    showName?: boolean
}

export default function TierBadge({ tier, size = 'md', showName = true }: TierBadgeProps) {
    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-base'
    }

    const iconSizes = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-xl'
    }

    return (
        <div
            className={`inline-flex items-center gap-2 rounded-full font-semibold ${sizeClasses[size]}`}
            style={{
                backgroundColor: `${tier.color}20`,
                color: tier.color,
                border: `2px solid ${tier.color}`
            }}
        >
            <span className={iconSizes[size]}>{tier.icon}</span>
            {showName && <span>{tier.name}</span>}
        </div>
    )
}
