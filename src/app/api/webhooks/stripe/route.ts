import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe/client'

// ============================================================================
// Stripe Webhook Handler
// Processes subscription lifecycle events and allocates credits on payment.
// CRITICAL: Must return 200 for all processed events (including errors) to
// prevent Stripe retry loops. Idempotency guards prevent double-processing.
//
// NOTE: Stripe API v2026-01-28.clover changed the data model:
//   - invoice.subscription → invoice.parent?.subscription_details?.subscription
//   - subscription.current_period_start/end → subscription.items.data[0].current_period_start/end
// ============================================================================

export async function POST(request: NextRequest) {
  console.log('[Stripe Webhook] Received webhook request')

  // CRITICAL: Read raw body as text for signature verification
  // Must use .text() before any other body consumption — Stripe SDK needs the
  // raw bytes to verify the HMAC-SHA256 signature
  const body = await request.text()

  // Get Stripe-Signature header
  const sig = (await headers()).get('stripe-signature')

  if (!sig) {
    console.warn('[Stripe Webhook] Missing stripe-signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  // Verify webhook signature — rejects spoofed or tampered events
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`[Stripe Webhook] Verified event: ${event.type} (${event.id})`)

  // Use Supabase admin client with service role key to bypass RLS
  // This is a server-to-server webhook — no user session available
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // -------------------------------------------------------------------------
  // Idempotency check: skip if event already processed
  // Stripe retries events for 3 days — we must handle duplicates gracefully
  // -------------------------------------------------------------------------
  const { data: existingEvent } = await supabaseAdmin
    .from('stripe_processed_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle()

  if (existingEvent) {
    console.log(`[Stripe Webhook] Duplicate event skipped: ${event.id}`)
    return NextResponse.json({ received: true, duplicate: true })
  }

  // Record event BEFORE processing (crash-safe: if we crash mid-process,
  // the event is recorded and won't be re-processed on retry)
  const { error: insertError } = await supabaseAdmin
    .from('stripe_processed_events')
    .insert({ stripe_event_id: event.id, event_type: event.type })

  if (insertError) {
    console.error('[Stripe Webhook] Failed to record event for idempotency:', insertError)
    // Do not return 500 — return 200 to prevent Stripe retry loop
    return NextResponse.json({ received: true })
  }

  // -------------------------------------------------------------------------
  // Route events to handlers
  // Handler errors are caught and logged — we return 200 regardless to
  // prevent Stripe retry loops (event is already marked as processed above)
  // -------------------------------------------------------------------------
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpsert(supabaseAdmin, event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabaseAdmin, event.data.object as Stripe.Subscription)
        break

      case 'invoice.paid':
        await handleInvoicePaid(supabaseAdmin, event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(supabaseAdmin, event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    // Log for manual review — do NOT return 500 (would cause Stripe to retry
    // an already-recorded event; idempotency would skip it but creates confusion)
    console.error(`[Stripe Webhook] Handler error for ${event.type} (${event.id}):`, err)
  }

  return NextResponse.json({ received: true })
}

// ============================================================================
// handleSubscriptionUpsert
// Handles customer.subscription.created and customer.subscription.updated
// Upserts subscription record to keep local state in sync with Stripe.
//
// NOTE: In Stripe API v2026-01-28.clover, current_period_start/end moved from
// the subscription object to the subscription item level. We read from
// subscription.items.data[0] for billing period timestamps.
// ============================================================================
async function handleSubscriptionUpsert(
  supabaseAdmin: SupabaseClient,
  subscription: Stripe.Subscription
) {
  console.log(`[Stripe Webhook] handleSubscriptionUpsert: ${subscription.id}`)

  const userId = subscription.metadata?.user_id

  if (!userId) {
    console.error(
      `[Stripe Webhook] handleSubscriptionUpsert: missing user_id in metadata for subscription ${subscription.id}`
    )
    return
  }

  // In Stripe API v2026-01-28.clover, current_period_start/end are on the
  // subscription item, not the subscription itself.
  const firstItem = subscription.items.data[0]
  const currentPeriodStart = firstItem?.current_period_start
    ? new Date(firstItem.current_period_start * 1000).toISOString()
    : null
  const currentPeriodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000).toISOString()
    : null

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        stripe_price_id: firstItem.price.id,
        status: subscription.status,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000).toISOString()
          : null,
      },
      { onConflict: 'stripe_subscription_id' }
    )

  if (error) {
    console.error(`[Stripe Webhook] handleSubscriptionUpsert DB error:`, error)
    throw error
  }

  console.log(
    `[Stripe Webhook] Subscription upserted: ${subscription.id} status=${subscription.status}`
  )
}

