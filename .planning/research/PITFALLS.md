# Pitfalls Research

**Domain:** SaaS with Stripe subscriptions, credit systems, and webhook integrations
**Researched:** 2026-02-21
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Stripe Webhook Race Conditions

**What goes wrong:**
When a customer completes Stripe checkout and is redirected back to the app, the frontend loads immediately and displays stale subscription/credit data. Meanwhile, Stripe webhooks arrive asynchronously 1-5 seconds later to update the database. Users see "no subscription" despite having just paid, requiring manual refresh. Even worse, when multiple webhook events (`customer.subscription.created`, `invoice.paid`, `payment_intent.succeeded`) arrive nearly simultaneously, processing one event may fail because another event's database changes haven't completed yet.

**Why it happens:**
Webhooks are asynchronous by design. Stripe sends events to your endpoint over the network, which inherently has latency. Multiple events fire in rapid succession, and network conditions can cause later events to arrive before earlier ones. Stripe explicitly does not guarantee delivery order. Developers assume the checkout redirect = webhook processed, but these are independent operations racing each other.

**How to avoid:**
1. **Immediate sync on checkout return**: When user redirects from Stripe checkout, immediately fetch subscription status directly from Stripe API and update database synchronously before rendering UI
2. **Polling fallback**: If sync doesn't reveal subscription, poll status endpoint with exponential backoff (1s, 2s, 3s, 4s, 5s) for up to 5 attempts
3. **Single source of truth**: For subscriptions, treat `invoice.paid` as authoritative event (fires only on confirmed payment, contains all necessary data)
4. **Idempotency keys**: Track processed event IDs in database to prevent duplicate processing when webhooks retry
5. **Database transactions**: Wrap all webhook processing in atomic transactions to prevent partial state updates

**Warning signs:**
- Users reporting "I paid but still see free tier"
- Support tickets about "refresh to see subscription"
- Database records showing subscription exists but credits weren't allocated
- Logs showing webhook processing errors like "user not found" followed by success on retry
- Multiple webhook events arriving within milliseconds of each other

**Phase to address:**
Phase 1 (Stripe & Subscriptions) - Must be architected correctly from the start. Cannot be retrofitted easily.

---

### Pitfall 2: Missing Webhook Signature Verification

**What goes wrong:**
Without verifying the `Stripe-Signature` header, attackers can send fake webhook events to your endpoint. A malicious actor could POST JSON to your webhook URL claiming a payment succeeded, granting themselves premium credits without paying. Over 40% of transaction issues arise from improper webhook validation, leading to spoofed events, fraudulent credit allocation, and financial loss.

**Why it happens:**
Developers skip signature verification during development (using localhost or test mode where security feels less urgent) and forget to implement it before production. Framework middleware manipulates the request body (parsing JSON, adding CSRF tokens), making raw body unavailable for HMAC verification. Teams don't understand that webhook URLs are public and anyone can discover them.

**How to avoid:**
1. **Always verify signatures**: Use Stripe's official libraries to verify `Stripe-Signature` header on every webhook request
2. **Preserve raw body**: Ensure framework doesn't manipulate request body before signature verification (exempt webhook routes from body parsers and CSRF middleware)
3. **Use webhook secrets**: Store endpoint signing secret in environment variables, rotate periodically
4. **Reject unsigned requests**: Return 401/403 for any request failing signature verification
5. **HTTPS only**: Configure webhooks with publicly accessible HTTPS URLs (TLS v1.2+) in production

**Warning signs:**
- Webhook endpoint accessible without authentication
- Framework logs showing "JSON body already parsed" before signature check
- Environment variables missing `STRIPE_WEBHOOK_SECRET`
- Webhook routes not exempted from CSRF protection
- Using HTTP instead of HTTPS for webhook URLs

**Phase to address:**
Phase 1 (Stripe & Subscriptions) - Security requirement from day one. Must be implemented before processing any webhooks.

---

### Pitfall 3: Non-Idempotent Webhook Handlers

**What goes wrong:**
Stripe webhooks can arrive multiple times for the same event (network failures, endpoint timeouts, retries). If webhook handlers aren't idempotent, processing the same event twice causes duplicate credit allocation (user gets 20 credits instead of 10), duplicate email sends, corrupted subscription state, or database constraint violations. Your handler returns 500 on second processing attempt, Stripe retries exponentially for 3 days, flooding logs with errors.

**Why it happens:**
Developers write handlers that assume each webhook is unique: "When invoice.paid arrives, add 10 credits." They don't track which events have been processed. Handlers perform complex business logic before returning HTTP 200, causing timeouts that trigger Stripe retries. Teams don't realize Stripe uses at-least-once delivery guarantees.

**How to avoid:**
1. **Event ID tracking**: Log `event.id` in database before processing, skip if already exists
2. **Return 200 immediately**: Acknowledge receipt with 2xx status before executing business logic
3. **Async processing**: Queue webhook events for background processing with retry logic
4. **Database constraints**: Use unique constraints on Stripe resource IDs to prevent duplicate records
5. **Idempotent operations**: Design credit allocation as "set balance to X" not "add X to balance"
6. **Compare object IDs**: For true duplicates (same Event object sent twice), also check `data.object.id` + `event.type`

