# Architecture Research

**Domain:** SaaS Platform with Stripe Subscriptions, Supabase Backend, and External Webhook Integrations
**Researched:** 2026-02-21
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                               │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Landing  │  │Dashboard │  │  Brand   │  │ Account  │  │  Auth    │  │
│  │  Pages   │  │  Pages   │  │ Settings │  │  Mgmt    │  │  Pages   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │             │             │             │         │
├───────┴─────────────┴─────────────┴─────────────┴─────────────┴─────────┤
│                         APPLICATION LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌────────────────────┐  ┌─────────────────┐   │
│  │  Client Supabase   │  │   Server Supabase  │  │  Middleware     │   │
│  │  (Browser context) │  │   (Server context) │  │  (Auth guards)  │   │
│  └─────────┬──────────┘  └─────────┬──────────┘  └────────┬────────┘   │
│            │                       │                      │             │
├────────────┴───────────────────────┴──────────────────────┴─────────────┤
│                         INTEGRATION LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────────────┐    │
│  │  Stripe API   │  │  N8N Webhook  │  │   Supabase Database      │    │
│  │  (Checkout,   │  │  (Carousel    │  │   (PostgreSQL + Auth)    │    │
│  │   Portal)     │  │  Generation)  │  │                          │    │
│  └───────┬───────┘  └───────┬───────┘  └───────────┬──────────────┘    │
│          │                  │                      │                    │
│          ↓                  ↓                      ↓                    │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                 WEBHOOK RECEIVERS (API Routes)                  │    │
│  │  /api/webhooks/stripe  |  /api/webhooks/n8n  |  /api/generate   │    │
│  └────────────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────────────┤
│                         DATA PERSISTENCE LAYER                           │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │  Users   │  │  Brands  │  │Carousels │  │  Credits │               │
│  │  (Auth)  │  │  (Data)  │  │(History) │  │ (Usage)  │               │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
│  ┌──────────────────────────────────────────────────────┐              │
│  │         Subscriptions (Synced from Stripe)            │              │
│  └──────────────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────────┘

