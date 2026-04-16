-- Add abuse monitoring and prevention system
-- This tracks user behavior patterns to detect spam and harassment

-- Table to log bulk upload activity with risk scoring
CREATE TABLE IF NOT EXISTS bulk_upload_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  upload_size INTEGER NOT NULL,
  processing_time_ms INTEGER,
  duplicate_rate DECIMAL(5,2), -- Percentage of duplicates detected
  high_risk_numbers INTEGER DEFAULT 0, -- Numbers flagged as suspicious
  risk_score INTEGER DEFAULT 0, -- Overall risk score (0-100)
  risk_flags TEXT[], -- Array of risk indicators
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'completed', -- completed, flagged, blocked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track account flags and suspension status
CREATE TABLE IF NOT EXISTS account_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  flag_type VARCHAR(50) NOT NULL, -- spam_suspected, harassment_reported, unusual_patterns
  flag_reason TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  evidence JSONB, -- Store details about the flagging incident
  auto_generated BOOLEAN DEFAULT true,
  admin_reviewed BOOLEAN DEFAULT false,
  admin_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID -- Admin user ID if manually created
);

-- Table for account suspension and restrictions
CREATE TABLE IF NOT EXISTS account_restrictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  restriction_type VARCHAR(50) NOT NULL, -- upload_suspended, sms_suspended, account_suspended
  reason TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL for permanent
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID, -- Admin user ID
  lifted_at TIMESTAMP WITH TIME ZONE,
  lifted_by UUID -- Admin user ID who lifted restriction
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bulk_upload_log_user_id ON bulk_upload_log(user_id);
CREATE INDEX IF NOT EXISTS idx_bulk_upload_log_created_at ON bulk_upload_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bulk_upload_log_risk_score ON bulk_upload_log(risk_score DESC);

CREATE INDEX IF NOT EXISTS idx_account_flags_user_id ON account_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_account_flags_flag_type ON account_flags(flag_type);
CREATE INDEX IF NOT EXISTS idx_account_flags_severity ON account_flags(severity);
CREATE INDEX IF NOT EXISTS idx_account_flags_unresolved ON account_flags(user_id) WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_account_restrictions_user_id ON account_restrictions(user_id);
CREATE INDEX IF NOT EXISTS idx_account_restrictions_active ON account_restrictions(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_account_restrictions_type ON account_restrictions(restriction_type);

-- Row Level Security policies
ALTER TABLE bulk_upload_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_restrictions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own upload logs
CREATE POLICY "Users can view own upload logs" ON bulk_upload_log
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own flags and restrictions (read-only)
CREATE POLICY "Users can view own flags" ON account_flags
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own restrictions" ON account_restrictions
    FOR SELECT USING (auth.uid() = user_id);

-- Admin policies (service role can access all)
-- These are automatically handled by service role bypass

-- Function to calculate risk score for bulk uploads
CREATE OR REPLACE FUNCTION calculate_bulk_upload_risk_score(
  p_user_id UUID,
  p_upload_size INTEGER,
  p_duplicate_rate DECIMAL,
  p_high_risk_numbers INTEGER
) RETURNS INTEGER AS $$
DECLARE
  risk_score INTEGER := 0;
  recent_upload_count INTEGER;
  user_age_days INTEGER;
  total_customers INTEGER;
  avg_upload_size DECIMAL;
BEGIN
  -- Base risk from upload size (larger uploads = higher risk)
  IF p_upload_size > 500 THEN
    risk_score := risk_score + 40;
  ELSIF p_upload_size > 200 THEN
    risk_score := risk_score + 25;
  ELSIF p_upload_size > 100 THEN
    risk_score := risk_score + 15;
  ELSIF p_upload_size > 50 THEN
    risk_score := risk_score + 10;
  END IF;

  -- Risk from duplicate rate (high duplicates = more suspicious)
  IF p_duplicate_rate < 5 THEN
    risk_score := risk_score + 20; -- Very few duplicates suspicious for large upload
  ELSIF p_duplicate_rate > 50 THEN
    risk_score := risk_score + 15; -- Too many duplicates also suspicious
  END IF;

  -- Risk from high-risk phone numbers
  risk_score := risk_score + (p_high_risk_numbers * 2);

  -- Check user history
  SELECT COUNT(*),
         EXTRACT(DAYS FROM NOW() - MIN(created_at))::INTEGER,
         COUNT(DISTINCT customer_id)
  INTO recent_upload_count, user_age_days, total_customers
  FROM bulk_upload_log
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '7 days';

  -- New account with large upload
  IF user_age_days < 7 AND p_upload_size > 50 THEN
    risk_score := risk_score + 30;
  END IF;

  -- Multiple large uploads recently
  IF recent_upload_count > 3 AND p_upload_size > 100 THEN
    risk_score := risk_score + 25;
  END IF;

  -- Cap at 100
  RETURN LEAST(risk_score, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has active restrictions
CREATE OR REPLACE FUNCTION user_has_active_restriction(
  p_user_id UUID,
  p_restriction_type VARCHAR DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM account_restrictions
    WHERE user_id = p_user_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (p_restriction_type IS NULL OR restriction_type = p_restriction_type)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;