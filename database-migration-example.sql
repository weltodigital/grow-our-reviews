-- Add columns to profiles table for dedicated phone numbers
ALTER TABLE profiles
ADD COLUMN twilio_phone_number TEXT,
ADD COLUMN twilio_phone_sid TEXT,
ADD COLUMN phone_provisioned_at TIMESTAMP;

-- Index for faster lookups
CREATE INDEX idx_profiles_twilio_phone ON profiles(twilio_phone_number);