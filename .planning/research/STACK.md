# Technology Stack

**Project:** Carousel Creator SaaS
**Domain:** SaaS Platform with Stripe Subscriptions, Supabase Auth/Database, External API Integrations
**Researched:** 2026-02-21
**Confidence:** HIGH

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.x | Full-stack React framework with App Router | Production-ready since Oct 2024. App Router is now the standard with React Server Components, improved caching defaults, Turbopack stable for dev, and official support for React 19. Vercel deployment is first-class. |
| React | 19.x | UI library | Latest stable release with forwardRef no longer needed (ref is now a regular prop). Full compatibility with Next.js 15. Improved performance and DX. |
| TypeScript | 5.9.x | Type safety | Latest stable (5.9.3 as of Feb 2026). Zod tested against TS 5.5+. Reduced disk footprint, better type inference, and Next.js supports `next.config.ts`. |
| Node.js | 20.x LTS | Runtime environment | Node 18 reached EOL April 2025. Node 20 is Active LTS through April 2026. Supabase client v2.79.0+ requires Node 20+. |

### Database & Authentication

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Supabase | Latest | PostgreSQL database, auth, real-time | Industry standard for Next.js SaaS. Integrated auth + database reduces complexity vs separate services. Excellent DX with TypeScript support. |
| @supabase/supabase-js | 2.79.x+ | Supabase JavaScript client | Official client library. v2.79.0+ requires Node 20+. Use with @supabase/ssr for Next.js SSR. |
| @supabase/ssr | Latest | SSR helpers for Next.js | Replaces deprecated auth-helpers. Required for Server Components, handles cookie management and auth token refresh. Critical for Next.js 15 App Router. |

### Payments & Subscriptions

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Stripe | Latest API (2026-01-28) | Payment processing, subscriptions, customer portal | Industry standard for SaaS payments. Comprehensive webhook system, customer portal, and subscription management. Official Node SDK actively maintained. |
| stripe (Node SDK) | 20.x+ | Server-side Stripe integration | Server-side only. v20.3.0+ supports Node 12+. Use latest pinned API version (2026-01-28). Never expose in client code. |
| @stripe/stripe-js | 6.x+ | Client-side Stripe.js wrapper | For Stripe Checkout and Elements. Each major version uses fixed Stripe.js version. v6.0+ is current for React applications. |

### Styling & UI Components

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Tailwind CSS | 4.x | Utility-first CSS framework | v4.0 stable as of Jan 2025. 5x faster full builds, 100x faster incremental builds, zero config, automatic content detection, first-party Vite plugin. Production-ready. |
| shadcn/ui | Latest | Unstyled, accessible UI components | Fully compatible with React 19 and Tailwind v4 (Feb 2025 update). Copy-paste components, not npm package. Built on Radix UI primitives. Industry standard for Next.js SaaS. |
| Radix UI | Latest | Headless UI primitives | Foundation for shadcn/ui. Accessible, unstyled, composable. Handles complex component logic (dropdowns, dialogs, etc.). |

### Form Handling & Validation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React Hook Form | 7.x | Form state management | Industry standard for React forms. Minimal re-renders, excellent performance, integrates seamlessly with Zod via @hookform/resolvers. |
| Zod | 3.x | Runtime schema validation | TypeScript-first validation. Runtime type checking for API responses, form inputs, env vars. Tested against TS 5.5+. Smaller bundle in v4 mini. Essential for validating external data (Stripe webhooks, N8N responses, user input). |
| @hookform/resolvers | Latest | Bridge for React Hook Form + Zod | Official resolver package. Enables zodResolver(schema) for type-safe form validation. |

### State Management & Data Fetching

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TanStack Query (React Query) | 5.x | Server state management, caching | v5.90.21+ fully compatible with React 19 and React Compiler. 20% smaller than v4. Stable Suspense support (useSuspenseQuery). Perfect for managing Supabase queries and Stripe API calls. Works seamlessly with Next.js App Router and Server Components. |
| Built-in Fetch API | Native | HTTP requests | Use native fetch for Next.js App Router. No extra dependencies. Next.js extends fetch with caching and revalidation. For server-side Stripe webhooks and N8N integrations, use native fetch or Supabase Edge Functions. Avoid axios unless you need interceptors. |

### Animation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Framer Motion | 12.x (Motion) | Declarative animations for landing page | Project requires relume.io-inspired animations. Framer Motion 12.0.0-alpha.2+ has React 19 compatibility, or use `motion/react` (rebranded package). Production-grade, beginner-friendly, supports gestures and scroll animations. CLIENT COMPONENTS ONLY. |