**Warning signs:**
- Users reporting double credit allocation after payment
- Webhook logs showing same `event.id` processed multiple times
- Database unique constraint violations in webhook processing
- Stripe dashboard showing failed webhook deliveries (red dots)
- Handlers taking >1 second to return response
- Email service showing duplicate sends

**Phase to address:**
Phase 1 (Stripe & Subscriptions) - Architectural pattern that must be correct from the start. Retrofitting is expensive.

---

### Pitfall 4: Credit System Double-Spending

**What goes wrong:**
User with 1 credit remaining triggers carousel generation twice simultaneously (double-click, multiple tabs, API race condition). Both requests check balance (1 credit available), both proceed with generation, both deduct 1 credit. User gets 2 carousels but only paid for 1. Or worse: concurrent requests cause negative credit balance (-1 credits) because deductions aren't atomic. Your N8N workflow costs you money for free carousels.

**Why it happens:**
Credit checks and deductions are separate operations: `SELECT balance` → `if balance > 0` → `UPDATE balance - 1` → `call N8N`. Between SELECT and UPDATE, another request can read the same balance. Supabase client doesn't enforce atomicity across these operations. Developers don't implement database-level locking. Frontend allows double-submission.

**How to avoid:**
1. **Atomic deduction via RPC**: Create PostgreSQL function that checks and deducts credits in single transaction with SERIALIZABLE isolation
2. **Database constraints**: Add `CHECK (credits >= 0)` constraint to prevent negative balances
3. **Optimistic locking**: Use version numbers or timestamps, fail transaction if balance changed since read
4. **Frontend debouncing**: Disable generate button after first click, show loading state
5. **Idempotency keys**: Pass client-generated idempotency key, return existing result if duplicate request
6. **Row-level locking**: Use `SELECT ... FOR UPDATE` in transaction to lock user's credit row

**How to avoid (RPC example):**
```sql
CREATE FUNCTION deduct_credit_and_generate(user_id UUID, carousel_id UUID)
RETURNS TABLE(success BOOLEAN, credits_remaining INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Lock row and check balance atomically
  SELECT credits INTO current_credits
  FROM user_credits
  WHERE user_id = $1
  FOR UPDATE;

  IF current_credits < 1 THEN
    RETURN QUERY SELECT FALSE, current_credits;
  END IF;

  -- Deduct credit
  UPDATE user_credits
  SET credits = credits - 1
  WHERE user_id = $1;

  -- Log generation
  INSERT INTO carousel_generations (user_id, carousel_id, credits_used)
  VALUES ($1, $2, 1);

  RETURN QUERY SELECT TRUE, current_credits - 1;
END;
$$;
```

**Warning signs:**
- Users reporting negative credit balances
- Multiple carousel generations logged for same timestamp/user
- Revenue doesn't match carousel generation counts
- N8N logs showing more requests than credits deducted
- Frontend allows rapid double-clicking "Generate"
- Database logs showing concurrent UPDATE statements on same user

**Phase to address:**
Phase 2 (Credits & Generation) - Must be architected correctly when implementing credit system. Cannot be bolted on later.

---

### Pitfall 5: Supabase RLS Policy Mistakes

**What goes wrong:**
Tables without RLS enabled are accessible to anyone with your project URL and anon key. Policies using `auth.uid() = user_id` silently fail when users aren't authenticated, returning empty results instead of errors. Policies checking `user_metadata` from JWT allow users to manipulate their own permissions. Performance degrades catastrophically because policies run per-row without indexes. Views created with postgres role bypass RLS entirely, exposing all data.

**Why it happens:**
Developers enable RLS in dashboard but forget the SQL equivalent when running migrations. They don't understand that `auth.uid()` returns null for unauthenticated users. They trust JWT claims without knowing users can modify `user_metadata` in their profile. They write policies without considering query performance. Framework ORMs generate unfiltered queries that bypass index optimization.

**How to avoid:**
1. **Always enable RLS**: On every table in public schema, verify with `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`
2. **Explicit auth checks**: Use `auth.uid() IS NOT NULL AND auth.uid() = user_id` pattern
3. **Use raw_app_meta_data**: Store authorization data only admins can modify, never rely on `user_metadata` for permissions
4. **Index policy columns**: Create indexes on every column referenced in RLS policies
5. **Optimize auth.uid()**: Wrap in SELECT to run once per query: `(SELECT auth.uid()) = user_id`
6. **Secure views**: Use `security_invoker = true` (Postgres 15+) or revoke access from anon/authenticated roles
7. **WITH CHECK clauses**: Always include `WITH CHECK` for insert/update policies to validate new data

**Warning signs:**
- API returns empty arrays for authenticated users
- Users can see other users' data by guessing IDs
- Queries taking >1 second on small tables
- Missing indexes on user_id columns
- Views accessible to anon role
- Policies missing `auth.uid() IS NOT NULL`
- JWT changes not reflected until manual logout/login

