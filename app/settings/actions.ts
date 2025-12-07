'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBillingPortalSession, updateSubscription, createCreditPurchaseSession, stripe, STRIPE_PRICES } from '@/lib/stripe/client'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

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

    let subscriptionId = subscription?.stripe_subscription_id

    // Fallback: If no subscription ID in DB, try to find it in Stripe
    if (!subscriptionId && subscription?.stripe_customer_id) {
        try {
            console.log('[Upgrade] Subscription ID missing in DB, fetching from Stripe...')
            const stripeSubs = await stripe.subscriptions.list({
                customer: subscription.stripe_customer_id,
                status: 'all',
                limit: 1,
            })

            if (stripeSubs.data.length > 0) {
                subscriptionId = stripeSubs.data[0].id
                console.log('[Upgrade] Found active subscription in Stripe:', subscriptionId)

                // Update DB so we don't have to look it up again
                await supabase
                    .from('tenant_subscriptions')
                    .update({
                        stripe_subscription_id: subscriptionId,
                        status: stripeSubs.data[0].status,
                    })
                    .eq('tenant_id', profile.tenant_id)
            }
        } catch (e) {
            console.error('[Upgrade] Failed to lookup subscription in Stripe:', e)
        }
    }

    if (!subscriptionId) {
        return { error: 'No active subscription found. Please check your billing status.' }
    }

    // Determine current price ID (optional check)
    // const currentPriceId = subscription.items.data[0].price.id

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
            subscriptionId: subscriptionId,
            newPriceId,
        })

        // Update local record explicitly using admin client to bypass RLS
        // (Webhooks are reliable but async; we need immediate consistency for UI)
        const adminSupabase = createAdminClient()
        const { error: updateError } = await adminSupabase
            .from('tenant_subscriptions')
            .update({
                tier: newTier,
                updated_at: new Date().toISOString()
            })
            .eq('tenant_id', profile.tenant_id)

        if (updateError) {
            console.error('Failed to update local subscription record:', updateError)
            // We don't throw here because Stripe update succeeded, so technically the plan CHANGED.
            // The webhook will eventually fix consistency if this fails.
        }

        revalidatePath('/[lang]/settings/billing')
        return { success: true }
    } catch (error: any) {
        console.error('Plan change error:', error)
        return { error: error?.message || 'Failed to change plan' }
    }
}

/**
 * Buy WhatsApp credits
 */
export async function buyCredits(amount: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'owner') {
        return { error: 'Only owners can purchase credits' }
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
        const session = await createCreditPurchaseSession({
            customerId: subscription.stripe_customer_id,
            priceAmount: amount * 100, // convert to cents
            metadata: {
                tenant_id: profile.tenant_id,
                type: 'credit_purchase',
            },
            successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=credits`,
            cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
        })

        return { url: session.url }
    } catch (error) {
        console.error('Credit purchase error:', error)
        return { error: 'Failed to create checkout session' }
    }
}
