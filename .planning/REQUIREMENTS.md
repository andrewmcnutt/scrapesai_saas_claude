# Requirements: Carousel Creator SaaS

**Defined:** 2026-02-21
**Core Value:** Non-designers can quickly create professional, branded LinkedIn carousels that match their voice and visual identity

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: User can sign up with email and password via Supabase
- [x] **AUTH-02**: User receives email verification after signup
- [x] **AUTH-03**: User can log in with verified email and session persists across browser refresh
- [x] **AUTH-04**: User can log out from any page
- [x] **AUTH-05**: Signup includes CAPTCHA to prevent bot abuse (Cloudflare Turnstile)
- [x] **AUTH-06**: Signup rate limited by IP (3 signups per day maximum)

### Brand Management

- [x] **BRND-01**: User is prompted to create brand profile on first carousel generation attempt
- [x] **BRND-02**: User can set brand name, colors, voice guidelines, product description, target audience, and CTA text
- [x] **BRND-03**: User can view and edit brand settings from dashboard
- [x] **BRND-04**: Brand data is stored in Supabase with RLS policies
- [x] **BRND-05**: Each user has one brand (1:1 relationship with user account)

### Carousel Generation

- [x] **GEN-01**: User can input carousel idea as text from dashboard
- [x] **GEN-02**: User can select carousel template from 5-6 options (template URLs provided externally)
- [x] **GEN-03**: User can select image style from 4 presets (Technical Annotation, Realism Notebook, White Board Diagram, Comic Strip Storyboard)
- [x] **GEN-04**: User can enter custom image style as free text
- [x] **GEN-05**: System sends idea, template URL, image style, and brand data to N8N webhook
- [x] **GEN-06**: System deducts 1 credit atomically before calling N8N (PostgreSQL RPC with SELECT FOR UPDATE)
- [x] **GEN-07**: N8N workflow processes request and returns carousel image URLs (5-10 slides from ImageB) and post body text
- [x] **GEN-08**: Generated carousel displays on dashboard with all slides visible
- [x] **GEN-09**: Generated post body text displays with carousel
- [x] **GEN-10**: User can download all carousel images as single zip file
- [x] **GEN-11**: User can regenerate carousel with same settings (costs another credit)
- [x] **GEN-12**: Generation handles N8N async processing (60-180s) without frontend timeout
- [x] **GEN-13**: Generation status updates in UI (polling with exponential backoff: 2s, 4s, 8s intervals)
- [x] **GEN-14**: Failed generations (timeout after 5 minutes) refund credit automatically
- [x] **GEN-15**: Generate button is debounced to prevent double-click double-spend

### Carousel History

- [x] **HIST-01**: All generated carousels auto-save to user's history
- [x] **HIST-02**: User can view history page showing all past carousels
- [x] **HIST-03**: History displays original idea, selected template, selected style, generation timestamp
- [x] **HIST-04**: User can view any historical carousel with full slides and post body
- [x] **HIST-05**: User can download historical carousels as zip
- [x] **HIST-06**: History is paginated (infinite scroll or page-based navigation)

### Credit System

- [x] **CRED-01**: Free tier users receive 3 total carousel generations (lifetime, not monthly)
- [x] **CRED-02**: Paid tier users receive 10 credits per month with rollover
- [x] **CRED-03**: Credits deduct when user clicks Generate (not on download)
- [x] **CRED-04**: Unused credits roll over month-to-month for paid users
- [x] **CRED-05**: Dashboard displays current credit balance prominently
- [x] **CRED-06**: Credit transactions stored as ledger (INSERT only, never UPDATE balance)
- [x] **CRED-07**: Balance calculated as SUM(transactions) for audit trail
- [x] **CRED-08**: Credits cannot go negative (CHECK constraint in database)
- [x] **CRED-09**: Monthly credit allocation tracks billing_period_id for idempotency
- [x] **CRED-10**: System prevents generation when balance is 0

### Stripe Payments & Subscriptions

