-- Migration: Add google_review_observations time series
-- Created: 2026-04-25
-- Purpose: Track per-user total_review_count over time so we can show
-- "+X new reviews this month" on the dashboard. One row appended per cache
-- refresh (~every 48h), kept lightweight.

CREATE TABLE google_review_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  observed_at timestamp with time zone NOT NULL DEFAULT now(),
  total_review_count integer NOT NULL,
  average_rating numeric(2, 1)
);

CREATE INDEX idx_google_review_observations_user_observed
  ON google_review_observations(user_id, observed_at DESC);

ALTER TABLE google_review_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own observations"
  ON google_review_observations FOR SELECT
  USING (user_id = auth.uid());

-- Writes are server-side only via the service role; no user-facing write policies.

-- Seed observations from the current cache so existing users have a baseline
-- right now instead of waiting for their next refresh. Without this they'd
-- show "+0 new this month" until then.
INSERT INTO google_review_observations (user_id, observed_at, total_review_count, average_rating)
SELECT user_id, last_fetched_at, total_review_count, average_rating
FROM google_reviews_cache
WHERE total_review_count IS NOT NULL;
