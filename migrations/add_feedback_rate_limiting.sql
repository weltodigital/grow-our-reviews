-- Migration: Add feedback rate limiting table
-- This tracks all feedback submission attempts for rate limiting and abuse detection

CREATE TABLE feedback_rate_limit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT NOT NULL,
    ip TEXT NOT NULL,
    user_agent TEXT,
    rating INTEGER,
    comment_length INTEGER DEFAULT 0,
    allowed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add token column to feedback table for rate limiting
-- This links feedback back to the original review request token
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS token TEXT;

-- Create indexes for efficient rate limiting queries
CREATE INDEX idx_feedback_rate_limit_log_ip_created_at ON feedback_rate_limit_log(ip, created_at);
CREATE INDEX idx_feedback_rate_limit_log_token ON feedback_rate_limit_log(token);
CREATE INDEX idx_feedback_token ON feedback(token);

-- Add comment for documentation
COMMENT ON TABLE feedback_rate_limit_log IS 'Logs all feedback submission attempts for rate limiting and abuse detection';
COMMENT ON COLUMN feedback_rate_limit_log.token IS 'Review request token that was used for submission';
COMMENT ON COLUMN feedback_rate_limit_log.ip IS 'Client IP address';
COMMENT ON COLUMN feedback_rate_limit_log.user_agent IS 'Browser user agent string';
COMMENT ON COLUMN feedback_rate_limit_log.allowed IS 'Whether the submission was allowed or rate limited';
COMMENT ON COLUMN feedback.token IS 'Review request token for rate limiting (max 5 per token)';

-- Helper functions for abuse monitoring
CREATE OR REPLACE FUNCTION get_top_feedback_ips(hours_ago INTEGER DEFAULT 24)
RETURNS TABLE(ip TEXT, submission_count BIGINT, allowed_count BIGINT, blocked_count BIGINT)
LANGUAGE SQL
AS $$
    SELECT
        ip,
        COUNT(*) as submission_count,
        COUNT(*) FILTER (WHERE allowed = true) as allowed_count,
        COUNT(*) FILTER (WHERE allowed = false) as blocked_count
    FROM feedback_rate_limit_log
    WHERE created_at >= NOW() - (hours_ago || ' hours')::INTERVAL
    GROUP BY ip
    ORDER BY submission_count DESC;
$$;

CREATE OR REPLACE FUNCTION get_tokens_with_multiple_feedback(hours_ago INTEGER DEFAULT 24)
RETURNS TABLE(token TEXT, submission_count BIGINT, unique_ips BIGINT)
LANGUAGE SQL
AS $$
    SELECT
        token,
        COUNT(*) as submission_count,
        COUNT(DISTINCT ip) as unique_ips
    FROM feedback_rate_limit_log
    WHERE created_at >= NOW() - (hours_ago || ' hours')::INTERVAL
    GROUP BY token
    HAVING COUNT(*) > 1
    ORDER BY submission_count DESC;
$$;