import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = createAdminClient()

    try {
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription
                await handleSubscriptionUpdate(supabase, subscription)
                break
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription
                await handleSubscriptionDeleted(supabase, subscription)
                break
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice
                await handlePaymentSucceeded(supabase, invoice)
                break
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice
                await handlePaymentFailed(supabase, invoice)
                break
            }

            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                await handleCheckoutCompleted(supabase, session)
                break
            }

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Webhook handler error:', error)
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
    }
}

async function handleSubscriptionUpdate(supabase: any, subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string

    // Get tenant by Stripe customer ID
    const { data: tenantSub } = await supabase
        .from('tenant_subscriptions')
        .select('tenant_id')
        .eq('stripe_customer_id', customerId)
        .single()

    if (!tenantSub) {
        console.error('Tenant not found for customer:', customerId)
        return
    }

    // Determine tier from price ID
    const priceId = subscription.items.data[0]?.price.id
    let tier = 'starter'

    if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY) {
        tier = 'pro'
    } else if (priceId === process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY) {
        tier = 'enterprise'
    }

    // Update subscription
    await supabase
        .from('tenant_subscriptions')
        .update({
            stripe_subscription_id: subscription.id,
            tier,
            status: subscription.status,
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            trial_ends_at: (subscription as any).trial_end
                ? new Date((subscription as any).trial_end * 1000).toISOString()
                : null,
        })
        .eq('tenant_id', tenantSub.tenant_id)

    console.log(`Updated subscription for tenant ${tenantSub.tenant_id}:`, {
        tier,
        status: subscription.status,
    })
}

async function handleSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string

    const { data: tenantSub } = await supabase
        .from('tenant_subscriptions')
        .select('tenant_id')
        .eq('stripe_customer_id', customerId)
        .single()

    if (!tenantSub) return

    // Mark as canceled
    await supabase
        .from('tenant_subscriptions')
        .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
        })
        .eq('tenant_id', tenantSub.tenant_id)

    console.log(`Subscription canceled for tenant ${tenantSub.tenant_id}`)
}

async function handlePaymentSucceeded(supabase: any, invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string

    const { data: tenantSub } = await supabase
        .from('tenant_subscriptions')
        .select('tenant_id')
        .eq('stripe_customer_id', customerId)
        .single()

    if (!tenantSub) return

    // Update status to active if it was past_due
    await supabase
        .from('tenant_subscriptions')
        .update({ status: 'active' })
        .eq('tenant_id', tenantSub.tenant_id)
        .eq('status', 'past_due')

    console.log(`Payment succeeded for tenant ${tenantSub.tenant_id}`)
}

async function handlePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string

    const { data: tenantSub } = await supabase
        .from('tenant_subscriptions')
        .select('tenant_id')
        .eq('stripe_customer_id', customerId)
        .single()

    if (!tenantSub) return

    // Mark as past_due
    await supabase
        .from('tenant_subscriptions')
        .update({ status: 'past_due' })
        .eq('tenant_id', tenantSub.tenant_id)

    console.log(`Payment failed for tenant ${tenantSub.tenant_id}`)

    // TODO: Send email notification to tenant owner
}

async function handleCheckoutCompleted(supabase: any, session: Stripe.Checkout.Session) {
    // Check if this is a credit purchase
    if (session.metadata?.type === 'credit_purchase' && session.mode === 'payment') {
        await handleCreditPurchase(supabase, session)
        return
    }

    const subscriptionId = session.subscription as string
    if (!subscriptionId) return

    // Fetch full subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    // Update via subscription handler
    await handleSubscriptionUpdate(supabase, subscription)

    console.log(`Checkout completed for customer ${customerId}`)
}

async function handleCreditPurchase(supabase: any, session: Stripe.Checkout.Session) {
    const tenantId = session.metadata?.tenant_id
    const amountTotal = session.amount_total || 0

    if (!tenantId || amountTotal <= 0) {
        console.error('Invalid credit purchase session:', session.id)
        return
    }

    // Increment credits
    const { error } = await supabase.rpc('increment_credits', {
        p_tenant_id: tenantId,
        p_amount: amountTotal
    })

    if (error) {
        // Fallback: manual update if RPC doesn't exist (it won't exist yet, so we use manual update)
        // Note: In production you should use RPC for atomicity
        const { data: credits } = await supabase
            .from('tenant_credits')
            .select('balance_cents')
            .eq('tenant_id', tenantId)
            .single()

        if (credits) {
            await supabase
                .from('tenant_credits')
                .update({ balance_cents: credits.balance_cents + amountTotal })
                .eq('tenant_id', tenantId)
        }
    }

    console.log(`Credits purchased for tenant ${tenantId}: +$${amountTotal / 100}`)
}
