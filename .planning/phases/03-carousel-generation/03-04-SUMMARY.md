---
phase: 03-carousel-generation
plan: 04
subsystem: ui
tags: [react, swiper, jszip, exponential-backoff, nextjs, polling, typescript]

# Dependency graph
requires:
  - phase: 03-01
    provides: jszip, swiper, exponential-backoff packages installed; CAROUSEL_STATUS const
  - phase: 03-02
    provides: GET /api/carousel/[id] polling endpoint; initiateGeneration server action

provides:
  - pollCarouselStatus utility with exponential backoff (2s->4s->8s) for generation wait
  - downloadCarouselZip client-side ZIP generation from image URLs via JSZip
  - GenerationPolling component with progress bar and rotating messages
  - SuccessScreen component with 3s auto-transition before carousel view
  - CarouselViewer component: Swiper slide viewer with thumbnail strip, post body text, ZIP download
  - /carousel/[id] page: client-side state machine (loading->polling->success->viewing->error)

affects: [03-05, 03-06, 03-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Client-side state machine for async generation: loading|polling|success|viewing|error phases
    - Exponential backoff polling: throw-to-retry pattern with terminal status check
    - Swiper dual-instance pattern: main viewer + thumbnail Swiper synced via thumbsSwiper state ref
    - Client ZIP download: parallel fetch -> JSZip.file() -> generateAsync -> anchor click -> revokeObjectURL

key-files:
  created:
    - src/lib/carousel/poll-status.ts
    - src/lib/carousel/download-zip.ts
    - src/components/carousel/GenerationPolling.tsx
    - src/components/carousel/SuccessScreen.tsx
    - src/components/carousel/CarouselViewer.tsx
    - src/app/(dashboard)/carousel/[id]/page.tsx
  modified:
    - src/app/(dashboard)/generate/actions.ts
    - src/app/(dashboard)/brand/actions.ts

key-decisions:
  - "Client-side state machine in page.tsx: single component manages polling->success->viewing transitions without server round-trips"
  - "pollCarouselStatus throws to trigger backOff retry on pending/processing status; returns on terminal states (completed/failed/timeout)"
  - "Thumbnail Swiper synced to main Swiper via thumbsSwiper state; null check prevents stale ref issues after destroy"
  - "prevState: any -> unknown fix in server actions to resolve build ESLint errors (pre-existing issue)"

patterns-established:
  - "Exponential backoff polling: startingDelay 2000, timeMultiple 2, maxDelay 8000 caps at 8s per GEN-13"
  - "ZIP download: parallel Promise.allSettled -> skip failed images with warning -> JSZip generate -> anchor download"
  - "Swiper thumbs integration: onSwiper callback stores Swiper instance; destroyed check before passing to main swiper"

requirements-completed: [GEN-07, GEN-08, GEN-09, GEN-10, GEN-12, GEN-13, UI-05]

# Metrics
duration: 4min
completed: 2026-02-25
---

# Phase 3 Plan 04: Carousel Viewing Experience Summary

**Swiper-based carousel viewer with exponential backoff polling, 3-state page machine (polling->success->viewing), JSZip download, and thumbnail strip synced to main slide viewer**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-25T00:35:48Z
- **Completed:** 2026-02-25T00:39:55Z
- **Tasks:** 2
- **Files modified:** 8 (created 6, modified 2)

## Accomplishments

- Full 3-state carousel page: pending jobs start polling with exponential backoff, transition to brief success screen, then render Swiper viewer
- CarouselViewer uses dual Swiper instances (main + thumbs) with Navigation and FreeMode modules for smooth slide navigation and synced thumbnail strip
- pollCarouselStatus implements throw-to-retry pattern with 2s->4s->8s backoff caps; client-side timeout after 40 attempts (~5 min)
- downloadCarouselZip fetches all images in parallel via Promise.allSettled, gracefully skips failures, generates ZIP with JSZip and triggers browser download
- Completed carousels render viewer directly (skipping polling); failed/timeout carousels show informative error state
- Regenerate button encodes all generation params in URL for pre-fill in generation wizard

## Task Commits

Each task was committed atomically:

1. **Task 1: Create polling utility, ZIP download, and polling UI components** - `265a227` (feat)
2. **Task 2: Create carousel viewer and carousel page** - `088aa02` (feat)

**Plan metadata:** (docs: commit follows this summary)

## Files Created/Modified

- `src/lib/carousel/poll-status.ts` - Exponential backoff polling utility; returns CarouselStatusResponse on terminal status
- `src/lib/carousel/download-zip.ts` - JSZip client-side ZIP generation from parallel-fetched image URLs
- `src/components/carousel/GenerationPolling.tsx` - Spinner + progress bar + rotating messages during 60-180s wait
- `src/components/carousel/SuccessScreen.tsx` - Checkmark + "Your carousel is ready!" with 3s auto-transition
- `src/components/carousel/CarouselViewer.tsx` - Swiper viewer with navigation arrows, thumbnail strip, post body text, ZIP download/Regenerate action bar
- `src/app/(dashboard)/carousel/[id]/page.tsx` - Client-side state machine page: loading->polling->success->viewing->error
- `src/app/(dashboard)/generate/actions.ts` - Fixed prevState: any -> unknown (ESLint/build fix)
- `src/app/(dashboard)/brand/actions.ts` - Fixed prevState: any -> unknown (ESLint/build fix)

## Decisions Made

- Client-side page.tsx implements the state machine (not a server component) because the polling/transition logic requires React state and client-side effects
- `pollCarouselStatus` uses throw-to-retry as the backOff library continues on thrown errors; returning in the backOff callback exits the loop
- Swiper thumbsSwiper state includes a `!thumbsSwiper.destroyed` guard to prevent stale instance issues when the component re-renders
- Used `Promise.allSettled` (not `Promise.all`) for ZIP image fetching so partial failures don't abort the entire download

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed prevState: any ESLint errors blocking production build**
- **Found during:** Task 2 verification (Next.js build)
- **Issue:** `prevState: any` in generate/actions.ts and brand/actions.ts caused `@typescript-eslint/no-explicit-any` errors that failed `next build`
- **Fix:** Changed `prevState: any` to `prevState: unknown` in both server action files
- **Files modified:** src/app/(dashboard)/generate/actions.ts, src/app/(dashboard)/brand/actions.ts
- **Verification:** `npx next build` passes with all 13 routes compiled successfully
- **Committed in:** `088aa02` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking build issue)
**Impact on plan:** Pre-existing issue from Plans 02 and 03 that only surfaced at build time. Required to complete verification successfully.

