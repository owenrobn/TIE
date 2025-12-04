-- Create signals table
CREATE TABLE IF NOT EXISTS signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL,
    context JSONB,
    simulation JSONB,
    score JSONB,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_signals_chain ON signals(chain);
CREATE INDEX IF NOT EXISTS idx_signals_type ON signals(type);
CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at);

-- Add comments for documentation
COMMENT ON TABLE signals IS 'Stores detected opportunities and their analysis results';
COMMENT ON COLUMN signals.id IS 'Unique identifier for the signal';
COMMENT ON COLUMN signals.chain IS 'Blockchain network where the opportunity was detected';
COMMENT ON COLUMN signals.type IS 'Type of opportunity (New Contract, Staking Reward, etc.)';
COMMENT ON COLUMN signals.context IS 'Detailed context information about the opportunity';
COMMENT ON COLUMN signals.simulation IS 'Simulation results for the opportunity';
COMMENT ON COLUMN signals.score IS 'Scoring details and final score';
COMMENT ON COLUMN signals.status IS 'Current status of the signal (new, reviewed, executed, etc.)';
COMMENT ON COLUMN signals.created_at IS 'Timestamp when the signal was created';
COMMENT ON COLUMN signals.updated_at IS 'Timestamp when the signal was last updated';