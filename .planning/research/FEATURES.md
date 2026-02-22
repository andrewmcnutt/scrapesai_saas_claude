# Feature Research

**Domain:** SaaS Carousel Creator & Social Media Content Generation
**Researched:** 2026-02-21
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| AI Content Generation | Industry standard in 2026 - all major tools (PostNitro, aiCarousels, ContentIn) offer AI writing | MEDIUM | Users expect to input topic/idea and receive structured carousel content with hooks, value slides, and CTAs. N8N workflow already handles this. |
| Template Library | Users expect pre-designed layouts they can customize, not blank slates | LOW | 5-6 templates already provided via external URLs. Users select template before generation. |
| Brand Customization | Every competitor allows brand colors, fonts, logos - missing this = unprofessional | MEDIUM | One brand per user with colors, voice, product description, target audience. Already in PROJECT.md requirements. |
| Carousel History/Library | Users expect to reference past creations without recreating them | LOW | Auto-save all generated carousels with timestamp, original inputs. Already in PROJECT.md requirements. |
| PDF Export for LinkedIn | LinkedIn carousels work via PDF upload in 2026 - this is not optional | LOW | Download as zip file containing all slides. Already handled by N8N + ImageB workflow. |
| Credit/Usage System | SaaS content tools universally use credits to prevent abuse and clarify costs | LOW | Free tier: 3 lifetime credits. Paid tier: 10 credits/month with rollover. Already in PROJECT.md. |
| Multiple Image Style Options | Users expect control over visual style (realistic, illustrated, diagram, etc.) | LOW | 4 preset styles + custom text input already in requirements. Selection happens pre-generation. |
| Text Customization Per Slide | Users expect to limit text length and control copy density | MEDIUM | Best practice: 10-20 words per slide. Should be configurable in brand voice guidelines or generation parameters. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Voice-Trained AI | AI that learns user's writing style from past posts/content vs generic AI copy | HIGH | ContentIn offers this - analyzes past posts to match tone. Creates authentic, on-brand content that doesn't sound like "AI slop." Requires training data corpus and fine-tuning. |
| Post Body Text Generation | Not just carousel slides - also the LinkedIn post caption that accompanies it | LOW | Already in PROJECT.md (N8N returns post body text). Many tools only generate slides, forcing users to write captions separately. |
| Credit Rollover | Unused credits carry forward month-to-month vs "use it or lose it" | LOW | Already in PROJECT.md. Increases perceived value and retention. Competitors often reset monthly. |
| One-Click Regeneration | Regenerate with same settings if unsatisfied, without re-entering all inputs | LOW | Already in PROJECT.md requirements. Saves time during iteration. |
| Content Structure Templates | Not just visual templates - structured content frameworks (problem-solution, listicle, case study) | MEDIUM | N8N could generate different narrative structures. Helps non-writers create effective content flow beyond just design. |
| Multi-Platform Optimization | Generate carousel variants optimized for LinkedIn AND Instagram dimensions/formats simultaneously | MEDIUM | Most tools focus on one platform. Would require N8N workflow to output multiple size variants per generation. |
| Brand Voice Guidelines | Structured inputs for tone, vocabulary, audience that guide AI generation | LOW | Already in PROJECT.md (brand voice guidelines). Implementation quality differentiates - most tools have basic fields. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| In-App Slide Editing | Users want to tweak individual slides after generation | Creates Canva competitor scope creep. Every edit feature = maintenance burden. Users expect full editing suite if you offer any editing. | Regeneration with adjusted prompts. If major changes needed, users already have Canva/Figma. Position as "generation tool" not "design tool." |
| Direct Social Media Publishing | "Why can't I publish directly to LinkedIn from your app?" | Requires OAuth integrations, handling platform API changes, support burden for posting failures, liability for posting errors. LinkedIn API restrictions on document posts. | Download + manual upload. Users already in LinkedIn to engage with comments anyway. Keep scope focused on creation, not distribution. |
| Unlimited Free Tier | "Why only 3 free carousels? Competitors offer more!" | Race to bottom on pricing. Users who want free will never convert. 3 carousels = enough to validate value, not enough to avoid paying. | Generous paid tier (10 credits/month, rollover). Position 3 free as "trial" not "free tier." |
| Real-Time Collaboration | "Can my team edit carousels together?" | Requires WebSocket infrastructure, conflict resolution, permission systems. Massive scope expansion. Most users work solo. | One brand per user. Teams can share account credentials if needed. Future enterprise tier could add this. |
| Template Design Builder | "I want to create custom templates in your app" | Turns product into design tool. Template creation is complex (multi-page layouts, variable text areas, image zones). Maintenance nightmare. | Provide template URLs (external hosting). Users can design templates in Canva, host anywhere, paste URL. Flexibility without complexity. |
| Video Carousels | "Can it generate video slides?" | 10x cost increase (video generation), storage costs explode, slower generation, quality concerns. Static images are proven format. | Focus on static images (proven 303% engagement boost on LinkedIn). Video is different product category. |
| Analytics/Performance Tracking | "Show me how my carousels perform on social media" | Requires platform integrations to pull engagement data. Users post manually, so tracking attribution is impossible. Privacy concerns. | Users can track in LinkedIn native analytics. Not our job to replicate platform analytics. Focus on creation quality. |

