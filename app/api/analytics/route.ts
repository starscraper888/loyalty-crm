import { getAnalyticsData } from '@/lib/analytics'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const range = (searchParams.get('range') || '7d') as '7d' | '30d'

    try {
        const data = await getAnalyticsData(range)
        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
