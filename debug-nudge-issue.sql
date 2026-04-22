-- Debug script to investigate nudge credit counting issue
-- Run this in your production database to check what's happening

-- 1. Check the most recent requests with nudge data
SELECT
    id,
    created_at,
    sent_at,
    nudge_sent,
    nudge_sent_at,
    status,
    CASE
        WHEN sent_at IS NOT NULL AND status != 'failed' THEN 1
        ELSE 0
    END as initial_credit,
    CASE
        WHEN nudge_sent_at IS NOT NULL THEN 1
        ELSE 0
    END as nudge_credit
FROM review_requests
WHERE user_id = (SELECT id FROM profiles WHERE email = 'your-email@domain.com')  -- Replace with your email
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check current nudge template for your account
SELECT
    type,
    greeting,
    opening_line,
    request_line,
    sign_off
FROM sms_templates
WHERE user_id = (SELECT id FROM profiles WHERE email = 'your-email@domain.com')  -- Replace with your email
ORDER BY type;

-- 3. Update nudge template to new format (if needed)
UPDATE sms_templates
SET
    request_line = 'just a quick reminder - would you mind leaving us a review',
    opening_line = '',
    updated_at = NOW()
WHERE
    user_id = (SELECT id FROM profiles WHERE email = 'your-email@domain.com')  -- Replace with your email
    AND type = 'nudge';

-- 4. Manual credit count for verification
SELECT
    COUNT(*) as total_requests,
    COUNT(CASE WHEN sent_at IS NOT NULL AND status != 'failed' THEN 1 END) as initial_messages,
    COUNT(CASE WHEN nudge_sent_at IS NOT NULL THEN 1 END) as nudge_messages,
    COUNT(CASE WHEN sent_at IS NOT NULL AND status != 'failed' THEN 1 END) +
    COUNT(CASE WHEN nudge_sent_at IS NOT NULL THEN 1 END) as total_credits_used
FROM review_requests
WHERE user_id = (SELECT id FROM profiles WHERE email = 'your-email@domain.com')  -- Replace with your email
    AND created_at >= date_trunc('month', CURRENT_DATE);  -- This month only