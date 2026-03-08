-- Migration to add trial_reminder_sent column to profiles table
-- Run this on your Supabase database if the column doesn't exist

-- Check if column exists before adding (safe migration)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'trial_reminder_sent'
    ) THEN
        ALTER TABLE profiles ADD COLUMN trial_reminder_sent TIMESTAMPTZ;
    END IF;
END $$;

-- Comment to track migration
COMMENT ON COLUMN profiles.trial_reminder_sent IS 'Timestamp when trial ending email was sent';