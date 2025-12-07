'use server'

import { createClient } from '@/lib/supabase/server'
import { createBillingPortalSession, updateSubscription, STRIPE_PRICES } from '@/lib/stripe/client'
import { redirect } from 'next/navigation'

/**
 * Get current tenant's subscription details
 */
export async function getSubscriptionDetails() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile || !['owner', 'admin'].includes(profile.role)) {
        return { error: 'Unauthorized' }
    }

    // Get subscription
    const { data: subscription } = await supabase
        .from('tenant_subscriptions')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .single()

    // Get current usage
    const { data: usage } = await supabase
        .from('tenant_usage')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .gte('period_start', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .order('period_start', { ascending: false })
        .limit(1)
        .single()

    // Get tier limits
    const { data: limits } = await supabase
        .from('tier_limits')
        .select('*')
        .eq('tier', subscription?.tier || 'developer')
        .single()

    // Get credits
    const { data: credits } = await supabase
        .from('tenant_credits')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .single()

    return {
        subscription,
        usage: usage || { members_count: 0, transactions_count: 0, messages_sent: 0, whatsapp_cost_cents: 0 },
        limits,
        credits,
    }
}

/**
 * Create Stripe billing portal session
 */
export async function openBillingPortal() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'owner') {
        return { error: 'Only owners can access billing' }
    }

    const { data: subscription } = await supabase
        .from('tenant_subscriptions')
        .select('stripe_customer_id')
        .eq('tenant_id', profile.tenant_id)
        .single()

    if (!subscription?.stripe_customer_id) {
        return { error: 'No billing account found' }
    }

    try {
        const session = await createBillingPortalSession({
            customerId: subscription.stripe_customer_id,
            returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
        })

        return { url: session.url }
    } catch (error) {
        console.error('Billing portal error:', error)
        return { error: 'Failed to open billing portal' }
    }
}

/**
 * Upgrade/downgrade subscription
 */
export async function changePlan(newTier: 'starter' | 'pro' | 'enterprise') {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'owner') {
        return { error: 'Only owners can change plans' }
    }

    const { data: subscription } = await supabase
        .from('tenant_subscriptions')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .single()

    if (!subscription?.stripe_subscription_id) {
        return { error: 'No active subscription found' }
    }

    if (subscription.tier === newTier) {
        return { error: 'Already on this plan' }
    }

    // Get new price ID
    const newPriceId =
        newTier === 'starter'
            ? STRIPE_PRICES.starter_monthly
            : newTier === 'pro'
                ? STRIPE_PRICES.pro_monthly
                : STRIPE_PRICES.enterprise_monthly

    if (!newPriceId) {
        return { error: 'Price not configured for this tier' }
    }

    try {
        await updateSubscription({
            subscriptionId: subscription.stripe_subscription_id,
            newPriceId,
        })

        // Update local record (webhook will also update it)
        await supabase
            .from('tenant_subscriptions')
            .update({ tier: newTier })
            .eq('tenant_id', profile.tenant_id)

        return { success: true }
    } catch (error) {
        console.error('Plan change error:', error)
        return { error: 'Failed to change plan' }
    }
}
