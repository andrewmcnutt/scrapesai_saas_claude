# Phase 2: Brand Management - Research

**Researched:** 2026-02-22
**Domain:** User profile management with Supabase, Next.js form patterns, RLS security
**Confidence:** HIGH

## Summary

Brand Management requires implementing a user-owned settings table with proper Row Level Security (RLS), form validation patterns using Zod (already in project stack), and conditional onboarding flows to prompt users to create brand profiles before generating carousels.

The domain is well-understood with established patterns: Supabase provides native support for user profile tables with RLS, Next.js 15 has mature Server Actions for form handling, and the project's existing auth foundation (Phase 1) provides the necessary primitives. Key decisions include using upsert for idempotent saves, database triggers for auto-creating profile records on signup, and native HTML5 color inputs to avoid external dependencies.

**Primary recommendation:** Use Supabase upsert with RLS policies, trigger-based profile creation, Server Actions for form mutations, and conditional middleware checks to enforce brand profile completion before carousel generation.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BRND-01 | User is prompted to create brand profile on first carousel generation attempt | Middleware redirect pattern, maybeSingle() existence check, modal/onboarding flow patterns |
| BRND-02 | User can set brand name, colors, voice guidelines, product description, target audience, and CTA text | Form validation with Zod schemas, HTML5 color input, textarea patterns, Server Actions |
| BRND-03 | User can view and edit brand settings from dashboard | RLS SELECT/UPDATE policies, upsert pattern for idempotent updates, Supabase client queries |
| BRND-04 | Brand data is stored in Supabase with RLS policies | RLS best practices, indexed policies, auth.uid() ownership checks, trigger functions |
| BRND-05 | Each user has one brand (1:1 relationship with user account) | Foreign key with ON DELETE CASCADE, unique constraint on user_id, trigger auto-creation |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.97.0 | Database queries, RLS enforcement | Already in project, official Supabase client |
| zod | ^4.3.6 | Form validation schemas | Already in project, type-safe validation |
| next | ^15.1.6 | Server Actions, routing, middleware | Already in project, forms use Server Actions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Built-in HTML5 `<input type="color">` | Native | Color picker | Avoids external dependencies, has universal browser support in 2026 |
| Built-in `<textarea>` | Native | Multi-line text input | Standard for voice guidelines, product descriptions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| HTML5 color input | react-colorful (2.8KB) | More UX polish, but adds dependency. Defer to v2 if users complain about native picker. |
| Database trigger | Frontend profile creation | Trigger ensures atomicity and can't be bypassed. Frontend approach adds complexity and failure modes. |
| upsert | Separate insert/update logic | upsert is atomic, prevents race conditions, simpler code. Always prefer for settings. |

**Installation:**
No new dependencies required. All tools already in project stack.

## Architecture Patterns

### Recommended Database Schema
```sql
-- Brand profiles table (1:1 with users)
CREATE TABLE brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  primary_color TEXT NOT NULL CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  secondary_color TEXT NOT NULL CHECK (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  voice_guidelines TEXT NOT NULL,
  product_description TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  cta_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for RLS policy performance (CRITICAL)
CREATE INDEX idx_brand_profiles_user_id ON brand_profiles(user_id);

-- Enable RLS
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own brand profile"
  ON brand_profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own brand profile"
  ON brand_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own brand profile"
  ON brand_profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Trigger to auto-create brand profile on user signup
CREATE OR REPLACE FUNCTION create_brand_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO brand_profiles (
    user_id,
    brand_name,
    primary_color,
    secondary_color,
    voice_guidelines,
    product_description,
    target_audience,
    cta_text
  )
  VALUES (
    NEW.id,
    'My Brand', -- Default placeholder
    '#3B82F6', -- Default blue
    '#10B981', -- Default green
    'Professional and helpful', -- Default voice
    'Enter your product description', -- Placeholder
    'Enter your target audience', -- Placeholder
    'Learn More' -- Default CTA
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_signup_create_brand
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_brand_profile();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_brand_profiles_updated_at
  BEFORE UPDATE ON brand_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Recommended Project Structure
```
app/
├── (authenticated)/
│   ├── dashboard/
│   │   └── page.tsx          # Shows "Complete Brand Profile" if incomplete
│   ├── brand/
│   │   ├── page.tsx          # Brand settings form
│   │   └── actions.ts        # Server Actions for save/update
│   └── layout.tsx            # Check brand profile existence
src/
├── lib/
│   ├── supabase/
│   │   └── client.ts         # Already exists
│   └── validations/
│       └── brand.ts          # Zod schemas for brand data
```

### Pattern 1: Upsert for Idempotent Updates
**What:** Use Supabase upsert instead of conditional insert/update logic
**When to use:** All brand profile saves (both first-time and subsequent edits)
**Example:**
```typescript
// Source: https://supabase.com/docs/reference/javascript/upsert
const { data, error } = await supabase
  .from('brand_profiles')
  .upsert({
    user_id: userId,
    brand_name: formData.brandName,
    primary_color: formData.primaryColor,
    // ... other fields
  }, {
    onConflict: 'user_id' // Use unique constraint
  })
  .select()
  .single()
