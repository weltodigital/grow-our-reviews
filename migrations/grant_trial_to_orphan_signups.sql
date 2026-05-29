-- Backfill the no-card 7-day trial onto profiles that completed onboarding
-- but never reached Stripe and don't have an active subscription_status.
--
-- This catches users like J.M Construction and Academy Property Service who
-- were cleaned up in the previous "drop misleading defaults" migration but
-- now find themselves with NULL subscription_status under the new flow.
-- They get a fresh 7-day trial starting NOW so they can use the product if
-- they come back.
--
-- Does NOT touch users with stripe_customer_id (real Stripe-managed trials
-- and subscriptions); those are migrated separately via the
-- /api/admin/migrate-stripe-trials-to-7d route.

UPDATE profiles
SET subscription_status = 'trialing',
    trial_ends_at = NOW() + INTERVAL '7 days',
    monthly_request_limit = 30,
    updated_at = NOW()
WHERE stripe_customer_id IS NULL
  AND subscription_status IS NULL
  AND business_name IS NOT NULL;
