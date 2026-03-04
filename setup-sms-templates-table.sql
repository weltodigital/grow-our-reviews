-- Setup script for sms_templates table and default templates
-- Run this in production database to fix the missing table error

-- Create the sms_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('initial', 'nudge')),
  greeting TEXT DEFAULT 'Hi',
  opening_line TEXT DEFAULT 'thx for {business_name}!',
  request_line TEXT DEFAULT 'Review please',
  sign_off TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- Enable RLS on sms_templates table
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sms_templates
DROP POLICY IF EXISTS "Users can view own sms templates" ON sms_templates;
DROP POLICY IF EXISTS "Users can insert own sms templates" ON sms_templates;
DROP POLICY IF EXISTS "Users can update own sms templates" ON sms_templates;
DROP POLICY IF EXISTS "Users can delete own sms templates" ON sms_templates;

CREATE POLICY "Users can view own sms templates" ON sms_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sms templates" ON sms_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sms templates" ON sms_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sms templates" ON sms_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_templates_user_id ON sms_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_templates_type ON sms_templates(type);

-- Insert short default templates for all existing users who don't have them
-- Using the shorter templates that fit within 160 characters

-- Insert initial templates
INSERT INTO sms_templates (user_id, type, greeting, opening_line, request_line, sign_off, is_active, created_at, updated_at)
SELECT
  id as user_id,
  'initial' as type,
  'Hi' as greeting,
  'thx for {business_name}!' as opening_line,
  'Review please' as request_line,
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

-- Insert nudge templates
INSERT INTO sms_templates (user_id, type, greeting, opening_line, request_line, sign_off, is_active, created_at, updated_at)
SELECT
  id as user_id,
  'nudge' as type,
  'Hi' as greeting,
  'thx for {business_name}!' as opening_line,
  'Review please' as request_line,
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

-- Update any existing templates that still have the old long defaults
UPDATE sms_templates
SET
  opening_line = 'thx for {business_name}!',
  request_line = 'Review please',
  updated_at = NOW()
WHERE
  request_line LIKE '%30 seconds%'
  OR request_line LIKE '%quick review%'
  OR opening_line = 'thanks for choosing {business_name}!'
  OR opening_line = 'thanks for using {business_name}!'
  OR opening_line = 'thanks for {business_name}!';

-- Verify the setup
SELECT
  'Table created and populated successfully' as status,
  COUNT(*) as total_templates,
  COUNT(DISTINCT user_id) as users_with_templates
FROM sms_templates;

-- Check character counts for verification
SELECT
  p.business_name,
  st.type,
  LENGTH(p.business_name) as business_name_length,
  LENGTH(
    CASE
      WHEN st.type = 'initial' THEN
        'Hi Christopher, ' || REPLACE(st.opening_line, '{business_name}', COALESCE(p.business_name, 'Your Business')) || '\n\n' || st.request_line || ' 👇\n\nhttps://growourreviews.com/review/a1b2c3d4e5f6'
      ELSE
        'Hi Christopher, reminder — ' || st.request_line || ':\n\nhttps://growourreviews.com/review/a1b2c3d4e5f6'
    END
  ) as estimated_sms_length
FROM profiles p
JOIN sms_templates st ON p.id = st.user_id
ORDER BY estimated_sms_length DESC
LIMIT 10;