## Feature Dependencies

```
Brand Management
    └──requires──> User Authentication (can't save brand without user account)

Carousel Generation
    └──requires──> Brand Management (generation uses brand data)
    └──requires──> Template Selection (must pick template before generating)
    └──requires──> Style Selection (must pick style before generating)

Carousel History
    └──requires──> Carousel Generation (can't save what hasn't been generated)
    └──requires──> Brand Management (history linked to user/brand)

Credit System
    └──requires──> User Authentication (track credits per user)
    └──requires──> Carousel Generation (deduct on generation event)

Stripe Payments
    └──requires──> User Authentication (link subscription to user)
    └──requires──> Credit System (payments allocate credits)

Regeneration Feature
    └──requires──> Carousel History (retrieve original inputs)
    └──requires──> Credit System (deduct credit for regeneration)
```

### Dependency Notes

- **Carousel Generation requires Brand Management:** Cannot generate without brand data (colors, voice, audience). Users must create brand first (prompted on first carousel attempt per PROJECT.md).
- **Credit System required before Carousel Generation:** Must track and deduct credits before allowing generation. Free tier limit (3 lifetime) enforced at generation time.
- **Stripe Payments enhances Credit System:** Paid subscription allocates credits. Credit system works standalone for free tier, but payment integration unlocks credit replenishment.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] User Authentication (Supabase email/password) — Cannot save brands or track credits without accounts
- [x] Brand Management (one brand per user) — Essential for personalized generation
- [x] Template Selection (5-6 external URLs) — Users need visual variety
- [x] Style Selection (4 presets + custom) — Control over carousel aesthetic
- [x] AI Carousel Generation (N8N workflow) — Core value proposition
- [x] Post Body Text Generation — Differentiator vs design-only tools
- [x] Carousel History (auto-save all) — Reference library, prevents re-creation work
- [x] Download as Zip — Users need carousel files to upload to LinkedIn
- [x] Credit System (free: 3 lifetime, paid: 10/month with rollover) — Monetization + abuse prevention
- [x] Stripe Subscription ($29.99/month) — Revenue model
- [x] Regeneration (same settings) — Quality iteration without re-input

### Add After Validation (v1.x)

Features to add once core is working and validated by real users.

