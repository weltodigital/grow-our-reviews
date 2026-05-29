-- Drop misleading defaults on profiles.subscription_status and trial_ends_at.
--
-- These defaults caused every new profile row (inserted at the end of the
-- onboarding flow) to look like an active 14-day trial — even when the user
-- never opened Stripe Checkout. That broke two things:
--   1. It made Supabase data misleading (couldn't tell "real" trialers from
--      abandoned signups by looking at subscription_status alone).
--   2. Trial-warning / trial-ending crons filter only on subscription_status,
--      so abandoned signups received trial emails as if they'd paid.
--
-- After this migration, subscription_status and trial_ends_at stay NULL until
-- the Stripe webhook fires checkout.session.completed and writes the real
-- values. The auth guard in lib/auth.ts already treats NULL as "send to
-- /billing/setup", so existing redirect behaviour is preserved.

ALTER TABLE profiles
  ALTER COLUMN subscription_status DROP DEFAULT,
  ALTER COLUMN trial_ends_at DROP DEFAULT;

-- Backfill: clear inconsistent state on rows where the user has no Stripe
-- customer. Real trialers (those who completed checkout) keep their values
-- because their stripe_customer_id is populated.
UPDATE profiles
SET subscription_status = NULL,
    trial_ends_at = NULL
WHERE stripe_customer_id IS NULL
  AND subscription_status = 'trialing';
