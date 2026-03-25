-- Add SMS failure tracking columns to review_requests table
ALTER TABLE review_requests
ADD COLUMN sms_error_code TEXT,
ADD COLUMN sms_error_message TEXT,
ADD COLUMN sms_failed_at TIMESTAMPTZ,
ADD COLUMN retry_count INTEGER DEFAULT 0;

-- Add index for failure tracking queries
CREATE INDEX idx_review_requests_sms_failed_at ON review_requests(sms_failed_at) WHERE sms_failed_at IS NOT NULL;
CREATE INDEX idx_review_requests_failed_status ON review_requests(status, sms_failed_at) WHERE status = 'failed';

-- Add comments for documentation
COMMENT ON COLUMN review_requests.sms_error_code IS 'Twilio error code when SMS delivery fails';
COMMENT ON COLUMN review_requests.sms_error_message IS 'Twilio error message when SMS delivery fails';
COMMENT ON COLUMN review_requests.sms_failed_at IS 'Timestamp when SMS delivery failed';
COMMENT ON COLUMN review_requests.retry_count IS 'Number of times SMS delivery was retried';