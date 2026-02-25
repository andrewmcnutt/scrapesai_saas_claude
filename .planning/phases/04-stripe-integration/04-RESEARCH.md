# Phase 4: Stripe Integration - Research

**Researched:** 2026-02-24
**Domain:** Stripe Subscriptions, Webhooks, Credit Allocation, Next.js 15 App Router
**Confidence:** HIGH

---

## Summary

Phase 4 adds monetization to a working carousel generation app. The core work is three distinct integration surfaces: (1) Stripe Checkout for subscription creation, (2) Stripe Webhooks for credit allocation and subscription lifecycle sync, and (3) Stripe Customer Portal for self-serve subscription management. The credit system ledger is already built (CRED-06, CRED-07, CRED-08) — Phase 4 wires Stripe events into that existing ledger and enforces the free tier limit.

The primary technical challenge is the race condition between Stripe's webhook delivery and the user's checkout redirect. The PAY-11 requirement mandates that the success page query Stripe's API directly to confirm subscription status before rendering — this is the correct pattern and is well-supported by Stripe's SDK. The secondary challenge is idempotent webhook processing: Stripe retries events for up to 3 days, so the webhook handler must track processed event IDs in the database to avoid double-allocating credits.

The existing codebase already uses `request.text()` for raw body reading in the N8N webhook handler — the exact same pattern applies to Stripe signature verification. The existing `SUPABASE_SERVICE_ROLE_KEY` client pattern for bypassing RLS in server-to-server contexts applies directly to the Stripe webhook handler.

