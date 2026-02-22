-- Brand Profiles Table
-- Auto-created on user signup with default values
-- 1:1 relationship with auth.users enforced via unique constraint

CREATE TABLE brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  primary_color TEXT NOT NULL CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  secondary_color TEXT NOT NULL CHECK (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  voice_guidelines TEXT NOT NULL,
  product_description TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  cta_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for RLS policy performance (prevents sequential scans when querying by user_id)
CREATE INDEX idx_brand_profiles_user_id ON brand_profiles(user_id);

-- Enable RLS (security-first approach)
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own brand profile
-- Uses auth.uid() to prevent user_id spoofing
CREATE POLICY "Users can view own brand profile"
  ON brand_profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- RLS Policy: Users can insert their own brand profile
-- WITH CHECK ensures user_id matches authenticated user
CREATE POLICY "Users can insert own brand profile"
  ON brand_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- RLS Policy: Users can update their own brand profile
-- USING clause verifies ownership before allowing update
CREATE POLICY "Users can update own brand profile"
  ON brand_profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Trigger function: Auto-create brand profile on user signup
-- SECURITY DEFINER grants elevated privileges to insert into brand_profiles
-- This ensures trigger can't be bypassed and runs atomically with user creation
CREATE OR REPLACE FUNCTION create_brand_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO brand_profiles (
    user_id,
    brand_name,
    primary_color,
    secondary_color,
    voice_guidelines,
    product_description,
    target_audience,
    cta_text
  )
  VALUES (
    NEW.id,
    'My Brand', -- Default placeholder
    '#3B82F6', -- Default blue
    '#10B981', -- Default green
    'Professional and helpful', -- Default voice
    'Enter your product description', -- Placeholder
    'Enter your target audience', -- Placeholder
    'Learn More' -- Default CTA
  );
  RETURN NEW;
END;
$$;

-- Trigger: Fire create_brand_profile() after user signup
CREATE TRIGGER on_user_signup_create_brand
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_brand_profile();

-- Trigger function: Auto-update updated_at timestamp on UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger: Update updated_at before each UPDATE
CREATE TRIGGER update_brand_profiles_updated_at
  BEFORE UPDATE ON brand_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
