-- Migration to create default SMS templates for existing users with proper character limits
-- Run this to fix SMS templates for existing users and add missing templates

-- First, update any existing templates with the old long defaults to the new shorter ones
UPDATE sms_templates
SET
  opening_line = 'thanks for using {business_name}!',
  request_line = 'Quick review please',
  updated_at = NOW()
WHERE
  request_line = 'If you were happy with our work, we''d really appreciate a quick review — it only takes 30 seconds'
  OR opening_line = 'thanks for choosing {business_name}!';

-- Insert missing initial templates for users who don't have them
INSERT INTO sms_templates (user_id, type, greeting, opening_line, request_line, sign_off, is_active, created_at, updated_at)
SELECT
  id as user_id,
  'initial' as type,
  'Hi' as greeting,
  'thanks for using {business_name}!' as opening_line,
  'Quick review please' as request_line,
  NULL as sign_off,
  true as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM profiles
WHERE id NOT IN (
  SELECT user_id FROM sms_templates WHERE type = 'initial'
)
ON CONFLICT (user_id, type) DO UPDATE SET
  greeting = EXCLUDED.greeting,
  opening_line = EXCLUDED.opening_line,
  request_line = EXCLUDED.request_line,
  updated_at = EXCLUDED.updated_at;

-- Insert missing nudge templates for users who don't have them
INSERT INTO sms_templates (user_id, type, greeting, opening_line, request_line, sign_off, is_active, created_at, updated_at)
SELECT
  id as user_id,
  'nudge' as type,
  'Hi' as greeting,
  'thanks for using {business_name}!' as opening_line,
  'Quick review please' as request_line,
  NULL as sign_off,
  true as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM profiles
WHERE id NOT IN (
  SELECT user_id FROM sms_templates WHERE type = 'nudge'
)
ON CONFLICT (user_id, type) DO UPDATE SET
  greeting = EXCLUDED.greeting,
  opening_line = EXCLUDED.opening_line,
  request_line = EXCLUDED.request_line,
  updated_at = EXCLUDED.updated_at;

-- Verify results - check character counts
SELECT
  p.business_name,
  st.type,
  LENGTH(
    CASE
      WHEN st.type = 'initial' THEN
        'Hi Christopher, ' || REPLACE(st.opening_line, '{business_name}', p.business_name || ' (example)') || '\n\n' || st.request_line || ' 👇\n\nhttps://growourreviews.com/review/abc123' ||
        CASE WHEN st.sign_off IS NOT NULL THEN '\n\n' || st.sign_off ELSE '' END
      ELSE
        'Hi Christopher, just a gentle reminder — ' || st.request_line || ':\n\nhttps://growourreviews.com/review/abc123' ||
        CASE WHEN st.sign_off IS NOT NULL THEN '\n\n' || st.sign_off ELSE '' END
    END
  ) as estimated_length
FROM profiles p
LEFT JOIN sms_templates st ON p.id = st.user_id
WHERE st.id IS NOT NULL
ORDER BY estimated_length DESC;