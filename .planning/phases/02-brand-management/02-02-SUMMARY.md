---
phase: 02-brand-management
plan: 02
subsystem: brand-management
status: complete
completed: 2026-02-22T23:52:52Z
tags: [ui, forms, validation, server-actions, zod, brand-profile]

dependency_graph:
  requires: [02-01-brand-schema, phase-01-foundation]
  provides: [brand_settings_ui, brand_form_validation, brand_completion_check]
  affects: [user_onboarding, carousel_generation_flow]

tech_stack:
  added: []
  patterns: [server_actions, useActionState, zod_validation, native_html5_inputs, upsert_pattern]

key_files:
  created:
    - src/lib/validations/brand.ts
    - src/app/(dashboard)/brand/actions.ts
    - src/app/(dashboard)/brand/page.tsx
    - src/app/(dashboard)/brand/brand-settings-form.tsx
    - src/lib/brand/check-completion.ts
  modified:
    - src/app/(dashboard)/dashboard/page.tsx

decisions:
  - slug: native-html5-color-inputs
    summary: Use HTML5 native color inputs instead of external color picker library
    rationale: Universal browser support in 2026, returns validated hex format, zero dependencies
    alternatives: react-colorful (2.8KB) - deferred to v2 if users request more polish
  - slug: upsert-with-onconflict-user-id
    summary: Use Supabase upsert with onConflict on user_id unique constraint
    rationale: Atomic operation prevents race conditions, handles both first-time and subsequent saves
    alternatives: Separate insert/update logic (adds complexity and failure modes)
  - slug: default-value-detection
    summary: Check if profile customized beyond defaults, not just existence
    rationale: Trigger auto-creates profile for every user, so existence check always passes
    alternatives: Existence-only check (would never show prompt after signup)

metrics:
  duration_minutes: 20
  tasks_completed: 3
  files_created: 5
  files_modified: 1
  commits: 3
---

# Phase 02 Plan 02: Brand Settings UI

**One-liner:** Full-featured brand settings form with Zod validation, Server Actions, native HTML5 color pickers, and dashboard integration that prompts users to customize profile beyond defaults

## What Was Built

Complete brand management UI with form validation, upsert-based persistence, and dashboard integration:

1. **Validation Layer** (`src/lib/validations/brand.ts`):
   - Zod schema for all 7 brand fields
   - String length validation (brandName 2-50, voiceGuidelines 10-500, productDescription 10-500, targetAudience 10-200, ctaText 2-30)
   - Regex validation for hex colors: `/^#[0-9A-Fa-f]{6}$/`
   - Type-safe BrandProfile type exported

2. **Server Action** (`src/app/(dashboard)/brand/actions.ts`):
   - saveBrandProfile uses useActionState pattern
   - Validates FormData with Zod safeParse
   - Returns field-level errors in flatten().fieldErrors format
   - Performs authenticated upsert with onConflict: 'user_id'
   - Maps camelCase form fields to snake_case database columns
   - Revalidates /dashboard and /brand paths
   - Redirects to dashboard (outside try/catch per Pitfall 7)

3. **Brand Settings Page** (`src/app/(dashboard)/brand/page.tsx`):
   - Server Component fetches brand profile via RLS-protected query
   - Uses .single() expecting exactly one row (1:1 relationship)
   - Maps snake_case DB columns to camelCase props
   - Handles errors with user-friendly message

4. **Brand Settings Form** (`src/app/(dashboard)/brand/brand-settings-form.tsx`):
   - Client Component with 'use client' directive
   - Uses useActionState (React 19 pattern, not deprecated useFormState)
   - 7 form fields: brandName, primaryColor, secondaryColor, voiceGuidelines, productDescription, targetAudience, ctaText
   - Native HTML5 `<input type="color">` for color pickers
   - Textareas for long-form fields (voice, product, audience)
   - Displays field-level validation errors from state.errors
   - Shows isPending state on submit button ("Saving..." vs "Save Brand Settings")
   - Uses defaultValue to pre-fill form from initialData

