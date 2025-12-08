import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function rateLimit({
    key,
    limit,
    window
}: {
    key: string
    limit: number
    window: number
}): Promise<boolean> {
    const supabase = await createClient()

    // Get IP for anonymous rate limiting if needed, though usually we pass explicit key
    // For now, we rely on the passed key.

    const { data, error } = await supabase.rpc('check_rate_limit', {
        p_key: key,
        p_limit: limit,
        p_window_seconds: window
    })

    if (error) {
        console.error('Rate limit error:', error)
        // Fail open if rate limit system is down? Or blocked?
        // Ideally fail open for UX, but fail closed for security.
        // Let's fail open (return true = allowed) but log error.
        return true
    }

    return data
}
