-- Add billing_cycle_date to profiles table
-- This represents the day of the month when the user's billing cycle resets
-- For trial users: day of signup
-- For paid users: day of first subscription

ALTER TABLE profiles
ADD COLUMN billing_cycle_date INTEGER;

-- Set billing_cycle_date for existing users based on their created_at date
UPDATE profiles
SET billing_cycle_date = EXTRACT(DAY FROM created_at)
WHERE billing_cycle_date IS NULL;

-- Add not null constraint after setting values
ALTER TABLE profiles
ALTER COLUMN billing_cycle_date SET NOT NULL;

-- Add check constraint to ensure valid day (1-28 to handle February)
ALTER TABLE profiles
ADD CONSTRAINT billing_cycle_date_check
CHECK (billing_cycle_date >= 1 AND billing_cycle_date <= 28);

-- Comment explaining the field
COMMENT ON COLUMN profiles.billing_cycle_date IS 'Day of month when billing cycle resets (1-28). Credits reset on this day each month.';