## Issues Encountered

Swiper v12 has reorganized CSS imports vs older documentation. Used `import 'swiper/css'`, `import 'swiper/css/navigation'`, `import 'swiper/css/thumbs'`, `import 'swiper/css/free-mode'` based on package.json exports inspection (not older `swiper/react/swiper.css` paths).

## User Setup Required

None - no external service configuration required for this plan.

## Next Phase Readiness

- Complete carousel viewing experience: polling, success, viewer all implemented
- Ready for Phase 3 Plan 05: Carousel history/listing page (Plan 03-03 already done per STATE.md - check next plan in sequence)
- No blocking issues — build passes with zero TypeScript errors, all 6 components compile correctly

---
*Phase: 03-carousel-generation*
*Completed: 2026-02-25*

## Self-Check: PASSED

- FOUND: src/lib/carousel/poll-status.ts
- FOUND: src/lib/carousel/download-zip.ts
- FOUND: src/components/carousel/GenerationPolling.tsx
- FOUND: src/components/carousel/SuccessScreen.tsx
- FOUND: src/components/carousel/CarouselViewer.tsx
- FOUND: src/app/(dashboard)/carousel/[id]/page.tsx
- FOUND: .planning/phases/03-carousel-generation/03-04-SUMMARY.md
- FOUND commit: 265a227 (Task 1)
- FOUND commit: 088aa02 (Task 2)
