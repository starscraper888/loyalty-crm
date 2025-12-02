import { createClient } from '@/lib/supabase/server'

/**
 * Check if an action is allowed by the rate limiter.
 * @param key Unique identifier (e.g. 'ip:1.2.3.4', 'user:123')
 * @param cost Cost of the action (default 1)
 * @param capacity Max burst capacity (default 10)
 * @param refillRate Points refilled per second (default 1)
 */
export async function checkRateLimit(
    key: string,
    cost: number = 1,
    capacity: number = 10,
    refillRate: number = 1
): Promise<boolean> {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('check_rate_limit', {
        p_key: key,
        p_cost: cost,
        p_capacity: capacity,
        p_refill_rate: refillRate
    })

    if (error) {
        console.error('Rate limit check failed:', error)
        // Fail open or closed? 
        // For security, usually fail closed, but for UX, fail open might be better if DB is down.
        // Let's fail closed for now to be safe.
        return false
    }

    return data as boolean
}
