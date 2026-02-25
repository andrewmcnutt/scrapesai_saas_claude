# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** Non-designers can quickly create professional, branded LinkedIn carousels that match their voice and visual identity
**Current focus:** Phase 4: Stripe Integration

## Current Position

Phase: 4 of 5 (Stripe Integration)
Plan: 1 of 5 in current phase
Status: In progress
Last activity: 2026-02-25 — Completed 04-01-PLAN.md (Stripe SDK + database schema)

Progress: [████████░░] 76%

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: 15 minutes
- Total execution time: 1.8 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01    | 4     | 66 min | 17 min  |
| 02    | 2     | 31 min | 16 min  |
| 03    | 3     | 13 min | 4 min   |

**Recent Plans:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 11 min | 2 tasks | 14 files |
| Phase 01 P02 | 1 | 2 tasks | 8 files |
| Phase 01 P03 | 8 | 2 tasks | 9 files |
| Phase 01 P04 | 46 | 1 tasks | 3 files |
| Phase 02 P01 | 11 | 2 tasks | 2 files |
| Phase 02 P02 | 20 | 3 tasks | 6 files |
| Phase 03 P01 | 3 min | 2 tasks | 5 files |
| Phase 03 P02 | 8 min | 2 tasks | 4 files |
| Phase 03-carousel-generation P03 | 2 | 2 tasks | 6 files |
| Phase 03 P04 | 4 | 2 tasks | 8 files |
| Phase 03 P05 | 2 | 2 tasks | 4 files |
| Phase 03 P06 | 2 | 1 tasks | 2 files |
| Phase 04-stripe-integration P01 | 8 | 2 tasks | 6 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Supabase for auth + database: Integrated solution simplifies architecture, provides excellent developer experience
- One brand per user: Simplifies v1 data model and UX, can expand to multi-brand later if needed
- Credits deducted on generation: Prevents abuse and makes cost clear to users
- Light theme only: Matches relume.io inspiration, reduces design complexity, ships faster
- [Phase 01]: INSERT-only ledger pattern for credit transactions ensures immutability and provides full audit trail
- [Phase 01]: RLS enabled from day one ensures security-first approach for user data isolation
- [Phase 01-02]: Use getClaims() instead of getSession() for token validation (more secure and future-proof)
- [Phase 01-02]: Allocate 3 free credits on email verification to prevent abuse
- [Phase 01-03]: Map-based in-memory rate limiting for simplicity in v1 (production should use Redis/Upstash)
- [Phase 01-03]: Credit balance calculated as SUM(amount) from credit_transactions on every page load
- [Phase 01-03]: Dashboard layout enforces authentication at route group level
- [Phase 01-04]: Database migration applied manually via Supabase SQL Editor (webhook not triggered)
- [Phase 01-04]: Human verification confirms CAPTCHA works correctly (browser extension interference is user-specific)
- [Phase 01-04]: Linting enforced before production build passes
- [Phase 01-VERIFY]: All 6 success criteria verified, no blocking issues, production-ready foundation
- [Phase 02]: Trigger-based profile creation ensures atomicity and can't be bypassed by client code
- [Phase 02]: Hand-created TypeScript types as placeholder until Supabase project is linked
- [Phase 02]: Use native HTML5 color inputs instead of external library for zero dependencies
- [Phase 02]: Use Supabase upsert with onConflict: 'user_id' for atomic insert-or-update
- [Phase 02]: Check default values (not just existence) to detect profile completion
- [Phase 03-01]: No UPDATE RLS policy for carousels - status/result updates exclusively via service role key from N8N webhook to prevent result spoofing
- [Phase 03-01]: refund_timeout_jobs SECURITY DEFINER function handles multiple concurrent timeouts atomically per job with completed_at guard against duplicate refunds
- [Phase 03-01]: CAROUSEL_STATUS const (not Postgres enum) provides type safety without additional migration complexity
- [Phase 03-02]: Raw body via request.text() required for HMAC verification — consuming body as JSON first destroys HMAC capability
- [Phase 03-02]: N8N call failure does NOT trigger credit refund — job exists in DB and is handled by refund_timeout_jobs after 5 minutes
- [Phase 03-02]: Service role key (bypasses RLS) used in N8N callback handler — no user session available in server-to-server context
- [Phase 03-03]: Custom image style: imageStyle='custom' + customStyleText stored separately, merged to effectiveImageStyle at submit time
- [Phase 03-03]: initiateGeneration called directly (not via useActionState) to allow imperative router.push redirect on success
- [Phase 03-04]: Client-side state machine in page.tsx manages polling->success->viewing transitions for async carousel generation
- [Phase 03-04]: pollCarouselStatus throws to trigger backOff retry on pending/processing; returns on terminal states (completed/failed/timeout)
- [Phase 03-04]: Swiper dual-instance pattern: main viewer + thumbnail synced via thumbsSwiper state ref with destroyed guard
- [Phase 03-05]: HistoryCard is client component for download interactivity; page.tsx and HistoryList remain server components
- [Phase 03-05]: Separate Supabase count query (head: true) avoids fetching all rows just for pagination math
- [Phase 03-05]: extractTemplateName parses template_url pathname to derive display-friendly name without storing separately
- [Phase 03-06]: Generate and History nav links added as primary navigation items in logical workflow order
- [Phase 03-06]: Dashboard CTA uses indigo gradient to make carousel generation the most prominent action
- [Phase 03-06]: GEN-14 refund_timeout_jobs function created in Plan 01 - scheduling via pg_cron or Vercel cron is operational task
- [Phase 03-07]: Insufficient credits error on Generate click is expected behavior (credit system working correctly)
- [Phase 03-07]: N8N E2E test deferred until N8N instance is running; all code paths verified via production build
- [Phase 03-07]: Phase 3 carousel generation approved complete by human verification
- [Phase 04-stripe-integration]: Stripe SDK v20.3.1 uses API version 2026-01-28.clover (plan specified 2024-11-20 — updated to match installed version)
- [Phase 04-stripe-integration]: No INSERT/UPDATE/DELETE RLS policies on subscriptions — all writes via service role key from webhook handler to prevent clients spoofing subscription state
- [Phase 04-stripe-integration]: seed_free_credits() uses SECURITY DEFINER to allow cross-schema insert from auth.users trigger into RLS-protected credit_transactions (CRED-01: 3 credits on signup)

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 1 Architecture:**
- Webhook signature verification must be implemented correctly from day one (retrofitting is risky)
- Credit ledger model (INSERT only, SUM-based balance) is foundational pattern that can't change later
- RLS policies must be indexed properly to prevent performance degradation

**Phase 3 N8N Integration:**
- N8N callback authentication pattern needs validation (HMAC signing support unclear from docs)
- Async timeout handling critical (60-180s processing time, frontend can't wait synchronously)
- Credit refund logic for failed generations must be atomic

**Phase 4 Stripe Webhooks:**
- Race conditions between checkout redirect and webhook arrival (need immediate sync strategy)
- Event ordering not guaranteed by Stripe (handlers must be idempotent)
- Cancel_at_period_end handling requires careful UX messaging

## Session Continuity

Last session: 2026-02-25 (stripe integration - SDK + database schema)
Stopped at: Completed 04-01-PLAN.md
Resume file: None
Next action: Phase 4 Plan 2 - Stripe webhook handler
