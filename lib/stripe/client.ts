import Stripe from 'stripe'
enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
}

/**
 * Create a Stripe customer for a new tenant
 */
export async function createStripeCustomer(params: {
    email: string
    name: string
    tenantId: string
}) {
    const customer = await stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: {
            tenant_id: params.tenantId,
        },
    })

    return customer
}

/**
 * Create a subscription for a customer
 */
export async function createSubscription(params: {
    customerId: string
    priceId: string
    trialDays?: number
}) {
    const subscription = await stripe.subscriptions.create({
        customer: params.customerId,
        items: [{ price: params.priceId }],
        trial_period_days: params.trialDays || 30,
        payment_behavior: 'default_incomplete',
        payment_settings: {
            save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
    })

    return subscription
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(params: {
    customerId: string
    priceId: string
    successUrl: string
    cancelUrl: string
    trialDays?: number
}) {
    const session = await stripe.checkout.sessions.create({
        customer: params.customerId,
        mode: 'subscription',
        line_items: [
            {
                price: params.priceId,
                quantity: 1,
            },
        ],
        subscription_data: {
            trial_period_days: params.trialDays || 30,
        },
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
    })

    return session
}

/**
 * Create a billing portal session
 */
export async function createBillingPortalSession(params: {
    customerId: string
    returnUrl: string
}) {
    const session = await stripe.billingPortal.sessions.create({
        customer: params.customerId,
        return_url: params.returnUrl,
    })

    return session
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string) {
    const subscription = await stripe.subscriptions.cancel(subscriptionId)
    return subscription
}

/**
 * Update subscription (upgrade/downgrade)
 */
export async function updateSubscription(params: {
    subscriptionId: string
    newPriceId: string
}) {
    const subscription = await stripe.subscriptions.retrieve(params.subscriptionId)

    const updatedSubscription = await stripe.subscriptions.update(params.subscriptionId, {
        items: [
            {
                id: subscription.items.data[0].id,
                price: params.newPriceId,
            },
        ],
        proration_behavior: 'always_invoice',
    })

    return updatedSubscription
}
