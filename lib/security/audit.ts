import { createClient } from '@/lib/supabase/server'

type ServerAction<T, R> = (args: T) => Promise<R>

/**
 * Wraps a server action with audit logging.
 * @param actionName Name of the action (e.g., 'issue_points')
 * @param action The actual function
 */
export function withAuditLog<T, R>(actionName: string, action: ServerAction<T, R>) {
    return async (args: T): Promise<R> => {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // 1. Execute Action
        let result: R
        let error: any
        try {
            result = await action(args)
        } catch (e) {
            error = e
            throw e
        } finally {
            // 2. Log (Fire and forget usually, but here we await to ensure it's captured)
            if (user) {
                // We need tenant_id. Usually we'd fetch it or expect it in context.
                // For simplicity, we'll try to fetch it from profile if not available.
                // But to avoid slowing down every request, we might skip tenant_id if not critical,
                // OR we assume the action context provides it.
                // Let's just log what we can.

                // Fetch tenant for completeness (cached ideally)
                const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

                await supabase.from('audit_logs').insert({
                    tenant_id: profile?.tenant_id,
                    actor_id: user.id,
                    action: actionName,
                    details: {
                        args,
                        success: !error,
                        error: error?.message
                    }
                })
            }
        }

        return result
    }
}