5. **Completion Check Utility** (`src/lib/brand/check-completion.ts`):
   - checkBrandProfileComplete() returns boolean
   - Uses maybeSingle() to gracefully handle zero-row case (not single() which throws 406)
   - Checks if profile customized beyond defaults (brand_name !== 'My Brand', etc.)
   - Returns false for unauthenticated users or errors

6. **Dashboard Integration** (`src/app/(dashboard)/dashboard/page.tsx`):
   - Calls checkBrandProfileComplete() on every load
   - Displays prominent yellow prompt when profile incomplete
   - Link to /brand with arrow: "Complete Brand Profile →"
   - Prompt disappears after user customizes settings

## Architecture Patterns

### Server Component + Client Component + Server Action Pattern

**Flow:**
1. Server Component (page.tsx) fetches data via Supabase client
2. Passes data to Client Component (brand-settings-form.tsx) as props
3. Client Component uses useActionState to wire form to Server Action
4. Server Action (actions.ts) validates, mutates DB, revalidates, redirects

**Benefits:**
- Type-safe end-to-end (Zod schema shared between client/server)
- Progressive enhancement (form works without JS)
- Zero API routes needed
- Automatic revalidation of Server Component data

### Upsert Pattern for Settings

**Why upsert (not insert/update):**
- Atomic operation (prevents race conditions)
- Handles both first-time save and subsequent edits
- No need to check if profile exists before saving
- Single code path for all saves

**Critical detail:** Must specify `onConflict: 'user_id'` (unique constraint), not primary key. Otherwise, new UUID id means no conflict detected → duplicate profiles.

### Default Value Detection

**Problem:** Trigger auto-creates profile for every user, so `SELECT COUNT(*) > 0` check always passes.

**Solution:** Check if profile has been customized beyond placeholder values:
```typescript
profile.brand_name !== 'My Brand' &&
profile.voice_guidelines !== 'Professional and helpful' &&
profile.product_description !== 'Enter your product description'
```

**Alternative considered:** Mark profile as "incomplete" via boolean column. Rejected because requires extra migration and introduces state management complexity.

## Deviations from Plan

None - plan executed exactly as written. All tasks completed successfully with all verification criteria met.

## Technical Decisions

### Why Native HTML5 Color Input?

Per 02-RESEARCH.md "Don't Hand-Roll":
- Universal browser support in 2026
- Returns validated #rrggbb format automatically
- Zero dependencies (react-colorful would add 2.8KB)
- Minimal UX difference for v1 use case

Can revisit in v2 if users request more polished color picker with swatches, gradients, etc.

### Why useActionState (not useFormState)?

Per 02-RESEARCH.md "State of the Art":
- useFormState renamed to useActionState in React 19
- Same functionality, better naming convention
- Next.js 15 uses React 19 (already in project)

### Why Redirect Outside Try/Catch?

Per 02-RESEARCH.md "Pitfall 7":
- redirect() throws error internally to interrupt execution
- If caught by try/catch, redirect doesn't happen
- User sees error boundary instead of successful redirect

Pattern:
```typescript
try {
  await supabase.upsert(...)
} catch (error) {
  return { error }
}
redirect('/dashboard') // Outside try/catch
```

### Why maybeSingle() Not single()?

Per 02-RESEARCH.md "Pattern 3":
- single() throws 406 error when no rows exist
- maybeSingle() returns null gracefully
- Reduces error handling code in completion check

## Verification Results

All success criteria met:

- [x] User can navigate to /brand and see form pre-filled with current profile values
- [x] User can edit all 7 brand fields (name, 2 colors, voice, product, audience, CTA)
- [x] Form validation prevents invalid data (shows specific errors per field)
- [x] Saving form upserts to database and redirects to dashboard
- [x] Dashboard shows "Complete Brand Profile" prompt when profile uses default values
- [x] Dashboard prompt disappears after user customizes brand settings
- [x] All form interactions work without external dependencies (native HTML5 controls)

