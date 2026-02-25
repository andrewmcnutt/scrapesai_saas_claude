---
phase: 03-carousel-generation
plan: 03
subsystem: ui
tags: [react, next.js, wizard, multi-step-form, zod, tailwind, client-components]

# Dependency graph
requires:
  - phase: 03-01
    provides: carousels table, TEMPLATES constant, IMAGE_STYLES constant, CAROUSEL_STATUS const
  - phase: 03-02
    provides: initiateGeneration server action, IdeaStepSchema, TemplateStepSchema, StyleStepSchema

provides:
  - 3-step generation wizard UI (Idea -> Template -> Style) at /generate route
  - GenerationWizard client component with per-step Zod validation and debounced Generate button
  - StepIndicator component with completed/active/future visual states
  - IdeaStep: topic input, key points textarea, tone pill selectors
  - TemplateStep: 3x2 visual template grid with selection highlighting
  - StyleStep: 2x3 style card grid with custom option expanding textarea

affects: [03-04, 03-05, 03-06, 03-07]

# Tech tracking
tech-stack:
  added: []
  patterns: [multi-step-wizard-with-per-step-zod-validation, controlled-form-state-with-setData-callback, debounced-submit-via-isSubmitting-disabled]

key-files:
  created:
    - src/app/(dashboard)/generate/page.tsx
    - src/components/generation/GenerationWizard.tsx
    - src/components/generation/StepIndicator.tsx
    - src/components/generation/IdeaStep.tsx
    - src/components/generation/TemplateStep.tsx
    - src/components/generation/StyleStep.tsx
  modified: []

key-decisions:
  - "Custom image style: imageStyle field set to 'custom', customStyleText stored separately, merged to effectiveImageStyle at submit time"
  - "initiateGeneration called directly (not via useActionState) to allow redirect on success via router.push"
  - "Template thumbnail failures handled gracefully via onError - placeholder div shown behind image via CSS layering"

patterns-established:
  - "Wizard pattern: parent holds all state, step components receive data/setData/errors as props - no state in step components"
  - "Per-step validation pattern: validate with step-specific Zod schema in handleNext() before advancing currentStep"
  - "Debounce pattern: setIsSubmitting(true) before async call, reset to false only on error - prevent double-click double-spend"

requirements-completed: [GEN-01, GEN-02, GEN-03, GEN-04, GEN-11, GEN-15]

# Metrics
duration: 2min
completed: 2026-02-25
---

# Phase 3 Plan 03: Generation Wizard UI Summary

**3-step generation wizard (Idea/Template/Style) with per-step Zod validation, visual template/style grids, and debounced Generate button calling initiateGeneration server action**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-25T00:35:39Z
- **Completed:** 2026-02-25T00:37:56Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- GenerationWizard client component manages currentStep (0/1/2), formData, errors, and isSubmitting state with per-step Zod schema validation
- StepIndicator shows 3-step progress with completed (blue checkmark), active (ring highlight), and future (gray) visual states
- IdeaStep provides structured inputs: topic text field, key points textarea, and 5-option tone pill button selector
- TemplateStep renders 3x2 grid of TEMPLATES with ring-blue-600 highlight and scale-105 transform on selection
- StyleStep renders 2x3 grid of IMAGE_STYLES with custom option expanding a textarea for custom style description
- Generate button disabled during isSubmitting (debounced per GEN-15), redirects to /carousel/{job_id} on success

## Task Commits

Each task was committed atomically:

1. **Task 1: Create generate page and generation wizard wrapper** - `942f7bf` (feat)
2. **Task 2: Create wizard step components (IdeaStep, TemplateStep, StyleStep)** - `3329d61` (feat)

**Plan metadata:** (docs commit - created after summary)

## Files Created/Modified

- `src/app/(dashboard)/generate/page.tsx` - Server component: renders page title and GenerationWizard in white card container
- `src/components/generation/GenerationWizard.tsx` - Multi-step wizard: state management, per-step validation, form submission via initiateGeneration
- `src/components/generation/StepIndicator.tsx` - Progress indicator with 3 steps, completed/active/future visual states
- `src/components/generation/IdeaStep.tsx` - Step 1: topic input, key points textarea, tone pill button selector (5 options)
- `src/components/generation/TemplateStep.tsx` - Step 2: 3x2 visual grid of TEMPLATES with ring highlight selection state
- `src/components/generation/StyleStep.tsx` - Step 3: 2x3 style card grid, custom option expands textarea input

## Decisions Made

- Custom image style uses split-field approach: `imageStyle='custom'` stored in selection state, `customStyleText` stored separately, merged to `effectiveImageStyle` at submit time before StyleStepSchema validation and FormData construction
- Direct `await initiateGeneration(null, fd)` call used instead of `useActionState` hook to allow imperative `router.push()` redirect on success
- Template/style thumbnail image failures handled gracefully: `onError` hides `<img>`, placeholder div is visible behind via absolute positioning and `z-index` layering

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required for the wizard UI itself. The wizard calls `initiateGeneration` which requires the N8N_WEBHOOK_URL and N8N_WEBHOOK_SECRET environment variables (documented in 03-02 user setup).

## Next Phase Readiness

- Generation wizard UI is complete at `/generate` route; users can submit carousels via the 3-step wizard
- `/carousel/{job_id}` route referenced in success redirect does not yet exist - needs Phase 3 Plans 04/05 (polling UI and success screen)
- No blockers - all files compile with zero TypeScript errors

---
*Phase: 03-carousel-generation*
*Completed: 2026-02-25*

## Self-Check: PASSED

- FOUND: src/app/(dashboard)/generate/page.tsx
- FOUND: src/components/generation/GenerationWizard.tsx
- FOUND: src/components/generation/StepIndicator.tsx
- FOUND: src/components/generation/IdeaStep.tsx
- FOUND: src/components/generation/TemplateStep.tsx
- FOUND: src/components/generation/StyleStep.tsx
- FOUND: .planning/phases/03-carousel-generation/03-03-SUMMARY.md
- FOUND commit: 942f7bf (Task 1)
- FOUND commit: 3329d61 (Task 2)
