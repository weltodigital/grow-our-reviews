-- Migration: Add SMS suppressions table for handling STOP messages
-- Created: 2026-04-03
-- Purpose: Legal compliance with UK PECR, GDPR, and Twilio acceptable use policy

-- Create SMS suppressions table
CREATE TABLE sms_suppressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,          -- E.164 format (+447xxxxxxxxx)
  user_id uuid NOT NULL REFERENCES profiles(id),  -- the business they opted out from
  reason text NOT NULL DEFAULT 'customer_opt_out', -- customer_opt_out, invalid_number, admin_suppressed
  source_message text,                 -- the actual message the customer sent (for audit)
  suppressed_at timestamp with time zone DEFAULT now(),
  UNIQUE(phone_number, user_id)        -- one suppression per phone per business
);

-- Add index for fast lookups during SMS sending
CREATE INDEX idx_sms_suppressions_lookup ON sms_suppressions(phone_number, user_id);
CREATE INDEX idx_sms_suppressions_user_id ON sms_suppressions(user_id);

-- Create auto-reply log table to prevent SMS loops
CREATE TABLE auto_reply_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  replied_at timestamp with time zone DEFAULT now(),
  user_id uuid REFERENCES profiles(id) -- track which business sent the auto-reply
);

-- Add index for 24-hour rate limiting lookups
CREATE INDEX idx_auto_reply_phone_date ON auto_reply_log(phone_number, replied_at);

-- Enable RLS on suppressions table
ALTER TABLE sms_suppressions ENABLE ROW LEVEL SECURITY;

-- Business owners can view their own suppressions but cannot delete them
CREATE POLICY "Users can view own suppressions"
  ON sms_suppressions FOR SELECT
  USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies for users — suppressions are managed by the system only
-- Service role key is used for creating suppressions from the webhook

-- Enable RLS on auto_reply_log table
ALTER TABLE auto_reply_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own auto-reply logs
CREATE POLICY "Users can view own auto replies"
  ON auto_reply_log FOR SELECT
  USING (user_id = auth.uid());

-- Add comments for documentation
COMMENT ON TABLE sms_suppressions IS 'Stores opt-out requests from customers (STOP messages) - required for legal compliance';
COMMENT ON COLUMN sms_suppressions.phone_number IS 'Customer phone number in E.164 format';
COMMENT ON COLUMN sms_suppressions.user_id IS 'Business owner who the customer opted out from';
COMMENT ON COLUMN sms_suppressions.reason IS 'Why the suppression was created: customer_opt_out, invalid_number, admin_suppressed';
COMMENT ON COLUMN sms_suppressions.source_message IS 'Original message from customer (e.g., "STOP", "UNSUBSCRIBE")';

COMMENT ON TABLE auto_reply_log IS 'Tracks auto-replies sent to prevent SMS loops - rate limited to 1 per 24 hours per phone';
COMMENT ON COLUMN auto_reply_log.phone_number IS 'Phone number that received an auto-reply';
COMMENT ON COLUMN auto_reply_log.user_id IS 'Business that sent the auto-reply';