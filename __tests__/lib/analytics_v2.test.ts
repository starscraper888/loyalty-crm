/**
 * @jest-environment node
 */
import { getAnalyticsData } from '@/lib/analytics'
import { POST as earnPost } from '@/app/api/earn/route'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn()
}))

describe('Analytics V2', () => {
    it('should return advanced metrics structure', async () => {
        const data = await getAnalyticsData('7d')
        expect(data.dailyMetrics).toHaveLength(7)
        expect(data.dailyMetrics[0]).toHaveProperty('active_members')
        expect(data.dailyMetrics[0]).toHaveProperty('repeat_rate')
        expect(data.dailyMetrics[0]).toHaveProperty('rm_per_100')
        expect(data.summary).toHaveProperty('totalRevenue')
    })

    it('should accept amount in earn API', async () => {
        const mockSupabase = {
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'staff-123' } }, error: null })
            },
            from: jest.fn().mockImplementation((table) => {
                if (table === 'profiles') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: { id: 'member-123', tenant_id: 't1' } })
                    }
                }
                if (table === 'points_ledger') {
                    return {
                        insert: jest.fn().mockImplementation((data) => {
                            expect(data).toHaveProperty('amount', 50.5)
                            return { error: null }
                        })
                    }
                }
                return { select: jest.fn().mockReturnThis() }
            }),
            rpc: jest.fn()
        }
            ; (createClient as jest.Mock).mockResolvedValue(mockSupabase)

        const req = new Request('http://localhost/api/earn', {
            method: 'POST',
            body: JSON.stringify({ phone: '+123', points: 100, amount: 50.50 })
        })

        const res = await earnPost(req)
        expect(res.status).toBe(200)
    })
})