**Primary recommendation:** Install `stripe` npm package (v20.x), add two new database tables (`subscriptions` and `stripe_processed_events`), wire checkout via a Server Action, and handle exactly 4 webhook events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CRED-01 | Free tier users receive 3 total carousel generations (lifetime, not monthly) | Free tier enforcement: check credit_transactions SUM for users without active subscription. 3 lifetime credits allocated at signup (existing). When balance=0 AND user is free tier, show upgrade prompt. |
| CRED-02 | Paid tier users receive 10 credits per month with rollover | invoice.paid webhook inserts credit_transaction with amount=10, type='monthly_allocation', metadata includes billing_period_id for idempotency (CRED-09). Rollover is automatic — ledger never resets. |
| CRED-03 | Credits deduct when user clicks Generate (not on download) | Already implemented via deduct_credit RPC. No changes needed. |
| CRED-04 | Unused credits roll over month-to-month for paid users | Inherent in ledger design (INSERT-only, SUM-based balance). No expiry logic needed. Credits accumulate. |
| CRED-05 | Dashboard displays current credit balance prominently | Enhance CreditBalance component to show tier, add upgrade CTA when balance low. Upgrade button should trigger checkout Server Action. |
| CRED-09 | Monthly credit allocation tracks billing_period_id for idempotency | Store invoice.id (Stripe's invoice ID) as billing_period_id in credit_transactions.metadata. Before allocating, check if any transaction with that invoice.id exists. |
| CRED-10 | System prevents generation when balance is 0 | Already enforced by deduct_credit RPC (raises exception if insufficient). Action.ts returns 'Insufficient credits' message. Need UI to show upgrade CTA instead of generic error. |
| PAY-01 | Free tier enforced (3 total carousels, then upgrade prompt) | Check subscription status from subscriptions table. If no active subscription AND balance=0, block generation and show upgrade prompt. |
| PAY-02 | Paid tier costs $29.99/month | Create Stripe Price in dashboard at $29.99/month. Store STRIPE_PRICE_ID in env. Reference in checkout session. |
| PAY-03 | User can subscribe via Stripe Checkout from dashboard | Server Action creates checkout session with mode:'subscription', user_id in metadata, success_url points to /billing/success?session_id={CHECKOUT_SESSION_ID}. |
| PAY-04 | Stripe webhook verifies signatures (stripe.webhooks.constructEvent) | Route handler at /api/webhooks/stripe. Use request.text() for raw body (same as N8N handler). Call stripe.webhooks.constructEvent(body, sig, secret). |
| PAY-05 | Stripe webhook handlers are idempotent (log event.id, skip if exists) | stripe_processed_events table stores event.id. Check before processing, insert after. Return 200 for duplicate events. |
| PAY-06 | invoice.paid event allocates 10 credits via ledger transaction | In webhook handler: check idempotency, insert credit_transaction(amount=10, type='monthly_allocation', metadata={invoice_id, period_start, period_end}). |
| PAY-07 | customer.subscription.created event creates subscription record | Upsert into subscriptions table: stripe_subscription_id, stripe_customer_id, user_id (from metadata), status, current_period_end. |
| PAY-08 | customer.subscription.updated event syncs subscription changes | Update subscriptions row: status, current_period_end, cancel_at_period_end. |
| PAY-09 | customer.subscription.deleted event marks subscription cancelled | Update subscriptions row: status='canceled', canceled_at=NOW(). |
| PAY-10 | Cancelled subscriptions retain access until period end | cancel_at_period_end=true keeps subscription status='active' until period ends. Check subscription.cancel_at_period_end in UI to show "cancels on X date" message. |
| PAY-11 | Checkout success page syncs subscription immediately before rendering | Success page (server component) calls stripe.checkout.sessions.retrieve(session_id) to confirm payment, then queries subscriptions table. Display "Activating..." if webhook not yet fired. |
| PAY-12 | User can manage subscription via Stripe Customer Portal | Server Action: stripe.billingPortal.sessions.create({customer: stripe_customer_id, return_url: '/dashboard'}). Redirect to portal URL. |
| PAY-13 | Webhook handlers return 200 immediately, process async | Return NextResponse.json({received:true}) immediately after idempotency check. Use waitUntil() pattern or process synchronously within Vercel's 10s serverless limit (credit allocation is fast). |
| PAY-14 | Failed payment prevents credit allocation but doesn't revoke existing credits | Do not allocate credits on invoice.payment_failed. Update subscription status to 'past_due'. Do not touch existing credit_transactions. |
| INFRA-04 | Stripe account configured with production webhooks | Stripe Dashboard: Add webhook endpoint pointing to production URL /api/webhooks/stripe. Select events: customer.subscription.created/updated/deleted, invoice.paid, invoice.payment_failed. |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `stripe` | ^20.3.1 | Stripe Node.js SDK — server-side only | Official Stripe SDK, handles API calls, webhook verification, TypeScript types |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@stripe/stripe-js` | n/a | Stripe.js browser SDK | NOT needed — we use Server Actions + redirect, no client-side Stripe.js required |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server Action redirect to Stripe Checkout | Embedded Checkout (iframe) | Embedded keeps users on-domain but adds React state complexity. Redirect is simpler, well-proven, and fits our current architecture. |
| Custom idempotency with DB table | Rely on Stripe's at-least-once delivery | DB table is explicit and auditable. Stripe does retry but doesn't prevent double-processing on your end. |
| Next.js Route Handler for checkout | Server Action | Server Action is cleaner for form-driven flows. Either works. Route Handler is required for webhooks (Stripe needs a static URL). |

**Installation:**
```bash
npm install stripe
```

No client-side Stripe package needed. The checkout flow uses a server-side redirect.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── billing/
│   │   │   ├── page.tsx          # Billing management page (subscription status, portal link)
│   │   │   └── success/
│   │   │       └── page.tsx      # Post-checkout success page (syncs with Stripe)
│   │   └── dashboard/
│   │       └── page.tsx          # Updated: shows upgrade CTA when balance low
│   └── api/
│       └── webhooks/
│           └── stripe/
│               └── route.ts      # Stripe webhook handler
├── lib/
│   ├── stripe/
│   │   ├── client.ts             # Stripe singleton instance
│   │   └── actions.ts            # Server Actions: createCheckoutSession, createPortalSession
│   └── supabase/
│       └── server.ts             # (existing) — reuse for subscription queries
└── components/
    ├── CreditBalance.tsx          # Updated: tier-aware, upgrade CTA
    └── billing/
        └── UpgradeCTA.tsx        # Upgrade button component
supabase/
└── migrations/
    └── YYYYMMDD_stripe_integration.sql   # subscriptions + stripe_processed_events tables
```

### Pattern 1: Stripe Singleton Instance

Initialize once, reuse across Server Actions and API routes.

```typescript
// src/lib/stripe/client.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20',
  typescript: true,
})
```

### Pattern 2: Checkout Session — Server Action

```typescript
// src/lib/stripe/actions.ts
'use server'

import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createCheckoutSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if customer already exists to avoid duplicate Stripe customers
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    customer: existingSub?.stripe_customer_id ?? undefined,
    customer_email: existingSub?.stripe_customer_id ? undefined : user.email,
    metadata: { user_id: user.id },  // CRITICAL: used by webhook to link subscription to user
    subscription_data: {
      metadata: { user_id: user.id },  // Also on subscription itself for sub events
    },
  })

  redirect(session.url!)
}
```

### Pattern 3: Webhook Handler — Route Handler (NOT Server Action)

Webhooks MUST be Route Handlers. Server Actions cannot receive external POST requests.

```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@supabase/supabase-js'

// CRITICAL: Disable Next.js body parsing to get raw body for signature verification
export const config = { runtime: 'nodejs' }

export async function POST(request: NextRequest) {
  const body = await request.text()  // Raw body — same pattern as N8N webhook handler
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // CRITICAL: Return 200 immediately, then process
  // For Vercel: processing must complete within the same request (no background jobs)
  // Credit allocation is fast (<100ms), so synchronous processing is fine here

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Idempotency: check if event already processed
  const { data: existingEvent } = await supabaseAdmin
    .from('stripe_processed_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle()

  if (existingEvent) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  // Record event as processed (before processing to handle crashes)
  await supabaseAdmin
    .from('stripe_processed_events')
    .insert({ stripe_event_id: event.id, event_type: event.type })

  // Route to appropriate handler
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
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Handler error for ${event.type}:`, err)
    // Don't return 500 — Stripe would retry and we've already marked as processed
    // Log the error and alert; manual intervention may be needed
  }

  return NextResponse.json({ received: true })
}
```

### Pattern 4: Subscription Event Handlers

```typescript
async function handleSubscriptionUpsert(supabase: SupabaseClient, subscription: Stripe.Subscription) {
  // user_id stored in subscription.metadata by checkout session creation
  const userId = subscription.metadata.user_id
  if (!userId) {
    console.error('[Stripe] No user_id in subscription metadata:', subscription.id)
    return
  }

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    stripe_price_id: subscription.items.data[0].price.id,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
  }, { onConflict: 'stripe_subscription_id' })
}

