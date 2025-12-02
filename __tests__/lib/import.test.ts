/**
 * @jest-environment node
 */
import { validateImport, processImport } from '@/app/admin/members/import/actions'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn()
}))
jest.mock('@/lib/supabase/admin', () => ({
    createAdminClient: jest.fn()
}))

describe('Bulk Import Logic', () => {
    const mockSupabase = {
        auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'admin-id' } } }),
            admin: {
                createUser: jest.fn().mockResolvedValue({ data: { user: { id: 'new-user-id' } }, error: null })
            }
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { tenant_id: 'tenant-id' } }),
        in: jest.fn().mockResolvedValue({ data: [] }), // No duplicates
        upsert: jest.fn().mockResolvedValue({ error: null }),
        insert: jest.fn().mockResolvedValue({ error: null })
    }

    beforeEach(() => {
        (createClient as jest.Mock).mockResolvedValue(mockSupabase)
            ; (createAdminClient as jest.Mock).mockReturnValue(mockSupabase)
    })

    it('should validate rows correctly', async () => {
        const rows = [
            { phone: '1234567890', name: 'Valid' },
            { phone: '', name: 'Invalid' }
        ]
        const map = { phone: 'phone', name: 'name' }

        const result = await validateImport(rows, map)
        expect(result.valid).toBe(1)
        expect(result.invalid).toBe(1)
    })

    it('should process import correctly', async () => {
        const rows = [
            { phone: '1234567890', name: 'Test User', points: '100' }
        ]
        const map = { phone: 'phone', name: 'name', points: 'points' }

        const result = await processImport(rows, map)
        expect(result.success).toBe(1)
        expect(mockSupabase.auth.admin.createUser).toHaveBeenCalled()
        expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
        expect(mockSupabase.from).toHaveBeenCalledWith('points_ledger')
    })
})
