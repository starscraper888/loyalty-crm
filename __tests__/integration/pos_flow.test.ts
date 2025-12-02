/**
 * @jest-environment node
 */
import { POST as earnPost } from '@/app/api/earn/route'
import { POST as redeemPost } from '@/app/api/redeem/route'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn()
}))

describe('POS Integration Flow', () => {
    let mockSupabase: any

    beforeEach(() => {
        mockSupabase = {
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'staff-123' } }, error: null })
            },
            from: jest.fn(),
            rpc: jest.fn()
        }
            ; (createClient as jest.Mock).mockResolvedValue(mockSupabase)
    })

    it('should allow earn and redeem flow', async () => {
        // 1. EARN
        // Mock profile lookup
        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'profiles') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: { id: 'member-123', tenant_id: 'tenant-1' } })
                }
            }
            if (table === 'points_ledger') {
                return {
                    insert: jest.fn().mockResolvedValue({ error: null })
                }
            }
            return { select: jest.fn().mockReturnThis() }
        })

        const earnReq = new Request('http://localhost/api/earn', {
            method: 'POST',
            body: JSON.stringify({ phone: '+123', points: 100 })
        })

        const earnRes = await earnPost(earnReq)
        expect(earnRes.status).toBe(200)

        // 2. REDEEM
        // Mock finding pending redemption
        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'profiles') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: { id: 'member-123', tenant_id: 'tenant-1' } })
                }
            }
            if (table === 'redemptions') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    gt: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({
                        data: { id: 'redemption-1', reward_id: 'reward-1', otp_expires_at: new Date(Date.now() + 10000).toISOString() }
                    }),
                    update: jest.fn().mockReturnThis()
                }
            }
            if (table === 'rewards') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: { cost: 50, name: 'Test Reward' } })
                }
            }
            if (table === 'points_ledger') {
                return {
                    insert: jest.fn().mockResolvedValue({ error: null })
                }
            }
            return { select: jest.fn().mockReturnThis() }
        })

        const redeemReq = new Request('http://localhost/api/redeem', {
            method: 'POST',
            body: JSON.stringify({ phone: '+123', otp: '123456' })
        })

        const redeemRes = await redeemPost(redeemReq)
        expect(redeemRes.status).toBe(200)
    })
})
