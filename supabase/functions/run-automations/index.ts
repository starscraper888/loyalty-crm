import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Configuration
const QUIET_HOURS_START = 21 // 9 PM
const QUIET_HOURS_END = 9    // 9 AM
const RATE_LIMIT_DAYS = 30   // Don't send same automation more than once every 30 days

serve(async (req) => {
    // 1. Quiet Hours Check
    const now = new Date()
    const hour = now.getHours()

    if (hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END) {
        return new Response(JSON.stringify({ message: 'Quiet hours active. Skipping.' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    const results = {
        birthday: 0,
        winback: 0,
        lowBalance: 0
    }

    // 2. Workflow: Birthday
    // Find users with birthday today
    const today = now.toISOString().slice(5, 10) // MM-DD

    // Note: Supabase/Postgres date filtering on MM-DD string is tricky without specific functions.
    // For this demo, we assume we fetch a batch and filter or use a specific RPC.
    // Let's use a simplified query assuming we have a helper or just fetch all for MVP (not scalable but works for demo logic).
    // Ideally: .rpc('get_users_with_birthday', { p_date: today })

    // Mocking the selection for the logic demonstration
    // In production: Use a proper SQL query for birthdays

    // 3. Workflow: Winback (Inactive > 30 days)
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30)).toISOString()

    const { data: inactiveUsers } = await supabase
        .from('profiles')
        .select('id, tenant_id, phone')
        .lt('last_interaction_at', thirtyDaysAgo)

    if (inactiveUsers) {
        for (const user of inactiveUsers) {
            if (await checkRateLimit(user.id, 'winback_offer')) {
                await sendAutomation(user, 'winback_offer')
                results.winback++
            }
        }
    }

    // 4. Workflow: Low Balance (< 100 pts)
    const { data: lowBalanceUsers } = await supabase
        .from('profiles')
        .select('id, tenant_id, phone')
        .lt('points_balance', 100)

    if (lowBalanceUsers) {
        for (const user of lowBalanceUsers) {
            if (await checkRateLimit(user.id, 'low_balance_alert')) {
                await sendAutomation(user, 'low_balance_alert')
                results.lowBalance++
            }
        }
    }

    return new Response(JSON.stringify(results), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    })
})

async function checkRateLimit(userId: string, templateName: string): Promise<boolean> {
    // Check if sent in last X days
    const limitDate = new Date()
    limitDate.setDate(limitDate.getDate() - RATE_LIMIT_DAYS)

    const { data } = await supabase
        .from('automation_logs')
        .select('id')
        .eq('profile_id', userId)
        .eq('automation_type', templateName) // We map template name to type for simplicity here
        .gt('sent_at', limitDate.toISOString())
        .single()

    return !data // Returns true if NO log found (safe to send)
}

async function sendAutomation(user: any, templateName: string) {
    // 1. Get Template Cost
    const { data: template } = await supabase
        .from('whatsapp_templates')
        .select('id, cost_per_msg')
        .eq('name', templateName)
        .single()

    if (!template) return

    // 2. Send Message (Mock)
    console.log(`Sending ${templateName} to ${user.phone}`)

    // 3. Log
    await supabase.from('automation_logs').insert({
        tenant_id: user.tenant_id,
        profile_id: user.id,
        template_id: template.id,
        automation_type: templateName,
        cost: template.cost_per_msg
    })
}