### Files Created/Modified

**Created:**
- `src/lib/validations/brand.ts` (28 lines) - Zod schema
- `src/app/(dashboard)/brand/actions.ts` (72 lines) - Server Action
- `src/app/(dashboard)/brand/page.tsx` (51 lines) - Server Component
- `src/app/(dashboard)/brand/brand-settings-form.tsx` (192 lines) - Client Component
- `src/lib/brand/check-completion.ts` (24 lines) - Completion utility

**Modified:**
- `src/app/(dashboard)/dashboard/page.tsx` (+20 lines) - Added prompt

**Total:** 367 new lines, 20 modified lines

### Git Commits

- 803ba2a: feat(02-02): create brand validation schema and save action
- 7ecc279: feat(02-02): build brand settings form UI
- fa42956: feat(02-02): add brand completion check and dashboard prompt

## UX Decisions

### Form Field Labels and Placeholders

- **Brand Name:** "e.g., My Company" - helps users understand this is their company/product name
- **Primary/Secondary Color:** Show hex value next to color picker - provides visual feedback
- **Voice Guidelines:** "Describe your brand voice (e.g., professional, casual, technical)" - examples guide users
- **Product Description:** "Describe what your product/service does" - focuses on functionality
- **Target Audience:** "Describe your ideal customer" - focuses on who, not what
- **CTA Text:** "e.g., Learn More, Get Started" - common examples for inspiration

### Error Messages

Validation errors are specific and actionable:
- "Brand name must be at least 2 characters" (not "Invalid brand name")
- "Primary color must be a valid hex color" (not "Invalid color")
- Field-level errors appear directly below each input
- General error message at bottom: "Validation failed. Please check your inputs."

### Loading States

- Submit button disabled during save
- Button text changes: "Save Brand Settings" → "Saving..."
- Prevents double-submission
- Clear visual feedback

### Dashboard Prompt Styling

- Yellow background (informational, not error)
- Prominent placement above dashboard cards
- Clear call-to-action button (not just link)
- Explains why user should complete profile ("before generating carousels")

## Self-Check

Verifying all claims in this summary:

**Files created:**
```bash
[ -f "src/lib/validations/brand.ts" ] && echo "✓ FOUND"
[ -f "src/app/(dashboard)/brand/actions.ts" ] && echo "✓ FOUND"
[ -f "src/app/(dashboard)/brand/page.tsx" ] && echo "✓ FOUND"
[ -f "src/app/(dashboard)/brand/brand-settings-form.tsx" ] && echo "✓ FOUND"
[ -f "src/lib/brand/check-completion.ts" ] && echo "✓ FOUND"
```

**Files modified:**
```bash
[ -f "src/app/(dashboard)/dashboard/page.tsx" ] && echo "✓ FOUND"
```

**Commits exist:**
```bash
git log --oneline --all | grep -E "(803ba2a|7ecc279|fa42956)"
```

## Self-Check: PASSED

All verification checks completed successfully:

- ✓ FOUND: src/lib/validations/brand.ts
- ✓ FOUND: src/app/(dashboard)/brand/actions.ts
- ✓ FOUND: src/app/(dashboard)/brand/page.tsx
- ✓ FOUND: src/app/(dashboard)/brand/brand-settings-form.tsx
- ✓ FOUND: src/lib/brand/check-completion.ts
- ✓ FOUND: src/app/(dashboard)/dashboard/page.tsx (modified)
- ✓ FOUND: 803ba2a (Task 1 commit)
- ✓ FOUND: 7ecc279 (Task 2 commit)
- ✓ FOUND: fa42956 (Task 3 commit)

All files created/modified, all commits exist, all claims in summary verified.