### Utilities

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| date-fns | 3.x | Date formatting and manipulation | Smaller bundle than Day.js when tree-shaken (1.6KB for single method). Functional programming approach. Import only what you need. Use for carousel history timestamps. |
| jszip | 3.x | Create zip files for carousel downloads | Standard library for browser-side zip creation. Works with file-saver to download multiple carousel images as single zip. Well-maintained, widely used. |
| file-saver | 2.x | Trigger file downloads in browser | Companion to jszip. Handles blob download triggers cross-browser. Lightweight (3KB). |

### Development Tools

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| ESLint | 9.x | Code linting | Next.js 15 supports ESLint 9. Use flat config (eslint.config.mjs) instead of .eslintrc.json. Some plugins still on v8, use FlatCompat for compatibility. |
| Prettier | 3.x | Code formatting | Industry standard. Integrate with ESLint via eslint-config-prettier to disable conflicting rules. |
| eslint-config-prettier | Latest | Disable ESLint formatting rules | Recommended by Next.js docs. Prevents ESLint/Prettier conflicts. |

## Installation

```bash
# Core framework
npm install next@latest react@latest react-dom@latest typescript

# Database & Auth
npm install @supabase/supabase-js @supabase/ssr

# Payments
npm install stripe @stripe/stripe-js

# Styling & UI
npm install tailwindcss@next postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge
# shadcn/ui components are added via CLI: npx shadcn@latest add [component]

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# Data fetching & state
npm install @tanstack/react-query

# Animation
npm install framer-motion@12.0.0-alpha.2
# OR: npm install motion

# Utilities
npm install date-fns jszip file-saver

# Dev dependencies
npm install -D @types/node @types/react @types/react-dom
npm install -D eslint eslint-config-next eslint-config-prettier prettier
npm install -D @types/file-saver
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Framework | Next.js 15 | Remix, Astro | Next.js is specified in constraints. Vercel deployment is first-class. Largest ecosystem for React SaaS. |
| Database | Supabase | Firebase, PlanetScale | Supabase specified in constraints. Better PostgreSQL access, superior auth DX, official Stripe sync engine. |
| Payments | Stripe | Paddle, LemonSqueezy | Stripe specified in constraints. Most comprehensive API, best webhook system, mature ecosystem. |
| Validation | Zod | Yup, Joi | Zod is TypeScript-first (better inference), smaller bundle, actively maintained. Yup has weaker TS support. |
| State Management | TanStack Query | SWR, Zustand | TanStack Query has better devtools, more features (mutations, infinite queries), larger ecosystem. SWR simpler but less powerful. |
| Date Library | date-fns | Day.js, Luxon | date-fns has better tree-shaking (smaller bundle when optimized). Day.js is 2KB but grows when using many methods. Luxon is larger. |
| HTTP Client | Native Fetch | Axios | Next.js optimizes native fetch (caching, revalidation). Axios adds 13KB+ for features we don't need (interceptors). Use fetch unless you need global request/response transformation. |
| Animation | Framer Motion | GSAP, React Spring | Framer Motion is declarative (better DX), React-first, smaller learning curve. GSAP requires licensing for commercial use. React Spring has steeper API. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Moment.js | Deprecated, massive bundle size (67KB), mutable API | date-fns (tree-shakeable, 1.6KB when optimized) |
| @supabase/auth-helpers | Deprecated as of 2025 | @supabase/ssr (official replacement for Next.js SSR) |
| Pages Router | Legacy Next.js architecture | App Router (Next.js 15 default, better performance, RSC support) |
| axios (unless needed) | 13KB+ bundle, redundant with Next.js fetch | Native fetch API (optimized by Next.js, zero bundle cost) |
| next-themes | Project specifies light theme only | Don't install theme switching. Hard-code light mode. |
| Redux/MobX | Overkill for this project, server state handled by TanStack Query | TanStack Query for server state, React state for UI state |
| CSS-in-JS (styled-components, Emotion) | Runtime performance cost, not needed with Tailwind | Tailwind CSS + shadcn/ui (zero runtime, better DX) |
| Node 18 or earlier | Node 18 EOL April 2025, Supabase client v2.79+ requires Node 20+ | Node 20 LTS (Active LTS through April 2026) |

## Stack Patterns by Use Case

### For Stripe Webhook Handling

**Recommended: Next.js API Routes (not Supabase Edge Functions)**

```
Stripe → Next.js API Route (/app/api/webhooks/stripe/route.ts) → Supabase Database
```

**Why:**
- Next.js uses Node.js/TypeScript (same as rest of codebase)
- Supabase Edge Functions use Deno (different globals, learning curve)
- 3-step (Stripe → Vercel → Supabase) vs 2-step is negligible since both are async webhooks
- Keeps all application logic in one codebase/deployment
- Official Vercel starter uses Next.js API routes for webhooks

**Implementation:**
```typescript
// app/api/webhooks/stripe/route.ts
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  // Handle event, update Supabase
  // ...
}
```

### For N8N Webhook Calls

**Recommended: Next.js Server Actions or API Routes**

```
User submits form → Server Action → N8N webhook → Return carousel URLs
```

**Why:**
- Server Actions keep API keys secure (never exposed to client)
- Simpler than API routes for form submissions
- Built-in error handling and loading states
- Type-safe with Zod validation

**Implementation:**
```typescript
// app/actions/generate-carousel.ts
'use server';