async function handleSubscriptionDeleted(supabase: SupabaseClient, subscription: Stripe.Subscription) {
  await supabase
    .from('subscriptions')
    .update({ status: 'canceled', canceled_at: new Date().toISOString() })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleInvoicePaid(supabase: SupabaseClient, invoice: Stripe.Invoice) {
  // Only allocate credits for subscription invoices (not one-time)
  if (!invoice.subscription) return

  // Use invoice.id as billing_period_id for credit idempotency (CRED-09)
  // This is separate from stripe_processed_events (which dedupes at event level)
  // Double-safety: also check if credit already allocated for this invoice
  const { data: existingAllocation } = await supabase
    .from('credit_transactions')
    .select('id')
    .eq('type', 'monthly_allocation')
    .contains('metadata', { invoice_id: invoice.id })
    .maybeSingle()

  if (existingAllocation) return  // Already allocated

  // Find user from subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .maybeSingle()

  if (!sub?.user_id) {
    console.error('[Stripe] Cannot find user for subscription:', invoice.subscription)
    return
  }

  await supabase.from('credit_transactions').insert({
    user_id: sub.user_id,
    amount: 10,
    type: 'monthly_allocation',
    metadata: {
      invoice_id: invoice.id,
      billing_period_start: invoice.period_start,
      billing_period_end: invoice.period_end,
      stripe_subscription_id: invoice.subscription,
    },
  })
}

async function handleInvoicePaymentFailed(supabase: SupabaseClient, invoice: Stripe.Invoice) {
  if (!invoice.subscription) return
  // Mark subscription past_due — do NOT touch credits (PAY-14)
  await supabase
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', invoice.subscription as string)
}
```

### Pattern 5: Success Page — Sync Before Rendering

```typescript
// src/app/(dashboard)/billing/success/page.tsx
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const params = await searchParams
  if (!params.session_id) redirect('/dashboard')

  // Query Stripe directly for authoritative status (PAY-11)
  const session = await stripe.checkout.sessions.retrieve(params.session_id, {
    expand: ['subscription'],
  })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check local subscription record (may not exist yet if webhook is delayed)
  const { data: localSub } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user!.id)
    .maybeSingle()

  const isActive = session.payment_status === 'paid' || localSub?.status === 'active'

  return (
    <div>
      {isActive
        ? <p>Subscription active! You have been credited 10 credits.</p>
        : <p>Activating subscription... Please refresh in a moment.</p>
      }
    </div>
  )
}
```

### Pattern 6: Customer Portal — Server Action

```typescript
// src/lib/stripe/actions.ts
export async function createPortalSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!sub?.stripe_customer_id) {
    redirect('/dashboard')  // No subscription to manage
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  })

  redirect(portalSession.url)
}
```

### Anti-Patterns to Avoid

- **Processing webhook body as JSON first:** `request.json()` consumes the stream. Must use `request.text()` for signature verification, then `JSON.parse()` manually. (Pattern already proven in N8N handler.)
- **Trusting client-side price info:** Never accept price_id from client requests. Always use `process.env.STRIPE_PRICE_ID` server-side.
- **Creating duplicate Stripe customers:** Check `subscriptions.stripe_customer_id` before creating checkout session. Pass existing customer ID if present.
- **Allocating credits in checkout.session.completed:** Use `invoice.paid` instead. The checkout event fires once; `invoice.paid` fires every billing cycle (monthly renewals).
- **Returning 500 after marking event as processed:** If event is marked processed but handler errors, returning 500 causes Stripe to retry but your idempotency check will skip it. Log the error, return 200, alert for manual review.
- **Using `cancel_at_period_end` to revoke access:** When `cancel_at_period_end=true`, subscription status remains `active`. Only `customer.subscription.deleted` means access should change.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Stripe signature verification | Custom HMAC check | `stripe.webhooks.constructEvent()` | Stripe SDK handles timestamp tolerance, encoding, timing attacks |
| Subscription billing logic | Custom billing cycle tracker | Stripe subscriptions + webhook events | Prorations, dunning, trials, cancellations are all handled by Stripe |
| Payment form | Custom credit card form | Stripe Checkout (hosted) | PCI compliance, 3DS, Apple Pay, saved cards — impossible to replicate safely |
| Customer self-service (cancel, update card) | Custom billing UI | Stripe Customer Portal | Portal handles cancellations, payment method updates, invoice history |
| Webhook retry / delivery guarantee | Custom retry queue | Stripe's built-in retry (3 days) | Stripe retries on 5xx responses. Your idempotency table handles deduplication. |

**Key insight:** Stripe's hosted services (Checkout, Customer Portal) handle compliance and edge cases that would take weeks to build correctly. The integration points are the webhook handler and credit allocation logic — that's where custom code belongs.

---

## Common Pitfalls

### Pitfall 1: Race Condition — Checkout Redirect vs. Webhook Arrival
**What goes wrong:** User completes checkout, gets redirected to success page, but webhook hasn't fired yet. Success page shows "no subscription found."
**Why it happens:** Stripe webhook delivery is asynchronous. The redirect happens in <1 second; webhook may take 5-30 seconds.
**How to avoid:** Success page (PAY-11) queries Stripe API directly via `stripe.checkout.sessions.retrieve(session_id)`. If `payment_status === 'paid'`, show success state even before webhook updates DB. Use a "pending activation" state in UI if neither confirms.
**Warning signs:** User reports subscription didn't activate after payment.

### Pitfall 2: Double Credit Allocation
**What goes wrong:** Stripe retries a webhook event. `invoice.paid` handler runs twice. User gets 20 credits instead of 10.
**Why it happens:** Stripe retries for up to 3 days on non-2xx responses. Even with 200, network failures can cause duplicates.
**How to avoid:** Two layers: (1) `stripe_processed_events` table deduplicates at event.id level. (2) Before inserting credit_transaction, check if `metadata @> '{"invoice_id": "..."}'` already exists. Both layers protect against different failure modes.
**Warning signs:** Users with unexpected high credit balances.

### Pitfall 3: Missing user_id in Webhook Events
**What goes wrong:** Subscription event fires; no `user_id` in metadata; cannot find user to allocate credits.
**Why it happens:** `metadata` must be explicitly set on BOTH `checkout.session.create()` (in `metadata` field) AND in `subscription_data.metadata`. The subscription object's metadata is independent of the session's metadata.
**How to avoid:** Set `metadata: { user_id }` AND `subscription_data: { metadata: { user_id } }` in checkout session creation. Verify in Stripe Dashboard after first test checkout.
**Warning signs:** Console errors "No user_id in subscription metadata" in webhook logs.

### Pitfall 4: Not Handling cancel_at_period_end Correctly
**What goes wrong:** App revokes access when user cancels, even though they paid for the rest of the month.
**Why it happens:** Subscription status stays `active` when `cancel_at_period_end=true`. Status only becomes `canceled` at period end via `customer.subscription.deleted` event.
**How to avoid:** Access check: `status === 'active' || (status === 'active' && cancel_at_period_end === true)`. Show "Your subscription cancels on [date]" in UI. Never revoke credits on cancellation.
**Warning signs:** Support tickets from users who cancelled but lost access immediately.

### Pitfall 5: Stripe Customer Portal Not Configured
**What goes wrong:** `stripe.billingPortal.sessions.create()` throws "No Customer Portal configuration found."
**Why it happens:** Customer Portal must be explicitly enabled and configured in Stripe Dashboard before the API call works.
**How to avoid:** Configure portal in Stripe Dashboard under Settings → Billing → Customer Portal before deploying PAY-12.
**Warning signs:** Server error on portal redirect.

### Pitfall 6: Environment Variables Missing in Production
**What goes wrong:** Webhook signature verification fails in production; checkout redirects to wrong URLs.
**Why it happens:** `.env.local` is gitignored. Production Vercel project needs explicit env var configuration.
**How to avoid:** Required env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `NEXT_PUBLIC_APP_URL`. Document in deployment checklist.
**Warning signs:** 400 errors on all webhook requests in production logs.

---

## Code Examples

Verified patterns from official sources and current codebase conventions:

### Database Migration — New Tables

```sql
-- Subscriptions: tracks Stripe subscription state per user
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid', 'paused')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
-- No INSERT/UPDATE policy: all writes via service role key from webhook handler

