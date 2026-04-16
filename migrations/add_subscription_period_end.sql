-- Add fields to track subscription cancellation and period end dates
-- This enables proper "cancel at period end" behavior for paid subscriptions

ALTER TABLE profiles
ADD COLUMN current_period_end timestamp NULL,
ADD COLUMN cancelled_at_period_end boolean DEFAULT false;

-- Add helpful comment
COMMENT ON COLUMN profiles.current_period_end IS 'Stripe subscription current_period_end - when access should end if cancelled';
COMMENT ON COLUMN profiles.cancelled_at_period_end IS 'True if user has cancelled but access continues until current_period_end';

-- Index for efficient querying of expired subscriptions
CREATE INDEX IF NOT EXISTS idx_profiles_period_end ON profiles(current_period_end)
WHERE current_period_end IS NOT NULL;