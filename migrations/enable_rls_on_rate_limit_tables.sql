-- Enable Row Level Security on internal rate-limit / usage-tracking tables.
--
-- WHY THIS IS SAFE (no policies needed):
-- These four tables are written and read ONLY by server-side code using the
-- Supabase SERVICE ROLE key:
--   - feedback_rate_limit_log   -> lib/feedback-rate-limiter.ts, admin/feedback-abuse-monitor
--   - sms_usage_tracking        -> admin/sms-usage, increment_sms_usage() RPC
--   - sms_rate_limits           -> lib/sms-rate-limiter.ts, admin/sms-usage
--   - sms_user_usage_tracking   -> increment_user_sms_usage() RPC (via service role)
-- The service role BYPASSES RLS, so enabling RLS with NO policies keeps all
-- server-side access working while denying ALL access through the public anon
-- REST API (anon / authenticated roles get zero rows and no writes).
--
-- Fixes Supabase Security Advisor errors:
--   - "RLS Disabled in Public" on all four tables
--   - "Sensitive Columns Exposed" on feedback_rate_limit_log (ip / user_agent PII)
--
-- Safe to run more than once.

ALTER TABLE public.feedback_rate_limit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_usage_tracking      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_rate_limits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_user_usage_tracking ENABLE ROW LEVEL SECURITY;
