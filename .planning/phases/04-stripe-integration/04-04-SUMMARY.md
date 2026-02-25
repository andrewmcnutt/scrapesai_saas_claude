---
phase: 04-stripe-integration
plan: 04
subsystem: payments
tags: [stripe, subscriptions, credits, free-tier, upgrade-cta, next.js, server-actions]

# Dependency graph
requires:
  - phase: 04-stripe-integration/04-01
    provides: subscriptions table, credit_transactions INSERT-only ledger, RLS infrastructure
  - phase: 04-stripe-integration/04-02
    provides: webhook handler that populates subscriptions table on checkout
  - phase: 04-stripe-integration/04-03
    provides: createCheckoutSession Server Action for upgrade flow

provides:
  - getUserSubscriptionStatus() utility returning tier/balance/cancelAtPeriodEnd
  - Tier-aware CreditBalance component (Free Plan vs Pro Plan vs Past Due UI)
  - Upgrade CTA in CreditBalance and Dashboard for free tier users
  - Generation action needsUpgrade flag with tier-aware error messaging
  - Billing nav link in sidebar navigation
  - Dashboard upgrade card and cancellation warning for subscription states

affects: [04-05-verification, future-feature-development]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Tier-aware UI pattern: query subscription status + credit balance in parallel, render different UI branches
    - Server Action in client component form: <form action={createCheckoutSession}> works without client-side JS
    - Free tier credit display: "X of 3" with progress bar showing usage
    - needsUpgrade flag in server action return for UI to conditionally show upgrade CTA

key-files:
  created:
    - src/lib/stripe/subscription-status.ts
  modified:
    - src/components/CreditBalance.tsx
    - src/app/(dashboard)/generate/actions.ts
    - src/app/(dashboard)/dashboard/page.tsx
    - src/app/(dashboard)/layout.tsx

key-decisions:
  - "CreditBalance uses client-side Supabase queries (not the server utility) since it is a 'use client' component — getUserSubscriptionStatus is designed for server components where supabase client is passed in"
  - "Dashboard upgrade card only shown when !isActiveSub — past_due users still have an active-ish subscription so they see the existing CreditBalance past_due UI instead of the upgrade card"
  - "needsUpgrade: true returned for free tier (no subscription); needsUpgrade: false for paid but out of credits — allows generation wizard to show appropriate CTA"
  - "Quick actions card only shown for paid users to maintain 3-column grid balance; free users see upgrade card in that slot"

patterns-established:
  - "Tier detection: isActiveSub = status === 'active' || status === 'trialing'; isFree = !isActiveSub"
  - "Upgrade form: <form action={createCheckoutSession}><button type='submit'>...</button></form> — no client-side redirect needed"
  - "Credit display for free users: '{balance} of 3' with visual progress bar"

requirements-completed: [CRED-01, CRED-03, CRED-05, CRED-10, PAY-01]

# Metrics
duration: 3min
completed: 2026-02-25
---

# Phase 4 Plan 04: Credit Enforcement and Upgrade UI Summary

**Tier-aware credit enforcement connecting Stripe subscription state to UI: free users see 3-credit limit with upgrade CTAs, paid users see balance without nagging, and generation action returns actionable needsUpgrade errors**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-25T02:09:16Z
- **Completed:** 2026-02-25T02:11:44Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- `getUserSubscriptionStatus()` utility queries subscription + credit_transactions in parallel, returning unified status object with tier, balance, cancelAtPeriodEnd, and currentPeriodEnd
- CreditBalance component renders three distinct states: Free Plan (X of 3 credits with progress bar and upgrade form), Pro Plan (indigo balance with optional cancellation/low-credits warnings), Past Due (yellow warning with payment link)
- Generation action now returns `needsUpgrade: true` for free-tier credit exhaustion vs `needsUpgrade: false` for paid-but-empty, giving the wizard UI enough context to show the right CTA
- Dashboard shows upgrade card (gradient, $29.99/mo, Server Action form) for free users and cancellation warning for subscribers with `cancel_at_period_end: true`
- Billing navigation link added to sidebar with credit card SVG icon

## Task Commits

Each task was committed atomically:

1. **Task 1: Create subscription status utility and tier-aware CreditBalance** - `eaf6ffd` (feat)
2. **Task 2: Update generation action, dashboard, and sidebar navigation** - `0080b35` (feat)

## Files Created/Modified
- `src/lib/stripe/subscription-status.ts` - Exported `getUserSubscriptionStatus(userId, supabase)` — parallel queries for subscription + credit transactions, returns `UserSubscriptionStatus`
- `src/components/CreditBalance.tsx` - Tier-aware component with Free/Pro/PastDue UI branches; upgrade form uses Server Action
- `src/app/(dashboard)/generate/actions.ts` - Enhanced credit failure path: queries subscription status, returns `needsUpgrade` flag with appropriate message
- `src/app/(dashboard)/dashboard/page.tsx` - Upgrade card for free users, cancellation warning for canceling subscribers, Server Action import
- `src/app/(dashboard)/layout.tsx` - Billing nav link with credit card icon after Brand Settings

## Decisions Made
- `CreditBalance` uses its own direct Supabase queries rather than calling `getUserSubscriptionStatus` — the utility is designed for server contexts where a supabase client is passed in; the client component creates its own client with `createClient()` from `@/lib/supabase/client`
- Dashboard upgrade card replaces the "Quick Actions" card slot for free users, maintaining the 3-column grid. Paid users get the Quick Actions card back in that slot.
- `needsUpgrade` flag added to generation action return type covers the UI gap: the wizard now has enough info to show "Upgrade to Pro" vs "Wait for billing cycle" messaging

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. All changes are UI/logic layer only.

## Next Phase Readiness
- Free tier enforcement complete: balance reaches 0, upgrade prompts shown everywhere (CreditBalance, dashboard, generation flow)
- All 5 requirements (CRED-01, CRED-03, CRED-05, CRED-10, PAY-01) fulfilled
- Ready for Phase 4-05: end-to-end verification and final Stripe integration testing

---
*Phase: 04-stripe-integration*
*Completed: 2026-02-25*

## Self-Check: PASSED

All files verified present. Both task commits (eaf6ffd, 0080b35) confirmed in git log.
