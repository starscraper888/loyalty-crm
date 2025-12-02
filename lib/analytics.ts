import { createHash } from 'crypto'

// k-anonymity helper
const SALT = process.env.ANALYTICS_SALT || 'default-salt-change-me'

export function anonymizeUser(userId: string) {
    return createHash('sha256').update(userId + SALT).digest('hex')
}

export async function logAnalyticsEvent(event: string, userId: string, metadata: any = {}) {
    const anonymizedId = await anonymizeUser(userId)
    // In production, send to PostHog / Mixpanel / Supabase Table
    console.log(`[Analytics] ${event} - User: ${anonymizedId}`, metadata)
}

export async function getAnalyticsData(range: '7d' | '30d' = '7d') {
    // In a real app with Supabase connected:
    // const supabase = await createClient()
    // const days = range === '7d' ? 7 : 30
    // const { data } = await supabase.from('mv_daily_metrics').select('*').gte('day', daysAgo)

    // Returning Mock Data matching the new schema
    const count = range === '7d' ? 7 : 30
    const data = []

    for (let i = 0; i < count; i++) {
        const date = new Date()
        date.setDate(date.getDate() - (count - i))

        data.push({
            date: date.toISOString().slice(0, 10),
            active_members: Math.floor(Math.random() * 50) + 10,
            revenue: Math.floor(Math.random() * 1000) + 100,
            transactions: Math.floor(Math.random() * 100) + 20,
            repeat_rate: Math.floor(Math.random() * 40) + 10, // %
            rm_per_100: Math.floor(Math.random() * 500) + 50
        })
    }

    return {
        dailyMetrics: data,
        summary: {
            totalRevenue: data.reduce((acc, curr) => acc + curr.revenue, 0),
            activeMembers: data[data.length - 1].active_members,
            repeatRate: 25 // Avg
        }
    }
}