```

### Pattern 2: Server Actions for Form Mutations
**What:** Use Next.js 15 Server Actions instead of API routes
**When to use:** All form submissions (create/update brand profile)
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/getting-started/updating-data
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveBrandProfile(formData: FormData) {
  // Validate with Zod
  const validatedFields = BrandProfileSchema.safeParse({
    brandName: formData.get('brandName'),
    primaryColor: formData.get('primaryColor'),
    // ... other fields
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  // Get user from session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Upsert brand profile
  const { error } = await supabase
    .from('brand_profiles')
    .upsert({
      user_id: user.id,
      ...validatedFields.data
    }, {
      onConflict: 'user_id'
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
```

### Pattern 3: Check Profile Existence with maybeSingle()
**What:** Use maybeSingle() to gracefully handle zero-row case when checking if profile is complete
**When to use:** Middleware checks, dashboard conditionals
**Example:**
```typescript
// Source: Supabase community best practices
const { data: profile, error } = await supabase
  .from('brand_profiles')
  .select('*')
  .eq('user_id', userId)
  .maybeSingle()

if (error) {
  // Handle actual error
  throw error
}

if (!profile) {
  // Profile doesn't exist - redirect to onboarding
  return false
}

// Check if profile is complete (not just defaults)
const isComplete =
  profile.brand_name !== 'My Brand' &&
  profile.voice_guidelines !== 'Professional and helpful'
  // ... check other default values

return isComplete
```

### Pattern 4: Zod Schema for Type-Safe Validation
**What:** Define Zod schemas that enforce business rules and provide TypeScript types
**When to use:** All form validation (client and server)
**Example:**
```typescript
// Source: Zod documentation + project conventions
import { z } from 'zod'

export const BrandProfileSchema = z.object({
  brandName: z.string()
    .min(2, 'Brand name must be at least 2 characters')
    .max(50, 'Brand name must be less than 50 characters'),
  primaryColor: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Primary color must be a valid hex color'),
  secondaryColor: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Secondary color must be a valid hex color'),
  voiceGuidelines: z.string()
    .min(10, 'Voice guidelines must be at least 10 characters')
    .max(500, 'Voice guidelines must be less than 500 characters'),
  productDescription: z.string()
    .min(10, 'Product description must be at least 10 characters')
    .max(500, 'Product description must be less than 500 characters'),
  targetAudience: z.string()
    .min(10, 'Target audience must be at least 10 characters')
    .max(200, 'Target audience must be less than 200 characters'),
  ctaText: z.string()
    .min(2, 'CTA text must be at least 2 characters')
    .max(30, 'CTA text must be less than 30 characters'),
})

export type BrandProfile = z.infer<typeof BrandProfileSchema>
```

