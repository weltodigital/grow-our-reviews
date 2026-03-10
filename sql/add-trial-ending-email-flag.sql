-- Add trial_ending_email_sent column to profiles table
ALTER TABLE profiles
ADD COLUMN trial_ending_email_sent BOOLEAN DEFAULT FALSE;

-- Add index for efficient querying of trial users needing emails
CREATE INDEX idx_profiles_trial_ending_email
ON profiles (subscription_status, trial_ends_at, trial_ending_email_sent)
WHERE subscription_status = 'trialing' AND trial_ending_email_sent = FALSE;