- [ ] Content Structure Templates — Trigger: Users request help with content organization (problem-solution, listicle frameworks)
- [ ] Voice-Trained AI — Trigger: Users complain about generic AI tone. Requires collecting training data corpus from willing users first.
- [ ] Multi-Platform Optimization — Trigger: Users explicitly request Instagram carousel support. Requires N8N workflow expansion.
- [ ] Advanced Brand Voice Controls — Trigger: Users want more granular tone controls beyond current voice guidelines field. Add structured inputs (formal/casual scale, vocabulary preferences, examples).
- [ ] Webhook Status Notifications — Trigger: Users frustrated waiting for generation. Add email/in-app notification when carousel ready if N8N processing takes >30 seconds.
- [ ] Bulk Generation — Trigger: Power users want to generate multiple carousels from list of topics. Requires queue system and credit bulk deduction.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Team Collaboration — Why defer: Complex infrastructure (real-time editing, permissions). Most v1 users are solopreneurs. Wait for enterprise customer demand.
- [ ] Custom Template Upload — Why defer: Becomes design tool, not generation tool. Scope creep risk. External URL approach works for v1.
- [ ] Direct LinkedIn Publishing — Why defer: API complexity, support burden, minimal value gain (users already open LinkedIn to engage with comments). Manual download is sufficient.
- [ ] Multiple Brands Per User — Why defer: Simplifies v1 data model. Agency/multi-brand need is niche. One brand serves 90% of users.
- [ ] Analytics Dashboard — Why defer: Requires platform integrations we don't control. Users post manually, so attribution is unreliable. Native platform analytics exist.
- [ ] Video Carousel Generation — Why defer: Different product category. 10x cost. Static images are proven, high-performing format.
- [ ] White-Label/Reseller — Why defer: Enterprise feature. V1 focuses on individual creators, not agencies selling to clients.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| AI Carousel Generation | HIGH | MEDIUM (existing N8N workflow) | P1 |
| Brand Customization | HIGH | MEDIUM | P1 |
| Credit System | HIGH | LOW | P1 |
| Carousel History | HIGH | LOW | P1 |
| Post Body Text | HIGH | LOW (N8N already returns) | P1 |
| Template Selection | HIGH | LOW (external URLs) | P1 |
| PDF Export/Download | HIGH | LOW (N8N + ImageB) | P1 |
| Regeneration | MEDIUM | LOW | P1 |
| Voice-Trained AI | HIGH | HIGH (requires training pipeline) | P2 |
| Content Structure Templates | MEDIUM | MEDIUM (N8N prompt engineering) | P2 |
| Multi-Platform Optimization | MEDIUM | MEDIUM (N8N multi-output) | P2 |
| Webhook Status Notifications | MEDIUM | LOW | P2 |
| Bulk Generation | LOW | MEDIUM (queue system) | P2 |
| Team Collaboration | LOW | HIGH (real-time infra) | P3 |
| Direct Publishing | LOW | HIGH (OAuth, API maintenance) | P3 |
| In-App Editing | LOW | HIGH (design tool scope) | P3 |
| Analytics Dashboard | LOW | HIGH (platform integrations) | P3 |

**Priority key:**
- P1: Must have for launch (all already in PROJECT.md requirements)
- P2: Should have, add when possible (user feedback triggers)
- P3: Nice to have, future consideration (wait for enterprise demand or clear ROI)

## Competitor Feature Analysis

| Feature | Canva | PostNitro | aiCarousels | ContentIn | Our Approach |
|---------|-------|-----------|-------------|-----------|--------------|
| AI Content Generation | Limited (Carousel Studio app) | Yes (full narrative structure) | Yes (topic to carousel) | Yes (voice-trained on past posts) | Yes via N8N - topic/idea to structured content + post body |
| Template Library | 897+ LinkedIn templates | Limited pre-designed templates | Hundreds of templates | Built-in branded templates | 5-6 external URLs (focused curation vs overwhelming choice) |
| Brand Customization | Brand Kit (Pro: $12.99/mo) | Brand colors, fonts, logos | Yes | Yes (saves brand for reuse) | One brand per user with voice, colors, audience, CTA |
| Scheduling/Publishing | No native LinkedIn scheduling | No scheduling | No scheduling | Yes (native in-platform) | No - focus on creation, not distribution (anti-feature) |
| Download Format | PNG, JPG, PDF | PDF for LinkedIn | PDF export | PDF export | Zip file with all slides (convenience) |
| Pricing | $12.99/mo (Pro individual) | $20/mo for carousels only | Free + paid tiers | $29/mo (includes scheduling, analytics) | $29.99/mo (10 credits/month, rollover) - competitive |
| Credit System | No credits (unlimited) | Not mentioned | Limited free, paid unlocks AI | Unlimited carousel creation | 3 free lifetime (trial), 10/month paid (prevents abuse) |
| Post Caption Generation | No | No | No | Yes (AI ghostwriter) | Yes (post body text included) - differentiator |
| Voice Training | No | No | No | Yes (analyzes past posts) | Not in v1 (future P2 feature) |
| In-App Editing | Full design suite | No (generation only) | Limited customization | Limited | No - regeneration instead (anti-feature, avoid scope creep) |
| Multi-Platform | Yes (all platforms) | Instagram, LinkedIn, TikTok | LinkedIn, Instagram, TikTok | LinkedIn focused | LinkedIn focused v1, Instagram future consideration |
| Collaboration | Yes (Team plan: $29.99/mo) | No | No | Team features available | No - one brand per user (v1 simplification) |