**Phase to address:**
Phase 1 (Auth & Database) - Security foundation that must be correct before building features. Retrofitting is extremely risky.

---

### Pitfall 6: N8N Workflow Timeout Failures

**What goes wrong:**
User clicks "Generate Carousel", frontend shows loading spinner, N8N workflow starts processing (calling AI models, generating images, uploading to ImageB). After 30 seconds, frontend timeout expires, user sees error. But N8N workflow continues running for 5 more minutes, completes successfully, generates images, consumes API credits, deducts user credits - but frontend never receives results. User clicks "Generate" again, spending another credit on duplicate generation. Or worse: workflow partially completes, leaving orphaned data.

**Why it happens:**
AI generation takes 60-180 seconds but frontend timeout is 30 seconds. N8N workflows run asynchronously but frontend expects synchronous response. No webhook callback mechanism to notify completion. Network timeouts occur differently for connection establishment vs. data retrieval. Developers don't implement retry logic with exponential backoff. Long-running workflows aren't designed for async/await patterns.

**How to avoid:**
1. **Async architecture**: Return 202 Accepted immediately, process webhook in background, notify frontend via polling/websocket
2. **Job queue pattern**: Create carousel_generations record with status='pending', poll for completion
3. **Webhook callbacks**: Configure N8N to POST results to your callback endpoint when complete
4. **Tiered timeouts**: Connection timeout 10s, read timeout 180s, overall timeout 300s
5. **Idempotency keys**: Pass carousel_id to N8N, return existing results if duplicate request
6. **Exponential backoff**: Retry failed webhooks with delays: 4s, 16s, 64s intervals
7. **Dead letter queue**: After 3 failures, log to manual review queue with full context
8. **Circuit breaker**: Temporarily stop sending requests if N8N has >50% failure rate

**How to avoid (async pattern):**
```typescript
// 1. Create pending record
const { data: carousel } = await supabase
  .from('carousel_generations')
  .insert({
    user_id,
    idea,
    status: 'pending',
    n8n_request_id: uuid() // idempotency key
  })
  .select()
  .single();

// 2. Trigger N8N asynchronously (don't await)
fetch(N8N_WEBHOOK_URL, {
  method: 'POST',
  body: JSON.stringify({
    carousel_id: carousel.id,
    callback_url: `${APP_URL}/api/n8n/callback`,
    ...carouselData
  })
}).catch(logError);

// 3. Return 202 immediately
return { carousel_id: carousel.id, status: 'pending' };

// 4. Frontend polls for completion
const checkStatus = async () => {
  const { data } = await supabase
    .from('carousel_generations')
    .select('status, image_urls, post_body')
    .eq('id', carousel_id)
    .single();

  if (data.status === 'completed') return data;
  if (attempts < 30) setTimeout(checkStatus, 2000); // poll every 2s for 60s
};
```

**Warning signs:**
- Frontend showing "Request failed" but N8N logs show success
- Users reporting "I was charged but got no carousel"
- Carousel generations in database with no image URLs
- N8N workflow average runtime >60 seconds
- Frontend timeout errors increasing over time
- Multiple carousel records with same idea/timestamp
- ImageB showing uploaded images not linked to any carousel

**Phase to address:**
Phase 2 (Credits & Generation) - Async architecture must be designed when integrating N8N. Cannot be converted from sync to async later without major refactor.

---

### Pitfall 7: Free Tier Abuse & Bot Attacks

**What goes wrong:**
Attackers script signups to create hundreds of accounts, each getting 3 free carousel generations. They harvest 300+ carousels without paying, costing you N8N API fees, ImageB storage, AI model costs, and Supabase bandwidth. Email verification requirement bypassed using temporary email services. Bots hammer signup endpoint causing legitimate users to hit rate limits. Your AWS bill skyrockets, Supabase warns about quota limits, ImageB storage fills up.

**Why it happens:**
No CAPTCHA on signup form makes automated account creation trivial. Email verification is weak security (10minutemail.com, etc). Free tier has no IP-based limits allowing same IP to create unlimited accounts. No rate limiting on expensive operations (carousel generation). Developers assume "3 carousels per user" prevents abuse, not realizing attackers create unlimited users.

**How to avoid:**
1. **CAPTCHA on signup**: Use Cloudflare Turnstile (free, privacy-respecting) or hCaptcha on registration
2. **Email domain blocking**: Block temporary email providers (10minutemail, guerrillamail, etc) using maintained blocklist
3. **Rate limiting by IP**: Max 3 signups per IP per day, max 5 carousel generations per IP per hour (even across accounts)
4. **Device fingerprinting**: Track browser fingerprints to detect same device creating multiple accounts
5. **Email verification strictness**: Require verified email before first carousel generation, not just before account creation
6. **Stripe payment verification**: Require $1 verification charge (refunded) to unlock free tier, filters bots
7. **Monitor abuse patterns**: Alert when single IP creates >5 accounts/day or generates >15 carousels/hour
8. **Credit burndown velocity**: Flag users who burn all 3 credits within first hour of signup