### Anti-Patterns to Avoid
- **Using separate insert/update logic:** Race conditions, non-atomic operations, more complex code. Always prefer upsert for settings.
- **Client-provided user_id in RLS policies:** Security vulnerability. Always use `(SELECT auth.uid())` to enforce ownership.
- **Missing indexes on RLS policy columns:** Performance degradation. Always index `user_id` and other columns used in `USING` clauses.
- **Using single() instead of maybeSingle():** Throws 406 error when no rows exist, requires extra error handling. Use maybeSingle() for existence checks.
- **Storing invalid hex colors:** Database constraint prevents this. Always validate color format in Zod schema AND database CHECK constraint.
- **Missing ON DELETE CASCADE:** Orphaned brand profiles when users are deleted. Always include cascade on foreign key.
- **Frontend-only profile creation:** Can be bypassed, creates race conditions. Always use database trigger for auto-creation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color picker component | Custom React color picker with RGB/HSL conversion | HTML5 `<input type="color">` | Native support in all modern browsers (2026), returns #rrggbb format automatically, zero dependencies |
| Profile existence detection | Custom caching layer or session state | Supabase RLS + maybeSingle() query | Database is source of truth, RLS enforces security, caching adds complexity and staleness issues |
| Form state management | Custom validation hooks | Zod + Server Actions + useActionState | Type-safe, shared validation between client/server, native React 19 integration |
| Insert-or-update logic | `if (exists) { update() } else { insert() }` | Supabase upsert() | Atomic operation, prevents race conditions, single round-trip |
| Trigger function permissions | Application-level profile creation | SECURITY DEFINER trigger function | Trigger can't be bypassed, runs with elevated privileges, atomic with user creation |

**Key insight:** The Supabase + Next.js 15 stack provides robust primitives for user-owned resources. Custom solutions add complexity without benefits. Rely on platform features: RLS for security, triggers for atomicity, upsert for idempotency, Server Actions for mutations.

## Common Pitfalls

### Pitfall 1: Trigger Failure Blocks Signups
**What goes wrong:** If the brand profile creation trigger throws an error, user signup fails silently or with cryptic database errors.
**Why it happens:** Triggers run in the same transaction as the INSERT that fired them. Any failure rolls back the entire transaction.
**How to avoid:**
- Test trigger thoroughly with invalid data scenarios
- Use default values that always pass validation
- Consider making some columns nullable in v1, enforce completion later
- Monitor Supabase logs for trigger errors
**Warning signs:** Users report signup failures, database shows auth.users records without corresponding brand_profiles

### Pitfall 2: RLS Policy Without Index
**What goes wrong:** Queries on brand_profiles become slow as user base grows, even though each user only has one profile.
**Why it happens:** RLS policies add WHERE clauses to every query. Without an index on user_id, Postgres does a sequential scan.
**How to avoid:** Always create index on columns used in RLS policies: `CREATE INDEX idx_brand_profiles_user_id ON brand_profiles(user_id);`
**Warning signs:** Slow dashboard loads, Supabase dashboard shows "sequential scan" in query plans

### Pitfall 3: Auth.uid() Null Handling
**What goes wrong:** RLS policies silently fail to return rows for unauthenticated users because `auth.uid()` returns null.
**Why it happens:** `null = user_id` evaluates to null (not false), so USING clause fails silently.
**How to avoid:**
- Always use `TO authenticated` to restrict policies to logged-in users
- Middleware should redirect unauthenticated users before they hit protected pages
- In policies, can add explicit null check: `auth.uid() IS NOT NULL AND auth.uid() = user_id`
**Warning signs:** "No rows returned" errors for authenticated users, RLS debugging shows null auth.uid()

### Pitfall 4: Missing SELECT Policy for UPDATE
**What goes wrong:** UPDATE operations fail even though user owns the row and UPDATE policy exists.
**Why it happens:** Postgres needs SELECT permission to verify the row matches USING clause before applying WITH CHECK.
**How to avoid:** Always create both SELECT and UPDATE policies for user-owned resources. Update requires SELECT to find the row.
**Warning signs:** Updates fail with "permission denied" despite correct user_id, SELECT works but UPDATE doesn't

