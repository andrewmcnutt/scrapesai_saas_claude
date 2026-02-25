'use server'

import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createCheckoutSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user already has a Stripe customer ID (reuse existing customer)
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    // Reuse existing Stripe customer to avoid duplicates
    customer: existingSub?.stripe_customer_id ?? undefined,
    // Only set email if no existing customer
    customer_email: existingSub?.stripe_customer_id ? undefined : user.email ?? undefined,
    // CRITICAL: user_id in session metadata for webhook to link subscription to user
    metadata: {
      user_id: user.id,
    },
    // Also set on subscription object for subscription lifecycle events
    subscription_data: {
      metadata: {
        user_id: user.id,
      },
    },
  })

  redirect(session.url!)
}

export async function createPortalSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Query subscriptions table for stripe_customer_id
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  // If no subscription found, nothing to manage
  if (!subscription?.stripe_customer_id) {
    redirect('/dashboard')
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  })

  redirect(portalSession.url)
}