**Warning signs:**
- Signup rate increases 10x overnight
- Most new users burning all 3 credits immediately
- High percentage of @10minutemail.com addresses
- Same IP creating >10 accounts
- Carousel generation API costs increasing faster than user growth
- ImageB storage growing >10GB/day
- Users with sequential email addresses (test1@gmail.com, test2@gmail.com)
- Supabase warning about bandwidth limits

**Phase to address:**
Phase 1 (Auth & Protection) - Rate limiting infrastructure needed from day one. Phase 3 (Monitoring) - Abuse detection dashboards to catch attacks early.

---

### Pitfall 8: Subscription Cancellation Timing Bugs

**What goes wrong:**
User cancels subscription on day 15 of billing cycle. You immediately revoke credits and downgrade to free tier. Stripe webhook `customer.subscription.updated` fires with `cancel_at_period_end=true`, but subscription is still active until period end (day 30). User paid for full month but only got 15 days of service. Alternatively: you let them keep credits until period end, they generate 50 carousels on day 29, subscription cancels on day 30, webhook fails to process, credits never deducted, user got month of free premium.

**Why it happens:**
Developers confuse "cancel subscription" with "end subscription immediately". Stripe has `cancel_at_period_end` (graceful) vs `cancel` (immediate). Webhook events are ambiguous: `customer.subscription.updated` fires for cancellation request, `customer.subscription.deleted` fires when actually ends. Teams implement "cancel = remove access immediately" thinking it protects revenue, but it violates user expectations and likely your ToS.

**How to avoid:**
1. **Understand cancel_at_period_end**: When user cancels, subscription remains active until period end, they keep access
2. **Listen to correct events**:
   - `customer.subscription.updated` with `cancel_at_period_end=true` = user requested cancellation, keep access
   - `customer.subscription.deleted` = subscription actually ended, now revoke access
3. **Grace period UI**: Show "Your subscription ends on [date]" when cancel_at_period_end, not "Subscription cancelled"
4. **Credit allocation timing**: Continue monthly credit allocation until subscription actually deleted
5. **Prevent credit abuse**: Track credit usage velocity in final week, alert if >200% of normal usage
6. **Stripe customer portal**: Use Stripe's hosted portal for cancellations to handle all edge cases correctly
7. **Reactivation flow**: If user resubscribes before period end, Stripe updates subscription automatically

**Warning signs:**
- Users complaining "I cancelled but was charged again"
- Support tickets "I cancelled but lost access immediately"
- Revenue dropping because users cancel day after renewal to "get one month free"
- `customer.subscription.deleted` webhooks failing
- Credits showing negative balance after subscription ends
- Subscription status in database doesn't match Stripe dashboard

**Phase to address:**
Phase 1 (Stripe & Subscriptions) - Must understand Stripe subscription lifecycle from the start. Phase 4 (Account Management) - Cancellation UI must reflect correct behavior.

---

### Pitfall 9: Credit Rollover Accounting Errors

**What goes wrong:**
User subscribes in January, gets 10 credits, uses 3. February arrives, you add 10 more credits (total should be 17), but database shows 20 because code does `credits = 10` instead of `credits += 10`. Alternatively: you correctly add 10, user now has 17, but revenue reports show "170% credit usage vs payment" because accounting system counts total balance instead of incremental allocation. CFO panics thinking business model is broken.

**Why it happens:**
Developers implement credit allocation as SET instead of INCREMENT. No audit trail of credit transactions (when added, when used, what for). Mixing subscription credits with one-time purchased credits in same column. Not tracking "credits allocated this period" vs "credits carried forward" separately. Renewals don't account for remaining credits. Reporting queries don't distinguish credit sources.

**How to avoid:**
1. **Transaction ledger model**: Never modify balance directly, always INSERT transaction records (type, amount, timestamp, source)
2. **Calculated balance**: Compute balance as `SUM(credits_transactions.amount) WHERE user_id = X`
3. **Separate tracking**: Track monthly_credits_allocated, bonus_credits, total_available separately
4. **Audit trail**: Every credit change logged with reason: 'monthly_allocation', 'subscription_payment', 'admin_grant', 'carousel_generation'
5. **Idempotent allocation**: Key monthly allocations by billing_period_id, prevent duplicate grants
6. **Rollover limits**: Cap rollover (e.g., max 30 credits total) to prevent accumulation without usage
7. **Revenue reconciliation**: Monthly report comparing credits allocated vs dollars paid vs credits used

**How to avoid (ledger schema):**
```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL, -- positive for grants, negative for deductions
  transaction_type TEXT NOT NULL, -- 'monthly_allocation', 'carousel_generation', etc
  source_id TEXT, -- billing_period_id or carousel_id
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Balance is always computed
CREATE VIEW user_credit_balances AS
SELECT
  user_id,
  SUM(amount) as total_credits,
  SUM(CASE WHEN transaction_type = 'monthly_allocation' THEN amount ELSE 0 END) as subscription_credits,
  SUM(CASE WHEN transaction_type = 'bonus_grant' THEN amount ELSE 0 END) as bonus_credits
FROM credit_transactions
GROUP BY user_id;
```

