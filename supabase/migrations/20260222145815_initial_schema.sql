-- Credit transactions ledger (immutable)
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('signup_bonus', 'monthly_allocation', 'generation_deduction', 'refund')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast balance calculation
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);

-- Enable RLS (CRITICAL: do this before adding policies)
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can view own transactions
CREATE POLICY "Users can view own transactions"
  ON credit_transactions
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- RPC function for atomic credit deduction
CREATE OR REPLACE FUNCTION deduct_credit(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT DEFAULT 'generation_deduction',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_transaction_id UUID;
BEGIN
  -- Lock user's transactions (prevents race conditions)
  SELECT COALESCE(SUM(amount), 0)
  INTO v_current_balance
  FROM credit_transactions
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits: % available, % required', v_current_balance, p_amount;
  END IF;

  -- Insert deduction (negative amount)
  INSERT INTO credit_transactions (user_id, amount, type, metadata)
  VALUES (p_user_id, -p_amount, p_type, p_metadata)
  RETURNING id INTO v_new_transaction_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'transaction_id', v_new_transaction_id,
    'previous_balance', v_current_balance,
    'new_balance', v_current_balance - p_amount
  );
END;
$$;

GRANT EXECUTE ON FUNCTION deduct_credit TO authenticated;

-- Trigger to prevent negative balance
CREATE OR REPLACE FUNCTION check_balance_non_negative()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO v_balance
  FROM credit_transactions
  WHERE user_id = NEW.user_id;

  IF v_balance < 0 THEN
    RAISE EXCEPTION 'Balance cannot go negative';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_non_negative_balance
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION check_balance_non_negative();