### Pitfall 5: Color Input Format Mismatch
**What goes wrong:** Color values stored as 'rgb(59, 130, 246)' or '#3b82f6aa' (8-digit) instead of '#3b82f6' (6-digit hex).
**Why it happens:** Some color pickers return different formats, or developers accept any CSS color value.
**How to avoid:**
- Use HTML5 `<input type="color">` which always returns 7-character hex (#rrggbb)
- Add Zod validation: `.regex(/^#[0-9A-Fa-f]{6}$/)`
- Add database CHECK constraint: `CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$')`
- Normalize input to lowercase in database: `LOWER(primary_color)`
**Warning signs:** N8N workflow receives malformed color values, ImageB template rendering fails

### Pitfall 6: Upsert Without onConflict Specification
**What goes wrong:** Upsert uses primary key (id) instead of unique constraint (user_id), creates duplicate profiles.
**Why it happens:** Postgres defaults to primary key for conflict detection. New UUID id means no conflict detected.
**How to avoid:** Always specify `onConflict: 'user_id'` when upserting brand profiles.
**Warning signs:** Users have multiple brand profiles, latest update doesn't show, unique constraint violations

### Pitfall 7: Server Action Redirect in Try/Catch
**What goes wrong:** Redirect doesn't execute after successful save, user sees error boundary.
**Why it happens:** redirect() throws an error internally to interrupt execution. If caught by try/catch, redirect doesn't happen.
**How to avoid:** Call redirect() outside try/catch blocks, after all async operations complete.
```typescript
// WRONG
try {
  await supabase.from('brand_profiles').upsert(...)
  redirect('/dashboard') // This throws, gets caught
} catch (error) {
  return { error: error.message }
}

// CORRECT
try {
  await supabase.from('brand_profiles').upsert(...)
} catch (error) {
  return { error: error.message }
}
redirect('/dashboard') // Outside try/catch
```
**Warning signs:** Forms submit successfully but don't redirect, error logs show "redirect" errors

## Code Examples

Verified patterns from official sources:

### Check Brand Profile Completion
```typescript
// Source: Supabase maybeSingle() pattern
import { createClient } from '@/lib/supabase/server'

export async function checkBrandProfileComplete(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  const { data: profile, error } = await supabase
    .from('brand_profiles')
    .select('brand_name, voice_guidelines, product_description')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Error checking brand profile:', error)
    return false
  }

  if (!profile) {
    return false
  }

  // Check if profile has been customized beyond defaults
  return (
    profile.brand_name !== 'My Brand' &&
    profile.voice_guidelines !== 'Professional and helpful' &&
    profile.product_description !== 'Enter your product description'
  )
}
```

### Brand Settings Form (Client Component)
```typescript
// Source: Next.js 15 Server Actions pattern
'use client'

import { useActionState } from 'react'
import { saveBrandProfile } from './actions'

type BrandProfile = {
  brandName: string
  primaryColor: string
  secondaryColor: string
  voiceGuidelines: string
  productDescription: string
  targetAudience: string
  ctaText: string
}

type FormState = {
  errors?: {
    brandName?: string[]
    primaryColor?: string[]
    secondaryColor?: string[]
    voiceGuidelines?: string[]
    productDescription?: string[]
    targetAudience?: string[]
    ctaText?: string[]
  }
  message?: string
}

export function BrandSettingsForm({ initialData }: { initialData: BrandProfile }) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    saveBrandProfile,
    {}
  )

  return (
    <form action={formAction}>
      <div>
        <label htmlFor="brandName">Brand Name</label>
        <input
          type="text"
          id="brandName"
          name="brandName"
          defaultValue={initialData.brandName}
          required
        />
        {state.errors?.brandName && (
          <p className="text-red-500">{state.errors.brandName[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="primaryColor">Primary Color</label>
        <input
          type="color"
          id="primaryColor"
          name="primaryColor"
          defaultValue={initialData.primaryColor}
          required
        />
        {state.errors?.primaryColor && (
          <p className="text-red-500">{state.errors.primaryColor[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="secondaryColor">Secondary Color</label>
        <input
          type="color"
          id="secondaryColor"
          name="secondaryColor"
          defaultValue={initialData.secondaryColor}
          required
        />
        {state.errors?.secondaryColor && (
          <p className="text-red-500">{state.errors.secondaryColor[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="voiceGuidelines">Voice Guidelines</label>
        <textarea
          id="voiceGuidelines"
          name="voiceGuidelines"
          defaultValue={initialData.voiceGuidelines}
          rows={4}
          placeholder="Describe your brand voice (e.g., professional, casual, technical)"
          required
        />
        {state.errors?.voiceGuidelines && (
          <p className="text-red-500">{state.errors.voiceGuidelines[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="productDescription">Product Description</label>
        <textarea
          id="productDescription"
          name="productDescription"
          defaultValue={initialData.productDescription}
          rows={4}
          placeholder="Describe what your product/service does"
          required
        />
        {state.errors?.productDescription && (
          <p className="text-red-500">{state.errors.productDescription[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="targetAudience">Target Audience</label>
        <textarea
          id="targetAudience"
          name="targetAudience"
          defaultValue={initialData.targetAudience}
          rows={3}
          placeholder="Describe your ideal customer"
          required
        />
        {state.errors?.targetAudience && (
          <p className="text-red-500">{state.errors.targetAudience[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="ctaText">Call-to-Action Text</label>
        <input
          type="text"
          id="ctaText"
          name="ctaText"
          defaultValue={initialData.ctaText}
          placeholder="e.g., Learn More, Get Started"
          required
        />
        {state.errors?.ctaText && (
          <p className="text-red-500">{state.errors.ctaText[0]}</p>
        )}
      </div>

      <button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Save Brand Settings'}
      </button>

      {state.message && <p>{state.message}</p>}
    </form>
  )
}
```

### Save Brand Profile Server Action
```typescript
// Source: Next.js 15 Server Actions + Supabase upsert pattern
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BrandProfileSchema } from '@/lib/validations/brand'

export async function saveBrandProfile(
  prevState: any,
  formData: FormData
) {
  // Validate input
  const validatedFields = BrandProfileSchema.safeParse({
    brandName: formData.get('brandName'),
    primaryColor: formData.get('primaryColor'),
    secondaryColor: formData.get('secondaryColor'),
    voiceGuidelines: formData.get('voiceGuidelines'),
    productDescription: formData.get('productDescription'),
    targetAudience: formData.get('targetAudience'),
    ctaText: formData.get('ctaText'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check your inputs.',
    }
  }

  // Get authenticated user
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      message: 'Unauthorized. Please log in.',
    }
  }

  // Upsert brand profile (atomic insert-or-update)
  const { error } = await supabase
    .from('brand_profiles')
    .upsert({
      user_id: user.id,
      brand_name: validatedFields.data.brandName,
      primary_color: validatedFields.data.primaryColor,
      secondary_color: validatedFields.data.secondaryColor,
      voice_guidelines: validatedFields.data.voiceGuidelines,
      product_description: validatedFields.data.productDescription,
      target_audience: validatedFields.data.targetAudience,
      cta_text: validatedFields.data.ctaText,
    }, {
      onConflict: 'user_id', // Critical: use unique constraint, not primary key
    })

  if (error) {
    console.error('Supabase upsert error:', error)
    return {
      message: 'Failed to save brand profile. Please try again.',
    }
  }

  // Revalidate cache and redirect
  revalidatePath('/dashboard')
  revalidatePath('/brand')
  redirect('/dashboard') // Must be outside try/catch
}
```

### Fetch Brand Profile for Form
```typescript
// Source: Supabase RLS + Server Component pattern
import { createClient } from '@/lib/supabase/server'
import { BrandSettingsForm } from './brand-settings-form'

export default async function BrandPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch brand profile (RLS ensures user can only see own profile)
  const { data: profile, error } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single() // Expect exactly one row (1:1 relationship)

  if (error) {
    console.error('Error fetching brand profile:', error)
    // Profile should always exist due to trigger, but handle gracefully
    return <div>Error loading brand settings. Please try refreshing.</div>
  }

  return (
    <div>
      <h1>Brand Settings</h1>
      <BrandSettingsForm
        initialData={{
          brandName: profile.brand_name,
          primaryColor: profile.primary_color,
          secondaryColor: profile.secondary_color,
          voiceGuidelines: profile.voice_guidelines,
          productDescription: profile.product_description,
          targetAudience: profile.target_audience,
          ctaText: profile.cta_text,
        }}
      />
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| API routes for mutations | Server Actions | Next.js 13.4 (2023), stable in 15 | Simpler code, type-safe, progressive enhancement, no separate API layer |
| useFormState | useActionState | React 19 (2024), Next.js 15 | Renamed hook with same functionality, better naming convention |
| Manual insert/update logic | Supabase upsert | Always available, best practice emerged 2024 | Atomic operations, prevents race conditions, simpler code |
| External color picker libraries | HTML5 input type=color | Universal support by 2026 | Zero dependencies, native UX, automatic validation |
| Frontend profile creation | Database trigger auto-creation | Supabase best practice (2024-2026) | Can't be bypassed, atomic with signup, reduces failure modes |
| middleware.ts | proxy.ts | Next.js 16 (future) | Not yet adopted, but on roadmap for renaming |

**Deprecated/outdated:**
- **react-color (unmaintained):** Last update 2018, use react-colorful or native HTML5 instead
- **Manual user_id from session:** Use auth.uid() in RLS policies, more secure and can't be spoofed
- **FOR ALL RLS policies:** Split into separate SELECT, INSERT, UPDATE, DELETE policies for granular control
- **single() for existence checks:** Use maybeSingle() to avoid 406 errors when row doesn't exist

## Open Questions

1. **Should we enforce brand profile completion immediately or allow partial saves?**
   - What we know: Requirements say "prompted on first carousel generation attempt" (BRND-01)
   - What's unclear: Can users navigate away from form and complete later, or must they finish before accessing dashboard?
   - Recommendation: Allow partial saves (upsert handles this naturally), check completion state before carousel generation, block generation with friendly prompt if incomplete

2. **How to handle users who signed up before trigger was deployed?**
   - What we know: Trigger only fires on INSERT, existing users won't have brand profiles
   - What's unclear: Should we backfill existing users with default profiles?
   - Recommendation: Run one-time migration to insert default profiles for existing users, or handle gracefully in code with "profile doesn't exist" fallback

3. **Should colors be stored as uppercase or lowercase hex?**
   - What we know: HTML5 color input returns lowercase, Postgres regex CHECK constraint accepts both
   - What's unclear: Does N8N workflow or ImageB template expect specific casing?
   - Recommendation: Normalize to lowercase in database (LOWER(primary_color)), verify ImageB template accepts lowercase hex

## Sources

### Primary (HIGH confidence)
- Supabase Row Level Security documentation - https://supabase.com/docs/guides/database/postgres/row-level-security - RLS policy patterns, auth.uid() usage
- Supabase Managing User Data - https://supabase.com/docs/guides/auth/managing-user-data - User profile table patterns, foreign key constraints
- Supabase Postgres Triggers - https://supabase.com/docs/guides/database/postgres/triggers - Trigger function creation, security definer pattern
- Supabase JavaScript Upsert - https://supabase.com/docs/reference/javascript/upsert - Upsert syntax, onConflict usage
- Next.js Server Actions - https://nextjs.org/docs/app/getting-started/updating-data - Server Actions pattern, redirect behavior
- Next.js Redirecting - https://nextjs.org/docs/app/api-reference/functions/redirect - Redirect function, POST-redirect-GET pattern
- MDN input type=color - https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color - Color input validation, format specification

### Secondary (MEDIUM confidence)
- Makerkit Next.js Server Actions Guide (2026) - https://makerkit.dev/blog/tutorials/nextjs-server-actions - Comprehensive Server Actions patterns
- DesignRevision Supabase RLS Guide (2026) - https://designrevision.com/blog/supabase-row-level-security - RLS best practices and common pitfalls
- SupaExplorer UPSERT best practices - https://supaexplorer.com/best-practices/supabase-postgres/data-upsert/ - When to use upsert vs insert/update
- Multiple tutorials on Supabase trigger-based profile creation - Community consensus on auto-creation pattern

### Tertiary (LOW confidence)
- WebSearch: "react-colorful" npm package (2.8KB) - Alternative if native color input UX is insufficient
- WebSearch: Next.js middleware rename to proxy.ts (future Next.js 16) - Not yet released, marked for validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, patterns verified in official docs
- Architecture: HIGH - RLS patterns, triggers, upsert all documented in Supabase official docs
- Pitfalls: MEDIUM-HIGH - Common pitfalls verified in official docs (RLS null handling, redirect in try/catch) and community discussions (trigger failures, missing indexes)

**Research date:** 2026-02-22
**Valid until:** 2026-03-24 (30 days - stable stack, mature patterns)
