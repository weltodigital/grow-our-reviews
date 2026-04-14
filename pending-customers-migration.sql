-- Create pending_customers table for storing customers to be processed in future billing cycles
CREATE TABLE pending_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE NULL,
    processed_request_id UUID NULL REFERENCES review_requests(id) ON DELETE SET NULL
);

-- Indexes for better performance
CREATE INDEX idx_pending_customers_user_id ON pending_customers(user_id);
CREATE INDEX idx_pending_customers_status ON pending_customers(status);
CREATE INDEX idx_pending_customers_created_at ON pending_customers(created_at);

-- RLS (Row Level Security) policies to ensure users only see their own pending customers
ALTER TABLE pending_customers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only select their own pending customers
CREATE POLICY "Users can view own pending customers" ON pending_customers
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own pending customers
CREATE POLICY "Users can insert own pending customers" ON pending_customers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own pending customers
CREATE POLICY "Users can update own pending customers" ON pending_customers
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own pending customers
CREATE POLICY "Users can delete own pending customers" ON pending_customers
    FOR DELETE USING (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE pending_customers IS 'Stores customers that exceed monthly credit limits and will be processed in future billing cycles';
COMMENT ON COLUMN pending_customers.status IS 'Status: pending (waiting for processing), processed (converted to review_request), cancelled (user cancelled)';
COMMENT ON COLUMN pending_customers.processed_at IS 'Timestamp when pending customer was converted to review_request';
COMMENT ON COLUMN pending_customers.processed_request_id IS 'Reference to review_request created from this pending customer';