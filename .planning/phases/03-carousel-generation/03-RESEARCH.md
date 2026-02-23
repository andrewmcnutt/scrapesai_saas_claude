# Phase 3: Carousel Generation - Research

**Researched:** 2026-02-22
**Domain:** Async job processing, webhook integration, file downloads, multi-step forms
**Confidence:** HIGH

## Summary

Phase 3 implements carousel generation with N8N webhook integration, requiring async job status tracking (60-180s processing time), multi-step wizard forms, client-side ZIP downloads, and carousel history with image galleries. The technical challenge centers on webhook-driven async workflows with credit deduction, timeout/refund handling, and polling-based status updates.

The project already uses Next.js 15 App Router with Server Actions, Supabase with RLS, and Zod validation. Phase 3 extends this foundation with: (1) database schema for carousel jobs with status tracking, (2) Route Handlers for N8N webhooks with HMAC verification, (3) client-side polling with exponential backoff, (4) JSZip for browser-based ZIP generation, and (5) multi-step form wizard pattern for generation flow.

**Primary recommendation:** Use PostgreSQL job status pattern with `FOR UPDATE SKIP LOCKED` for atomic credit deduction, implement HMAC signature verification for N8N callback security, poll status with exponential backoff (2s→4s→8s, max 5min), generate ZIP files client-side with JSZip to avoid server memory overhead, and use React state machine pattern for wizard steps.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Generation form layout:** Stepped wizard flow: Step 1 (Idea) → Step 2 (Template) → Step 3 (Style) → Generate. Each step shown one at a time, guided progression.
- **Idea input:** Structured fields: separate inputs for topic, key points, and tone. Not a single free-form text area — give the user guidance and structure.
- **Template selection:** Visual grid of 5-6 template preview thumbnails. User clicks a thumbnail to select — all options visible at once. Selected template gets a highlighted/active state.
- **Image style picker:** Style cards with visual preview for each of the 4 presets. Each card shows an example of that style so the user knows what they're choosing. "Custom" option expands an input field for user-defined style description.
- **Slide navigation:** Slide-by-slide view with left/right arrows for navigation. Thumbnail strip below the main slide viewer for jumping to specific slides. Large preview of the current slide as the focal point.
- **Post body text placement:** Post body text displayed in a text section below the slide viewer. Clearly separated from the slide content.
- **Action placement:** Download ZIP and Regenerate buttons in an action bar below the slides, after the post body text.
- **Generation completion flow:** Brief success screen ("Your carousel is ready!") with a "View Carousel" button. Not a direct transition — give the user a moment before showing slides.

### Claude's Discretion
- Wait experience during 60-180s generation (progress indicators, animations, whether user can navigate away)
- History browsing layout (card grid vs list, info per entry, pagination style)
- Loading states and error handling
- Exact wizard step transitions and animations
- Thumbnail strip styling and behavior
- Empty state for history page

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

This phase must address 32 requirements across carousel generation, history, and N8N integration:

