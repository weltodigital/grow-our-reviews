-- Create webhook_events table for idempotency and audit trail
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_event_id TEXT NOT NULL UNIQUE, -- Idempotency key
    event_type TEXT NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped_duplicate')),
    error_message TEXT,
    payload JSONB NOT NULL, -- Full event for replay
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for performance on common lookups
CREATE INDEX idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at);

-- RLS policy to match profiles table pattern
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Only allow system/service role access for webhook events
CREATE POLICY "Webhook events are system-only"
    ON webhook_events
    FOR ALL
    TO service_role
    USING (true);