-- Stripe processed events: idempotency table (PAY-05)
CREATE TABLE stripe_processed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- No RLS needed: service role only writes, not user-accessible
-- No user_id: this table is internal to webhook processing
```

### Updated credit_transactions type

The existing `type` check constraint needs `monthly_allocation` — confirm this was included in Phase 1 migration. The current migration already has `'monthly_allocation'` in the allowed types list. No migration change needed.

### Free Tier Enforcement Check

```typescript
// Utility function for checking subscription and tier
export async function getUserSubscriptionStatus(userId: string, supabase: SupabaseClient) {
  const [{ data: sub }, { data: transactions }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('status, current_period_end, cancel_at_period_end')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('credit_transactions')
      .select('amount')
      .eq('user_id', userId),
  ])

  const balance = (transactions ?? []).reduce((sum, tx) => sum + tx.amount, 0)
  const isActiveSub = sub?.status === 'active' || sub?.status === 'trialing'

  return {
    balance,
    isActiveSub,
    isFree: !isActiveSub,
    cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
    currentPeriodEnd: sub?.current_period_end ?? null,
  }
}
```

### Environment Variables Required

```bash
# Stripe (add to .env.local and Vercel project settings)
STRIPE_SECRET_KEY=sk_live_...          # Server-side only, never NEXT_PUBLIC_
STRIPE_WEBHOOK_SECRET=whsec_...        # From Stripe Dashboard webhook settings
STRIPE_PRICE_ID=price_...             # $29.99/month price ID from Stripe Dashboard
NEXT_PUBLIC_APP_URL=https://yourdomain.com  # For success/cancel URL construction
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| API route for checkout (`/api/create-checkout-session`) | Server Action (`createCheckoutSession`) | Next.js 13+ / 2024 | Cleaner, less boilerplate, no client fetch needed |
| `@stripe/stripe-js` loadStripe() on client | Server-side redirect to Stripe Checkout URL | 2023-2024 | Simpler, no client bundle, PCI fully offloaded |
| Polling success page | Query Stripe API directly on success page load | 2022+ | Reliable, no delay, handles webhook race condition |
| stripe v14/v16 | stripe v20.x (2026) | Feb 2026 | Updated API types, `apiVersion: '2024-11-20'` |
| `bodyParser: false` config export | `request.text()` in App Router | Next.js 13+ | App Router uses Web API Request object, no config needed |