| ID | Description | Research Support |
|----|-------------|-----------------|
| GEN-01 | User can input carousel idea as text from dashboard | Multi-step wizard pattern with structured form fields |
| GEN-02 | User can select carousel template from 5-6 options (template URLs provided externally) | Database schema stores template_url, UI displays grid with thumbnails |
| GEN-03 | User can select image style from 4 presets (Technical Annotation, Realism Notebook, White Board Diagram, Comic Strip Storyboard) | Enum/constant values in database, visual style cards in UI |
| GEN-04 | User can enter custom image style as free text | Conditional field in wizard when "Custom" selected |
| GEN-05 | System sends idea, template URL, image style, and brand data to N8N webhook | Route Handler POST to N8N with brand profile joined data |
| GEN-06 | System deducts 1 credit atomically before calling N8N (PostgreSQL RPC with SELECT FOR UPDATE) | Use existing `deduct_credit()` RPC function from Phase 1 migration |
| GEN-07 | N8N workflow processes request and returns carousel image URLs (5-10 slides from ImageB) and post body text | N8N callback Route Handler receives job_id, image_urls[], post_body_text |
| GEN-08 | Generated carousel displays on dashboard with all slides visible | Carousel viewer component with image gallery library |
| GEN-09 | Generated post body text displays with carousel | Text display section below slide viewer |
| GEN-10 | User can download all carousel images as single zip file | JSZip client-side generation from image URLs |
| GEN-11 | User can regenerate carousel with same settings (costs another credit) | Store generation params in database, copy to new job on regenerate |
| GEN-12 | Generation handles N8N async processing (60-180s) without frontend timeout | Job status polling with exponential backoff, no synchronous waits |
| GEN-13 | Generation status updates in UI (polling with exponential backoff: 2s, 4s, 8s intervals) | Client-side polling loop with interval state management |
| GEN-14 | Failed generations (timeout after 5 minutes) refund credit automatically | Database trigger or scheduled job to detect pending jobs older than 5min |
| GEN-15 | Generate button is debounced to prevent double-click double-spend | React state + disabled button during submission |
| HIST-01 | All generated carousels auto-save to user's history | Every job record persists in carousels table |
| HIST-02 | User can view history page showing all past carousels | Supabase query with RLS filtering user_id |
| HIST-03 | History displays original idea, selected template, selected style, generation timestamp | Database columns: idea_topic, idea_key_points, template_url, image_style, created_at |
| HIST-04 | User can view any historical carousel with full slides and post body | Navigation to carousel detail page by ID |
| HIST-05 | User can download historical carousels as zip | Same JSZip download function works for any carousel record |
| HIST-06 | History is paginated (infinite scroll or page-based navigation) | Supabase pagination with offset/limit or cursor-based |
| N8N-01 | Existing N8N workflow updated to write to Supabase (not Airtable) | N8N workflow modification (outside Next.js codebase) |
| N8N-02 | Generation endpoint sends POST to N8N with: idea, template_url, image_style, brand data | Server Action calls Route Handler that POSTs to N8N webhook URL |
| N8N-03 | N8N webhook returns 202 Accepted with job_id for async processing | N8N responds immediately, processing happens async |
| N8N-04 | N8N callback webhook receives: job_id, image_urls[], post_body_text | Route Handler at /api/webhooks/n8n/callback validates and updates DB |
| N8N-05 | N8N callback verifies HMAC signature or API key | HMAC SHA256 verification using crypto.createHmac() with raw body |
| N8N-06 | Callback updates carousel record from status='pending' to status='completed' | Database UPDATE by job_id with status transition |
| N8N-07 | System retries callback failures with exponential backoff | N8N-side retry logic, not Next.js responsibility |
| N8N-08 | Daily reconciliation job compares ImageB uploads vs database records | Out of scope for initial implementation, future enhancement |
| N8N-09 | Orphaned images (exist in ImageB but not database) trigger manual review alert | Out of scope for initial implementation, future enhancement |
| N8N-10 | Integration uses N8N-MCP GitHub repository for workflow editing | N8N workflow lives in separate repo, referenced but not in codebase |
| UI-05 | Dashboard displays generation status with progress indicators | Polling status component with loading states and progress messages |

**Notes:**
- N8N-08 and N8N-09 are reconciliation requirements, deferred to post-launch operations
- N8N-10 references external workflow repo, not Next.js code changes
- Requirements depend on existing Phase 1 infrastructure: credit ledger, RLS policies, Supabase client patterns
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.1.6 | Framework (already installed) | App Router with Route Handlers for webhooks, Server Actions for forms, React 19 support |
| @supabase/supabase-js | 2.97.0 | Database client (already installed) | Existing auth/RLS infrastructure, query patterns established |
| Zod | 4.3.6 | Validation (already installed) | Type-safe schemas for form validation, established pattern in Phase 2 |
| jszip | ^3.10.1 | Client-side ZIP generation | Industry standard for browser ZIP creation, 8M+ weekly downloads, dependency-free |
| React | 19.0.0 | UI library (already installed) | New hooks (useOptimistic, useFormStatus) support async form patterns |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| swiper | ^11.1.0 | Carousel/slider component | Image gallery viewer with thumbnails, touch/keyboard support, 4M+ weekly downloads |
| exponential-backoff | ^3.1.1 | Polling retry logic | Handles backoff intervals (2s, 4s, 8s) with jitter and max attempts |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jszip | client-zip | client-zip is 40x faster and lighter (2.6KB), but jszip has more features (edit existing zips, node.js compatibility). For simple create-and-download use case, either works. jszip chosen for maturity and ecosystem support. |
| swiper | react-slick | react-slick is older and more widely known, but swiper has better performance, modern API, and active maintenance. Swiper is lighter and supports virtual slides for large datasets. |
| exponential-backoff | Custom implementation | Custom polling is 20 lines of code, but library provides battle-tested jitter, max delay caps, and error handling edge cases. Use library to avoid subtle bugs. |
| Polling | WebSockets/SSE | WebSockets add infrastructure complexity (connection management, Redis pub/sub). Polling with exponential backoff is simpler for 60-180s wait times. SSE is one-directional and doesn't work well with Vercel serverless limits. |

