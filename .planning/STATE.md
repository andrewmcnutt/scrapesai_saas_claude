# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** Non-designers can quickly create professional, branded LinkedIn carousels that match their voice and visual identity
**Current focus:** Phase 3: Carousel Generation

## Current Position

Phase: 3 of 5 (Carousel Generation)
Plan: 2 of 7 in current phase
Status: In progress
Last activity: 2026-02-24 — Completed 03-02-PLAN.md (generation API and webhook layer)

Progress: [█████░░░░░] 40%

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
| 03    | 1     | 3 min  | 3 min   |

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

Last session: 2026-02-24 (carousel generation - generation API and webhook layer)
Stopped at: Completed 03-02-PLAN.md
Resume file: None
Next action: Continue Phase 3 - execute 03-03-PLAN.md
