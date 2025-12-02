import { generateOTP, verifyOTP } from '@/lib/auth/otp'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(),
}))

describe('OTP Logic', () => {
    const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
    }

    beforeEach(() => {
        jest.clearAllMocks()
            ; (createClient as jest.Mock).mockResolvedValue(mockSupabase)
    })

    it('should generate a 6-digit OTP', async () => {
        mockSupabase.eq.mockResolvedValue({ error: null })

        const otp = await generateOTP('redemption-123')

        expect(otp).toMatch(/^\d{6}$/)
        expect(mockSupabase.from).toHaveBeenCalledWith('redemptions')
        expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
            otp_code: otp,
        }))
    })

    it('should verify a valid OTP', async () => {
        mockSupabase.single.mockResolvedValue({
            data: {
                otp_code: '123456',
                otp_expires_at: new Date(Date.now() + 10000).toISOString(),
            },
            error: null,
        })
        mockSupabase.eq.mockReturnThis() // for update chain

        const isValid = await verifyOTP('redemption-123', '123456')

        expect(isValid).toBe(true)
        expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
            status: 'completed',
        }))
    })

    it('should reject an invalid OTP', async () => {
        mockSupabase.single.mockResolvedValue({
            data: {
                otp_code: '123456',
                otp_expires_at: new Date(Date.now() + 10000).toISOString(),
            },
            error: null,
        })

        const isValid = await verifyOTP('redemption-123', '000000')

        expect(isValid).toBe(false)
    })

    it('should reject an expired OTP', async () => {
        mockSupabase.single.mockResolvedValue({
            data: {
                otp_code: '123456',
                otp_expires_at: new Date(Date.now() - 10000).toISOString(),
            },
            error: null,
        })

        const isValid = await verifyOTP('redemption-123', '123456')

        expect(isValid).toBe(false)
    })
})