**Installation:**
```bash
npm install jszip swiper exponential-backoff
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── generate/
│   │   │   ├── page.tsx              # Multi-step wizard form
│   │   │   └── actions.ts            # Server Action: initiate generation
│   │   ├── carousel/
│   │   │   └── [id]/
│   │   │       └── page.tsx          # View carousel with slides
│   │   └── history/
│   │       └── page.tsx              # Paginated carousel history
│   └── api/
│       ├── generate/
│       │   └── route.ts              # POST to N8N, return job_id
│       └── webhooks/
│           └── n8n/
│               └── callback/
│                   └── route.ts      # N8N callback receiver
├── components/
│   ├── CarouselViewer.tsx            # Slide viewer with nav controls
│   ├── GenerationWizard.tsx          # Multi-step form wrapper
│   ├── TemplateSelector.tsx          # Template grid component
│   ├── StylePicker.tsx               # Image style selector
│   └── GenerationPolling.tsx         # Status polling component
└── lib/
    ├── carousel/
    │   ├── download-zip.ts           # JSZip download function
    │   ├── poll-status.ts            # Polling logic with backoff
    │   └── verify-webhook.ts         # HMAC signature verification
    └── validations/
        └── carousel.ts               # Zod schemas for generation
```

### Pattern 1: Atomic Credit Deduction with Job Creation

**What:** Deduct credit and create carousel job in a single database transaction to prevent race conditions.

**When to use:** Before calling N8N webhook to ensure credit is deducted only if job record is created.

**Example:**
```typescript
// Server Action or Route Handler
async function initiateGeneration(params: GenerationParams) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Step 1: Atomic credit deduction (uses Phase 1 RPC)
  const { data: deductionResult, error: deductError } = await supabase
    .rpc('deduct_credit', {
      p_user_id: user.id,
      p_amount: 1,
      p_type: 'generation_deduction',
      p_metadata: { carousel_type: 'standard' }
    })

  if (deductError) {
    throw new Error('Insufficient credits')
  }

  // Step 2: Create carousel job record
  const { data: carousel, error: insertError } = await supabase
    .from('carousels')
    .insert({
      user_id: user.id,
      status: 'pending',
      idea_topic: params.topic,
      idea_key_points: params.keyPoints,
      idea_tone: params.tone,
      template_url: params.templateUrl,
      image_style: params.imageStyle,
      transaction_id: deductionResult.transaction_id
    })
    .select()
    .single()

  if (insertError) {
    // Refund credit if job creation fails
    await supabase.from('credit_transactions').insert({
      user_id: user.id,
      amount: 1,
      type: 'refund',
      metadata: { reason: 'job_creation_failed' }
    })
    throw new Error('Failed to create carousel job')
  }

  // Step 3: Call N8N webhook (fire-and-forget)
  await fetch(process.env.N8N_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job_id: carousel.id,
      idea: { topic: params.topic, key_points: params.keyPoints, tone: params.tone },
      template_url: params.templateUrl,
      image_style: params.imageStyle,
      brand: params.brandData
    })
  })

  return { job_id: carousel.id }
}
```

