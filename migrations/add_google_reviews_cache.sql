-- Migration: Add google_reviews_cache table
-- Created: 2026-04-24
-- Purpose: Cache Google Places API review data per user so we refresh at most every
-- 48 hours, keeping cost down while showing users their recent reviews + totals.

CREATE TABLE google_reviews_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  place_id text NOT NULL,
  total_review_count integer,
  average_rating numeric(2, 1),
  -- reviews is an array of the 5 most recent review objects from the Places API
  -- (each has author, rating, text, publishTime, relativePublishTimeDescription, etc.)
  reviews jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  last_error text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_google_reviews_cache_user_id ON google_reviews_cache(user_id);

ALTER TABLE google_reviews_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own review cache"
  ON google_reviews_cache FOR SELECT
  USING (user_id = auth.uid());

-- Writes are performed by the server (service role) only; no user-facing write policies.