External Services (Not Hosted):
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    Stripe    │  │     N8N      │  │   ImageB     │
│  (Payments)  │  │ (Workflow)   │  │  (Hosting)   │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Presentation Layer** | User interface, routing, client-side state | Next.js App Router pages, React components, Tailwind CSS |
| **Client Supabase** | Browser-side auth, public queries | `@supabase/ssr` createBrowserClient() |
| **Server Supabase** | Server-side auth, service role operations | `@supabase/ssr` createClient() with server context |
| **Middleware** | Session management, auth guards | Next.js middleware.ts with updateSession() |
| **Webhook Receivers** | Event ingestion, signature verification | Next.js API routes at /api/webhooks/* |
| **Stripe Integration** | Checkout, subscriptions, customer portal | @stripe/stripe-js (client), stripe (server) |
| **N8N Webhook** | Carousel generation via external workflow | HTTP POST to N8N endpoint, receive image URLs |
| **Database** | User data, brand settings, carousel history | Supabase PostgreSQL with Row-Level Security |

## Recommended Project Structure

```
scrapesai_saas_claude/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Route group - auth pages
│   │   ├── login/
│   │   │   └── page.tsx           # Login page
│   │   ├── signup/
│   │   │   └── page.tsx           # Signup page
│   │   └── verify-email/
│   │       └── page.tsx           # Email verification
│   ├── (marketing)/               # Route group - public pages
│   │   ├── page.tsx               # Landing page (root)
│   │   ├── pricing/
│   │   │   └── page.tsx           # Pricing page
│   │   └── layout.tsx             # Marketing layout (no auth required)
│   ├── (dashboard)/               # Route group - authenticated pages
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Dashboard home (carousel creation)
│   │   ├── history/
│   │   │   └── page.tsx           # Carousel history
│   │   ├── brand/
│   │   │   └── page.tsx           # Brand settings
│   │   ├── account/
│   │   │   └── page.tsx           # Account/subscription management
│   │   └── layout.tsx             # Dashboard layout (auth required)
│   ├── api/                       # API routes
│   │   ├── webhooks/
│   │   │   ├── stripe/
│   │   │   │   └── route.ts       # Stripe webhook handler
│   │   │   └── n8n/
│   │   │       └── route.ts       # N8N callback handler
│   │   ├── generate/
│   │   │   └── route.ts           # Trigger N8N carousel generation
│   │   └── stripe/
│   │       ├── checkout/
│   │       │   └── route.ts       # Create checkout session
│   │       └── portal/
│   │           └── route.ts       # Customer portal session
│   ├── layout.tsx                 # Root layout
│   └── error.tsx                  # Global error boundary
├── components/                    # React components
│   ├── ui/                        # shadcn/ui components
│   ├── auth/                      # Auth-related components
│   ├── carousel/                  # Carousel display/management
│   ├── brand/                     # Brand settings forms
│   └── layout/                    # Layout components (header, nav, footer)
├── lib/                           # Utility libraries
│   ├── supabase/
│   │   ├── client.ts              # Browser client
│   │   ├── server.ts              # Server client
│   │   ├── middleware.ts          # Session update utilities
│   │   └── types.ts               # Database types (generated)
│   ├── stripe/
│   │   ├── client.ts              # Stripe client config
│   │   └── webhooks.ts            # Webhook verification utilities
│   ├── n8n/
│   │   └── client.ts              # N8N webhook client
│   └── utils.ts                   # General utilities (cn, etc.)
├── types/                         # TypeScript type definitions
│   ├── database.ts                # Database schema types
│   ├── carousel.ts                # Carousel-related types
│   └── stripe.ts                  # Stripe event types
├── middleware.ts                  # Next.js middleware (auth)
├── supabase/
│   ├── migrations/                # Database migration files
│   └── seed.sql                   # Seed data (optional)
├── public/                        # Static assets
│   ├── images/
│   └── fonts/
└── .env.local                     # Environment variables
```

### Structure Rationale

- **Route Groups (parentheses):** Organize pages by auth state without affecting URLs. `(marketing)`, `(auth)`, `(dashboard)` provide logical separation and different layout requirements.
- **lib/supabase/ separation:** Next.js runs code in browser and server contexts. Separate client/server files ensure Supabase uses correct environment (cookies vs. service role).
- **Webhook isolation:** `/api/webhooks/*` routes handle external events. These must be fast (return 2xx quickly), verify signatures, and enqueue work asynchronously.
- **Component organization:** Group by feature (auth, carousel, brand) rather than type (buttons, forms). Easier to locate related code.
- **Type generation:** Supabase CLI generates types from database schema. Store in `lib/supabase/types.ts` and import throughout app for type safety.

## Architectural Patterns

### Pattern 1: Webhook-Driven Synchronization

**What:** External services (Stripe) push state changes to your application via webhooks. Your application acts as a passive receiver, syncing external state to local database.

**When to use:** Any integration where the external service is the source of truth (payments, subscriptions, fulfillment status).

**Trade-offs:**
- **Pros:** Real-time updates, no polling overhead, accurate state representation
- **Cons:** Requires public endpoint, must handle duplicates/retries, eventual consistency challenges

**Example:**
```typescript
// app/api/webhooks/stripe/route.ts
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    // 1. Verify signature BEFORE processing
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Webhook Error', { status: 400 });
  }

  // 2. Return 200 QUICKLY to prevent retries
  // Process asynchronously if needed (queue job, background task)
  const supabase = await createClient();

  // 3. Make handler idempotent (check if already processed)
  const { data: existing } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('event_id', event.id)
    .single();

  if (existing) {
    return new Response('Event already processed', { status: 200 });
  }

  // 4. Process event type
  switch (event.type) {
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    // ... other events
  }

  // 5. Log event as processed
  await supabase.from('stripe_events').insert({
    event_id: event.id,
    event_type: event.type,
    processed_at: new Date().toISOString()
  });

  return new Response('Success', { status: 200 });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const supabase = await createClient();

  // Allocate credits to user
  await supabase
    .from('credits')
    .insert({
      user_id: invoice.metadata.user_id,
      amount: 10, // Monthly credit allocation
      source: 'subscription',
      invoice_id: invoice.id
    });
}
```

### Pattern 2: Client/Server Supabase Separation

**What:** Create separate Supabase client instances for browser and server contexts. Browser clients use cookies for auth; server clients can use service role for privileged operations.

**When to use:** Always in Next.js applications with Supabase. Required for proper session management in App Router.

**Trade-offs:**
- **Pros:** Proper auth context, enables service role operations, follows security best practices
- **Cons:** More boilerplate, requires understanding of execution contexts

**Example:**
```typescript
// lib/supabase/client.ts (Browser)
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// lib/supabase/server.ts (Server)
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

// Usage in Server Component
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: carousels } = await supabase
    .from('carousels')
    .select('*')
    .eq('user_id', user.id);

  return <CarouselList carousels={carousels} />;
}
```

### Pattern 3: External Webhook Integration (N8N)

**What:** Trigger external workflow via webhook POST, receive response with processed data (image URLs, text). Store references to external resources, not files themselves.

**When to use:** When processing is complex, requires external tools (AI, image generation), or benefits from visual workflow builder.

**Trade-offs:**
- **Pros:** Separates concerns, leverages specialized tools, enables non-developers to modify workflows
- **Cons:** Network dependency, potential latency, requires external service management

**Example:**
```typescript
// lib/n8n/client.ts
export interface CarouselGenerationRequest {
  idea: string;
  templateUrls: string[];
  imageStyle: string;
  brand: {
    name: string;
    colors: string[];
    voice: string;
    productDescription: string;
    targetAudience: string;
    ctaText: string;
  };
}

export interface CarouselGenerationResponse {
  carouselImages: string[]; // ImageB URLs
  postBodyText: string;
  slidesCount: number;
}

export async function generateCarousel(
  request: CarouselGenerationRequest
): Promise<CarouselGenerationResponse> {
  const response = await fetch(process.env.N8N_WEBHOOK_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Optional: Add authentication if N8N webhook requires it
      'Authorization': `Bearer ${process.env.N8N_WEBHOOK_SECRET}`
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`N8N webhook failed: ${response.statusText}`);
  }

  return await response.json();
}

// app/api/generate/route.ts
import { createClient } from '@/lib/supabase/server';
import { generateCarousel } from '@/lib/n8n/client';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Check credits
  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_id', user.id)
    .single();

  if (credits.balance < 1) {
    return new Response('Insufficient credits', { status: 402 });
  }

  const { idea, templateUrls, imageStyle } = await req.json();

  // Fetch brand data
  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Deduct credit BEFORE generation (prevents abuse)
  await supabase
    .from('user_credits')
    .update({ balance: credits.balance - 1 })
    .eq('user_id', user.id);

  try {
    // Call N8N workflow
    const result = await generateCarousel({
      idea,
      templateUrls,
      imageStyle,
      brand
    });

    // Save carousel to history
    const { data: carousel } = await supabase
      .from('carousels')
      .insert({
        user_id: user.id,
        idea,
        template_urls: templateUrls,
        image_style: imageStyle,
        carousel_image_urls: result.carouselImages,
        post_body_text: result.postBodyText,
        slides_count: result.slidesCount
      })
      .select()
      .single();

    return Response.json(carousel);
  } catch (error) {
    // Refund credit on failure
    await supabase
      .from('user_credits')
      .update({ balance: credits.balance })
      .eq('user_id', user.id);

    throw error;
  }
}
```

### Pattern 4: Row-Level Security with Service Role Fallback

**What:** Use RLS for read operations from client; route mutations through server-side API routes with service role key for validation and complex logic.

**When to use:** Production SaaS applications requiring both client-side reads (fast UX) and server-side control (business logic, validation).

**Trade-offs:**
- **Pros:** Security by default, prevents client-side tampering, enables complex validation
- **Cons:** More API routes, can't rely solely on RLS for everything

**Example:**
```sql
-- Enable RLS on tables
ALTER TABLE carousels ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own carousels
CREATE POLICY "Users can view own carousels"
  ON carousels
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Only service role can insert (via API route)
CREATE POLICY "Service role can insert carousels"
  ON carousels
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

```typescript
// Client can read directly
const { data: carousels } = await supabase
  .from('carousels')
  .select('*'); // RLS automatically filters to user's carousels

// Mutations go through API route with service role
// This allows server-side validation, credit checks, external API calls
```

## Data Flow

### Request Flow: Carousel Generation

```
User Action (Click "Generate")
    ↓
Client Component → Form validation
    ↓
API Route (/api/generate)
    ↓
Server Supabase → Check user credits
    ↓ (sufficient credits)
Deduct credit → Update database
    ↓
N8N Webhook → POST request with idea + brand
    ↓ (processing)
N8N Workflow → AI carousel generation
    ↓
ImageB → Store carousel images
    ↓
N8N Response → Return image URLs + post text
    ↓
Save to Database → Insert carousel record
    ↓
Response to Client → Return carousel data
    ↓
Client Update → Display carousel + download option
```

### Request Flow: Stripe Subscription

```
User Action (Click "Subscribe")
    ↓
API Route (/api/stripe/checkout)
    ↓
Create Checkout Session → Stripe API
    ↓
Redirect to Stripe Checkout
    ↓ (user completes payment)
Stripe → Creates subscription
    ↓
Stripe Webhook → POST to /api/webhooks/stripe
    ↓
Verify Signature → Ensure authentic
    ↓
Process Event (invoice.paid)
    ↓
Allocate Credits → Update user_credits table
    ↓
Update Subscription Status → Sync to database
    ↓
Return 200 → Acknowledge to Stripe
```

### State Management

```
Database (Single Source of Truth)
    ↓ (Server Components fetch)
Server Supabase → Query with RLS
    ↓
Server Component → Pass as props
    ↓
Client Component → Render UI
    ↓ (user interaction)
API Route → Mutation via server
    ↓
Database Update → New state
    ↓ (revalidation)
Re-render → Fresh data displayed
```

**Key principle:** Server Components fetch data on each request (no client-side cache by default). For real-time updates, use Supabase Realtime subscriptions in Client Components.

### Key Data Flows

1. **Authentication Flow:** User signs up → Supabase Auth creates user → Email verification → Middleware validates session on each request → Protected pages accessible

2. **Credit Flow:** Subscription created (Stripe) → Webhook allocates credits → User generates carousel → Credit deducted → Balance updated → UI reflects new balance

3. **Carousel Flow:** User inputs idea → API checks credits → N8N generates carousel → Images hosted on ImageB → URLs stored in database → User downloads carousel

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-1k users** | Monolith is perfect. Next.js on Vercel, Supabase free tier, single region deployment. Focus on shipping features. |
| **1k-10k users** | Add database indexes on frequently queried columns (user_id, created_at). Enable Supabase connection pooling. Monitor webhook processing times. Consider caching static content (templates, brand data) with Redis if reads become slow. |
| **10k-100k users** | Move webhook processing to queue (Vercel Queue, Inngest, BullMQ). Separate read replicas for analytics queries. Enable Supabase's point-in-time recovery. Consider CDN for carousel downloads (CloudFront). Monitor N8N workflow execution times. |
| **100k+ users** | Split monolith if needed: separate auth service, billing service, generation service. Multi-region deployment for lower latency. Dedicated Stripe webhook handler (separate deployment). Consider replacing N8N with custom service if workflow becomes bottleneck. Implement rate limiting and DDoS protection. |

### Scaling Priorities

1. **First bottleneck: Webhook processing times**
   - **Symptom:** Stripe webhooks timeout, N8N calls take >30s, users see "processing" state too long
   - **Fix:** Move webhook handlers to async queue. Return 200 immediately, process in background job. Add webhook event status table for transparency ("processing", "completed", "failed").

2. **Second bottleneck: Database queries**
   - **Symptom:** Dashboard slow to load, carousel history pagination sluggish
   - **Fix:** Add indexes on user_id + created_at for history queries. Use Supabase's query performance insights. Cache frequently accessed data (brand settings) in-memory or Redis.

3. **Third bottleneck: N8N workflow capacity**
   - **Symptom:** Carousel generation queue grows, timeouts increase
   - **Fix:** Scale N8N horizontally (multiple instances). Add generation queue in database with status tracking. Implement retry logic for failed generations. Consider timeout limits (30s max) with graceful failure messaging.

## Anti-Patterns

### Anti-Pattern 1: Client-Side Credit Checks Only

**What people do:** Check credits on client before calling API, assume it's safe.

**Why it's wrong:** Client-side checks are bypassable. Malicious user can inspect network requests, call API directly, bypass credit validation. Results in unlimited free usage.

**Do this instead:** ALWAYS check credits server-side in API route. Client-side check is UX optimization only (prevents unnecessary API call). Treat client as untrusted.

```typescript
// BAD: Client-side only
function ClientComponent() {
  const credits = useCredits();

  if (credits < 1) {
    return <div>Insufficient credits</div>;
  }

  // User can bypass this and call API directly
  return <GenerateButton />;
}

// GOOD: Server-side validation
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Server validates credits (cannot be bypassed)
  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_id', user.id)
    .single();

  if (credits.balance < 1) {
    return new Response('Insufficient credits', { status: 402 });
  }

  // Proceed with generation
}
```

### Anti-Pattern 2: Skipping Webhook Signature Verification

**What people do:** Process webhook events without verifying signatures, trust that POST to /api/webhooks/stripe is legitimate.

**Why it's wrong:** Anyone can POST to your webhook endpoint with fake events. Could create fake subscriptions, allocate credits without payment, trigger unwanted actions. Major security vulnerability.

**Do this instead:** ALWAYS verify webhook signatures using official library. Reject invalid signatures before processing any event data.

```typescript
// BAD: No verification
export async function POST(req: Request) {
  const event = await req.json();
  // Anyone can send this!
  await handleEvent(event);
}

// GOOD: Signature verification
export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Invalid signature', { status: 400 });
  }

  // Now safe to process
  await handleEvent(event);
}
```

### Anti-Pattern 3: Synchronous Webhook Processing

**What people do:** Perform complex operations (database writes, external API calls, email sending) synchronously in webhook handler before returning response.

**Why it's wrong:** Webhooks have timeout limits (typically 10-30s). Slow processing causes timeouts, Stripe marks webhook as failed, retries repeatedly. Can create duplicate records, overwhelm your system, fail to acknowledge successful receipt.

**Do this instead:** Return 200 immediately after basic validation and queuing. Process event asynchronously in background job.

```typescript
// BAD: Synchronous processing
export async function POST(req: Request) {
  const event = verifyWebhook(req);

  // These operations are slow (5-10s total)
  await updateDatabase(event);
  await sendEmail(event);
  await triggerAnalytics(event);

  return new Response('Success', { status: 200 }); // Might timeout!
}

// GOOD: Async processing
export async function POST(req: Request) {
  const event = verifyWebhook(req);

  // Quick validation and queue
  await queue.add('stripe-webhook', {
    eventId: event.id,
    eventType: event.type,
    eventData: event.data
  });

  // Return immediately (< 1s)
  return new Response('Queued', { status: 200 });
}

// Separate worker processes queue
async function processWebhookEvent(job) {
  const { eventId, eventType, eventData } = job.data;

  // Check idempotency
  const existing = await checkIfProcessed(eventId);
  if (existing) return;

  // Process slowly without timeout pressure
  await updateDatabase(eventData);
  await sendEmail(eventData);
  await triggerAnalytics(eventData);

  await markAsProcessed(eventId);
}
```

### Anti-Pattern 4: Using RLS for Everything

**What people do:** Rely entirely on Row-Level Security for all operations, including inserts/updates, assuming it eliminates need for API routes.

**Why it's wrong:** RLS can't validate business logic (credit checks, external API validation, complex rules). Can't perform multi-step transactions safely. Can't integrate with external services (Stripe, N8N) securely. Performance issues with complex policies.

**Do this instead:** Use RLS for SELECT queries (fast, secure reads). Route mutations through API routes with service role for validation and business logic.

```sql
-- GOOD: RLS for reads only
CREATE POLICY "Users can view own carousels"
  ON carousels
  FOR SELECT
  USING (auth.uid() = user_id);

-- BAD: RLS for complex inserts
CREATE POLICY "Users can insert carousels if they have credits"
  ON carousels
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    -- This is complex and hard to maintain
    (SELECT balance FROM user_credits WHERE user_id = auth.uid()) >= 1
  );
```

```typescript
// GOOD: Server-side mutation with validation
export async function POST(req: Request) {
  const supabase = await createClient();

  // Complex validation
  const hasCredits = await checkCredits(userId);
  const brandExists = await checkBrand(userId);
  const rateLimitOk = await checkRateLimit(userId);

  if (!hasCredits || !brandExists || !rateLimitOk) {
    return new Response('Validation failed', { status: 400 });
  }

  // Multi-step transaction
  await deductCredit(userId);
  const result = await callN8N(data);
  await saveCarousel(userId, result);

  return Response.json(result);
}
```

### Anti-Pattern 5: Exposing Service Role Key to Client

**What people do:** Use `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` environment variable, making it accessible in client bundles.

**Why it's wrong:** Service role key bypasses ALL Row-Level Security policies. Anyone with this key has full database access (read, write, delete anything). Exposed in client JavaScript bundles, visible in browser DevTools. Catastrophic security vulnerability.

**Do this instead:** NEVER prefix service role key with `NEXT_PUBLIC_`. Only use in server-side code (API routes, Server Components). Client should only have anon key (restricted by RLS).

```typescript
// BAD: Client-side service role usage
// .env.local
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key // EXPOSED!

// Client component
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY! // Anyone can see this!
);

// GOOD: Server-side service role, client uses anon key
// .env.local
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key // Server-only
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key // Client-safe

// lib/supabase/admin.ts (server only)
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Only in server context
  );
}

// Client uses anon key (protected by RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Safe for client
);
```

### Anti-Pattern 6: Missing Idempotency in Webhook Handlers

**What people do:** Process every webhook event as new, without checking if already handled.

**Why it's wrong:** Stripe retries failed webhooks. Network issues cause duplicates. Same event processed multiple times = duplicate credit allocations, multiple emails, inconsistent state.

**Do this instead:** Log event IDs before processing. Check if event already processed. Skip if duplicate.

```typescript
// BAD: No idempotency
export async function POST(req: Request) {
  const event = verifyWebhook(req);

  // Processes every time, even duplicates
  await allocateCredits(event.data);

  return new Response('Success', { status: 200 });
}

// GOOD: Idempotent handler
export async function POST(req: Request) {
  const event = verifyWebhook(req);

  const supabase = await createClient();

  // Check if already processed
  const { data: existing } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('event_id', event.id)
    .single();

  if (existing) {
    console.log(`Event ${event.id} already processed`);
    return new Response('Already processed', { status: 200 });
  }

  // Process event
  await allocateCredits(event.data);

  // Mark as processed
  await supabase.from('stripe_events').insert({
    event_id: event.id,
    event_type: event.type,
    processed_at: new Date().toISOString()
  });

  return new Response('Success', { status: 200 });
}
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Stripe (Checkout)** | Client-side redirect to Stripe Checkout hosted page | Use `/api/stripe/checkout` to create session, redirect user. Stripe handles payment collection, returns to success URL. |
| **Stripe (Webhooks)** | Inbound webhook to `/api/webhooks/stripe` | Verify signature with `stripe.webhooks.constructEvent()`. Return 200 quickly. Process asynchronously. Log event IDs for idempotency. |
| **Stripe (Customer Portal)** | Client-side redirect to Stripe Customer Portal | Use `/api/stripe/portal` to create session, redirect user. Stripe handles subscription management, returns to dashboard. |
| **Supabase (Auth)** | Server-side session management via middleware | Middleware updates session on each request. Server Components use `createClient()` with cookie context. Protected routes check `user` object. |
| **Supabase (Database)** | Direct queries from Server Components, RLS-protected reads from Client Components | Server Components query with service role or user context. Client reads filtered by RLS. Mutations via API routes. |
| **N8N (Webhook)** | Outbound HTTP POST from `/api/generate` route | POST idea + brand data to N8N webhook URL. N8N processes asynchronously. Returns image URLs + post text. Store URLs in database. |
| **ImageB (Hosting)** | Indirect via N8N workflow | N8N uploads carousel images to ImageB. Returns URLs. We store URLs in database, never upload/manage files directly. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Client ↔ Server Components** | Props (Server → Client), API routes (Client → Server) | Server Components fetch data, pass as props to Client Components. Client mutations call API routes (POST /api/*). |
| **Browser ↔ Supabase** | Supabase client with anon key | Client can read data (filtered by RLS). Cannot perform privileged operations. Session managed via cookies. |
| **API Routes ↔ Supabase** | Supabase server client with user context or service role | API routes use server client. User context for RLS enforcement. Service role for privileged operations (bypasses RLS). |
| **Middleware ↔ Supabase** | Session update utilities | Middleware calls `updateSession()` to refresh auth token. Runs on every request to protected routes. |
| **Webhook Routes ↔ Queue** | Direct enqueue or via Vercel Queue | Webhook handlers enqueue jobs immediately. Background workers process asynchronously. Prevents timeout issues. |

## Build Order Implications

Based on this architecture, suggested component build order:

### Phase 1: Foundation (Authentication & Database)
**Why first:** Every other feature depends on user identity and data persistence.

- Supabase project setup (database, auth)
- Next.js project structure (route groups, middleware)
- Auth pages (signup, login, email verification)
- Middleware for session management
- Database schema (users, brands, carousels, credits, subscriptions)

**Dependencies:** None
**Blocks:** All other phases

### Phase 2: Brand Management
**Why second:** Carousel generation requires brand data to be configured first.

- Brand settings page
- Brand data CRUD (create, read, update)
- Brand form validation
- Prompt to create brand on first carousel attempt

**Dependencies:** Phase 1 (Auth, Database)
**Blocks:** Phase 3 (Carousel generation needs brand)

### Phase 3: Carousel Generation (Core Feature)
**Why third:** Depends on auth + brand, but can work without payments initially (test with unlimited credits).

- Dashboard page (carousel creation form)
- N8N webhook integration
- `/api/generate` route (credit check, N8N call, save carousel)
- Carousel display component
- Download carousel as zip
- Carousel history page

**Dependencies:** Phase 1 (Auth), Phase 2 (Brand)
**Blocks:** Nothing (can test with manual credit allocation)

### Phase 4: Stripe Integration (Monetization)
**Why fourth:** Enables revenue but not required for core feature testing.

- Stripe account setup
- Checkout flow (`/api/stripe/checkout`)
- Webhook handler (`/api/webhooks/stripe`)
- Credit allocation on payment
- Customer portal integration
- Free tier enforcement (3 carousels)

**Dependencies:** Phase 1 (Auth, Database), Phase 3 (Credit system needs to exist)
**Blocks:** Production launch

### Phase 5: Polish & Launch Prep
**Why last:** UX improvements, non-blocking features.

- Landing page
- Pricing page
- Account management page
- Animations and transitions
- Error handling and loading states
- Email notifications (optional)

**Dependencies:** All previous phases
**Blocks:** Nothing (incremental improvements)

**Rationale for this order:**
1. **Phase 1 first:** Can't build anything without auth and database
2. **Phase 2 before Phase 3:** Carousel generation requires brand data
3. **Phase 3 before Phase 4:** Can test generation without payments (manual credit allocation)
4. **Phase 4 before Phase 5:** Need monetization before public launch
5. **Phase 5 last:** Polish doesn't block core functionality

**Alternative ordering (faster MVP):** Could combine Phases 3+4 (build generation + payment together) if goal is end-to-end revenue validation quickly. Separating allows testing generation workflow without payment complexity.

## Sources

### HIGH Confidence (Official Documentation)
- Stripe Webhooks Official Documentation: https://docs.stripe.com/webhooks
- Supabase Next.js Quickstart: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- Next.js App Router Project Structure: https://nextjs.org/docs/app/getting-started/project-structure
- Vercel Next.js Subscription Payments (Reference Implementation): https://github.com/vercel/nextjs-subscription-payments

### MEDIUM Confidence (Community Best Practices, Verified)
- Best Practices for Stripe Webhooks (Stigg): https://www.stigg.io/blog-posts/best-practices-i-wish-we-knew-when-integrating-stripe-webhooks
- Next.js + Supabase in Production (Catjam): https://catjam.fi/articles/next-supabase-what-do-differently
- SaaS Architecture Patterns with Next.js (Vladimir Siedykh): https://vladimirsiedykh.com/blog/saas-architecture-patterns-nextjs
- Stripe Webhooks Complete Guide (MagicBell): https://www.magicbell.com/blog/stripe-webhooks-guide
- Common Webhook Errors Guide (WebhookDebugger): https://www.webhookdebugger.com/blog/common-webhook-errors-and-how-to-fix-them

### MEDIUM Confidence (Established SaaS Boilerplates)
- Makerkit Next.js Supabase Architecture: https://makerkit.dev/docs/next-supabase/architecture/architecture
- Next.js Supabase Stripe Starter (KolbySisk): https://github.com/KolbySisk/next-supabase-stripe-starter
- N8N Webhook Node Documentation: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/

---
*Architecture research for: SaaS Platform with Stripe Subscriptions, Supabase Backend, and External Webhook Integrations*
*Researched: 2026-02-21*
