-- Stripe Integration Migration
-- Creates subscriptions table, stripe_processed_events table,
-- and free credit seeding trigger for new user signups (CRED-01).

-- =============================================================================
-- 1. SUBSCRIPTIONS TABLE
-- =============================================================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid', 'paused')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- Enable RLS (security-first)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own subscription
-- NOTE: No INSERT/UPDATE/DELETE policies — all writes come from the webhook handler
-- via the service role key which bypasses RLS. This prevents clients from spoofing
-- subscription state.
CREATE POLICY "Users can view own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- =============================================================================
-- 2. STRIPE_PROCESSED_EVENTS TABLE (webhook idempotency)
-- =============================================================================

CREATE TABLE stripe_processed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE stripe_processed_events ENABLE ROW LEVEL SECURITY;

-- No RLS policies: internal webhook processing table, service role access only
-- (authenticated users have no reason to read or write this table)

-- =============================================================================
-- 3. UPDATED_AT TRIGGER FOR SUBSCRIPTIONS
-- =============================================================================

-- NOTE: update_updated_at_column() function already exists from 20260222_brand_profiles.sql
-- We only create the trigger here, not the function.

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 4. FREE CREDIT SEEDING TRIGGER (CRED-01)
-- =============================================================================

-- New users automatically receive 3 free credits on signup.
-- SECURITY DEFINER is required: trigger fires on auth.users but inserts into
-- credit_transactions which has RLS enabled. The function must run with the
-- definer's privileges (postgres/superuser) to bypass RLS on the target table.

CREATE OR REPLACE FUNCTION seed_free_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO credit_transactions (user_id, amount, type, metadata)
  VALUES (NEW.id, 3, 'signup_bonus', '{"reason": "initial_free_credits"}'::jsonb);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION seed_free_credits();

-- =============================================================================
-- 5. BACKFILL FOR EXISTING USERS (run once after applying migration)
-- =============================================================================

-- If there are existing users in auth.users who never received signup credits,
-- run this backfill query manually in the Supabase SQL Editor after applying
-- this migration:
--
-- INSERT INTO credit_transactions (user_id, amount, type, metadata)
-- SELECT u.id, 3, 'signup_bonus', '{"reason": "initial_free_credits_backfill"}'::jsonb
-- FROM auth.users u
-- WHERE NOT EXISTS (
--   SELECT 1 FROM credit_transactions ct
--   WHERE ct.user_id = u.id AND ct.type = 'signup_bonus'
-- );
