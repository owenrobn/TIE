-- Create executions table
CREATE TABLE IF NOT EXISTS executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_id UUID REFERENCES signals(id),
    executor VARCHAR(100),
    result JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on signal_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_executions_signal_id ON executions(signal_id);

-- Create index on executor for faster lookups
CREATE INDEX IF NOT EXISTS idx_executions_executor ON executions(executor);