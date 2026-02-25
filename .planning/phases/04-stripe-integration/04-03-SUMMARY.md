---
phase: 04-stripe-integration
plan: 03
subsystem: payments
tags: [stripe, next.js, server-actions, checkout, customer-portal, billing]

# Dependency graph
requires:
  - phase: 04-stripe-integration/04-01
    provides: Stripe singleton client at src/lib/stripe/client.ts, subscriptions table with RLS
  - phase: 01-foundation
    provides: Supabase createClient server helper, auth.getUser() pattern

provides:
  - createCheckoutSession Server Action (starts Stripe Checkout subscription flow)
  - createPortalSession Server Action (redirects to Stripe Customer Portal)
  - Billing management page at /billing with status-aware UI
  - Post-checkout success page at /billing/success with direct Stripe API sync
  - Webhook handler TypeScript fixes for Stripe API v2026-01-28.clover

affects: [04-webhook-handler, 04-billing-ui, 04-credit-enforcement]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Actions with redirect() for Stripe checkout (no client-side redirects)
    - Existing Stripe customer reuse via stripe_customer_id lookup before checkout
    - Direct Stripe API query in success page (stripe.checkout.sessions.retrieve) to handle webhook race condition
    - Next.js 15 searchParams as Promise (must await before use)
    - Conditional subscription UI states (free / active / canceling / canceled / past_due)

key-files:
  created:
    - src/lib/stripe/actions.ts
    - src/app/(dashboard)/billing/page.tsx
    - src/app/(dashboard)/billing/success/page.tsx
  modified:
    - src/app/api/webhooks/stripe/route.ts (fixed TS errors for Stripe API v2026-01-28.clover)

key-decisions:
  - "Success page queries Stripe directly (checkout.sessions.retrieve) rather than relying solely on DB to handle webhook race condition (PAY-11)"
  - "Existing Stripe customers reused via stripe_customer_id lookup before creating new checkout session — prevents duplicate customer records"
  - "Placeholder Stripe env vars added to .env.local to allow npm run build without real credentials (gitignored, user must replace with real values)"
  - "Stripe API v2026-01-28.clover: current_period_start/end moved from Subscription to SubscriptionItem; invoice.subscription moved to invoice.parent.subscription_details.subscription"

patterns-established:
  - "Stripe Server Actions: 'use server' + createClient() + auth.getUser() + stripe.*.create() + redirect()"
  - "Success page race condition pattern: query Stripe directly AND check local DB; show success if either confirms active"
  - "Billing UI conditional states: check status + cancel_at_period_end combination for correct messaging"

requirements-completed: [PAY-02, PAY-03, PAY-11, PAY-12]

# Metrics
duration: 5min
completed: 2026-02-25
---

# Phase 4 Plan 03: Stripe Checkout, Billing Page, and Customer Portal Summary

**Stripe Checkout Server Actions, status-aware billing management page, and race-condition-safe success page using direct Stripe API verification**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-25T02:00:34Z
- **Completed:** 2026-02-25T02:05:47Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Two Server Actions exported: `createCheckoutSession` (starts $29.99/month subscription with user_id in metadata) and `createPortalSession` (redirects to Stripe Customer Portal for subscription management)
- Billing page at `/billing` shows five distinct UI states (free, active, canceling, canceled, past_due) with appropriate action buttons using form+Server Action pattern
- Success page at `/billing/success` queries Stripe API directly via `stripe.checkout.sessions.retrieve` to confirm payment status independent of webhook delivery timing, solving PAY-11 race condition

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Server Actions for Stripe Checkout and Customer Portal** - `8205905` (feat)
2. **Task 2: Create billing page and post-checkout success page** - `0c7309c` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `src/lib/stripe/actions.ts` - Server Actions: createCheckoutSession (Stripe Checkout) and createPortalSession (Customer Portal), both with auth guard and redirect
- `src/app/(dashboard)/billing/page.tsx` - Subscription management page with conditional UI for all subscription states
- `src/app/(dashboard)/billing/success/page.tsx` - Post-checkout page querying Stripe directly to confirm activation, with pending state and refresh option
- `src/app/api/webhooks/stripe/route.ts` - Fixed TypeScript errors for Stripe API v2026-01-28.clover data model changes

