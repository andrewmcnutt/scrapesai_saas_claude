# Project Research Summary

**Project:** Carousel Creator SaaS
**Domain:** SaaS Platform - AI-Powered Content Generation with Stripe Subscriptions
**Researched:** 2026-02-21
**Confidence:** HIGH

## Executive Summary

This is a LinkedIn carousel generation SaaS that converts user ideas into professional multi-slide carousels using AI. Experts build this type of product as a focused generation tool (not a design platform like Canva), using Next.js 15 with App Router, Supabase for auth/database, Stripe for subscriptions, and external webhooks (N8N) for AI processing. The recommended stack is production-ready with all components at stable versions: Next.js 15.x, React 19.x, Supabase with @supabase/ssr, Stripe with proper webhook handling, and Tailwind CSS 4.x for styling.

The critical success factors are: (1) proper webhook architecture to handle Stripe subscription events and N8N generation callbacks without race conditions, (2) atomic credit system preventing double-spending, and (3) async generation workflow since AI processing takes 60-180 seconds. The main risks are webhook race conditions causing payment/subscription state mismatches, credit deduction failures from concurrent requests, and N8N timeout failures leaving orphaned data. All three are preventable with architectural patterns identified in research: idempotent webhook handlers, PostgreSQL RPC for atomic credit operations, and async job queues with callback verification.

The product differentiates through post body text generation (most tools only create slides), credit rollover (competitors reset monthly), and quality-focused curation (5-6 templates vs overwhelming choice). Positioning as "best-in-class carousel generation" rather than attempting to compete with full design tools (Canva) or content suites (ContentIn).

## Key Findings

### Recommended Stack

**Core Framework:** Next.js 15.x with App Router is production-ready as of Oct 2024, providing React Server Components, improved caching, and Turbopack for development. React 19.x is the latest stable with improved DX (forwardRef deprecated). TypeScript 5.9.x provides better type inference and disk footprint reduction. Node.js 20 LTS is required (Node 18 reached EOL April 2025, Supabase client v2.79+ requires Node 20+).

**Core technologies:**
- **Next.js 15 + React 19:** Full-stack framework with App Router — industry standard for React SaaS, first-class Vercel deployment, Server Components mature
- **Supabase (latest):** PostgreSQL + auth + real-time — integrated auth/database reduces complexity, excellent TypeScript support, use @supabase/ssr for Next.js SSR
- **Stripe (API 2026-01-28):** Payments and subscriptions — industry standard, comprehensive webhook system, customer portal handles subscription management
- **Tailwind CSS 4.x:** Utility-first styling — 5x faster builds, zero config, production-ready as of Jan 2025, pairs with shadcn/ui
- **TanStack Query 5.x:** Server state management — fully compatible with React 19, 20% smaller than v4, stable Suspense support
- **React Hook Form 7.x + Zod 3.x:** Form handling + validation — minimal re-renders, runtime type checking essential for external data (Stripe webhooks, N8N responses)
- **Framer Motion 12.x:** Animations for landing page — React 19 compatible, required for relume.io-inspired animations (CLIENT COMPONENTS ONLY)

**Critical version requirements:**
- Node 20+ (Supabase client requirement)
- @supabase/ssr (replaces deprecated auth-helpers)
- Next.js 15 async request APIs (await headers(), await cookies())
- Tailwind 4.x requires PostCSS plugin setup

**What NOT to use:**
- Moment.js (deprecated, 67KB) → use date-fns (1.6KB tree-shaken)
- @supabase/auth-helpers (deprecated) → use @supabase/ssr
- Pages Router → use App Router (Next.js 15 default)
- axios → use native fetch (Next.js optimized, zero bundle)
- Node 18 or earlier → use Node 20 LTS

### Expected Features

