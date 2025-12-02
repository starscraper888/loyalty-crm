import { handleWhatsAppMessage } from '@/lib/whatsapp/handler'
import { createAdminClient } from '@/lib/supabase/admin'

jest.mock('@/lib/supabase/admin', () => ({
    createAdminClient: jest.fn(),
}))

describe('WhatsApp Handler', () => {
    const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
    }

    beforeEach(() => {
        jest.clearAllMocks()
            ; (createAdminClient as jest.Mock).mockReturnValue(mockSupabase)
    })

    it('should return balance for registered user', async () => {
        mockSupabase.single.mockResolvedValue({
            data: { full_name: 'John Doe', points_balance: 150 },
            error: null,
        })

        const response = await handleWhatsAppMessage('+1234567890', 'Balance')

        expect(response).toContain('Hi John Doe! Your current balance is: 150 points.')
    })

    it('should ask unregistered user to register', async () => {
        mockSupabase.single.mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
        })

        const response = await handleWhatsAppMessage('+1234567890', 'Balance')

        expect(response).toContain('Please register')
    })

    it('should handle unknown commands', async () => {
        const response = await handleWhatsAppMessage('+1234567890', 'Hello')

        expect(response).toContain("Type 'Balance'")
    })
})