**Warning signs:**
- Credit balances don't match expected values (10, 20, 30 from monthly grants)
- Users reporting "I had 17 credits but now only have 10"
- Financial reports showing credit allocation >100% of revenue
- No way to audit when/why credits changed
- Can't answer "how many credits were actually used last month"
- Subscription renewals resetting credits to 10 instead of adding 10
- Database direct updates to credit column

**Phase to address:**
Phase 2 (Credits & Generation) - Ledger architecture must be designed from start. Phase 5 (Admin & Monitoring) - Audit tools to detect discrepancies.

---

### Pitfall 10: N8N-Supabase Data Consistency Failures

**What goes wrong:**
User generates carousel, N8N workflow completes, images uploaded to ImageB, but N8N webhook back to your app fails (network timeout, validation error). Carousel images exist in ImageB but not in Supabase database. User's credit was deducted but they can't access carousel. Week later, orphaned images pile up costing storage fees. Or reverse: Supabase records carousel as 'completed' but ImageB upload failed, user sees broken image URLs.

**Why it happens:**
N8N workflow and Supabase database are separate systems with no distributed transaction guarantees. Network failures between them. Webhook callback URL incorrect or endpoint throws 500 error. No retry logic on N8N side. Database insert fails validation after workflow completes. Partial failures leave inconsistent state (images uploaded but database insert failed). No reconciliation process to detect mismatches.

**How to avoid:**
1. **Workflow state in database**: Create carousel record with status='pending' before calling N8N, update to 'completed' when callback received
2. **Idempotency on callbacks**: N8N sends carousel_id in callback, upsert based on ID
3. **Callback verification**: N8N includes HMAC signature in callback, verify before processing
4. **Exponential retry**: If callback fails, N8N retries with backoff (3 attempts over 15 minutes)
5. **Reconciliation job**: Daily cron comparing ImageB uploads vs Supabase records, alert on mismatches
6. **Timeout handling**: If no callback received in 10 minutes, mark carousel as 'failed', refund credit
7. **Compensating transactions**: If ImageB upload succeeds but callback fails, N8N cleanup job deletes orphaned images
8. **Status transitions**: Only allow pending → processing → completed or pending → processing → failed paths

**How to avoid (workflow integration):**
```typescript
// N8N workflow structure
// 1. Receive webhook with carousel_id
// 2. Generate carousel (AI + images)
// 3. Upload images to ImageB
// 4. POST results to callback URL with retry
// 5. If callback fails after 3 retries, log to error queue

// Callback endpoint in your app
app.post('/api/n8n/callback', async (req) => {
  const { carousel_id, image_urls, post_body, signature } = req.body;

  // Verify N8N signature
  if (!verifyN8NSignature(signature)) return res.status(401).end();

  // Idempotent update (safe to call multiple times)
  await supabase
    .from('carousel_generations')
    .update({
      status: 'completed',
      image_urls,
      post_body,
      completed_at: new Date()
    })
    .eq('id', carousel_id)
    .eq('status', 'processing'); // Only update if still processing

  return res.status(200).json({ received: true });
});
```

**Warning signs:**
- ImageB storage growing but carousel records not increasing proportionally
- Users reporting "generation stuck on loading forever"
- Database showing carousels with status='processing' older than 10 minutes
- N8N logs showing successful workflow but database shows 'failed'
- ImageB has files not referenced in any database record
- Callback endpoint returning 500 errors
- Credit deductions without corresponding completed carousels

