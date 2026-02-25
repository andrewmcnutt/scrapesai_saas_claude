---
phase: 04-stripe-integration
plan: 01
subsystem: payments
tags: [stripe, postgres, rls, sql-migration, typescript]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: credit_transactions table and INSERT-only ledger pattern
  - phase: 03-carousel-generation
    provides: auth.users RLS pattern and SECURITY DEFINER trigger pattern

provides:
  - stripe npm package (v20.3.1) installed and importable
  - Stripe client singleton at src/lib/stripe/client.ts
  - TypeScript subscription types at src/lib/stripe/types.ts
  - subscriptions table with RLS (SELECT-only for authenticated users)
  - stripe_processed_events table (webhook idempotency, service role only)
  - seed_free_credits trigger (3 credits on user signup, CRED-01)

affects: [04-webhook-handler, 04-checkout, 04-billing-ui]

# Tech tracking
tech-stack:
  added: [stripe@20.3.1]
  patterns:
    - Stripe singleton client (server-side only, no 'use client')
    - RLS SELECT-only pattern for subscription data (writes exclusively via service role from webhook)
    - SECURITY DEFINER trigger for cross-schema inserts (auth.users -> credit_transactions)
    - Webhook idempotency via stripe_processed_events deduplication table

key-files:
  created:
    - src/lib/stripe/client.ts
    - src/lib/stripe/types.ts
    - supabase/migrations/20260225_stripe_integration.sql
  modified:
    - .env.example
    - package.json
    - package-lock.json

key-decisions:
  - "Stripe SDK v20.3.1 uses API version 2026-01-28.clover (not 2024-11-20 as planned — updated to match installed version)"
  - "No INSERT/UPDATE/DELETE RLS policies on subscriptions — all writes via service role key from webhook handler to prevent clients from spoofing subscription state"
  - "stripe_processed_events has RLS enabled but no policies — service role only, users have no reason to read/write this table"
  - "seed_free_credits() uses SECURITY DEFINER to allow cross-schema insert from auth.users trigger into RLS-protected credit_transactions table"
  - "update_updated_at_column() function reused from brand_profiles migration (not redefined)"

patterns-established:
  - "Stripe singleton: import { stripe } from '@/lib/stripe/client' for all server-side Stripe API calls"
  - "Subscription type safety: SubscriptionStatus union type matches CHECK constraint in subscriptions table"
  - "UserSubscriptionStatus: computed view of user state for UI (tier, balance, isActiveSub, cancelAtPeriodEnd)"

requirements-completed: [INFRA-04, CRED-01, CRED-09]

# Metrics
duration: 8min
completed: 2026-02-25
---

# Phase 4 Plan 01: Stripe SDK Installation and Database Schema Summary

**Stripe SDK (v20.3.1) installed with singleton client, TypeScript subscription types, subscriptions + stripe_processed_events SQL tables with RLS, and signup credit seeding trigger (CRED-01)**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-25T01:55:28Z
- **Completed:** 2026-02-25T02:03:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- stripe@20.3.1 npm package installed, TypeScript compiles clean, production build passes
- Stripe client singleton and complete subscription TypeScript types created (server-side only)
- SQL migration with subscriptions table (RLS), stripe_processed_events table, indexes, updated_at trigger, and CRED-01 free credit seeding trigger for new user signups

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Stripe SDK and create client singleton + types** - `11896c3` (feat)
2. **Task 2: Create database migration for subscriptions and stripe_processed_events tables** - `d682db5` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `src/lib/stripe/client.ts` - Stripe singleton instance (API v2026-01-28.clover, server-side only)
- `src/lib/stripe/types.ts` - SubscriptionStatus, UserSubscription, UserTier, UserSubscriptionStatus type definitions
- `supabase/migrations/20260225_stripe_integration.sql` - subscriptions + stripe_processed_events tables, RLS, indexes, updated_at trigger, seed_free_credits trigger (CRED-01)
- `.env.example` - Added STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID, NEXT_PUBLIC_APP_URL
- `package.json` / `package-lock.json` - Added stripe@20.3.1

## Decisions Made
- Stripe SDK v20.3.1 ships with API version `2026-01-28.clover` (plan specified `2024-11-20` which no longer exists in v20.x). Updated client to use the current API version — this is purely a version string alignment, no behavioral impact.
- `update_updated_at_column()` function already existed from the brand_profiles migration (20260222_brand_profiles.sql). Did not redefine it — only created the trigger for subscriptions.
- `seed_free_credits()` uses `SECURITY DEFINER` so the trigger can insert into `credit_transactions` (which has RLS) while firing from `auth.users`. Without this, the insert would fail because no session context exists during the trigger.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated Stripe API version string from 2024-11-20 to 2026-01-28.clover**
- **Found during:** Task 1 (TypeScript compile verification)
- **Issue:** `npx tsc --noEmit` failed with `Type '"2024-11-20"' is not assignable to type '"2026-01-28.clover"'` — Stripe SDK v20.3.1 only accepts the current API version
- **Fix:** Updated `apiVersion` in client.ts from `'2024-11-20'` to `'2026-01-28.clover'`
- **Files modified:** src/lib/stripe/client.ts
- **Verification:** `npx tsc --noEmit` passes, `npm run build` succeeds
- **Committed in:** `11896c3` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — API version string mismatch)
**Impact on plan:** Required fix — Stripe SDK v20.x only accepts the latest API version string. No scope creep.

## Issues Encountered
- Stripe SDK v20.x ships with newer API version than plan specified. Auto-fixed by updating the version string to match what the installed SDK requires.

## User Setup Required

The following Stripe setup is required before Phase 4 webhook and checkout plans can run:

1. **Stripe Dashboard setup:**
   - Create product with $29.99/month recurring price
   - Copy the `price_...` ID → add as `STRIPE_PRICE_ID` in `.env.local`
   - Add webhook endpoint: `{NEXT_PUBLIC_APP_URL}/api/webhooks/stripe`
   - Select events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
   - Copy webhook signing secret → add as `STRIPE_WEBHOOK_SECRET` in `.env.local`
   - Enable Customer Portal: Settings -> Billing -> Customer portal -> Activate link

2. **Environment variables to add to `.env.local`:**
   - `STRIPE_SECRET_KEY` - from Stripe Dashboard -> Developers -> API keys
   - `STRIPE_WEBHOOK_SECRET` - from webhook endpoint configuration
   - `STRIPE_PRICE_ID` - from the $29.99/month product price
   - `NEXT_PUBLIC_APP_URL` - your domain (or `http://localhost:3000` for dev)

3. **Apply database migration manually via Supabase SQL Editor:**
   - Apply `supabase/migrations/20260225_stripe_integration.sql`
   - Run the backfill query (included as a comment in the migration) for any existing users who haven't received signup credits

## Next Phase Readiness
- Stripe SDK client is importable via `import { stripe } from '@/lib/stripe/client'` in any server-side file
- TypeScript types ready for webhook handler and checkout route
- Database schema ready for manual migration application
- Webhook idempotency table (stripe_processed_events) in place for Phase 4-02 webhook handler
- Free credit seeding will activate for all new users once migration is applied

---
*Phase: 04-stripe-integration*
*Completed: 2026-02-25*
