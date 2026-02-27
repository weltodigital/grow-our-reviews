-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  business_name TEXT,
  google_review_url TEXT,
  phone TEXT,
  sms_delay_hours INTEGER DEFAULT 2,
  nudge_enabled BOOLEAN DEFAULT true,
  nudge_delay_hours INTEGER DEFAULT 48,
  monthly_request_limit INTEGER DEFAULT 50,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customers table
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create review_requests table
CREATE TABLE review_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'scheduled',
  sms_message_sid TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  nudge_sent BOOLEAN DEFAULT false,
  nudge_sent_at TIMESTAMPTZ,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feedback table
CREATE TABLE feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_request_id UUID REFERENCES review_requests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_review_requests_user_id ON review_requests(user_id);
CREATE INDEX idx_review_requests_status ON review_requests(status);
CREATE INDEX idx_review_requests_scheduled_for ON review_requests(scheduled_for);
CREATE INDEX idx_review_requests_token ON review_requests(token);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_review_request_id ON feedback(review_request_id);

-- Create function to generate unique tokens
CREATE OR REPLACE FUNCTION generate_review_token() RETURNS TEXT AS $$
DECLARE
  token TEXT;
  exists BOOLEAN DEFAULT TRUE;
BEGIN
  WHILE exists LOOP
    token := encode(gen_random_bytes(16), 'hex');
    SELECT EXISTS(SELECT 1 FROM review_requests WHERE review_requests.token = token) INTO exists;
  END LOOP;
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set token on insert
CREATE OR REPLACE FUNCTION set_review_token() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.token IS NULL OR NEW.token = '' THEN
    NEW.token := generate_review_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_review_token_trigger
  BEFORE INSERT ON review_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_review_token();

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();