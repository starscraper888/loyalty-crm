import { createReward } from '@/app/admin/actions'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(),
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

describe('Admin Actions', () => {
    const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        rpc: jest.fn().mockReturnThis(),
    }

    beforeEach(() => {
        jest.clearAllMocks()
            ; (createClient as jest.Mock).mockResolvedValue(mockSupabase)
    })

    it('should create a reward', async () => {
        mockSupabase.insert.mockResolvedValue({ error: null })
        mockSupabase.rpc.mockResolvedValue({ data: 'tenant-123' })

        const formData = new FormData()
        formData.append('name', 'Coffee')
        formData.append('cost', '50')
        formData.append('description', 'Free Coffee')

        const result = await createReward(formData)

        expect(result).toEqual({ success: true })
        expect(mockSupabase.from).toHaveBeenCalledWith('rewards')
        expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Coffee',
            cost: 50,
        }))
    })
})