- [x] **PAY-01**: Free tier enforced (3 total carousels, then upgrade prompt)
- [x] **PAY-02**: Paid tier costs $29.99/month
- [x] **PAY-03**: User can subscribe via Stripe Checkout from dashboard
- [x] **PAY-04**: Stripe webhook verifies signatures for all events (stripe.webhooks.constructEvent)
- [x] **PAY-05**: Stripe webhook handlers are idempotent (log event.id, skip if exists)
- [x] **PAY-06**: invoice.paid event allocates 10 credits via ledger transaction
- [x] **PAY-07**: customer.subscription.created event creates subscription record
- [x] **PAY-08**: customer.subscription.updated event syncs subscription changes
- [x] **PAY-09**: customer.subscription.deleted event marks subscription cancelled
- [x] **PAY-10**: Cancelled subscriptions retain access until period end (cancel_at_period_end)
- [x] **PAY-11**: Checkout success page syncs subscription immediately before rendering (queries Stripe API)
- [x] **PAY-12**: User can manage subscription via Stripe Customer Portal
- [x] **PAY-13**: Webhook handlers return 200 immediately, process async
- [x] **PAY-14**: Failed payment prevents credit allocation but doesn't revoke existing credits

### N8N Workflow Integration

- [x] **N8N-01**: Existing N8N workflow updated to write to Supabase (not Airtable)
- [x] **N8N-02**: Generation endpoint sends POST to N8N with: idea, template_url, image_style, brand data
- [x] **N8N-03**: N8N webhook returns 202 Accepted with job_id for async processing
- [x] **N8N-04**: N8N callback webhook receives: job_id, image_urls[], post_body_text
- [x] **N8N-05**: N8N callback verifies HMAC signature or API key
- [x] **N8N-06**: Callback updates carousel record from status='pending' to status='completed'
- [x] **N8N-07**: System retries callback failures with exponential backoff
- [x] **N8N-08**: Daily reconciliation job compares ImageB uploads vs database records
- [x] **N8N-09**: Orphaned images (exist in ImageB but not database) trigger manual review alert
- [x] **N8N-10**: Integration uses N8N-MCP GitHub repository for workflow editing

### Frontend & Design

- [ ] **UI-01**: Landing page with hero section and signup CTA (light theme only)
- [ ] **UI-02**: Landing page includes animations matching relume.io aesthetic (Framer Motion)
- [ ] **UI-03**: Authenticated dashboard displays brand settings, generation form, carousel history
- [ ] **UI-04**: Dashboard shows credit balance with upgrade CTA when low
- [x] **UI-05**: Dashboard displays generation status with progress indicators
- [ ] **UI-06**: All pages use light theme (no dark mode toggle)
- [ ] **UI-07**: Design uses Tailwind CSS v4 with shadcn/ui components
- [ ] **UI-08**: Design built using frontend-design-skill for consistent relume.io aesthetic
- [ ] **UI-09**: Error messages are specific (not generic "Something went wrong")
- [ ] **UI-10**: Loading states show during async operations (generation, checkout sync)

### Deployment & Infrastructure

- [x] **INFRA-01**: Application deployed to Vercel
- [x] **INFRA-02**: Version control managed via GitHub
- [x] **INFRA-03**: Supabase project configured for production (auth, database, RLS)
- [x] **INFRA-04**: Stripe account configured with production webhooks
- [x] **INFRA-05**: Environment variables secured (webhook secrets, service role keys, Stripe keys)
- [x] **INFRA-06**: Database migrations version controlled
- [x] **INFRA-07**: RLS enabled on all tables with indexed policy columns
- [x] **INFRA-08**: Rate limiting configured at application layer (IP-based, 5 generations/hour)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced AI

- **AI-01**: Voice-Trained AI learns writing style from user's past LinkedIn posts
- **AI-02**: Content Structure Templates support multiple frameworks (problem-solution, listicle, case study)
- **AI-03**: Multi-platform optimization (Instagram, Twitter/X carousel formats)

### User Experience

- **UX-01**: Email notifications when generation completes
- **UX-02**: Email notifications when credits run low (< 3 remaining)
- **UX-03**: Usage analytics dashboard (carousels created per day/week/month)
- **UX-04**: In-app tutorial/onboarding flow for first-time users

### Business

