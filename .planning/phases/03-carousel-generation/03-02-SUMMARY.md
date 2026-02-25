---
phase: 03-carousel-generation
plan: 02
subsystem: api
tags: [n8n, webhook, hmac, supabase, server-action, credits, async]

# Dependency graph
requires:
  - phase: 03-01
    provides: carousels table, credit_transactions table, deduct_credit RPC, CAROUSEL_STATUS const, N8nCallbackSchema validation

provides:
  - initiateGeneration server action with atomic credit deduction and N8N outbound call
  - GET /api/carousel/[id] status polling endpoint with RLS enforcement
  - POST /api/webhooks/n8n/callback webhook handler with HMAC-SHA256 verification
  - verifyWebhookSignature utility using constant-time comparison

affects: [03-03, 03-04, 03-05, 03-06, 03-07]

# Tech tracking
tech-stack:
  added: [Node.js crypto module for HMAC-SHA256]
  patterns: [server-action-with-rpc, raw-body-hmac-verification, service-role-webhook-handler, atomic-credit-deduction-with-refund]

key-files:
  created:
    - src/app/(dashboard)/generate/actions.ts
    - src/app/api/carousel/[id]/route.ts
    - src/app/api/webhooks/n8n/callback/route.ts
    - src/lib/carousel/verify-webhook.ts
  modified: []

key-decisions:
  - "Read raw body via request.text() before JSON.parse() for HMAC verification — consuming body as JSON first would make HMAC impossible"
  - "N8N call failure does NOT trigger refund — job exists in DB and can be retried or timed out by the existing refund_timeout_jobs function"
  - "Service role key (not user session) used in webhook handler to bypass RLS for server-to-server communication"
  - "Buffer length check before timingSafeEqual — Node crypto throws if buffers differ in length"

patterns-established:
  - "HMAC webhook pattern: text() -> verify signature -> JSON.parse() -> validate schema -> service role DB update"
  - "Credit deduction pattern: deduct_credit RPC -> insert carousel job -> refund on job creation failure -> call N8N"
  - "Status polling pattern: GET /api/carousel/[id] with RLS enforcement via maybeSingle()"

requirements-completed: [GEN-05, GEN-06, GEN-12, N8N-02, N8N-03, N8N-04, N8N-05, N8N-06]

# Metrics
duration: 8min
completed: 2026-02-24
---

# Phase 3 Plan 02: Generation API and Webhook Layer Summary

**Generation server action with atomic credit deduction via deduct_credit RPC, N8N outbound webhook call, HMAC-SHA256 verified inbound callback handler, and status polling endpoint**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-25T00:30:44Z
- **Completed:** 2026-02-25T00:38:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `initiateGeneration` server action atomically deducts 1 credit, creates carousel job with pending status, calls N8N webhook with full idea/template/style/brand payload
- Refund logic handles job creation failure by inserting credit_transaction with amount 1 and type 'refund'
- N8N callback webhook handler reads raw body, verifies HMAC-SHA256 signature via constant-time comparison, validates with N8nCallbackSchema, updates carousel via service role key
- `verifyWebhookSignature` utility safely handles buffer length mismatches without throwing
- GET /api/carousel/[id] status polling endpoint enforces RLS — users can only poll their own jobs

## Task Commits

Each task was committed atomically:

1. **Task 1: Create generation server action and N8N outbound webhook call** - `4218553` (feat)
2. **Task 2: Create N8N callback webhook handler with HMAC verification** - `1ba3935` (feat)

**Plan metadata:** (docs commit — created after summary)

## Files Created/Modified

- `src/app/(dashboard)/generate/actions.ts` - Server action: validates form, deducts credit, creates carousel job, calls N8N
- `src/app/api/carousel/[id]/route.ts` - Status polling endpoint with auth check and RLS enforcement
- `src/app/api/webhooks/n8n/callback/route.ts` - N8N completion callback: HMAC verify, payload validate, DB update via service role
- `src/lib/carousel/verify-webhook.ts` - HMAC-SHA256 signature verification utility with constant-time comparison

## Decisions Made

- Read raw body via `request.text()` before `JSON.parse()` for HMAC — JSON consumption would make body unavailable for HMAC calculation
- N8N call failure does NOT trigger a credit refund — the carousel job exists in the database and will be cleaned up by the existing `refund_timeout_jobs` function after 5 minutes
- Webhook handler uses direct Supabase client with service role key (bypasses RLS) — no user session available in server-to-server context
- Buffer length mismatch check added before `timingSafeEqual` — Node.js throws a TypeError if buffer lengths differ

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

External services require manual configuration before the generation flow will work end-to-end:

- **N8N_WEBHOOK_URL** — N8N instance -> Workflow -> Webhook trigger node -> Production URL
- **N8N_WEBHOOK_SECRET** — Shared HMAC secret; generate with `openssl rand -hex 32`, configure in both N8N workflow and `.env.local`
- **SUPABASE_SERVICE_ROLE_KEY** — Required for the webhook callback handler to bypass RLS

These are documented in the plan's `user_setup` section.

## Next Phase Readiness

- Backend API layer is complete: generation initiation, webhook callback, and status polling all implemented and type-safe
- Ready for Phase 3 Plan 03: Generation wizard UI that calls `initiateGeneration` and polls `/api/carousel/[id]`
- No blockers — all files compile cleanly with zero TypeScript errors

---
*Phase: 03-carousel-generation*
*Completed: 2026-02-24*

## Self-Check: PASSED

- FOUND: src/app/(dashboard)/generate/actions.ts
- FOUND: src/app/api/carousel/[id]/route.ts
- FOUND: src/app/api/webhooks/n8n/callback/route.ts
- FOUND: src/lib/carousel/verify-webhook.ts
- FOUND: .planning/phases/03-carousel-generation/03-02-SUMMARY.md
- FOUND commit: 4218553 (Task 1)
- FOUND commit: 1ba3935 (Task 2)
