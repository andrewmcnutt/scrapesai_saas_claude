---
phase: 03-carousel-generation
plan: 01
subsystem: database
tags: [supabase, postgresql, zod, typescript, jszip, swiper, rls, migrations]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: credit_transactions table for refund function foreign key
  - phase: 02-brand-management
    provides: database pattern conventions (RLS, trigger patterns)
provides:
  - Carousels PostgreSQL table with RLS, indexes, and timeout refund function
  - TypeScript types for type-safe carousel database operations
  - Zod validation schemas for wizard steps and N8N callback payload
  - Template and image style constants for UI consumption
  - jszip, swiper, exponential-backoff npm packages installed
  - N8N environment variables documented in .env.example
affects:
  - 03-02 (generation API and wizard UI)
  - 03-03 (carousel history/listing)
  - 03-04 (N8N webhook callback handler)

# Tech tracking
tech-stack:
  added:
    - jszip@3.10.1 (carousel image downloading as ZIP)
    - swiper@12.1.2 (carousel UI slider component)
    - exponential-backoff@3.1.3 (polling with backoff for generation status)
  patterns:
    - SECURITY DEFINER function for cross-table refund atomicity
    - No UPDATE RLS policy for authenticated users (service role only for webhook updates)
    - Partial index for efficient pending-job timeout detection
    - Per-step Zod schemas for wizard validation (IdeaStep, TemplateStep, StyleStep + combined GenerationSchema)

key-files:
  created:
    - supabase/migrations/20260222_carousels.sql
    - src/lib/carousel/constants.ts
    - src/lib/validations/carousel.ts
  modified:
    - src/types/database.ts
    - .env.example
    - package.json

key-decisions:
  - "No UPDATE RLS policy for carousels: status/result updates come exclusively from N8N webhook via service role key, preventing clients from spoofing generation results"
  - "refund_timeout_jobs uses SECURITY DEFINER with loop pattern to handle multiple concurrent timeouts atomically per job"
  - "CAROUSEL_STATUS const object provides type safety without Postgres enum (avoids migration complexity)"
  - "Partial index on (status, created_at) WHERE status='pending' efficiently targets timeout detection queries without scanning completed carousels"

patterns-established:
  - "Per-step validation: Each wizard step has its own Zod schema (IdeaStepSchema, TemplateStepSchema, StyleStepSchema) plus a combined GenerationSchema for final submission"
  - "N8N callback validation: N8nCallbackSchema validates webhook payload with strict UUID and URL validation"
  - "Constants module: src/lib/carousel/constants.ts centralizes TEMPLATES, IMAGE_STYLES, CAROUSEL_STATUS for use across wizard, history, and API"

requirements-completed: [GEN-02, GEN-03, GEN-06, HIST-01, HIST-03, N8N-01]

# Metrics
duration: 3min
completed: 2026-02-24
---

# Phase 3 Plan 01: Database Foundation and Shared Dependencies Summary

**Carousels table with RLS + timeout refund function, TypeScript types, per-step Zod schemas, and jszip/swiper/exponential-backoff packages installed**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-25T00:25:38Z
- **Completed:** 2026-02-25T00:27:51Z
- **Tasks:** 2
- **Files modified:** 5 (created 3, modified 2)

## Accomplishments
- Carousels database migration with full schema: table, 2 indexes, 2 RLS policies, refund_timeout_jobs SECURITY DEFINER function
- TypeScript types added to Database type for carousels table (Row, Insert, Update, Relationships) and refund_timeout_jobs function
- Zod validation schemas for all wizard steps (IdeaStepSchema, TemplateStepSchema, StyleStepSchema), full form (GenerationSchema), and N8N callback (N8nCallbackSchema)
- Template and image style constants with 6 templates and 5 image styles defined
- Three npm packages installed: jszip, swiper, exponential-backoff

## Task Commits

Each task was committed atomically:

1. **Task 1: Create carousels database migration and install npm dependencies** - `e82e8d5` (feat)
2. **Task 2: Create carousel TypeScript types and Zod validation schemas** - `047c09d` (feat)

**Plan metadata:** (docs: commit follows this summary)

## Files Created/Modified
- `supabase/migrations/20260222_carousels.sql` - Carousels table, indexes, RLS policies, refund_timeout_jobs function
- `src/lib/carousel/constants.ts` - TEMPLATES, IMAGE_STYLES, CAROUSEL_STATUS, MAX_POLL_TIMEOUT_MS, POLL_STARTING_DELAY_MS
- `src/lib/validations/carousel.ts` - GenerationSchema, IdeaStepSchema, TemplateStepSchema, StyleStepSchema, N8nCallbackSchema
- `src/types/database.ts` - Added carousels table types and refund_timeout_jobs function type
- `.env.example` - Added N8N_WEBHOOK_URL and N8N_WEBHOOK_SECRET

## Decisions Made
- No UPDATE RLS policy for authenticated users: all carousel status/result updates come from N8N webhook via service role key, preventing clients from spoofing completed generation results
- refund_timeout_jobs uses SECURITY DEFINER with a loop to process multiple timed-out jobs atomically, setting completed_at to prevent duplicate refund processing
- CAROUSEL_STATUS const object (not a Postgres enum) provides type safety without additional migration complexity
- Partial index `WHERE status = 'pending'` on (status, created_at) efficiently targets timeout detection without scanning completed carousels

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
- Add `N8N_WEBHOOK_URL` and `N8N_WEBHOOK_SECRET` to your `.env.local` file
- Apply migration `supabase/migrations/20260222_carousels.sql` via Supabase SQL Editor or `supabase db push`

## Next Phase Readiness
- Carousels table schema complete and ready for generation API (Plan 02)
- TypeScript types allow type-safe Supabase queries in all future plans
- Zod schemas ready for import in generation wizard components and API route handlers
- Constants ready for template/style picker UI components

---
*Phase: 03-carousel-generation*
*Completed: 2026-02-24*