- **BUS-01**: Annual subscription option with 15% discount ($305.88/year)
- **BUS-02**: Team/agency plans with multiple brand slots
- **BUS-03**: Referral program (give 5 credits, get 5 credits)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| In-app slide editing | Anti-feature: positions as Canva competitor, scope creep into design tool territory. We're a generation tool, not a design platform. |
| Direct social media publishing | Anti-feature: OAuth complexity, platform API changes, high support burden. Users already open LinkedIn to engage with comments. Low value vs high cost. |
| Real-time collaboration | Anti-feature: WebSocket infrastructure, conflict resolution complexity, niche need. Most users work solo. Add only if user research proves demand. |
| Video carousels | Different product category, 10x cost increase (video processing, storage, hosting). Defer to v3+ if static carousels validate. |
| Analytics dashboard | Platform integrations outside our control. Users have native LinkedIn analytics. Complexity doesn't justify value. |
| Dark mode | Light theme only for v1 keeps design simple and aligned with relume.io inspiration. Can add in v2 if users request. |
| Multiple brands per user | One brand per user simplifies data model and UX. Can expand to multi-brand in v2 if agency customers emerge. |
| Template creation UI | Templates provided via external URLs. No in-app template builder. Avoids design tool scope creep. |
| Unlimited free tier | Prevents monetization and invites abuse. 3 lifetime carousels provides meaningful trial without race to bottom. |
| Custom fonts | Template fonts baked into design. Custom font support adds ImageB complexity. Defer to v2+ based on demand. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| AUTH-06 | Phase 1 | Complete |
| BRND-01 | Phase 2 | Complete |
| BRND-02 | Phase 2 | Complete |
| BRND-03 | Phase 2 | Complete |
| BRND-04 | Phase 2 | Complete |
| BRND-05 | Phase 2 | Complete |
| GEN-01 | Phase 3 | Complete |
| GEN-02 | Phase 3 | Complete |
| GEN-03 | Phase 3 | Complete |
| GEN-04 | Phase 3 | Complete |
| GEN-05 | Phase 3 | Complete |
| GEN-06 | Phase 3 | Complete |
| GEN-07 | Phase 3 | Complete |
| GEN-08 | Phase 3 | Complete |
| GEN-09 | Phase 3 | Complete |
| GEN-10 | Phase 3 | Complete |
| GEN-11 | Phase 3 | Complete |
| GEN-12 | Phase 3 | Complete |
| GEN-13 | Phase 3 | Complete |
| GEN-14 | Phase 3 | Complete |
| GEN-15 | Phase 3 | Complete |
| HIST-01 | Phase 3 | Complete |
| HIST-02 | Phase 3 | Complete |
| HIST-03 | Phase 3 | Complete |
| HIST-04 | Phase 3 | Complete |
| HIST-05 | Phase 3 | Complete |
| HIST-06 | Phase 3 | Complete |
| CRED-01 | Phase 4 | Complete |
| CRED-02 | Phase 4 | Complete |
| CRED-03 | Phase 4 | Complete |
| CRED-04 | Phase 4 | Complete |
| CRED-05 | Phase 4 | Complete |
| CRED-06 | Phase 1 | Complete |
| CRED-07 | Phase 1 | Complete |
| CRED-08 | Phase 1 | Complete |
| CRED-09 | Phase 4 | Complete |
| CRED-10 | Phase 4 | Complete |
| PAY-01 | Phase 4 | Complete |
| PAY-02 | Phase 4 | Complete |
| PAY-03 | Phase 4 | Complete |
| PAY-04 | Phase 4 | Complete |
| PAY-05 | Phase 4 | Complete |
| PAY-06 | Phase 4 | Complete |
| PAY-07 | Phase 4 | Complete |
| PAY-08 | Phase 4 | Complete |
| PAY-09 | Phase 4 | Complete |
| PAY-10 | Phase 4 | Complete |
| PAY-11 | Phase 4 | Complete |
| PAY-12 | Phase 4 | Complete |
| PAY-13 | Phase 4 | Complete |
| PAY-14 | Phase 4 | Complete |
| N8N-01 | Phase 3 | Complete |
| N8N-02 | Phase 3 | Complete |
| N8N-03 | Phase 3 | Complete |
| N8N-04 | Phase 3 | Complete |
| N8N-05 | Phase 3 | Complete |
| N8N-06 | Phase 3 | Complete |
| N8N-07 | Phase 3 | Complete |
| N8N-08 | Phase 3 | Complete |
| N8N-09 | Phase 3 | Complete |
| N8N-10 | Phase 3 | Complete |
| UI-01 | Phase 5 | Pending |
| UI-02 | Phase 5 | Pending |
| UI-03 | Phase 5 | Pending |
| UI-04 | Phase 5 | Pending |
| UI-05 | Phase 3 | Complete |
| UI-06 | Phase 5 | Pending |
| UI-07 | Phase 5 | Pending |
| UI-08 | Phase 5 | Pending |
| UI-09 | Phase 5 | Pending |
| UI-10 | Phase 5 | Pending |
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 4 | Complete |
| INFRA-05 | Phase 1 | Complete |
| INFRA-06 | Phase 1 | Complete |
| INFRA-07 | Phase 1 | Complete |
| INFRA-08 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 58 total
- Mapped to phases: 58 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-02-21*
*Last updated: 2026-02-21 after roadmap creation*