**Phase to address:**
Phase 2 (Credits & Generation) - Integration architecture must handle failures from day one. Phase 5 (Admin & Monitoring) - Reconciliation dashboards to detect inconsistencies.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip webhook signature verification in dev | Faster iteration, simpler localhost setup | Forget to add before production, security vulnerability | Never - Use Stripe CLI to test webhooks locally with signatures |
| Process webhooks synchronously | Simpler code, no queue infrastructure | Timeouts cause failed webhooks, can't scale beyond 100 users | Never - Async is not complex with modern tools |
| Store credits as single integer column | Simple schema, easy queries | No audit trail, can't debug discrepancies, credit allocation bugs unfixable | Never - Ledger model is standard pattern |
| Frontend-only credit checks | Faster UI, no API round trip | Trivial to bypass, allows credit theft via API calls | Never - Always enforce server-side |
| Manually test webhook flows | No infrastructure setup needed | Miss race conditions, duplicate events, retry scenarios | Only for initial prototype, never for pre-production |
| Skip email verification requirement | Better signup conversion | Bot signups, free tier abuse, wasted infrastructure costs | Only during closed beta with invite codes |
| Trust user_metadata in RLS policies | Simple to implement | Users can modify own permissions, security hole | Never - Use raw_app_meta_data or separate table |
| No rate limiting on expensive operations | Simpler deployment (no Redis) | Single user can run up your bill, DDoS vulnerability | Only for MVP with <10 users, add before launch |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Stripe Webhooks | Listening to all events instead of required events only | Subscribe only to: invoice.paid, customer.subscription.updated, customer.subscription.deleted, payment_intent.payment_failed |
| Stripe Webhooks | Returning 200 after business logic completes | Return 200 immediately after signature verification, queue business logic for async processing |
| Stripe Webhooks | Assuming events arrive in chronological order | Use event timestamps to handle out-of-order delivery, design state machine to handle any order |
| Supabase Auth | Checking only auth.uid() without IS NOT NULL | Always use: auth.uid() IS NOT NULL AND auth.uid() = user_id pattern |
| Supabase RLS | Creating policies without indexes on filtered columns | Index every column referenced in RLS policies before enabling on table |
| N8N Webhooks | Expecting synchronous response from long-running workflows | Design async: trigger workflow, return 202, poll for completion or use callback webhook |
| N8N Webhooks | No timeout handling for external API calls | Set connection timeout (10s), read timeout (180s), implement retry with exponential backoff |
| N8N Webhooks | Sending sensitive data in plain text | Use HTTPS, include HMAC signature for callbacks, verify signature before processing |
| ImageB Storage | Storing image URLs without checking existence | Validate images exist before marking carousel complete, implement cleanup for orphaned images |
| Stripe Customer Portal | Building custom cancellation UI | Use Stripe-hosted portal to handle all subscription management (reduces bugs, PCI compliance simpler) |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Unindexed RLS policy columns | Queries taking 1s+, high database CPU | Create index on every column in WHERE clause of RLS policies | >1,000 rows in table |
| Synchronous webhook processing | Webhook timeouts, failed deliveries | Queue webhooks for async processing (BullMQ, pg_boss, Supabase Edge Functions) | >50 webhooks/hour |
| Polling N8N status every 500ms | High database reads, rate limiting | Poll every 2-5 seconds with exponential backoff, or use websocket/SSE | >20 concurrent generations |
| Loading all carousel history at once | Slow page loads, memory issues | Paginate with limit/offset or cursor, load initial 20 carousels only | >100 carousels per user |
| No database connection pooling | "Too many connections" errors | Use Supavisor in transaction mode, configure pgBouncer, limit client connections | >100 concurrent users |
| Fetching full carousel images for list view | Slow loads, high bandwidth | Use thumbnails or lazy loading, only fetch full images on detail view | >50 carousels in history |
| N-plus-1 queries for user + subscription data | Dashboard loads >3 seconds | Use Supabase select with joins: .select('*, subscription(*), credits(*)') | >500 active users |
| Storing webhook events in main database | Database bloat, slow queries | Use separate events table with retention policy (delete events >90 days old) | >10,000 webhook events |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing Supabase service_role key in frontend | Complete database access bypass, data theft | Never use service_role in client, only in server/Edge Functions, store in environment variables |
| No RLS on carousel_generations table | Users can view other users' carousels by guessing IDs | Enable RLS: CREATE POLICY ON carousel_generations FOR SELECT USING (auth.uid() = user_id) |
| Trusting client-provided credit balance | User sends {credits: 999} to API, bypasses payment | Always query credit balance server-side, never accept from client |
| N8N webhook URL without authentication | Anyone can trigger carousel generation, drain your API credits | Require HMAC signature or API key, whitelist your server IP in N8N settings |
| Logging Stripe webhook payloads | PCI compliance violation, exposes card data | Log only event.type and event.id, redact payment_method and customer details |
| Reusing Stripe test keys in production | All transactions are fake, you collect $0 | Use separate test/prod keys, verify environment variables, check Stripe dashboard mode |
| No rate limiting on signup endpoint | Account enumeration, credential stuffing | Limit to 3 signups per IP per hour, require CAPTCHA after 2 attempts |
| Storing ImageB URLs without access control | Carousel images publicly accessible by URL guessing | Use signed URLs with expiration, or proxy images through authenticated endpoint |
| Missing webhook endpoint CSRF exemption | Webhooks fail with 403 Forbidden | Add webhook routes to CSRF exemption list in framework config |
| Allowing credit purchases without payment | Users POST to /api/credits/add, grant themselves credits | All credit allocation must verify Stripe payment, never trust client requests |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading state during generation | User doesn't know if click worked, clicks again (double charge) | Show spinner, disable button, display "Generating... (1-2 minutes)" |
| Checkout redirect without context | User completes payment, returns to app, sees "No subscription" until refresh | Immediately sync Stripe status on return, show "Activating subscription..." |
| Silent webhook failures | User paid, dashboard still shows free tier, user contacts support | Show banner "Payment received, activating subscription..." + poll for webhook completion |
| No feedback when credits depleted | User clicks Generate, nothing happens, no error message | Show error modal: "You've used all 10 credits this month. Resets on [date] or upgrade plan." |
| Unclear credit usage messaging | User confused why credits deducted on failed generation | Explain "Credits deduct when you click Generate, even if carousel fails. This prevents abuse." |
| No generation status visibility | User waits 90 seconds, no idea if still processing or failed | Show progress: "Generating carousel... Analyzing content... Creating images... Almost done..." |
| Confusing cancellation flow | User cancels subscription, immediately loses access, angry | Show "You'll keep access until [period end date]. Cancel anytime before then to avoid renewal." |
| No carousel preview before download | User downloads zip, discovers carousel has errors, no refund | Show carousel slides preview before download, offer regenerate option |
| Ambiguous error messages | N8N fails, user sees "Generation failed" with no context | Specific errors: "AI service timeout, try again" vs "Invalid image style, choose preset" |
| No credit usage history | User disputes charge, can't see what they generated | Show credit ledger: "Jan 15: -1 credit (Carousel: LinkedIn Tips), Jan 1: +10 credits (Subscription)" |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Stripe Integration:** Often missing webhook signature verification in production - verify STRIPE_WEBHOOK_SECRET set and verified
- [ ] **Stripe Integration:** Often missing idempotency checks - verify event.id logged before processing
- [ ] **Stripe Integration:** Often missing async processing - verify webhooks queued for background jobs, not processed in handler
- [ ] **Credit System:** Often missing atomic deduction logic - verify using RPC or SELECT FOR UPDATE transaction
- [ ] **Credit System:** Often missing negative balance protection - verify CHECK constraint: credits >= 0
- [ ] **Credit System:** Often missing audit trail - verify credit_transactions ledger table exists and tracks all changes
- [ ] **N8N Integration:** Often missing timeout handling - verify frontend timeout > workflow runtime (120s+ recommended)
- [ ] **N8N Integration:** Often missing callback verification - verify HMAC signature checked on callback endpoint
- [ ] **N8N Integration:** Often missing orphaned data cleanup - verify reconciliation job compares ImageB vs database
- [ ] **RLS Policies:** Often missing explicit auth check - verify policies use auth.uid() IS NOT NULL AND pattern
- [ ] **RLS Policies:** Often missing indexes - verify indexed columns with EXPLAIN ANALYZE on policy queries
- [ ] **RLS Policies:** Often missing on all tables - verify SELECT * FROM pg_tables WHERE rowsecurity = false AND schemaname = 'public' returns 0 rows
- [ ] **Free Tier Protection:** Often missing CAPTCHA - verify Turnstile or hCaptcha on signup form
- [ ] **Free Tier Protection:** Often missing rate limiting - verify max signups per IP per day enforced
- [ ] **Free Tier Protection:** Often missing email verification requirement - verify users can't generate until email confirmed
- [ ] **Subscription Management:** Often missing cancel_at_period_end handling - verify access continues until period end, not immediate revocation
- [ ] **Frontend Protection:** Often missing generate button debouncing - verify button disabled after click, prevents double-submission
- [ ] **Error Handling:** Often missing user-friendly error messages - verify specific errors shown (not generic "Something went wrong")
- [ ] **Monitoring:** Often missing webhook failure alerts - verify Stripe dashboard checked for failed deliveries or alerts configured
- [ ] **Testing:** Often missing webhook retry testing - verify handlers work correctly when same event arrives multiple times

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Webhook race conditions causing wrong state | MEDIUM | 1. Sync all subscriptions from Stripe API using /v1/subscriptions endpoint 2. Compare with database state 3. Update database to match Stripe source of truth 4. Refund affected users or grant credits for disruption |
| Missing signature verification exploited | HIGH | 1. Immediately rotate webhook secret in Stripe dashboard 2. Deploy signature verification 3. Audit all webhook events from past 30 days for suspicious patterns 4. Revoke fraudulent credits/subscriptions 5. Ban affected user accounts |
| Double credit allocation from duplicate webhooks | LOW | 1. Query credit_transactions for duplicate event.id 2. INSERT negative transaction to reverse duplicates 3. Deploy event.id tracking to prevent future occurrences |
| Credit double-spending from race conditions | MEDIUM | 1. Query carousel_generations for users with negative credits 2. Identify concurrent generation timestamps 3. Add CHECK constraint to prevent negatives 4. Deploy atomic RPC for credit deduction 5. Decide policy: honor existing generations or bill users |
| RLS policy missing allowing unauthorized access | HIGH | 1. Enable RLS on affected tables immediately 2. Audit access logs for unauthorized reads/writes 3. Notify affected users of potential data exposure 4. Review all tables for RLS status 5. Add automated test to verify RLS on all tables |
| N8N webhook failures leaving orphaned images | LOW | 1. Query ImageB for files uploaded in last 7 days 2. Compare with carousel_generations records 3. Delete unmatched images 4. Deploy reconciliation cron job to prevent accumulation |
| Subscription cancellation timing bug overcharging users | MEDIUM | 1. Query subscriptions with cancel_at_period_end where access was revoked early 2. Calculate pro-rated refund 3. Issue Stripe refunds via API 4. Send apology email with explanation 5. Deploy correct cancel_at_period_end handling |
| Credit rollover accounting errors | MEDIUM | 1. Export all credit transactions to CSV 2. Rebuild balances from transaction history 3. Compare with current database balances 4. UPDATE users to correct balance 5. Deploy ledger-based credit model |
| Free tier abuse by bot signups | MEDIUM | 1. Identify suspicious patterns (sequential emails, same IP, rapid credit usage) 2. DELETE fake accounts and revoke API access 3. Deploy CAPTCHA on signup 4. Add IP-based rate limiting 5. Monitor for future abuse patterns |
| N8N-Supabase consistency failures | MEDIUM | 1. Run reconciliation script comparing ImageB uploads vs database records 2. Mark orphaned database records as 'failed' 3. Delete orphaned ImageB files 4. Refund credits for failed generations 5. Deploy callback retry logic and reconciliation cron |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Stripe webhook race conditions | Phase 1: Stripe & Subscriptions | Test: Complete checkout, immediately check subscription status without refresh - should show active |
| Missing webhook signature verification | Phase 1: Stripe & Subscriptions | Test: POST unsigned webhook to endpoint - should return 401/403, not process event |
| Non-idempotent webhook handlers | Phase 1: Stripe & Subscriptions | Test: Send same webhook event twice - verify credit allocated only once, no errors logged |
| Credit system double-spending | Phase 2: Credits & Generation | Test: Trigger two concurrent generations with 1 credit balance - verify only one succeeds, other fails with insufficient credits |
| Supabase RLS policy mistakes | Phase 1: Auth & Database Schema | Test: Try accessing other user's carousel via API - should return empty/forbidden, not data |
| N8N workflow timeout failures | Phase 2: Credits & Generation | Test: Simulate N8N taking 90 seconds - verify frontend handles gracefully, shows status, completes when callback received |
| Free tier abuse & bot attacks | Phase 1: Auth & Protection | Test: Create 10 accounts from same IP - verify rate limiting kicks in, CAPTCHA required |
| Subscription cancellation timing bugs | Phase 4: Account Management | Test: Cancel subscription - verify access continues until period end, UI shows correct end date |
| Credit rollover accounting errors | Phase 2: Credits & Generation | Test: Subscribe, use 3 credits, wait for next billing cycle - verify balance is 17 (10 new + 7 rollover), ledger shows both transactions |
| N8N-Supabase data consistency failures | Phase 2: Credits & Generation | Test: Simulate N8N callback failure - verify carousel marked failed, credit refunded or manual intervention queued |
| Performance degradation from unindexed RLS | Phase 1: Database Schema | Test: Run EXPLAIN ANALYZE on carousel query with 1000+ rows - verify uses index scan, not seq scan |
| Missing HTTPS on webhook endpoints | Phase 1: Stripe & Subscriptions | Test: Stripe dashboard webhook settings - verify all endpoints are https://, no http:// |
| Client-side credit balance trust | Phase 2: Credits & Generation | Test: Modify API request to send {credits: 999} - verify server ignores client value, queries database |
| No error messaging during generation failures | Phase 3: UI/UX Polish | Test: Simulate N8N error - verify user sees specific error message, knows what went wrong, has next steps |
| Silent webhook failures | Phase 5: Monitoring & Admin | Test: Disable internet during webhook - verify Stripe dashboard shows failed delivery, alerts configured |

