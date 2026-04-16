-- Add functions for abuse monitoring admin dashboard

-- Function to get top risk users by average risk score
CREATE OR REPLACE FUNCTION get_top_risk_users(days_ago INTEGER DEFAULT 7)
RETURNS TABLE (
  user_id UUID,
  business_name TEXT,
  email TEXT,
  total_uploads BIGINT,
  average_risk_score DECIMAL,
  highest_risk_score INTEGER,
  blocked_uploads BIGINT,
  flagged_uploads BIGINT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as user_id,
    p.business_name,
    p.email,
    COUNT(bul.id) as total_uploads,
    ROUND(AVG(bul.risk_score), 1) as average_risk_score,
    MAX(bul.risk_score) as highest_risk_score,
    COUNT(bul.id) FILTER (WHERE bul.status = 'blocked') as blocked_uploads,
    COUNT(bul.id) FILTER (WHERE bul.status = 'flagged') as flagged_uploads,
    p.created_at
  FROM profiles p
  JOIN bulk_upload_log bul ON p.id = bul.user_id
  WHERE bul.created_at > NOW() - INTERVAL '1 day' * days_ago
  GROUP BY p.id, p.business_name, p.email, p.created_at
  HAVING COUNT(bul.id) > 0
  ORDER BY average_risk_score DESC, total_uploads DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get abuse summary stats for admin dashboard
CREATE OR REPLACE FUNCTION get_abuse_summary_stats(days_ago INTEGER DEFAULT 7)
RETURNS TABLE (
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  total_uploads BIGINT,
  blocked_uploads BIGINT,
  flagged_uploads BIGINT,
  unique_users BIGINT,
  avg_risk_score DECIMAL,
  high_risk_uploads BIGINT,
  new_flags BIGINT,
  active_restrictions BIGINT
) AS $$
DECLARE
  start_date TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '1 day' * days_ago;
  end_date TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  RETURN QUERY
  SELECT
    start_date as period_start,
    end_date as period_end,

    -- Upload statistics
    (SELECT COUNT(*) FROM bulk_upload_log WHERE created_at BETWEEN start_date AND end_date) as total_uploads,
    (SELECT COUNT(*) FROM bulk_upload_log WHERE created_at BETWEEN start_date AND end_date AND status = 'blocked') as blocked_uploads,
    (SELECT COUNT(*) FROM bulk_upload_log WHERE created_at BETWEEN start_date AND end_date AND status = 'flagged') as flagged_uploads,
    (SELECT COUNT(DISTINCT user_id) FROM bulk_upload_log WHERE created_at BETWEEN start_date AND end_date) as unique_users,
    (SELECT ROUND(AVG(risk_score), 1) FROM bulk_upload_log WHERE created_at BETWEEN start_date AND end_date) as avg_risk_score,
    (SELECT COUNT(*) FROM bulk_upload_log WHERE created_at BETWEEN start_date AND end_date AND risk_score >= 60) as high_risk_uploads,

    -- Flag statistics
    (SELECT COUNT(*) FROM account_flags WHERE created_at BETWEEN start_date AND end_date) as new_flags,
    (SELECT COUNT(*) FROM account_restrictions WHERE is_active = true) as active_restrictions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get risk pattern analysis
CREATE OR REPLACE FUNCTION analyze_risk_patterns(days_ago INTEGER DEFAULT 7)
RETURNS TABLE (
  risk_flag TEXT,
  occurrence_count BIGINT,
  percentage DECIMAL,
  avg_upload_size INTEGER,
  avg_risk_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH flag_stats AS (
    SELECT
      unnest(risk_flags) as flag,
      upload_size,
      risk_score
    FROM bulk_upload_log
    WHERE created_at > NOW() - INTERVAL '1 day' * days_ago
      AND risk_flags IS NOT NULL
  ),
  flag_counts AS (
    SELECT
      flag,
      COUNT(*) as count,
      ROUND(AVG(upload_size)) as avg_size,
      ROUND(AVG(risk_score), 1) as avg_score
    FROM flag_stats
    GROUP BY flag
  )
  SELECT
    fc.flag as risk_flag,
    fc.count as occurrence_count,
    ROUND((fc.count * 100.0 / total_uploads.total), 1) as percentage,
    fc.avg_size::INTEGER as avg_upload_size,
    fc.avg_score as avg_risk_score
  FROM flag_counts fc
  CROSS JOIN (
    SELECT COUNT(DISTINCT id) as total
    FROM bulk_upload_log
    WHERE created_at > NOW() - INTERVAL '1 day' * days_ago
  ) as total_uploads(total)
  ORDER BY occurrence_count DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user risk timeline
CREATE OR REPLACE FUNCTION get_user_risk_timeline(p_user_id UUID, days_ago INTEGER DEFAULT 30)
RETURNS TABLE (
  upload_date DATE,
  uploads_count BIGINT,
  avg_risk_score DECIMAL,
  max_risk_score INTEGER,
  blocked_count BIGINT,
  flagged_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(created_at) as upload_date,
    COUNT(*) as uploads_count,
    ROUND(AVG(risk_score), 1) as avg_risk_score,
    MAX(risk_score) as max_risk_score,
    COUNT(*) FILTER (WHERE status = 'blocked') as blocked_count,
    COUNT(*) FILTER (WHERE status = 'flagged') as flagged_count
  FROM bulk_upload_log
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 day' * days_ago
  GROUP BY DATE(created_at)
  ORDER BY upload_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;