import { z } from 'zod';

const carouselSchema = z.object({
  idea: z.string().min(10),
  templateUrl: z.string().url(),
  imageStyle: z.string(),
  brandData: z.object({...}),
});

export async function generateCarousel(data: z.infer<typeof carouselSchema>) {
  const validated = carouselSchema.parse(data);

  const response = await fetch(process.env.N8N_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validated),
  });

  return response.json();
}
```

### For Supabase Auth in Server Components

**Recommended: @supabase/ssr with server-side client**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
```

**CRITICAL: Always use `supabase.auth.getUser()` not `getSession()` in Server Components.**
- `getSession()` doesn't revalidate auth token (security risk)
- `getUser()` sends request to Supabase Auth server every time (guaranteed fresh)

### For Client-Side Supabase (Client Components)

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### For Form Handling with Server Actions

**Recommended: React Hook Form + Zod + Server Actions**

```typescript
// components/carousel-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { carouselSchema } from '@/lib/schemas';
import { generateCarousel } from '@/app/actions/generate-carousel';

export function CarouselForm() {
  const form = useForm({
    resolver: zodResolver(carouselSchema),
  });

  const onSubmit = async (data) => {
    const result = await generateCarousel(data);
    // Handle result
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 15 | React 19, Node 20+, TypeScript 5.5+ | Requires async request APIs (await headers(), await cookies()) |
| React 19 | Framer Motion 12.0.0-alpha.2+, TanStack Query 5.x, shadcn/ui (updated Feb 2025) | forwardRef no longer needed, ref is regular prop |
| @supabase/supabase-js 2.79+ | Node 20+ (Node 18 EOL April 2025) | Must use @supabase/ssr for Next.js SSR |
| Tailwind CSS 4.x | PostCSS 8+, Next.js 15 | Use PostCSS plugin or Vite plugin, not CLI |
| TanStack Query 5.x | React 19, React Compiler | 20% smaller than v4, stable Suspense support |
| Zod 3.x | TypeScript 5.5+, React Hook Form 7.x | Tested against TS 5.5+, use @hookform/resolvers for RHF integration |
| ESLint 9.x | Next.js 15, Prettier 3.x | Use flat config (eslint.config.mjs), some plugins need FlatCompat for v8 compatibility |

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# N8N
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Security Notes:**
- `NEXT_PUBLIC_*` vars are exposed to browser (safe for publishable keys only)
- Never expose `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` in client code
- Keep `N8N_WEBHOOK_URL` server-side only (use Server Actions or API routes)

## Sources

**HIGH CONFIDENCE (Official Docs & Releases):**
- Next.js 15 Release: https://nextjs.org/blog/next-15 (Oct 21, 2024)
- Supabase SSR Docs: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Supabase Stripe Webhooks: https://supabase.com/docs/guides/functions/examples/stripe-webhooks
- Tailwind CSS v4: https://tailwindcss.com/blog/tailwindcss-v4 (Jan 22, 2025)
- shadcn/ui React 19 Update: https://ui.shadcn.com/docs/react-19 (Feb 2025)
- TanStack Query v5: https://tanstack.com/query/v5/docs/framework/react/overview
- TypeScript 5.9 Release: https://devblogs.microsoft.com/typescript/

**MEDIUM CONFIDENCE (GitHub, Community Patterns):**
- Vercel Next.js Subscription Payments: https://github.com/vercel/nextjs-subscription-payments (archived Jan 2025, patterns still valid)
- React Hook Form + Zod patterns: Multiple 2025 tutorials verified
- Framer Motion React 19 compatibility: Community discussions, alpha version testing

**LOW CONFIDENCE (Flagged for Validation):**
- Exact version numbers for @supabase/supabase-js (npm blocked WebFetch, last verified: 2.79.0+)
- Exact version numbers for stripe npm (npm blocked WebFetch, last verified: 20.3.0+)

---
*Stack research for: Carousel Creator SaaS*
*Researched: 2026-02-21*
*Overall confidence: HIGH (90%+ verified with official sources)*
