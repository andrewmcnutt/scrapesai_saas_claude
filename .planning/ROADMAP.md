# Roadmap: Carousel Creator SaaS

## Overview

This roadmap delivers a production-ready LinkedIn carousel generation SaaS in 5 phases. Starting with authentication and database foundation (Phase 1), we build brand management (Phase 2), core carousel generation with N8N integration (Phase 3), Stripe subscription monetization (Phase 4), and polish for public launch (Phase 5). The architecture follows webhook-driven patterns with async processing, atomic credit operations, and full requirement coverage across 58 v1 features.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Infrastructure** - Authentication, database, webhook architecture, credit system foundation
- [ ] **Phase 2: Brand Management** - Brand profiles with voice guidelines, colors, CTA settings
- [ ] **Phase 3: Carousel Generation** - Core generation workflow with N8N, async processing, history, downloads
- [ ] **Phase 4: Stripe Integration** - Subscription payments, credit allocation, customer portal
- [ ] **Phase 5: Polish & Launch** - Landing page, animations, error handling, production readiness

## Phase Details

### Phase 1: Foundation & Infrastructure
**Goal**: Users can create accounts, log in securely, and access a protected dashboard with database persistence and webhook infrastructure
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, CRED-06, CRED-07, CRED-08, INFRA-01, INFRA-02, INFRA-03, INFRA-05, INFRA-06, INFRA-07, INFRA-08
**Success Criteria** (what must be TRUE):
  1. User can sign up with email and password, receives verification email, and completes verification
  2. User can log in with verified credentials and session persists across browser refresh
  3. User can log out from any page and session is terminated
  4. Signup is protected by CAPTCHA and rate limited to 3 signups per day per IP
  5. Database has RLS enabled on all tables with proper user isolation policies
  6. Credit transaction ledger is functional with SUM-based balance calculation
**Plans**: 4 plans in 4 waves

Plans:
- [ ] 01-01-PLAN.md — Project & Database Foundation (Next.js 15, Supabase setup, credit ledger schema)
- [ ] 01-02-PLAN.md — Authentication System (Supabase auth with email verification, session management)
- [ ] 01-03-PLAN.md — Security & Dashboard (Rate limiting, CAPTCHA, protected dashboard with credit balance)
- [ ] 01-04-PLAN.md — Human Verification Checkpoint (End-to-end auth flow testing)

### Phase 2: Brand Management
**Goal**: Every user has a brand profile with colors, voice guidelines, and CTA settings required for carousel generation
**Depends on**: Phase 1
**Requirements**: BRND-01, BRND-02, BRND-03, BRND-04, BRND-05
**Success Criteria** (what must be TRUE):
  1. User attempting first carousel generation without a brand is prompted to create one
  2. User can set brand name, colors, voice guidelines, product description, target audience, and CTA text
  3. User can view and edit brand settings from dashboard at any time
  4. Brand data is stored in Supabase with proper RLS policies enforcing 1 brand per user
**Plans**: TBD

Plans:
- [ ] TBD during phase planning

### Phase 3: Carousel Generation
**Goal**: Users can generate professional carousels from ideas, select templates and styles, view generated content with post body text, and access full carousel history
**Depends on**: Phase 2
**Requirements**: GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, GEN-06, GEN-07, GEN-08, GEN-09, GEN-10, GEN-11, GEN-12, GEN-13, GEN-14, GEN-15, HIST-01, HIST-02, HIST-03, HIST-04, HIST-05, HIST-06, N8N-01, N8N-02, N8N-03, N8N-04, N8N-05, N8N-06, N8N-07, N8N-08, N8N-09, N8N-10, UI-05
**Success Criteria** (what must be TRUE):
  1. User can input carousel idea, select template from 5-6 options, and choose image style (4 presets or custom)
  2. User clicks Generate and system deducts 1 credit atomically before calling N8N webhook
  3. Generation handles async N8N processing (60-180s) with status updates showing progress indicators
  4. Generated carousel displays all slides with post body text when complete
  5. User can download carousel as zip file and regenerate with same settings (costs another credit)
  6. User can view complete carousel history with pagination showing all past generations
  7. User can access and download any historical carousel
  8. Failed generations (timeout after 5 minutes) automatically refund credit
  9. N8N workflow updated to write to Supabase instead of Airtable
**Plans**: TBD

Plans:
- [ ] TBD during phase planning

### Phase 4: Stripe Integration
**Goal**: Users can subscribe for $29.99/month to receive 10 credits monthly with rollover, manage subscriptions via Stripe portal, and free tier enforces 3 lifetime carousel limit
**Depends on**: Phase 3
**Requirements**: CRED-01, CRED-02, CRED-03, CRED-04, CRED-05, CRED-09, CRED-10, PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, PAY-07, PAY-08, PAY-09, PAY-10, PAY-11, PAY-12, PAY-13, PAY-14, INFRA-04
**Success Criteria** (what must be TRUE):
  1. Free tier users receive 3 total carousel generations lifetime, then see upgrade prompt
  2. User can subscribe via Stripe Checkout and subscription activates immediately after payment
  3. Paid tier users receive 10 credits per month that roll over (unused credits persist)
  4. Dashboard displays current credit balance prominently with upgrade CTA when balance is low
  5. Stripe webhooks verify signatures, handle events idempotently, and process async
  6. Credits allocated automatically on successful payment via ledger transaction
  7. User can manage subscription (upgrade, cancel) via Stripe Customer Portal
  8. Cancelled subscriptions retain access until period end (cancel_at_period_end)
  9. Generation is prevented when balance is 0 with clear messaging
**Plans**: TBD

Plans:
- [ ] TBD during phase planning

### Phase 5: Polish & Launch
**Goal**: Public-facing landing page with animations, comprehensive error handling, loading states, and production-ready user experience
**Depends on**: Phase 4
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-06, UI-07, UI-08, UI-09, UI-10
**Success Criteria** (what must be TRUE):
  1. Landing page with hero section and signup CTA displays with relume.io-inspired animations (Framer Motion)
  2. All authenticated pages use light theme with Tailwind CSS v4 and shadcn/ui components
  3. Dashboard shows brand settings, generation form, carousel history, and account management
  4. Error messages are specific and actionable (not generic "Something went wrong")
  5. Loading states display during all async operations (generation, checkout sync, N8N callbacks)
  6. Checkout success flow shows "Activating subscription..." while syncing with Stripe
  7. Application is ready for public launch with complete UX polish
**Plans**: TBD

Plans:
- [ ] TBD during phase planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Infrastructure | 0/4 | Planning complete | - |
| 2. Brand Management | 0/TBD | Not started | - |
| 3. Carousel Generation | 0/TBD | Not started | - |
| 4. Stripe Integration | 0/TBD | Not started | - |
| 5. Polish & Launch | 0/TBD | Not started | - |
