-- Migration to create default SMS templates for existing users
-- Run this after deploying the sms_templates table

INSERT INTO sms_templates (user_id, type, greeting, opening_line, request_line, sign_off, is_active, created_at, updated_at)
SELECT
  id as user_id,
  'initial' as type,
  'Hi' as greeting,
  'thanks for choosing {business_name}!' as opening_line,
  'If you were happy with our work, we''d really appreciate a quick review — it only takes 30 seconds' as request_line,
  NULL as sign_off,
  true as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM profiles
WHERE id NOT IN (
  SELECT user_id FROM sms_templates WHERE type = 'initial'
);

INSERT INTO sms_templates (user_id, type, greeting, opening_line, request_line, sign_off, is_active, created_at, updated_at)
SELECT
  id as user_id,
  'nudge' as type,
  'Hi' as greeting,
  'thanks for choosing {business_name}!' as opening_line,
  'If you were happy with our work, we''d really appreciate a quick review — it only takes 30 seconds' as request_line,
  NULL as sign_off,
  true as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM profiles
WHERE id NOT IN (
  SELECT user_id FROM sms_templates WHERE type = 'nudge'
);

-- Check results
SELECT
  p.business_name,
  COUNT(st.id) as template_count
FROM profiles p
LEFT JOIN sms_templates st ON p.id = st.user_id
GROUP BY p.id, p.business_name
ORDER BY template_count ASC;