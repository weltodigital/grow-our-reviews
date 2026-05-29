-- Track when a recovery email was sent to an abandoned signup so we send it
-- exactly once per user. NULL means "not sent yet". The recovery cron
-- (api/cron/abandoned-signup-recovery) gates on this column and stamps it
-- with NOW() after the Resend send succeeds.

ALTER TABLE profiles
  ADD COLUMN recovery_email_sent_at TIMESTAMPTZ;
