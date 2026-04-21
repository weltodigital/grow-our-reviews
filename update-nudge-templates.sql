-- Update all existing nudge templates to use new standard format
-- This updates the default nudge message to: "Hi {name}, just a quick reminder - would you mind leaving us a review: {link}"

UPDATE sms_templates
SET
  request_line = 'just a quick reminder - would you mind leaving us a review',
  opening_line = '',
  updated_at = NOW()
WHERE
  type = 'nudge'
  AND (
    request_line = 'We''d love your feedback'
    OR request_line = 'would you mind leaving us a review:'
    OR request_line LIKE '%We''d love%'
    OR request_line LIKE '%would you mind%'
  );

-- Also update any nudge templates that still have opening lines
-- since nudges should only use greeting + request_line format
UPDATE sms_templates
SET
  opening_line = '',
  updated_at = NOW()
WHERE
  type = 'nudge'
  AND opening_line IS NOT NULL
  AND opening_line != '';

-- Verify the updates
SELECT
  COUNT(*) as total_nudge_templates_updated,
  COUNT(CASE WHEN request_line = 'just a quick reminder - would you mind leaving us a review' THEN 1 END) as using_new_format
FROM sms_templates
WHERE type = 'nudge';