-- Create SMS usage tracking table
CREATE TABLE IF NOT EXISTS sms_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  hour INTEGER NOT NULL, -- 0-23
  sms_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, hour)
);

-- Create SMS rate limits configuration table
CREATE TABLE IF NOT EXISTS sms_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  limit_type VARCHAR(20) NOT NULL, -- 'hourly' or 'daily'
  limit_value INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(limit_type)
);

-- Insert default SMS rate limits
INSERT INTO sms_rate_limits (limit_type, limit_value, is_active) VALUES
  ('hourly', 200, true),
  ('daily', 1000, true)
ON CONFLICT (limit_type) DO UPDATE SET
  limit_value = EXCLUDED.limit_value,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_usage_date_hour ON sms_usage_tracking(date, hour);
CREATE INDEX IF NOT EXISTS idx_sms_usage_date ON sms_usage_tracking(date);

-- Create function to increment SMS usage atomically
CREATE OR REPLACE FUNCTION increment_sms_usage(target_date DATE, target_hour INTEGER, increment_by INTEGER DEFAULT 1)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO sms_usage_tracking (date, hour, sms_count, updated_at)
  VALUES (target_date, target_hour, increment_by, NOW())
  ON CONFLICT (date, hour)
  DO UPDATE SET
    sms_count = sms_usage_tracking.sms_count + increment_by,
    updated_at = NOW()
  RETURNING sms_count INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get current SMS usage
CREATE OR REPLACE FUNCTION get_sms_usage(target_date DATE, target_hour INTEGER DEFAULT NULL)
RETURNS TABLE(date DATE, hour INTEGER, sms_count INTEGER) AS $$
BEGIN
  IF target_hour IS NULL THEN
    -- Return daily total
    RETURN QUERY
    SELECT target_date as date, -1 as hour, COALESCE(SUM(sut.sms_count), 0)::INTEGER as sms_count
    FROM sms_usage_tracking sut
    WHERE sut.date = target_date;
  ELSE
    -- Return hourly count
    RETURN QUERY
    SELECT sut.date, sut.hour, COALESCE(sut.sms_count, 0) as sms_count
    FROM sms_usage_tracking sut
    WHERE sut.date = target_date AND sut.hour = target_hour;
  END IF;
END;
$$ LANGUAGE plpgsql;