---

## Sources

**Stripe Webhooks & Idempotency:**
- https://docs.stripe.com/webhooks (Official Stripe documentation - HIGH confidence)
- https://hookdeck.com/webhooks/platforms/guide-to-stripe-webhooks-features-and-best-practices (MEDIUM confidence)
- https://www.pedroalonso.net/blog/stripe-webhooks-deep-dive/ (MEDIUM confidence - specific race condition examples)
- https://excessivecoding.com/blog/billing-webhook-race-condition-solution-guide (MEDIUM confidence - race condition solutions)

**Supabase RLS & Security:**
- https://supabase.com/docs/guides/database/postgres/row-level-security (Official Supabase documentation - HIGH confidence)
- https://www.supadex.app/blog/best-security-practices-in-supabase-a-comprehensive-guide (MEDIUM confidence)
- https://github.com/orgs/supabase/discussions/30334 (MEDIUM confidence - race condition handling)

**Credit Systems & Billing:**
- https://saasteps.com/saas-billing-platform-mistakes-and-how-to-remedy-it/ (MEDIUM confidence)
- https://www.investorideas.com/news/2026/food-beverage/01202-saas-manage-subscriptions-avoid-billing-errors.asp (MEDIUM confidence)

**N8N & Workflow Integration:**
- https://community.n8n.io/t/webhook-error-handling/11471 (MEDIUM confidence - community discussions)
- https://www.codesmith.in/post/n8n-job-queue-webhook-callbacks (MEDIUM confidence - integration patterns)

**Rate Limiting & Abuse Prevention:**
- https://www.aifreeapi.com/en/posts/gemini-api-free-tier-limit (MEDIUM confidence - 2025 abuse patterns)
- Multiple WebSearch results on free tier abuse and rate limiting best practices (MEDIUM to LOW confidence)

**Database Transactions & Concurrency:**
- https://bootstrapped.app/guide/how-to-handle-concurrent-writes-in-supabase (MEDIUM confidence)
- Multiple WebSearch results on PostgreSQL transaction isolation and race conditions (MEDIUM confidence)

---
*Pitfalls research for: SaaS with Stripe subscriptions, credit systems, and webhook integrations*
*Researched: 2026-02-21*