// ============================================================================
// handleSubscriptionDeleted
// Handles customer.subscription.deleted
// Marks subscription as canceled in local database
// ============================================================================
async function handleSubscriptionDeleted(
  supabaseAdmin: SupabaseClient,
  subscription: Stripe.Subscription
) {
  console.log(`[Stripe Webhook] handleSubscriptionDeleted: ${subscription.id}`)

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error(`[Stripe Webhook] handleSubscriptionDeleted DB error:`, error)
    throw error
  }

  console.log(`[Stripe Webhook] Subscription marked canceled: ${subscription.id}`)
}

// ============================================================================
// handleInvoicePaid
// Handles invoice.paid
// Allocates 10 credits per billing cycle via the credit_transactions ledger.
// Double-safety idempotency: checks invoice_id in metadata before allocating
// (in addition to the stripe_processed_events top-level idempotency check).
//
// NOTE: In Stripe API v2026-01-28.clover, the subscription reference moved from
// invoice.subscription to invoice.parent?.subscription_details?.subscription.
// ============================================================================
async function handleInvoicePaid(
  supabaseAdmin: SupabaseClient,
  invoice: Stripe.Invoice
) {
  console.log(`[Stripe Webhook] handleInvoicePaid: invoice=${invoice.id}`)

  // In Stripe API v2026-01-28.clover, subscription reference is at
  // invoice.parent?.subscription_details?.subscription
  const subscriptionId =
    invoice.parent?.type === 'subscription_details'
      ? (invoice.parent.subscription_details?.subscription as string | undefined)
      : undefined

  // Skip non-subscription invoices (e.g. one-time charges)
  if (!subscriptionId) {
    console.log(
      `[Stripe Webhook] handleInvoicePaid: skipping non-subscription invoice ${invoice.id}`
    )
    return
  }

  // Double-safety credit idempotency (CRED-09)
  // Primary guard: stripe_processed_events table above
  // Secondary guard: check invoice_id in credit_transactions metadata
  // This handles edge cases where the event record was inserted but credit insert failed
  const { data: existingCredit } = await supabaseAdmin
    .from('credit_transactions')
    .select('id')
    .eq('type', 'monthly_allocation')
    .contains('metadata', { invoice_id: invoice.id })
    .maybeSingle()

  if (existingCredit) {
    console.log(
      `[Stripe Webhook] handleInvoicePaid: credits already allocated for invoice ${invoice.id}`
    )
    return
  }

  // Find user via their subscription record
  const { data: subscriptionRecord } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle()

  if (!subscriptionRecord?.user_id) {
    console.error(
      `[Stripe Webhook] handleInvoicePaid: no subscription found for stripe_subscription_id=${subscriptionId}`
    )
    return
  }

  // INSERT 10 credits with invoice_id in metadata for double-safety idempotency
  // invoice.period_start/period_end still exist on Invoice in v2026-01-28.clover
  const { error } = await supabaseAdmin
    .from('credit_transactions')
    .insert({
      user_id: subscriptionRecord.user_id,
      amount: 10,
      type: 'monthly_allocation',
      metadata: {
        invoice_id: invoice.id,
        billing_period_start: invoice.period_start,
        billing_period_end: invoice.period_end,
        stripe_subscription_id: subscriptionId,
      },
    })

  if (error) {
    console.error(`[Stripe Webhook] handleInvoicePaid credit insert error:`, error)
    throw error
  }

  console.log(
    `[Stripe Webhook] Allocated 10 credits for user ${subscriptionRecord.user_id} (invoice ${invoice.id})`
  )
}

// ============================================================================
// handleInvoicePaymentFailed
// Handles invoice.payment_failed
// Marks subscription as past_due. Does NOT touch credit_transactions (PAY-14).
// ============================================================================
async function handleInvoicePaymentFailed(
  supabaseAdmin: SupabaseClient,
  invoice: Stripe.Invoice
) {
  console.log(`[Stripe Webhook] handleInvoicePaymentFailed: invoice=${invoice.id}`)

  // In Stripe API v2026-01-28.clover, subscription reference is at
  // invoice.parent?.subscription_details?.subscription
  const subscriptionId =
    invoice.parent?.type === 'subscription_details'
      ? (invoice.parent.subscription_details?.subscription as string | undefined)
      : undefined

  // Skip non-subscription invoices
  if (!subscriptionId) {
    console.log(
      `[Stripe Webhook] handleInvoicePaymentFailed: skipping non-subscription invoice ${invoice.id}`
    )
    return
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error(`[Stripe Webhook] handleInvoicePaymentFailed DB error:`, error)
    throw error
  }

  console.log(
    `[Stripe Webhook] Subscription marked past_due for stripe_subscription_id=${subscriptionId}`
  )
}
