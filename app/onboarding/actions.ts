'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createStripeCustomer, createCheckoutSession, STRIPE_PRICES } from '@/lib/stripe/client'
import { redirect } from 'next/navigation'

/**
 * Create a new tenant with owner account
 */
export async function createTenant(data: {
    businessName: string
    ownerName: string
    ownerEmail: string
    ownerPassword: string
    tier: 'starter' | 'pro' | 'enterprise'
}) {
    const adminSupabase = createAdminClient()

    try {
        // 1. Create auth user for owner
        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
            email: data.ownerEmail,
            password: data.ownerPassword,
            email_confirm: true,
            user_metadata: {
                full_name: data.ownerName,
                role: 'owner',
            },
        })

        if (authError || !authData.user) {
            return { error: `Failed to create user: ${authError?.message}` }
        }

        // 2. Create tenant
        const { data: tenant, error: tenantError } = await adminSupabase
            .from('tenants')
            .insert({
                name: data.businessName,
            })
            .select()
            .single()

        if (tenantError || !tenant) {
            // Rollback: delete auth user
            await adminSupabase.auth.admin.deleteUser(authData.user.id)
            return { error: `Failed to create tenant: ${tenantError?.message}` }
        }

        // 3. Create owner profile
        const { error: profileError } = await adminSupabase
            .from('profiles')
            .update({
                tenant_id: tenant.id,
                role: 'owner',
                full_name: data.ownerName,
            })
            .eq('id', authData.user.id)

        if (profileError) {
            // Rollback
            await adminSupabase.auth.admin.deleteUser(authData.user.id)
            await adminSupabase.from('tenants').delete().eq('id', tenant.id)
            return { error: `Failed to create profile: ${profileError.message}` }
        }

        // 4. Create Stripe customer
        let stripeCustomer
        try {
            stripeCustomer = await createStripeCustomer({
                email: data.ownerEmail,
                name: data.businessName,
                tenantId: tenant.id,
            })
        } catch (stripeError) {
            console.error('Stripe customer creation failed:', stripeError)
            // Rollback everything
            await adminSupabase.auth.admin.deleteUser(authData.user.id)
            await adminSupabase.from('tenants').delete().eq('id', tenant.id)
            return { error: 'Failed to create Stripe customer. Please check your Stripe API key.' }
        }

        if (!stripeCustomer?.id) {
            // Rollback
            await adminSupabase.auth.admin.deleteUser(authData.user.id)
            await adminSupabase.from('tenants').delete().eq('id', tenant.id)
            return { error: 'Stripe customer was not created properly' }
        }

        // 5. Create subscription record
        const trialDays = data.tier === 'starter' ? 30 : data.tier === 'pro' ? 30 : 30

        console.log('[Onboarding] Creating subscription record with:', {
            tenant_id: tenant.id,
            stripe_customer_id: stripeCustomer.id,
            tier: data.tier,
            status: 'trialing'
        })

        const { data: subscriptionData, error: subscriptionError } = await adminSupabase
            .from('tenant_subscriptions')
            .insert({
                tenant_id: tenant.id,
                stripe_customer_id: stripeCustomer.id,
                tier: data.tier,
                status: 'trialing',
                trial_ends_at: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString(),
            })
            .select()
            .single()

        if (subscriptionError) {
            console.error('Failed to create subscription record:', subscriptionError)
            return { error: `Failed to create subscription: ${subscriptionError.message}` }
        }

        console.log('[Onboarding] Subscription record created:', subscriptionData)

        // 6. Create tenant settings
        const { error: settingsError } = await adminSupabase
            .from('tenant_settings')
            .insert({
                tenant_id: tenant.id,
                business_name: data.businessName,
            })

        if (settingsError) {
            console.error('Failed to create settings:', settingsError)
        }

        // 7. Create tenant credits
        const { error: creditsError } = await adminSupabase
            .from('tenant_credits')
            .insert({
                tenant_id: tenant.id,
                balance_cents: 0,
            })

        if (creditsError) {
            console.error('Failed to create credits:', creditsError)
        }

        return {
            success: true,
            tenantId: tenant.id,
            userId: authData.user.id,
            stripeCustomerId: stripeCustomer.id,
        }
    } catch (error) {
        console.error('Tenant creation error:', error)
        return { error: 'An unexpected error occurred during signup' }
    }
}

/**
 * Create Stripe checkout session for new tenant
 */
export async function createOnboardingCheckout(data: {
    tenantId: string
    tier: 'starter' | 'pro' | 'enterprise'
}) {
    // Use admin client because user might not be authenticated yet during onboarding
    const adminSupabase = createAdminClient()

    console.log('[Checkout] Looking up subscription for tenant:', data.tenantId)

    // Get subscription
    const { data: subscription, error: queryError } = await adminSupabase
        .from('tenant_subscriptions')
        .select('stripe_customer_id')
        .eq('tenant_id', data.tenantId)
        .single()

    console.log('[Checkout] Query result:', { subscription, error: queryError })

    if (queryError || !subscription?.stripe_customer_id) {
        console.error('[Checkout] Failed to find subscription:', queryError)
        return { error: 'Stripe customer not found' }
    }

    // Get price ID
    const priceId =
        data.tier === 'starter'
            ? STRIPE_PRICES.starter_monthly
            : data.tier === 'pro'
                ? STRIPE_PRICES.pro_monthly
                : STRIPE_PRICES.enterprise_monthly

    if (!priceId) {
        return { error: 'Price ID not configured for this tier' }
    }

    try {
        const session = await createCheckoutSession({
            customerId: subscription.stripe_customer_id,
            priceId,
            successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/payment`,
            trialDays: 30,
        })

        return { success: true, sessionUrl: session.url }
    } catch (error) {
        console.error('Checkout creation error:', error)
        return { error: 'Failed to create checkout session' }
    }
}

/**
 * Complete onboarding after successful payment
 */
export async function completeOnboarding(sessionId: string) {
    const supabase = await createClient()

    // Verify session and update subscription status
    // This will be handled by webhook in production
    // For now, just redirect to dashboard

    return { success: true }
}
