-- Health metrics table for daily system monitoring
CREATE TABLE health_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN (
        'sms_sent',
        'sms_failed',
        'nudges_sent',
        'nudges_failed',
        'trial_emails_sent',
        'trial_emails_failed',
        'webhooks_processed',
        'webhooks_failed',
        'reconciliation_run',
        'reconciliation_issues',
        'trials_started',
        'trials_converted',
        'trials_failed',
        'payment_tests_run',
        'payment_tests_failed'
    )),
    count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Unique constraint to prevent duplicate entries per day/metric
CREATE UNIQUE INDEX idx_health_metrics_date_type ON health_metrics(date, metric_type);

-- Performance indexes
CREATE INDEX idx_health_metrics_date ON health_metrics(date);
CREATE INDEX idx_health_metrics_type ON health_metrics(metric_type);

-- RLS for security
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Health metrics are system-only"
    ON health_metrics
    FOR ALL
    TO service_role
    USING (true);

-- Function to increment health metrics
CREATE OR REPLACE FUNCTION increment_health_metric(
    metric_type_param TEXT,
    increment_by INTEGER DEFAULT 1
) RETURNS VOID AS $$
BEGIN
    INSERT INTO health_metrics (date, metric_type, count)
    VALUES (CURRENT_DATE, metric_type_param, increment_by)
    ON CONFLICT (date, metric_type)
    DO UPDATE SET
        count = health_metrics.count + increment_by,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;