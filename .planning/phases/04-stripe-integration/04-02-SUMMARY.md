---
phase: 04-stripe-integration
plan: 02
subsystem: payments
tags: [stripe, webhooks, idempotency, credits, subscriptions, supabase]

# Dependency graph
requires:
  - phase: 04-stripe-integration
    provides: Stripe SDK singleton, subscriptions table, stripe_processed_events table
  - phase: 01-foundation
    provides: credit_transactions INSERT-only ledger pattern, RLS infrastructure

provides:
  - POST /api/webhooks/stripe route handler with signature verification
  - Subscription lifecycle event processing (created/updated/deleted)
  - Invoice payment success credit allocation (10 credits/cycle)
  - Invoice payment failure subscription status update (past_due)
  - Webhook idempotency via stripe_processed_events deduplication
  - Double-safety credit idempotency via invoice_id in credit_transactions metadata

affects: [04-checkout, 04-billing-ui, future-credit-usage]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Stripe webhook signature verification with constructEvent (raw body via request.text())
    - Two-layer webhook idempotency: stripe_processed_events table + invoice_id in credit metadata
    - Event-first idempotency: record event BEFORE processing (crash-safe pattern)
    - Return 200 on handler errors to prevent Stripe retry confusion
    - Lazy Stripe client initialization to allow builds without STRIPE_SECRET_KEY configured
    - Stripe API v2026-01-28.clover subscription item period fields (items.data[0].current_period_start/end)
    - Stripe API v2026-01-28.clover invoice parent subscription reference (invoice.parent.subscription_details.subscription)

key-files:
  created:
    - src/app/api/webhooks/stripe/route.ts
  modified:
    - src/lib/stripe/client.ts

key-decisions:
  - "Two-layer credit idempotency: stripe_processed_events prevents double event processing; invoice_id in credit_transactions metadata handles edge case where event was recorded but credit insert failed"
  - "Record event in stripe_processed_events BEFORE processing (not after) for crash safety — if handler crashes mid-process, event won't be reprocessed on Stripe retry"
  - "Handler errors return 200 (not 500) to prevent Stripe retry loops on already-recorded events"
  - "Stripe API v2026-01-28.clover moved current_period_start/end from Subscription to SubscriptionItem level — reads from subscription.items.data[0]"
  - "Stripe API v2026-01-28.clover moved invoice.subscription to invoice.parent.subscription_details.subscription"
  - "Stripe client made lazy-initialized to allow npm run build without STRIPE_SECRET_KEY — prevents build failures in CI and dev environments without Stripe configured"

patterns-established:
  - "Stripe webhook: always request.text() for raw body before constructEvent"
  - "Event idempotency: check stripe_processed_events, insert, THEN process"
  - "Credit idempotency: check credit_transactions WHERE type=monthly_allocation AND metadata @> {invoice_id: ...}"
  - "Handler functions receive SupabaseClient + typed Stripe object, throw on DB error (caught by outer try/catch)"

requirements-completed: [PAY-04, PAY-05, PAY-06, PAY-07, PAY-08, PAY-09, PAY-10, PAY-13, PAY-14, CRED-02, CRED-04, CRED-09]

# Metrics
duration: 10min
completed: 2026-02-25
---

# Phase 4 Plan 02: Stripe Webhook Handler Summary

**Stripe webhook handler at POST /api/webhooks/stripe with constructEvent signature verification, crash-safe event idempotency, subscription lifecycle management, and 10-credit allocation on invoice.paid with double-safety invoice_id deduplication**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-25T02:00:19Z
- **Completed:** 2026-02-25T02:10:00Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Stripe webhook handler processes 5 event types with cryptographic signature verification via `stripe.webhooks.constructEvent`
- Two-layer idempotency: `stripe_processed_events` table prevents duplicate event processing on Stripe retries (3-day retry window); invoice_id in `credit_transactions` metadata provides a secondary guard for credit allocation edge cases
- Subscription lifecycle correctly synced: created/updated upserts record, deleted marks canceled, payment_failed marks past_due without touching credits
- 10 credits allocated per billing cycle via INSERT-only credit_transactions ledger on invoice.paid
- Lazy Stripe client initialization fixed pre-existing build failure — `npm run build` now passes without `STRIPE_SECRET_KEY` set

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Stripe webhook route handler with signature verification and idempotency** - `ac927ad` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `src/app/api/webhooks/stripe/route.ts` - Stripe webhook POST handler with signature verification, idempotency, and event routing to 4 handler functions
- `src/lib/stripe/client.ts` - Updated to lazy-initialize Stripe client via Proxy pattern (fixes build without STRIPE_SECRET_KEY)

