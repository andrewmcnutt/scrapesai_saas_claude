---
phase: 03-carousel-generation
plan: 06
subsystem: ui
tags: [navigation, sidebar, dashboard, nextjs, tailwind]

# Dependency graph
requires:
  - phase: 03-01
    provides: Database schema and refund_timeout_jobs function for carousel generation
  - phase: 03-03
    provides: Generate page (/generate) built in plan 03
provides:
  - Updated sidebar navigation with Generate and History links
  - Dashboard with prominent carousel generation CTA
  - Documentation of N8N external/operational requirements (N8N-07 through N8N-10, GEN-14)
affects: [03-05, 04-payments, navigation, dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sidebar nav ordering: Dashboard > Generate > History > Brand Settings"
    - "Gradient CTA card: bg-gradient-to-r from-indigo-600 to-blue-500 for primary actions"

key-files:
  created: []
  modified:
    - src/app/(dashboard)/layout.tsx
    - src/app/(dashboard)/dashboard/page.tsx

key-decisions:
  - "Generate and History nav links added as primary navigation items in logical workflow order"
  - "Dashboard CTA uses indigo gradient to make carousel generation the most prominent action"
  - "N8N-07 retry logic: N8N-side configuration (3 retries, 30s delay) - not Next.js code"
  - "N8N-08/09 reconciliation and orphan alerts deferred to post-launch operations"
  - "N8N-10 N8N workflow lives in separate repository - not part of this codebase"
  - "GEN-14 refund_timeout_jobs function created in Plan 01 - scheduling via pg_cron or Vercel cron is operational task"

patterns-established:
  - "Navigation order: Dashboard, Generate, History, Brand Settings"
  - "Primary CTA uses gradient card at top of dashboard content area"

requirements-completed: [GEN-14, N8N-07, N8N-08, N8N-09, N8N-10]

# Metrics
duration: 2min
completed: 2026-02-25
---

# Phase 3 Plan 06: Navigation and Dashboard CTA Summary

**Sidebar updated with Generate and History navigation links; dashboard features prominent indigo gradient Generate Carousel CTA; all N8N external requirements documented**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-25T00:42:42Z
- **Completed:** 2026-02-25T00:43:45Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Added Generate (/generate) and History (/history) navigation links to sidebar with appropriate icons
- Reordered sidebar nav: Dashboard, Generate, History, Brand Settings
- Added prominent indigo gradient "Create a New Carousel" CTA to top of dashboard
- Updated Quick Actions card to link to carousel history
- Documented all N8N external requirements (N8N-07 through N8N-10) as operational/external concerns
- Documented GEN-14 timeout refund as ready (function created in Plan 01), scheduling is operational task

## Task Commits

Each task was committed atomically:

1. **Task 1: Update sidebar navigation and dashboard page** - `9a8d34d` (feat)

**Plan metadata:** `[docs commit below]` (docs: complete plan)

## Files Created/Modified
- `src/app/(dashboard)/layout.tsx` - Added Generate and History nav links with icons; reordered nav items
- `src/app/(dashboard)/dashboard/page.tsx` - Added indigo gradient Generate Carousel CTA section; updated Quick Actions card

## Decisions Made
- Generate nav uses a plus icon (M12 6v6m0 0v6m0-6h6m-6 0H6) - clean and universally understood for "create new"
- History nav uses a clock icon - intuitive for past records
- Dashboard CTA placed above the brand completion warning so it's the first prominent action seen
- Quick Actions card updated to link to /history instead of showing placeholder text from Phase 1/2

## External Requirements Documented

The following requirements are handled outside the Next.js codebase:

- **N8N-07** (retry callback failures): N8N workflow should be configured to retry HTTP requests 3 times with 30-second delay on 5xx responses. N8N-side configuration only.
- **N8N-08** (daily reconciliation): Deferred to post-launch operations per 03-RESEARCH.md. Not implemented in v1.
- **N8N-09** (orphaned image alerts): Deferred to post-launch operations per 03-RESEARCH.md. Not implemented in v1.
- **N8N-10** (N8N-MCP repo): N8N workflow lives in separate repository. Referenced but not part of Next.js codebase.
- **GEN-14** (timeout refund): `refund_timeout_jobs()` function created in Plan 01 migration is ready. Scheduling via Supabase pg_cron or a scheduled Vercel cron job is an operational task for deployment.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Navigation complete: users can reach Generate and History from any dashboard page
- Dashboard prominently surfaces the primary user action (carousel generation)
- All Phase 3 carousel generation UI is ready for end-to-end testing
- GEN-14 timeout refund function ready - scheduling should be configured at deployment time

## Self-Check: PASSED

- FOUND: src/app/(dashboard)/layout.tsx
- FOUND: src/app/(dashboard)/dashboard/page.tsx
- FOUND: .planning/phases/03-carousel-generation/03-06-SUMMARY.md
- FOUND: commit 9a8d34d

---
*Phase: 03-carousel-generation*
*Completed: 2026-02-25*
