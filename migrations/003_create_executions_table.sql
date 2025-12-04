-- Create executions table
CREATE TABLE IF NOT EXISTS executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_id UUID REFERENCES signals(id) ON DELETE CASCADE,
    executor VARCHAR(100),
    result JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_executions_signal_id ON executions(signal_id);
CREATE INDEX IF NOT EXISTS idx_executions_executor ON executions(executor);
CREATE INDEX IF NOT EXISTS idx_executions_timestamp ON executions(timestamp);

-- Add comments for documentation
COMMENT ON TABLE executions IS 'Stores execution results for processed signals';
COMMENT ON COLUMN executions.id IS 'Unique identifier for the execution record';
COMMENT ON COLUMN executions.signal_id IS 'Reference to the signal that was executed';
COMMENT ON COLUMN executions.executor IS 'Identifier for the executor (automation engine, user, etc.)';
COMMENT ON COLUMN executions.result IS 'Detailed execution results';
COMMENT ON COLUMN executions.timestamp IS 'Timestamp when the execution occurred';