**Key Insights:**
- **Canva** is design tool with carousel feature. We're carousel tool, not design platform.
- **PostNitro** closest to our approach (generation-focused, no scheduling), but lacks post caption generation (our differentiator).
- **aiCarousels** has free tier + many templates. We differentiate on quality (curated templates, post body text, credit rollover).
- **ContentIn** is comprehensive platform (scheduling, analytics, voice training). We're leaner, focused on generation quality. Their $29/mo includes more features, but also more complexity. We match price with simpler, focused product.

**Our Positioning:** Generation-quality focused tool. Not a design platform (Canva), not a full content suite (ContentIn). Best-in-class carousel generation with post captions, then get out of user's way.

## Sources

**Confidence Assessment:**
- MEDIUM confidence overall. WebSearch-based research verified across multiple 2026 sources (Supergrow, ContentIn, PostNitro product pages, user review sites).
- HIGH confidence on table stakes (template libraries, AI generation, brand customization, PDF export) - universal across all competitors.
- MEDIUM confidence on differentiators (voice training, post body text) - features exist in some tools but not all.
- HIGH confidence on anti-features (direct publishing, in-app editing, unlimited free) - validated by competitor analysis and user feedback patterns.

**Primary Sources:**
- Supergrow: "8 Best LinkedIn Carousel Generators for 2026" (https://www.supergrow.ai/blog/linkedin-carousel-generators)
- ContentIn: "9 Best LinkedIn Carousel Generators (2026) - Tested & Compared" (https://contentin.io/blog/best-linkedin-carousel-generators/)
- Expandi: "How To Create A LinkedIn Carousel In 2026" (https://expandi.io/blog/linkedin-carousel/)
- SocialPilot: "LinkedIn Carousels 2026: How to Create, Post, and Go Viral" (https://www.socialpilot.co/blog/linkedin-carousel)
- Product Hunt: PostNitro reviews (https://www.producthunt.com/products/postnitro/reviews)
- Capterra: Canva reviews 2026 (https://www.capterra.com/p/168956/Canva/reviews/)

**Performance Data:**
- LinkedIn carousels achieve 6.60% average engagement rate (highest-performing format) - PostUnreel 2026 data
- Carousels generate 303% more engagement than single images - SocialPilot
- AI-generated carousels: 44% engagement boost vs manual, 68% higher save rates - PostNitro blog
- 76% of humans can detect AI-generated text, 72% feel "deceived" by undisclosed AI content - CXL brand voice research
- Content with distinctive brand voice generates 3x more engagement than generic messaging - Social Media Examiner

**Best Practices Validated:**
- Ideal carousel length: 6-10 slides (sources: Expandi, SocialPilot, Kanbox)
- Text per slide: 10-20 words maximum (sources: Expandi, Oreate AI, SocialPilot)
- Optimal content structure: Hook → Value → Proof → CTA (sources: Expandi, Supergrow)
- Square (1080x1080px) or vertical (1080x1350px) formats perform best on mobile LinkedIn (source: Expandi)

---
*Feature research for: SaaS Carousel Creator & Social Media Content Generation*
*Researched: 2026-02-21*