**Must have (table stakes):**
- **AI Content Generation** — users expect topic-to-carousel with hooks, value slides, CTAs (industry standard 2026)
- **Template Library** — pre-designed layouts users can customize (5-6 focused templates vs overwhelming choice)
- **Brand Customization** — colors, fonts, voice, audience, CTA (every competitor has this)
- **Carousel History/Library** — auto-save with timestamp and original inputs (users expect reference without recreating)
- **PDF Export for LinkedIn** — LinkedIn uses PDF upload for carousels in 2026 (not optional)
- **Credit/Usage System** — prevents abuse, clarifies costs (3 free lifetime, 10/month paid with rollover)
- **Multiple Image Styles** — 4 presets + custom text (control over visual aesthetic)

**Should have (competitive advantages):**
- **Post Body Text Generation** — differentiate from design-only tools, already in N8N workflow (many tools only generate slides)
- **Credit Rollover** — unused credits carry forward (increases perceived value, competitors often reset monthly)
- **One-Click Regeneration** — same settings without re-input (saves iteration time)
- **Brand Voice Guidelines** — structured tone/vocabulary/audience inputs (implementation quality differentiates)
- **Content Structure Templates** — problem-solution, listicle frameworks for non-writers (v1.x after validation)
- **Voice-Trained AI** — learns writing style from past posts (v1.x, high complexity, requires training pipeline)

**Defer (v2+):**
- **In-App Slide Editing** — anti-feature: creates Canva competitor scope creep, position as generation tool not design tool
- **Direct Social Publishing** — anti-feature: OAuth complexity, platform API changes, support burden, users already open LinkedIn for comments
- **Real-Time Collaboration** — anti-feature: WebSocket infrastructure, conflict resolution, most users work solo
- **Video Carousels** — different product category, 10x cost increase
- **Analytics Dashboard** — platform integrations outside our control, users have native LinkedIn analytics

**MVP Definition (v1):**
All table stakes features plus regeneration, post body text, and Stripe subscription at $29.99/month. Validates core value proposition: quality carousel generation with minimal friction.

### Architecture Approach

This follows standard SaaS webhook-driven architecture: Next.js App Router for presentation/routing, separate Supabase clients for browser vs server contexts, webhook receivers as API routes, and async integration with external services (Stripe, N8N). The key pattern is treating external services as source of truth — Stripe owns subscription state, N8N owns generation workflow, our database synchronizes via webhooks.