**Source:** Adapted from [PostgreSQL job queue pattern](https://aminediro.com/posts/pg_job_queue/) and existing `deduct_credit()` RPC from Phase 1 migration.

### Pattern 2: HMAC Webhook Signature Verification

**What:** Verify N8N callback authenticity using HMAC-SHA256 signature to prevent unauthorized requests.

**When to use:** In webhook Route Handler before processing callback data.

**Example:**
```typescript
// /app/api/webhooks/n8n/callback/route.ts
import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const rawBody = await request.text() // CRITICAL: Must use raw body, not .json()
  const signature = request.headers.get('x-n8n-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  // Compute expected signature
  const expectedSignature = createHmac('sha256', process.env.N8N_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex')

  // Timing-safe comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(signature, 'hex')
  const expectedBuffer = Buffer.from(expectedSignature, 'hex')

  if (signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  // Signature valid, proceed with processing
  const payload = JSON.parse(rawBody)
  // ... update database with carousel results

  return NextResponse.json({ success: true })
}
```

**Sources:**
- [HMAC SHA256 webhook verification guide](https://hookdeck.com/webhooks/guides/how-to-implement-sha256-webhook-signature-verification)
- [Node.js crypto HMAC examples](https://www.authgear.com/post/generate-verify-hmac-signatures)

### Pattern 3: Exponential Backoff Polling

**What:** Poll job status with increasing intervals (2s, 4s, 8s, 16s...) up to max timeout.

**When to use:** After initiating generation, to check status until completion or failure.

**Example:**
```typescript
// lib/carousel/poll-status.ts
import { backOff } from 'exponential-backoff'

export async function pollCarouselStatus(jobId: string) {
  const fetchStatus = async () => {
    const response = await fetch(`/api/carousel/${jobId}/status`)
    const data = await response.json()

    if (data.status === 'completed' || data.status === 'failed') {
      return data // Success condition, stops polling
    }

    throw new Error('Still pending') // Triggers retry
  }

  try {
    const result = await backOff(fetchStatus, {
      startingDelay: 2000,      // Start at 2 seconds
      timeMultiple: 2,           // Double each time
      maxDelay: 30000,           // Cap at 30 seconds
      numOfAttempts: 10,         // Max 10 attempts
      retry: (e, attemptNumber) => {
        console.log(`Polling attempt ${attemptNumber}`)
        return true // Always retry until max attempts
      }
    })
    return result
  } catch (error) {
    // Polling timed out, job likely failed
    return { status: 'timeout' }
  }
}
```

**Sources:**
- [exponential-backoff npm package](https://www.npmjs.com/package/exponential-backoff)
- [Polling best practices with backoff](https://betterstack.com/community/guides/monitoring/exponential-backoff/)

### Pattern 4: Multi-Step Wizard State Machine

**What:** Manage wizard steps with React state, validate each step before progression.

**When to use:** Generation form with 3 steps (Idea → Template → Style → Generate).

**Example:**
```typescript
// components/GenerationWizard.tsx
'use client'

import { useState } from 'react'
import { z } from 'zod'

const steps = ['idea', 'template', 'style'] as const
type Step = typeof steps[number]

const IdeaSchema = z.object({
  topic: z.string().min(5),
  keyPoints: z.string().min(10),
  tone: z.enum(['professional', 'casual', 'inspirational'])
})

export function GenerationWizard() {
  const [currentStep, setCurrentStep] = useState<Step>('idea')
  const [formData, setFormData] = useState({
    topic: '',
    keyPoints: '',
    tone: 'professional',
    templateUrl: '',
    imageStyle: ''
  })
  const [errors, setErrors] = useState({})

  const handleNext = () => {
    // Validate current step
    if (currentStep === 'idea') {
      const result = IdeaSchema.safeParse({
        topic: formData.topic,
        keyPoints: formData.keyPoints,
        tone: formData.tone
      })
      if (!result.success) {
        setErrors(result.error.flatten().fieldErrors)
        return
      }
    }

    // Progress to next step
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
      setErrors({})
    }
  }

  const handleBack = () => {
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="flex gap-2 mb-8">
        {steps.map((step, idx) => (
          <div
            key={step}
            className={`flex-1 h-2 rounded ${
              steps.indexOf(currentStep) >= idx ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      {currentStep === 'idea' && (
        <IdeaStep data={formData} setData={setFormData} errors={errors} />
      )}
      {currentStep === 'template' && (
        <TemplateStep data={formData} setData={setFormData} />
      )}
      {currentStep === 'style' && (
        <StyleStep data={formData} setData={setFormData} onSubmit={handleGenerate} />
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        {currentStep !== 'idea' && (
          <button onClick={handleBack}>Back</button>
        )}
        {currentStep !== 'style' && (
          <button onClick={handleNext}>Next</button>
        )}
      </div>
    </div>
  )
}
```

**Sources:**
- [Multi-step forms with React Hook Form and Zod](https://blog.logrocket.com/building-reusable-multi-step-form-react-hook-form-zod/)
- [React wizard pattern best practices](https://makerkit.dev/blog/tutorials/multi-step-forms-reactjs)

### Pattern 5: Client-Side ZIP Download

**What:** Generate ZIP file in browser from image URLs, trigger download without server round-trip.

**When to use:** Download carousel button in carousel viewer and history.

**Example:**
```typescript
// lib/carousel/download-zip.ts
import JSZip from 'jszip'

export async function downloadCarouselZip(
  imageUrls: string[],
  carouselName: string
) {
  const zip = new JSZip()

  // Fetch all images and add to zip
  await Promise.all(
    imageUrls.map(async (url, index) => {
      const response = await fetch(url)
      const blob = await response.blob()
      const extension = url.split('.').pop() || 'png'
      zip.file(`slide-${index + 1}.${extension}`, blob)
    })
  )

  // Generate ZIP blob
  const zipBlob = await zip.generateAsync({ type: 'blob' })

  // Trigger download
  const link = document.createElement('a')
  link.href = URL.createObjectURL(zipBlob)
  link.download = `${carouselName}-carousel.zip`
  link.click()
  URL.revokeObjectURL(link.href)
}
```

**Sources:**
- [JSZip official documentation](https://stuk.github.io/jszip/)
- [Create ZIP archives in browser guide](https://transloadit.com/devtips/create-zip-archives-in-the-browser-with-jszip/)

### Anti-Patterns to Avoid

- **Synchronous N8N wait:** Never use `await fetch(n8nUrl)` and wait for processing completion. N8N takes 60-180s. Always use async job pattern with callback.
- **Polling without backoff:** Fixed-interval polling (e.g., every 2s for 5 minutes) wastes resources and hammers database. Use exponential backoff.
- **Server-side ZIP generation:** Fetching images server-side and creating ZIP consumes Vercel function memory and time. Do it client-side with JSZip.
- **Missing HMAC verification:** Accepting webhook callbacks without signature verification allows malicious actors to mark jobs complete or inject fake data.
- **Credit deduction after N8N call:** If credit is deducted after calling N8N but before job creation, a crash between those steps loses the credit without creating a job.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Exponential backoff logic | Manual setTimeout with interval multiplication | exponential-backoff library | Library handles jitter (randomization to prevent thundering herd), max delay caps, attempt limits, and error callback hooks. Custom implementations miss these edge cases. |
| ZIP file generation | Custom binary concatenation or server-side archiving | JSZip (client-side) | ZIP format has complex compression algorithms, CRC checksums, and directory structures. JSZip is battle-tested with 8M+ downloads/week. Server-side generation consumes function memory. |
| HMAC comparison | String equality (`signature === expected`) | crypto.timingSafeEqual() | String comparison leaks timing information (timing attack vulnerability). Constant-time comparison prevents attackers from guessing signatures byte-by-byte. |
| Multi-step form state | Custom useState for each field | React Hook Form (if needed) or simple reducer pattern | For this phase, simple useState is sufficient given the small number of fields. React Hook Form adds complexity not needed for 3-step linear flow. |
| Image carousel UI | Custom prev/next button logic with index state | Swiper library | Carousel needs touch gestures, keyboard nav, thumbnail sync, lazy loading, and responsive breakpoints. Swiper handles these with 4M+ downloads/week. |

**Key insight:** Async job processing patterns are deceptively complex. Webhook authentication, race conditions in credit deduction, and timeout handling all have subtle edge cases that cause production bugs. Use proven patterns (job status table, HMAC verification, atomic transactions) rather than inventing custom solutions.

## Common Pitfalls

### Pitfall 1: Race Condition in Credit Deduction

**What goes wrong:** User clicks Generate button twice rapidly. Two requests deduct 2 credits, both create jobs, but user expects only 1 generation.

**Why it happens:** Without button debouncing or transaction-level locking, concurrent requests both see sufficient balance and proceed.

**How to avoid:**
1. Disable Generate button immediately on first click using React state
2. Use existing `deduct_credit()` RPC with `SELECT FOR UPDATE` lock (already in Phase 1 migration)
3. Add unique constraint on carousel creation if regenerating same params within time window

**Warning signs:** Users report "lost credits" without corresponding carousels in history, duplicate carousel jobs with identical timestamps.

### Pitfall 2: Webhook Replay Attacks

**What goes wrong:** Attacker captures valid N8N callback request and replays it multiple times, marking jobs complete without actual processing.

**Why it happens:** Missing HMAC signature verification or using non-constant-time string comparison.

**How to avoid:**
1. Require `x-n8n-signature` header with HMAC-SHA256 of raw request body
2. Use `crypto.timingSafeEqual()` for signature comparison (prevents timing attacks)
3. Optional: Add nonce/timestamp to prevent replay (check timestamp is within 5 minutes)

**Warning signs:** Jobs marked complete without images, signature mismatches in logs, suspicious callback patterns.

### Pitfall 3: Polling Timeout Without Refund

**What goes wrong:** Generation takes >5 minutes due to N8N failure. Frontend stops polling, job stays "pending" forever, credit never refunded.

**Why it happens:** No server-side timeout detection mechanism to auto-refund abandoned jobs.

**How to avoid:**
1. Create database trigger or cron job to detect `status='pending'` AND `created_at < NOW() - INTERVAL '5 minutes'`
2. Auto-transition to `status='failed'` and insert refund transaction
3. Notify user via email (optional future enhancement)

**Warning signs:** Growing number of "pending" jobs in database older than 5 minutes, user complaints about lost credits.

### Pitfall 4: Memory Overflow from Large Carousels

**What goes wrong:** Carousel has 10 high-res images (5MB each). Loading all into browser memory for ZIP generation (50MB total) crashes mobile browsers.

**Why it happens:** JSZip loads full blobs into memory before generating archive.

**How to avoid:**
1. Limit carousel to 10 slides maximum (enforced in N8N workflow)
2. Use streaming generation if needed (JSZip supports `generateAsync({ type: 'blob', streamFiles: true })`)
3. Consider compressing images before download (resize to 1200px width)

**Warning signs:** Mobile users report crashes during download, browser console shows "out of memory" errors.

### Pitfall 5: N8N Callback Lost in Vercel Cold Start

**What goes wrong:** N8N sends callback webhook, but Vercel function is cold-starting. Request times out, N8N doesn't retry, job stuck in "pending".

**Why it happens:** Webhook endpoints have no warm-up guarantee, callback arrives during cold start window.

**How to avoid:**
1. N8N workflow configured to retry callback 3 times with 30s delay (N8N-side config)
2. Webhook endpoint returns 200 immediately after validation, processes update async
3. Consider using Vercel Edge Runtime for webhook endpoints (faster cold start)

**Warning signs:** Jobs stuck in "pending" state with no callback logged, N8N logs show timeout errors.

## Code Examples

Verified patterns from research and existing codebase:

### Database Schema for Carousels

```sql
-- Carousel jobs table
CREATE TABLE carousels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'timeout')),

  -- Generation parameters (stored for regeneration)
  idea_topic TEXT NOT NULL,
  idea_key_points TEXT NOT NULL,
  idea_tone TEXT NOT NULL,
  template_url TEXT NOT NULL,
  image_style TEXT NOT NULL,

  -- Results from N8N (populated on completion)
  image_urls TEXT[], -- Array of ImageB URLs
  post_body_text TEXT,

  -- Metadata
  transaction_id UUID REFERENCES credit_transactions(id), -- Link to deduction
  error_message TEXT, -- Populated if status='failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index for user history queries
CREATE INDEX idx_carousels_user_id_created_at ON carousels(user_id, created_at DESC);

-- Index for timeout detection
CREATE INDEX idx_carousels_pending_timeout ON carousels(status, created_at)
  WHERE status = 'pending';

-- RLS policies
ALTER TABLE carousels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own carousels"
  ON carousels FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own carousels"
  ON carousels FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Function to auto-refund timed-out jobs (run via cron or trigger)
CREATE OR REPLACE FUNCTION refund_timeout_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Find jobs pending for >5 minutes
  UPDATE carousels
  SET status = 'timeout',
      error_message = 'Generation timed out after 5 minutes'
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '5 minutes';

  -- Refund credits for newly timed-out jobs
  INSERT INTO credit_transactions (user_id, amount, type, metadata)
  SELECT
    user_id,
    1, -- Refund 1 credit
    'refund',
    jsonb_build_object('reason', 'timeout', 'carousel_id', id)
  FROM carousels
  WHERE status = 'timeout'
    AND completed_at IS NULL; -- Not already refunded

  -- Mark as completed to prevent duplicate refunds
  UPDATE carousels
  SET completed_at = NOW()
  WHERE status = 'timeout' AND completed_at IS NULL;
END;
$$;
```

**Source:** Adapted from [PostgreSQL job queue implementation](https://medium.com/@epam.macys/implementing-efficient-queue-systems-in-postgresql-c219ccd56327) and existing Phase 1 RLS patterns.

### Server Action: Initiate Generation

```typescript
// app/(dashboard)/generate/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { GenerationSchema } from '@/lib/validations/carousel'

export async function initiateGeneration(
  prevState: any,
  formData: FormData
) {
  const validated = GenerationSchema.safeParse({
    topic: formData.get('topic'),
    keyPoints: formData.get('keyPoints'),
    tone: formData.get('tone'),
    templateUrl: formData.get('templateUrl'),
    imageStyle: formData.get('imageStyle')
  })

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: 'Validation failed'
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { message: 'Unauthorized' }
  }

  // Fetch brand data
  const { data: brand } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!brand) {
    return { message: 'Please complete your brand profile first' }
  }

  try {
    // Step 1: Deduct credit atomically
    const { data: deduction, error: deductError } = await supabase
      .rpc('deduct_credit', {
        p_user_id: user.id,
        p_amount: 1,
        p_type: 'generation_deduction',
        p_metadata: { action: 'carousel_generation' }
      })

    if (deductError) {
      return { message: 'Insufficient credits. Please upgrade your plan.' }
    }

    // Step 2: Create carousel job
    const { data: carousel, error: insertError } = await supabase
      .from('carousels')
      .insert({
        user_id: user.id,
        status: 'pending',
        idea_topic: validated.data.topic,
        idea_key_points: validated.data.keyPoints,
        idea_tone: validated.data.tone,
        template_url: validated.data.templateUrl,
        image_style: validated.data.imageStyle,
        transaction_id: deduction.transaction_id
      })
      .select()
      .single()

    if (insertError) {
      // Refund on failure
      await supabase.from('credit_transactions').insert({
        user_id: user.id,
        amount: 1,
        type: 'refund',
        metadata: { reason: 'job_creation_failed' }
      })
      return { message: 'Failed to create generation job' }
    }

    // Step 3: Call N8N webhook (async, fire-and-forget)
    await fetch(process.env.N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: carousel.id,
        idea: {
          topic: validated.data.topic,
          key_points: validated.data.keyPoints,
          tone: validated.data.tone
        },
        template_url: validated.data.templateUrl,
        image_style: validated.data.imageStyle,
        brand: {
          name: brand.brand_name,
          primary_color: brand.primary_color,
          secondary_color: brand.secondary_color,
          voice_guidelines: brand.voice_guidelines,
          product_description: brand.product_description,
          target_audience: brand.target_audience,
          cta_text: brand.cta_text
        }
      })
    })

    return {
      success: true,
      job_id: carousel.id,
      message: 'Generation started! This will take 60-180 seconds.'
    }
  } catch (error) {
    console.error('Generation error:', error)
    return { message: 'An unexpected error occurred' }
  }
}
```

**Source:** Adapted from [Next.js 15 Server Actions with Zod validation](https://www.freecodecamp.org/news/handling-forms-nextjs-server-actions-zod/) and existing Phase 2 brand action patterns.

### Webhook Route Handler: N8N Callback

```typescript
// app/api/webhooks/n8n/callback/route.ts
import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key for webhook (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  // CRITICAL: Get raw body for signature verification
  const rawBody = await request.text()
  const signature = request.headers.get('x-n8n-signature')

  if (!signature) {
    console.error('Missing signature header')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify HMAC signature
  const expectedSignature = createHmac('sha256', process.env.N8N_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex')

  const signatureBuffer = Buffer.from(signature, 'hex')
  const expectedBuffer = Buffer.from(expectedSignature, 'hex')

  if (signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    console.error('Invalid signature')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Parse payload after verification
  const payload = JSON.parse(rawBody)
  const { job_id, image_urls, post_body_text, status } = payload

  if (!job_id) {
    return NextResponse.json({ error: 'Missing job_id' }, { status: 400 })
  }

  // Update carousel record
  const { error } = await supabase
    .from('carousels')
    .update({
      status: status || 'completed',
      image_urls,
      post_body_text,
      completed_at: new Date().toISOString()
    })
    .eq('id', job_id)

  if (error) {
    console.error('Database update error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  console.log(`Carousel ${job_id} marked as ${status || 'completed'}`)
  return NextResponse.json({ success: true })
}
```

**Sources:**
- [Next.js 15 Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [HMAC webhook verification](https://hookdeck.com/webhooks/guides/how-to-implement-sha256-webhook-signature-verification)

### Client Component: Status Polling

```typescript
// components/GenerationPolling.tsx
'use client'

import { useEffect, useState } from 'react'
import { backOff } from 'exponential-backoff'

interface GenerationPollingProps {
  jobId: string
  onComplete: (carousel: any) => void
  onError: (error: string) => void
}

export function GenerationPolling({ jobId, onComplete, onError }: GenerationPollingProps) {
  const [status, setStatus] = useState<string>('pending')
  const [progress, setProgress] = useState<number>(0)

  useEffect(() => {
    const pollStatus = async () => {
      const fetchStatus = async () => {
        const response = await fetch(`/api/carousel/${jobId}`)
        const data = await response.json()

        setStatus(data.status)

        if (data.status === 'completed') {
          onComplete(data)
          return data // Stops polling
        }

        if (data.status === 'failed' || data.status === 'timeout') {
          onError(data.error_message || 'Generation failed')
          return data // Stops polling
        }

        // Still pending, throw to trigger retry
        throw new Error('Still processing')
      }

      try {
        await backOff(fetchStatus, {
          startingDelay: 2000,    // 2 seconds
          timeMultiple: 2,         // Double each time
          maxDelay: 8000,          // Cap at 8 seconds
          numOfAttempts: 40,       // ~5 minutes total
          retry: (e, attemptNumber) => {
            setProgress(Math.min(attemptNumber * 2.5, 95)) // Visual progress
            console.log(`Polling attempt ${attemptNumber}`)
            return true
          }
        })
      } catch (error) {
        onError('Generation timed out. Your credit has been refunded.')
      }
    }

    pollStatus()
  }, [jobId, onComplete, onError])

  return (
    <div className="text-center py-12">
      <div className="mb-4">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
      <h2 className="text-xl font-semibold mb-2">
        {status === 'pending' ? 'Generating your carousel...' : 'Processing...'}
      </h2>
      <p className="text-gray-600 mb-4">
        This typically takes 60-180 seconds. You can leave this page and check back later.
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2 max-w-md mx-auto">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
```

**Sources:**
- [exponential-backoff usage](https://www.npmjs.com/package/exponential-backoff)
- [React 19 new hooks](https://www.freecodecamp.org/news/react-19-new-hooks-explained-with-examples/)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Synchronous webhook responses | Async job pattern with callbacks | 2020-2022 | Webhooks return 202 Accepted immediately, process async. Prevents timeout issues with long-running tasks. |
| String comparison for signatures | crypto.timingSafeEqual() | 2019 | Constant-time comparison prevents timing attacks. Node.js crypto module is built-in standard. |
| Server-side ZIP generation | Client-side with JSZip | 2018-2020 | Reduces server memory usage, faster downloads, works with Vercel serverless limits. |
| Fixed-interval polling | Exponential backoff | 2017-2019 | Reduces unnecessary requests, gentler on servers, faster user feedback when job completes. |
| React Hook Form for all forms | useActionState for simple forms | 2024 (React 19) | React 19's useActionState handles basic Server Action forms without RHF overhead. Use RHF only for complex validation. |

**Deprecated/outdated:**
- **Pages Router API Routes:** Next.js 15 App Router uses Route Handlers (`app/api/*/route.ts`) instead of Pages Router (`pages/api/*.ts`). Route Handlers support streaming, Edge Runtime, and better TypeScript integration.
- **getSession() for auth:** Supabase SSR now recommends `getUser()` or `getClaims()` for token validation (already adopted in Phase 1).
- **Client-side Supabase queries in components:** Use Server Components with async/await for initial data, client components only for interactive polling. Reduces client bundle size and improves performance.

## Open Questions

1. **N8N HMAC signature format**
   - What we know: N8N can send custom headers in webhook responses
   - What's unclear: Does N8N natively support HMAC signatures or requires custom code node?
   - Recommendation: Verify N8N workflow can compute HMAC-SHA256 and add `x-n8n-signature` header. If not, use API key in header as fallback (less secure but acceptable for v1).

2. **ImageB URL expiration**
   - What we know: N8N stores images in ImageB, returns URLs
   - What's unclear: Do ImageB URLs expire? If so, what's the TTL?
   - Recommendation: Test URL persistence after 30 days. If URLs expire, implement periodic re-upload or migration to Supabase Storage.

3. **Carousel regeneration credit logic**
   - What we know: Regeneration costs another credit (GEN-11)
   - What's unclear: Should regeneration create new carousel record or update existing?
   - Recommendation: Create new record for clean audit trail. Old carousel stays in history, new one is separate. Users can compare different generations of same idea.

4. **History pagination strategy**
   - What we know: History must be paginated (HIST-06)
   - What's unclear: Infinite scroll vs traditional pagination? Page size?
   - Recommendation: Use traditional pagination (20 per page) with Supabase `.range()`. Infinite scroll adds complexity for small history sizes. Can upgrade later if users have >100 carousels.

5. **N8N callback retry configuration**
   - What we know: N8N should retry failed callbacks (N8N-07)
   - What's unclear: Is retry configured in N8N workflow or should Next.js webhook return retry-friendly status codes?
   - Recommendation: Configure N8N workflow to retry 3 times with 30s delay on 5xx responses. Next.js webhook should return 200 for success, 5xx for transient failures, 4xx for permanent failures (invalid job_id).

## Sources

### Primary (HIGH confidence)

- [Next.js 15 Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) - Webhook endpoint patterns
- [Next.js 15 Server Actions](https://www.freecodecamp.org/news/handling-forms-nextjs-server-actions-zod/) - Form handling with Zod
- [React 19 new hooks](https://react.dev/blog/2024/12/05/react-19) - useOptimistic, useFormStatus, useActionState
- [JSZip official docs](https://stuk.github.io/jszip/) - Client-side ZIP generation API
- [Supabase RLS patterns](https://designrevision.com/blog/supabase-row-level-security) - User-owned resource policies
- [PostgreSQL job queue implementation](https://aminediro.com/posts/pg_job_queue/) - Status tracking with FOR UPDATE SKIP LOCKED
- [exponential-backoff npm](https://www.npmjs.com/package/exponential-backoff) - Polling library configuration

### Secondary (MEDIUM confidence)

- [HMAC webhook verification guide](https://hookdeck.com/webhooks/guides/how-to-implement-sha256-webhook-signature-verification) - Signature patterns
- [Node.js HMAC examples](https://www.authgear.com/post/generate-verify-hmac-signatures) - crypto.createHmac() usage
- [Multi-step forms with Zod](https://blog.logrocket.com/building-reusable-multi-step-form-react-hook-form-zod/) - Wizard validation patterns
- [React carousel libraries comparison](https://www.bacancytechnology.com/blog/react-carousel) - Swiper vs alternatives
- [Swiper official site](https://swiperjs.com/) - Configuration and features
- [PostgreSQL JSONB vs arrays](https://www.heap.io/blog/when-to-avoid-jsonb-in-a-postgresql-schema) - Schema design for image URLs

### Tertiary (LOW confidence)

- [N8N webhook HMAC discussion](https://community.n8n.io/t/feature-proposal-hmac-signature-verification-for-webhook-node/223375) - Community feature request (not implemented natively)
- [pg-boss queue library](https://github.com/timgit/pg-boss) - Alternative to custom job queue pattern (not needed for this phase)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All core libraries already installed (Next.js, Supabase, Zod) or widely adopted (JSZip, Swiper, exponential-backoff)
- Architecture: HIGH - Patterns verified with official docs and existing Phase 1/2 codebase patterns (RLS, Server Actions, Zod validation)
- Pitfalls: MEDIUM - Race conditions, HMAC verification, and timeout handling are documented patterns, but N8N-specific retry behavior needs verification

**Research date:** 2026-02-22
**Valid until:** ~30 days (March 2026) - Stack is stable, but N8N workflow configuration should be verified during implementation
