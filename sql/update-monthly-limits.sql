-- Update monthly request limits for existing profiles to match new pricing tiers
-- This ensures existing users get the benefit of the increased limits

-- Update profiles with 50 limit to new Starter limit (150)
UPDATE profiles
SET monthly_request_limit = 150
WHERE monthly_request_limit = 50;

-- Update profiles with old Growth limit (150) to new Growth limit (300)
UPDATE profiles
SET monthly_request_limit = 300
WHERE monthly_request_limit = 150 AND subscription_status IN ('active', 'trialing');

-- Note: This migration is safe to run multiple times
-- Profiles already at 150+ will be updated to 300 (Growth tier)
-- Profiles at 50 will be updated to 150 (new Starter tier)