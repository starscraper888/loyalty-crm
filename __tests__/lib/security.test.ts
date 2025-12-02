/**
 * @jest-environment node
 */
import { checkRateLimit } from '@/lib/security/rate-limiter'
import { checkTransactionAnomaly } from '@/lib/security/anomaly-detector'
import { withAuditLog } from '@/lib/security/audit'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn()
}))

describe('Security Features', () => {
    let mockSupabase: any
    let mockChain: any

    beforeEach(() => {
        // Create a chainable mock object
        mockChain = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            insert: jest.fn().mockResolvedValue({ error: null }),
            single: jest.fn().mockResolvedValue({ data: { tenant_id: 'tenant-1' } }),
            then: jest.fn((resolve) => resolve({ data: [] })) // Default empty data
        }

        mockSupabase = {
            rpc: jest.fn(),
            from: jest.fn().mockReturnValue(mockChain),
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } })
            }
        }

            ; (createClient as jest.Mock).mockResolvedValue(mockSupabase)
    })

    describe('Rate Limiter', () => {
        it('should return true if allowed', async () => {
            mockSupabase.rpc.mockResolvedValue({ data: true, error: null })
            const allowed = await checkRateLimit('test-key')
            expect(allowed).toBe(true)
            expect(mockSupabase.rpc).toHaveBeenCalledWith('check_rate_limit', expect.any(Object))
        })

        it('should return false if blocked', async () => {
            mockSupabase.rpc.mockResolvedValue({ data: false, error: null })
            const allowed = await checkRateLimit('test-key')
            expect(allowed).toBe(false)
        })
    })

    describe('Anomaly Detector', () => {
        it('should detect high velocity', async () => {
            // Mock recent transactions summing to 450
            // We need to override the 'then' behavior for the specific chain
            mockChain.then = jest.fn((resolve) => resolve({ data: [{ points: 450 }] }))

            // Adding 60 more should trigger (> 500)
            const isAnomaly = await checkTransactionAnomaly('user-1', 60)

            expect(isAnomaly).toBe(true)
            // The audit log insert is a separate call, so we check if from('audit_logs') was called
            expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs')
        })

        it('should pass normal velocity', async () => {
            mockChain.then = jest.fn((resolve) => resolve({ data: [{ points: 100 }] }))
            const isAnomaly = await checkTransactionAnomaly('user-1', 50)
            expect(isAnomaly).toBe(false)
        })
    })

    describe('Audit Log Wrapper', () => {
        it('should log action execution', async () => {
            const mockAction = jest.fn().mockResolvedValue('success')
            const wrapped = withAuditLog('test_action', mockAction)

            await wrapped({ foo: 'bar' })

            expect(mockAction).toHaveBeenCalled()
            expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs')
            expect(mockChain.insert).toHaveBeenCalledWith(expect.objectContaining({
                action: 'test_action',
                actor_id: 'user-1'
            }))
        })
    })
})