**Deprecated/outdated:**
- Pages Router webhook config `export const config = { api: { bodyParser: false } }`: Not applicable in App Router. Just use `request.text()`.
- Client-side `stripe.redirectToCheckout()`: Deprecated. Use server-side session creation + redirect.

---

## Open Questions

1. **Stripe Customer Portal Configuration Requirement**
   - What we know: Portal must be configured in Stripe Dashboard before API calls work
   - What's unclear: Specific settings to enable (cancellation policy, invoice history, payment method updates)
   - Recommendation: Include "Configure Stripe Customer Portal" as an explicit task in planning. Planner should document required dashboard settings.

2. **Vercel Webhook Timeout**
   - What we know: Vercel serverless functions timeout at 10s (hobby) / 60s (pro)
   - What's unclear: Current Vercel plan limits
   - Recommendation: Credit allocation is database-only (<100ms), so synchronous processing within the webhook handler is safe. No background queue needed for this use case.

3. **Existing Free Credits at Subscription Start**
   - What we know: Free users get 3 signup credits. Paid users get 10/month.
   - What's unclear: Do the 3 free credits count toward the paid user's balance? (Yes, per the rollover design — ledger never resets.)
   - Recommendation: Document clearly in UI: "Your existing credits roll over. You'll receive 10 additional credits."