**Major components:**
1. **Presentation Layer** — Next.js App Router pages with route groups: (marketing), (auth), (dashboard) for logical separation without affecting URLs
2. **Integration Layer** — API routes at /api/webhooks/* handle Stripe/N8N events with signature verification, idempotency tracking, and async processing
3. **Data Persistence** — Supabase PostgreSQL with Row-Level Security for reads, service role operations for mutations via API routes
4. **External Services** — Stripe (payments), N8N (carousel generation), ImageB (hosting) communicate via webhooks, never trusted without verification

**Critical architectural patterns:**
- **Webhook-Driven Sync:** Stripe pushes state changes via webhooks, we act as passive receiver syncing to database (verify signatures, return 200 quickly, process async)
- **Client/Server Supabase Separation:** Browser uses createBrowserClient() with cookies, server uses createServerClient() with cookie context, privileged operations use service role
- **Async N8N Integration:** Trigger workflow via POST, return 202 Accepted, poll for completion or use callback webhook (AI generation takes 60-180s, can't be synchronous)
- **RLS for Reads, API Routes for Mutations:** Row-Level Security filters SELECT queries, INSERT/UPDATE routed through API routes for validation and business logic

**Build order implications:** Phase 1 must be auth/database foundation (everything depends on user identity). Phase 2 is brand management (generation requires brand data). Phase 3 is carousel generation (can test without payments using manual credits). Phase 4 is Stripe integration (enables revenue). Phase 5 is polish/launch prep.

### Critical Pitfalls

1. **Stripe Webhook Race Conditions** — User completes checkout, frontend loads immediately showing stale data, webhooks arrive 1-5s later asynchronously. Multiple events (customer.subscription.created, invoice.paid) arrive simultaneously out of order. **Avoid:** Immediate sync on checkout return, poll with exponential backoff, treat invoice.paid as single source of truth, use idempotency keys, wrap in database transactions.

2. **Missing Webhook Signature Verification** — Without verifying Stripe-Signature header, attackers POST fake events granting premium credits without payment. Over 40% of transaction issues arise from improper validation. **Avoid:** Always verify signatures with stripe.webhooks.constructEvent(), preserve raw body for HMAC, use webhook secrets in env vars, reject unsigned requests, HTTPS only.

3. **Non-Idempotent Webhook Handlers** — Stripe retries failed webhooks, same event arrives multiple times causing duplicate credit allocation, corrupted state, constraint violations. **Avoid:** Track event.id in database before processing, return 200 immediately, queue for async processing, use unique constraints on Stripe resource IDs, design operations as "set to X" not "add X".

4. **Credit System Double-Spending** — User with 1 credit triggers generation twice simultaneously, both check balance concurrently, both proceed, results in 2 carousels for 1 credit or negative balance. **Avoid:** Atomic deduction via PostgreSQL RPC with SELECT FOR UPDATE, CHECK constraint preventing negative balances, frontend debouncing, idempotency keys, row-level locking.

5. **Supabase RLS Policy Mistakes** — Tables without RLS expose all data to anyone with project URL. Policies using auth.uid() = user_id silently fail when unauthenticated (returns empty, not error). Performance degrades from per-row policy execution without indexes. **Avoid:** Enable RLS on all tables, use auth.uid() IS NOT NULL AND pattern, index policy columns, never trust user_metadata for permissions, use WITH CHECK clauses.

6. **N8N Workflow Timeout Failures** — Frontend timeout 30s, AI generation takes 60-180s, frontend shows error but N8N completes successfully, user charged but receives no carousel, clicks Generate again spending another credit. **Avoid:** Async architecture with 202 Accepted response, job queue pattern with status polling, webhook callbacks from N8N, tiered timeouts (connection 10s, read 180s, overall 300s), exponential backoff retries.

7. **Free Tier Abuse & Bot Attacks** — Attackers script hundreds of signups using temp email services, each gets 3 free carousels, costs N8N API fees without revenue. **Avoid:** CAPTCHA on signup (Cloudflare Turnstile), block temp email domains, rate limit by IP (3 signups/day, 5 generations/hour), device fingerprinting, require email verification before first generation, monitor abuse patterns.

8. **Subscription Cancellation Timing Bugs** — User cancels on day 15, immediately loses access despite paying for full month. Or keeps credits until day 30, generates 50 carousels, subscription ends, webhook fails, credits never deducted. **Avoid:** Understand cancel_at_period_end (subscription active until period end), listen to customer.subscription.deleted not just .updated, show "Subscription ends on [date]" UI, use Stripe customer portal for cancellation handling.

9. **Credit Rollover Accounting Errors** — February renewal adds 10 credits but database shows 20 (SET instead of INCREMENT) or 17 but revenue reports show "170% usage" (counts total balance not incremental). **Avoid:** Transaction ledger model with INSERT only (never UPDATE balance), calculate balance as SUM(transactions), audit trail for every change, track monthly_allocated vs carried_forward separately, idempotent allocation by billing_period_id.

10. **N8N-Supabase Data Consistency Failures** — N8N completes, images uploaded to ImageB, callback to app fails (network timeout), images exist but not in database, user charged but can't access carousel. **Avoid:** Create carousel record with status='pending' before calling N8N, update to 'completed' on callback, verify callback HMAC signature, exponential retry on failure, daily reconciliation job comparing ImageB vs database, timeout handling with credit refunds.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation (Auth, Database, Stripe Setup)
**Rationale:** Every feature depends on user identity, data persistence, and secure payment infrastructure. Webhook architecture must be correct from day one — retrofitting is expensive and risky. RLS policies and credit system architecture are foundational patterns that can't be changed later without major refactoring.

**Delivers:** User authentication (Supabase email/password), database schema (users, brands, carousels, credits, subscriptions), Stripe webhook handlers with signature verification and idempotency, credit ledger model, RLS policies on all tables.

**Addresses Features:** User accounts, subscription management infrastructure, credit tracking foundation.

**Avoids Pitfalls:** #1 (webhook race conditions via immediate sync), #2 (signature verification from start), #3 (idempotent handlers), #5 (RLS on all tables), #7 (CAPTCHA and rate limiting), #8 (proper cancel_at_period_end handling).

**Must implement:**
- Idempotent webhook handlers tracking event.id
- Signature verification on all webhook endpoints
- Credit ledger (transaction log, never direct balance updates)
- RLS enabled on all tables with indexed policy columns
- CAPTCHA on signup (Cloudflare Turnstile)
- Rate limiting by IP (3 signups/day)

### Phase 2: Brand Management
**Rationale:** Carousel generation requires brand data (colors, voice, audience, CTA). Users must create brand before first generation. Simple CRUD operations, no external integrations, can be built and tested independently.

**Delivers:** Brand settings page, brand CRUD operations, brand form validation (React Hook Form + Zod), prompt to create brand on first carousel attempt.

**Addresses Features:** Brand customization (table stakes), brand voice guidelines (differentiator).

**Depends On:** Phase 1 (auth, database)

**Blocks:** Phase 3 (carousel generation needs brand data)

**Must implement:**
- One brand per user (simplifies v1 data model)
- Brand form validation with Zod schemas
- Prompt flow: user attempts generation → no brand → redirect to brand setup → return to generation

### Phase 3: Carousel Generation (Core Value)
**Rationale:** Core feature delivering primary value proposition. Depends on auth (user context), brand (generation inputs), and credit system (usage tracking). Can be built and tested without Stripe payments by manually allocating credits in database.

**Delivers:** Dashboard carousel creation form (template selection, style selection, idea input), /api/generate route with atomic credit deduction, N8N webhook integration with async processing, carousel display component, download as zip (jszip + file-saver), carousel history page with pagination, regeneration feature.

**Addresses Features:** AI content generation (table stakes), post body text (differentiator), template library, carousel history, PDF export, regeneration.

**Avoids Pitfalls:** #4 (atomic credit deduction via PostgreSQL RPC), #6 (async N8N architecture with polling/callbacks), #9 (credit ledger model), #10 (N8N callback verification and reconciliation).

**Must implement:**
- PostgreSQL RPC function for atomic credit check + deduction with SELECT FOR UPDATE
- Async generation: return 202, create carousel record with status='pending', poll for completion
- N8N callback endpoint with HMAC signature verification
- Frontend debouncing on Generate button (prevent double-click)
- Status polling with exponential backoff (2s, 4s, 8s intervals)
- Timeout handling (mark failed after 5 minutes, refund credit)
- Daily reconciliation cron comparing ImageB uploads vs database records

### Phase 4: Stripe Integration (Monetization)
**Rationale:** Enables revenue but not required for testing core generation workflow. Can test Phase 3 with manual credit allocation. Stripe integration is complex (webhooks, customer portal, subscription lifecycle) and should be isolated from generation logic.

**Delivers:** Stripe account setup and products ($29.99/month), checkout flow (/api/stripe/checkout creating session, redirect to Stripe), webhook handler for invoice.paid/customer.subscription.updated/deleted, credit allocation on payment (10 credits via ledger transaction), customer portal integration (Stripe-hosted for subscription management), free tier enforcement (3 lifetime credits).

**Addresses Features:** Credit system (table stakes), subscription payments.

**Avoids Pitfalls:** #1 (immediate sync on checkout return), #2 (signature verification), #3 (idempotency), #8 (cancel_at_period_end handling).

**Must implement:**
- Webhook signature verification before processing
- Immediate sync on checkout success URL (query Stripe API, update database before rendering)
- Idempotent event processing (log event.id, skip if exists)
- Return 200 immediately, queue business logic for async processing
- Handle cancel_at_period_end (keep access until period end, not immediate revocation)
- Use Stripe customer portal (don't build custom cancellation UI)

### Phase 5: Polish & Launch Prep
**Rationale:** UX improvements and marketing pages. Non-blocking for core functionality. Can be developed incrementally while collecting early user feedback on Phases 1-4.

**Delivers:** Landing page with Framer Motion animations (relume.io-inspired), pricing page, account management page (subscription status, credit balance, usage history), loading states and error messages for all operations, email notifications (optional: generation complete, credits low), 404/error pages.

**Addresses Features:** User experience polish, conversion optimization.

**Depends On:** All previous phases (needs complete app to build around)

**Must implement:**
- Specific error messages (not generic "Something went wrong")
- Loading states during generation (progress indicators, estimated time)
- Checkout return UX (show "Activating subscription..." while syncing)
- Credit depletion messaging (show next reset date, upgrade CTA)
- Generation status visibility (polling updates: "Analyzing content... Creating images... Almost done...")

### Phase Ordering Rationale

**Why Foundation first:** Cannot build any feature without authentication, database, and credit infrastructure. Webhook architecture mistakes discovered in Phase 4 would require rewriting Phase 1-3.

**Why Brand before Generation:** Carousel generation requires brand data as input. Building generation first would require mocking brand data, then refactoring when brand management added.

**Why Generation before Stripe:** Allows testing core value proposition (AI carousel generation) without payment complexity. Can manually allocate credits in database to test full user flow. Validates product-market fit before monetization.

**Why Stripe before Polish:** Need revenue model working before public launch. Can soft-launch to early users with basic UI, but can't launch publicly without payments.

**Why Polish last:** UX improvements don't block functionality. Can collect user feedback on working product and prioritize polish based on real pain points, not assumptions.

**Alternative faster path:** Could combine Phases 3+4 (build generation and payment together) if goal is end-to-end revenue validation immediately. Separating allows testing generation workflow complexity (N8N, timeouts, callbacks) without also debugging Stripe webhooks.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 3 (Carousel Generation):** N8N webhook integration patterns, callback authentication, timeout handling, reconciliation strategies. N8N documentation is community-driven, may need experimentation.
- **Phase 4 (Stripe Integration):** Subscription lifecycle edge cases (dunning, failed payments, refunds), customer portal customization, webhook event ordering. Stripe docs are excellent but SaaS-specific patterns require reading case studies.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** Supabase auth, Next.js middleware, RLS policies — well-documented with official quickstarts and examples.
- **Phase 2 (Brand Management):** Basic CRUD, React Hook Form, Zod validation — standard patterns with abundant tutorials.
- **Phase 5 (Polish):** Landing pages, Framer Motion, Tailwind — established patterns, no novel integration challenges.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations from official docs (Next.js 15, Supabase, Stripe, Tailwind 4). Version compatibility verified across docs. Node 20 requirement confirmed via Supabase release notes. |
| Features | MEDIUM | Table stakes features verified across 4 competitors (PostNitro, aiCarousels, ContentIn, Canva). Best practices validated via multiple 2026 sources. Differentiators based on competitor analysis. Anti-features inferred from scope creep patterns. |
| Architecture | HIGH | Patterns sourced from official Supabase Next.js docs, Stripe webhook guides, Vercel reference implementations. Webhook-driven sync, client/server separation, RLS for reads are established SaaS patterns. Build order based on dependency analysis. |
| Pitfalls | HIGH | Top 10 pitfalls verified across official docs (Stripe webhooks, Supabase RLS), established community discussions (race conditions, idempotency), and SaaS billing best practices. Recovery strategies validated via post-mortems and incident reports. |

**Overall confidence:** HIGH (85%+)

Research based on official documentation for all core technologies. Architecture patterns verified via reference implementations (Vercel Next.js Subscription Payments, Makerkit). Pitfalls validated through community discussions and incident reports. Feature research medium confidence due to reliance on competitor analysis rather than first-hand user interviews, but patterns are consistent across multiple sources.

### Gaps to Address

**Version numbers for npm packages:** npm WebFetch blocked during research. Last verified: @supabase/supabase-js 2.79.0+, stripe 20.3.0+. **Validate:** Run `npm view @supabase/supabase-js version` and `npm view stripe version` during Phase 1 setup to confirm latest stable.

**N8N callback authentication:** N8N docs show webhook triggers but less detail on callback security (HMAC signing). **Validate:** During Phase 3, test N8N workflow callback with custom headers, determine if HMAC signing supported or need to implement API key verification.

**Framer Motion React 19 compatibility:** Research indicates alpha version 12.0.0-alpha.2+ has compatibility, or use motion/react rebranded package. **Validate:** During Phase 5, test Framer Motion animations in React 19 environment, confirm no SSR/hydration issues.

**Credit reconciliation frequency:** Daily reconciliation suggested for N8N-Supabase consistency, but no data on whether hourly would catch issues faster. **Validate:** During Phase 3 testing, monitor orphaned image frequency to determine if daily is sufficient or needs hourly.

**Stripe webhook event ordering:** Research confirms Stripe doesn't guarantee order, but unclear how often out-of-order arrival occurs in production. **Validate:** During Phase 4 testing, log event timestamps vs arrival timestamps to measure real-world ordering issues.

**ImageB upload limits:** Project mentions ImageB for hosting but research didn't cover storage limits, rate limiting, or costs. **Validate:** During Phase 3, confirm ImageB free tier limits or pricing, determine if cleanup cron needed for storage management.

## Sources

### Primary (HIGH confidence)
- Next.js 15 Release Notes — https://nextjs.org/blog/next-15 — Framework features and App Router patterns
- Supabase Auth SSR Documentation — https://supabase.com/docs/guides/auth/server-side/creating-a-client — Server-side auth patterns
- Stripe Webhooks Official Documentation — https://docs.stripe.com/webhooks — Webhook handling, signature verification, event types
- Tailwind CSS v4 Release — https://tailwindcss.com/blog/tailwindcss-v4 — Version 4 features and migration
- shadcn/ui React 19 Update — https://ui.shadcn.com/docs/react-19 — Component compatibility
- TanStack Query v5 Overview — https://tanstack.com/query/v5/docs/framework/react/overview — React 19 compatibility and features
- TypeScript 5.9 Release Notes — https://devblogs.microsoft.com/typescript/ — Latest TypeScript features

### Secondary (MEDIUM confidence)
- Vercel Next.js Subscription Payments — https://github.com/vercel/nextjs-subscription-payments — Reference architecture (archived Jan 2025, patterns still valid)
- Stripe Webhooks Best Practices (Stigg) — https://www.stigg.io/blog-posts/best-practices-i-wish-we-knew-when-integrating-stripe-webhooks — Idempotency and error handling
- Next.js + Supabase Production Patterns (Catjam) — https://catjam.fi/articles/next-supabase-what-do-differently — Real-world deployment lessons
- Stripe Webhooks Deep Dive (Pedro Alonso) — https://www.pedroalonso.net/blog/stripe-webhooks-deep-dive/ — Race condition examples
- Billing Webhook Race Conditions (ExcessiveCoding) — https://excessivecoding.com/blog/billing-webhook-race-condition-solution-guide — Recovery strategies
- Makerkit Next.js Supabase Architecture — https://makerkit.dev/docs/next-supabase/architecture/architecture — SaaS boilerplate patterns
- Supabase Concurrent Writes Guide — https://bootstrapped.app/guide/how-to-handle-concurrent-writes-in-supabase — Race condition prevention
- LinkedIn Carousel Generators 2026 (Supergrow) — https://www.supergrow.ai/blog/linkedin-carousel-generators — Competitor feature analysis
- LinkedIn Carousel Best Practices (ContentIn) — https://contentin.io/blog/best-linkedin-carousel-generators/ — Performance data and user expectations
- N8N Webhook Node Documentation — https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/ — Webhook trigger patterns

### Tertiary (LOW confidence)
- Community discussions on N8N webhook error handling — Integration patterns for callbacks
- Multiple WebSearch results on free tier abuse patterns — 2025-2026 SaaS security trends
- Product Hunt reviews for PostNitro, Canva — User feature expectations and pain points

---
*Research completed: 2026-02-21*
*Ready for roadmap: yes*