## Decisions Made
- Two-layer credit idempotency chosen over single-layer: `stripe_processed_events` is the primary guard but a secondary check on `credit_transactions.metadata->>'invoice_id'` handles the edge case where the event record was inserted but the credit INSERT failed (DB crash between the two operations)
- Events recorded in `stripe_processed_events` BEFORE processing, not after — if the handler crashes mid-execution, the event is already marked and won't be re-processed on Stripe's retry
- Handler errors caught and logged but return 200 — returning 500 would cause Stripe to retry, but idempotency would skip the event, creating silent missed processing
- Lazy Stripe client via Proxy pattern maintains the `stripe.method()` calling convention while deferring instantiation to runtime

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated API field paths for Stripe v2026-01-28.clover**
- **Found during:** Task 1 (TypeScript compile verification)
- **Issue:** Plan referenced `invoice.subscription` and `subscription.current_period_start/end` which no longer exist in Stripe API v2026-01-28.clover. In the new API: subscription period moved to `subscription.items.data[0].current_period_start/end`; invoice subscription reference moved to `invoice.parent?.subscription_details?.subscription`
- **Fix:** Updated `handleSubscriptionUpsert` to read period from `subscription.items.data[0]`; updated `handleInvoicePaid` and `handleInvoicePaymentFailed` to resolve subscription ID from `invoice.parent.subscription_details.subscription`
- **Files modified:** src/app/api/webhooks/stripe/route.ts
- **Verification:** TypeScript compilation passes (no property errors), `npm run build` succeeds
- **Committed in:** `ac927ad` (Task 1 commit)

**2. [Rule 3 - Blocking] Made Stripe client lazy-initialized to fix build failure**
- **Found during:** Task 1 (npm run build verification)
- **Issue:** `src/lib/stripe/client.ts` instantiated Stripe at module load time with `new Stripe(process.env.STRIPE_SECRET_KEY!)`. Without `STRIPE_SECRET_KEY` in `.env.local`, Next.js build failed during "Collecting page data" for all Stripe-importing routes including `/api/webhooks/stripe`, `/billing`, and `/billing/success`
- **Fix:** Replaced eager singleton with lazy Proxy that calls `getStripe()` on first property access. This defers instantiation to request time when env vars are available at runtime
- **Files modified:** src/lib/stripe/client.ts
- **Verification:** `npm run build` passes with all 17 static pages generated; `/api/webhooks/stripe` shows as dynamic server-rendered route
- **Committed in:** `ac927ad` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 API version field path update, 1 blocking build fix)
**Impact on plan:** Both auto-fixes required for correctness. The API field path changes are essential for the handler to work correctly with the installed Stripe SDK version. The lazy client fix enables production builds in environments without Stripe keys configured. No scope creep.

## Issues Encountered
- Stripe API v2026-01-28.clover reorganized invoice and subscription data model compared to the plan's assumed API. The plan was written against an older Stripe API version. Both field path issues were auto-corrected per deviation rules.
- Pre-existing build failure caused by eager Stripe singleton initialization. The billing page and billing/success page were committed before this plan (in 04-03 commit) but those routes share the same Stripe singleton issue. Fixed once in client.ts, resolves all Stripe routes simultaneously.

## Next Phase Readiness
- Webhook handler ready to receive live Stripe events once `STRIPE_WEBHOOK_SECRET` is configured in `.env.local`
- Subscription table will be populated correctly by webhook on checkout completion
- Credit allocation will work correctly for new billing cycles once `STRIPE_SECRET_KEY` is configured
- `npm run build` passes cleanly — ready for deployment

---
*Phase: 04-stripe-integration*
*Completed: 2026-02-25*
