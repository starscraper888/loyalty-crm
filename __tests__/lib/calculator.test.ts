/**
 * @jest-environment node
 */
import { getRates } from '@/app/admin/calculator/actions'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn()
}))

describe('Cost Calculator Logic', () => {
    it('should fetch rates correctly', async () => {
        const mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
                data: [
                    { id: '1', country_code: 'MY', category: 'marketing', rate: 0.35 },
                    { id: '2', country_code: 'SG', category: 'marketing', rate: 0.45 }
                ],
                error: null
            })
        }
            ; (createClient as jest.Mock).mockResolvedValue(mockSupabase)

        const rates = await getRates()
        expect(rates).toHaveLength(2)
        expect(rates[0].country_code).toBe('MY')
    })

    it('should calculate projections correctly', () => {
        // Logic test (replicating UI logic)
        const userCount = 1000
        const msgsPerMonth = 4
        const rate = 0.35
        const growthRate = 5 // 5%

        let currentUsers = userCount
        let totalCost = 0

        for (let i = 1; i <= 12; i++) {
            const monthlyCost = currentUsers * msgsPerMonth * rate
            totalCost += monthlyCost
            currentUsers = currentUsers * (1 + growthRate / 100)
        }

        // Month 1: 1000 * 4 * 0.35 = 1400
        // Month 2: 1050 * 4 * 0.35 = 1470
        // ...
        expect(totalCost).toBeGreaterThan(1400 * 12) // Should be more than linear due to growth
    })
})
