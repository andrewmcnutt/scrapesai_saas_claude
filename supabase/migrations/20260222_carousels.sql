-- Carousels Table
-- Stores carousel generation jobs and their results
-- Updates (status, image_urls, etc.) come from webhook handler via service role (bypasses RLS)

CREATE TABLE carousels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'timeout')),
  idea_topic TEXT NOT NULL,
  idea_key_points TEXT NOT NULL,
  idea_tone TEXT NOT NULL,
  template_url TEXT NOT NULL,
  image_style TEXT NOT NULL,
  image_urls TEXT[], -- nullable, populated on completion
  post_body_text TEXT, -- nullable, populated on completion
  transaction_id UUID REFERENCES credit_transactions(id), -- links to credit deduction
  error_message TEXT, -- nullable, populated on failure
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ -- nullable, set when job finishes
);

-- Index for history queries (user's carousels ordered by recency)
CREATE INDEX idx_carousels_user_id_created_at ON carousels(user_id, created_at DESC);

-- Partial index for timeout detection (only pending jobs)
CREATE INDEX idx_carousels_pending_timeout ON carousels(status, created_at) WHERE status = 'pending';

-- Enable RLS (security-first approach)
ALTER TABLE carousels ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own carousels
CREATE POLICY "Users can view own carousels"
  ON carousels
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- RLS Policy: Users can insert their own carousels
-- WITH CHECK ensures user_id matches authenticated user
CREATE POLICY "Users can insert own carousels"
  ON carousels
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- NOTE: No UPDATE policy for authenticated users.
-- Updates to status, image_urls, post_body_text, error_message, completed_at
-- come exclusively from the N8N webhook handler using the service role key (bypasses RLS).
-- This prevents clients from spoofing generation results.

-- Function: Refund credits for timed-out carousel generation jobs
-- SECURITY DEFINER: Runs with elevated privileges to update carousels and insert refund transactions
-- Called via RPC or scheduled cron job to detect and clean up stuck jobs
CREATE OR REPLACE FUNCTION refund_timeout_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  timed_out_carousel RECORD;
BEGIN
  -- Find all pending carousels older than 5 minutes
  FOR timed_out_carousel IN
    SELECT id, user_id, transaction_id
    FROM carousels
    WHERE status = 'pending'
      AND created_at < NOW() - INTERVAL '5 minutes'
  LOOP
    -- Mark carousel as timed out and set completed_at to prevent duplicate refunds
    UPDATE carousels
    SET
      status = 'timeout',
      error_message = 'Generation timed out after 5 minutes',
      completed_at = NOW()
    WHERE id = timed_out_carousel.id;

    -- Issue credit refund for the failed generation
    INSERT INTO credit_transactions (user_id, amount, type, metadata)
    VALUES (
      timed_out_carousel.user_id,
      1, -- Refund 1 credit
      'refund',
      jsonb_build_object(
        'carousel_id', timed_out_carousel.id,
        'reason', 'timeout'
      )
    );
  END LOOP;
END;
$$;

-- Grant execute permission so it can be called via Supabase RPC by authenticated users
-- (or invoked by a scheduled Edge Function using service role)
GRANT EXECUTE ON FUNCTION refund_timeout_jobs() TO authenticated;
