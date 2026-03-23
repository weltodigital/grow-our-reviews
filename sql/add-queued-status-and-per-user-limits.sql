-- Add 'queued' status for rate-limited messages
-- No ALTER TYPE needed since status is TEXT, can accept any string value

-- Add per-user SMS tracking table for fairness
CREATE TABLE IF NOT EXISTS sms_user_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  hour INTEGER NOT NULL, -- 0-23
  sms_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, hour)
);

-- Add per-user rate limits to the existing table
INSERT INTO sms_rate_limits (limit_type, limit_value, is_active) VALUES
  ('per_user_hourly', 30, true)
ON CONFLICT (limit_type) DO UPDATE SET
  limit_value = EXCLUDED.limit_value,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_user_usage_user_date_hour ON sms_user_usage_tracking(user_id, date, hour);
CREATE INDEX IF NOT EXISTS idx_sms_user_usage_user_date ON sms_user_usage_tracking(user_id, date);
CREATE INDEX IF NOT EXISTS idx_sms_user_usage_date_hour ON sms_user_usage_tracking(date, hour);

-- Create function to increment per-user SMS usage atomically
CREATE OR REPLACE FUNCTION increment_user_sms_usage(target_user_id UUID, target_date DATE, target_hour INTEGER, increment_by INTEGER DEFAULT 1)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO sms_user_usage_tracking (user_id, date, hour, sms_count, updated_at)
  VALUES (target_user_id, target_date, target_hour, increment_by, NOW())
  ON CONFLICT (user_id, date, hour)
  DO UPDATE SET
    sms_count = sms_user_usage_tracking.sms_count + increment_by,
    updated_at = NOW()
  RETURNING sms_count INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get per-user SMS usage
CREATE OR REPLACE FUNCTION get_user_sms_usage(target_user_id UUID, target_date DATE, target_hour INTEGER DEFAULT NULL)
RETURNS TABLE(user_id UUID, date DATE, hour INTEGER, sms_count INTEGER) AS $$
BEGIN
  IF target_hour IS NULL THEN
    -- Return daily total for user
    RETURN QUERY
    SELECT target_user_id as user_id, target_date as date, -1 as hour, COALESCE(SUM(sut.sms_count), 0)::INTEGER as sms_count
    FROM sms_user_usage_tracking sut
    WHERE sut.user_id = target_user_id AND sut.date = target_date;
  ELSE
    -- Return hourly count for user
    RETURN QUERY
    SELECT sut.user_id, sut.date, sut.hour, COALESCE(sut.sms_count, 0) as sms_count
    FROM sms_user_usage_tracking sut
    WHERE sut.user_id = target_user_id AND sut.date = target_date AND sut.hour = target_hour;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add queued_reason column to track why messages are queued
ALTER TABLE review_requests ADD COLUMN IF NOT EXISTS queued_reason TEXT DEFAULT NULL;
ALTER TABLE review_requests ADD COLUMN IF NOT EXISTS queued_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for queued messages
CREATE INDEX IF NOT EXISTS idx_review_requests_queued ON review_requests(status) WHERE status = 'queued';