## Decisions Made
- Success page queries Stripe directly (`stripe.checkout.sessions.retrieve`) rather than relying solely on the local DB — this is the correct pattern for handling the race condition where the user lands on the success page before Stripe's webhook has been processed and written to the DB (PAY-11)
- Existing Stripe customers are reused: before creating a checkout session, we query the `subscriptions` table for an existing `stripe_customer_id`. If found, we pass `customer: existingSub.stripe_customer_id` instead of `customer_email` — this prevents creating duplicate Stripe customer records for returning subscribers
- Placeholder Stripe env vars (`sk_test_placeholder`, etc.) added to `.env.local` (gitignored) to allow `npm run build` to succeed during development without real credentials

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TypeScript errors in webhook handler for Stripe API v2026-01-28.clover**
- **Found during:** Task 2 verification (`npm run build`)
- **Issue:** `src/app/api/webhooks/stripe/route.ts` had 9 TypeScript errors due to Stripe API v2026-01-28.clover data model changes: `current_period_start`/`current_period_end` moved from `Subscription` to `SubscriptionItem`, and `invoice.subscription` moved to `invoice.parent?.subscription_details?.subscription`
- **Fix:** Updated `handleSubscriptionUpsert` to read period timestamps from `subscription.items.data[0].current_period_start/end`; updated `handleInvoicePaid` and `handleInvoicePaymentFailed` to use `invoice.parent?.subscription_details?.subscription` for subscription ID lookup
- **Files modified:** `src/app/api/webhooks/stripe/route.ts`
- **Verification:** `npx tsc --noEmit` passes with no errors; `npm run build` succeeds
- **Committed in:** `0c7309c` (part of Task 2 commit)

**2. [Rule 3 - Blocking] Added placeholder Stripe env vars to .env.local to unblock build**
- **Found during:** Task 2 verification (`npm run build`)
- **Issue:** Stripe client initialization (lazy via Proxy) still caused Next.js build to fail during "collect page data" when `STRIPE_SECRET_KEY` was not set — the Stripe SDK throws "Neither apiKey nor config.authenticator provided" at any property access
- **Fix:** Added placeholder values (`sk_test_placeholder`, `whsec_placeholder`, `price_placeholder`, `http://localhost:3000`) to `.env.local` with comment instructing user to replace with real values. File is gitignored — no secrets risk
- **Files modified:** `.env.local` (gitignored, not committed)
- **Verification:** `npm run build` succeeds — all routes including `/billing`, `/billing/success`, `/api/webhooks/stripe` compile and generate correctly
- **Note:** User must still replace placeholder values with real Stripe credentials before live testing

---

**Total deviations:** 2 auto-fixed (2 blocking — pre-existing TS errors + env var build block)
**Impact on plan:** Both fixes required for plan verification to pass. The webhook TS errors were pre-existing from Phase 4-02 but were discovered during this plan's build verification. No scope creep.

## Issues Encountered
- Stripe API v2026-01-28.clover removed top-level `current_period_start`/`current_period_end` from `Subscription` (moved to `SubscriptionItem`) and removed `invoice.subscription` shortcut (moved to nested `parent.subscription_details.subscription`). These breaking changes affected the webhook handler created in Plan 04-02.

## User Setup Required
Before live testing, replace placeholder values in `.env.local`:
- `STRIPE_SECRET_KEY` — from Stripe Dashboard -> Developers -> API keys
- `STRIPE_WEBHOOK_SECRET` — from webhook endpoint configuration (`{APP_URL}/api/webhooks/stripe`)
- `STRIPE_PRICE_ID` — the `price_...` ID for the $29.99/month product
- `NEXT_PUBLIC_APP_URL` — your domain (e.g., `https://yourapp.com`) or `http://localhost:3000` for dev

Customer Portal must also be activated in Stripe Dashboard: Settings -> Billing -> Customer portal -> Activate link.

## Next Phase Readiness
- `/billing` and `/billing/success` routes are live and accessible under the authenticated dashboard layout
- Server Actions handle both checkout initiation and portal redirect
- Webhook handler TypeScript is now clean (prerequisite for webhook testing in Phase 4 verification)
- All 4 requirements (PAY-02, PAY-03, PAY-11, PAY-12) completed
- Ready for Phase 4-04: credit enforcement based on subscription status

---
*Phase: 04-stripe-integration*
*Completed: 2026-02-25*
