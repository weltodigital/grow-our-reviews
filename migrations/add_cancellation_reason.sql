-- Add cancellation_reason field to track why subscription was cancelled
-- This enables different UX messaging for payment failures vs voluntary cancellations

ALTER TABLE profiles
ADD COLUMN cancellation_reason varchar(50) NULL;

-- Add helpful comment
COMMENT ON COLUMN profiles.cancellation_reason IS 'Reason for subscription cancellation: payment_failed, user_requested, etc.';

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_cancellation_reason ON profiles(cancellation_reason)
WHERE cancellation_reason IS NOT NULL;