4. **Invoice.paid for First Payment**
   - What we know: `invoice.paid` fires on every successful invoice, including the first
   - What's unclear: Whether checkout.session.completed also needs to be handled
   - Recommendation: Use `invoice.paid` exclusively for credit allocation. It covers both initial and renewal payments. Do NOT use `checkout.session.completed` for credits — it doesn't fire for renewals.

---

## Sources

### Primary (HIGH confidence)
- [Stripe Webhooks Documentation](https://docs.stripe.com/webhooks) — event types, idempotency guidance, retry behavior, signature verification
- [Stripe Subscription Webhooks Guide](https://docs.stripe.com/billing/subscriptions/webhooks) — complete event list with exact type strings
- [Stripe Customer Portal Documentation](https://docs.stripe.com/billing/customer-portal) — portal session creation API
- [Stripe Checkout Quickstart](https://docs.stripe.com/checkout/quickstart) — session creation parameters, mode:'subscription'
- [Supabase Stripe Webhook Example](https://supabase.com/docs/guides/functions/examples/stripe-webhooks) — raw body pattern, constructEventAsync usage
- Project codebase (`/src/app/api/webhooks/n8n/callback/route.ts`) — existing raw body + service role pattern to replicate

### Secondary (MEDIUM confidence)
- [Stripe + Next.js 15 Complete Guide 2025](https://www.pedroalonso.net/blog/stripe-nextjs-complete-guide-2025/) — Server Action checkout pattern, verified against Stripe official docs
- [Next.js Subscription Payments Template (Vercel)](https://github.com/vercel/nextjs-subscription-payments) — Supabase schema patterns, webhook architecture
- [Stripe + Next.js 2026 Edition (DEV Community)](https://dev.to/sameer_saleem/the-ultimate-guide-to-stripe-nextjs-2026-edition-2f33) — modern patterns
- [Stripe Subscriptions + Supabase Guide](https://dev.to/flnzba/33-stripe-integration-guide-for-nextjs-15-with-supabase-13b5) — Supabase schema for subscriptions table

### Tertiary (LOW confidence)
- Stripe npm package version v20.3.1 sourced from web search — verify with `npm info stripe version` before installing

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — stripe npm package is the official SDK, no alternatives needed
- Architecture: HIGH — patterns verified against Stripe docs and existing N8N webhook handler in codebase
- Pitfalls: HIGH — race condition, idempotency, and cancel_at_period_end issues are well-documented
- Database schema: HIGH — consistent with existing ledger design from Phase 1

**Research date:** 2026-02-24
**Valid until:** 2026-04-24 (Stripe API changes infrequently; webhook patterns are stable)
