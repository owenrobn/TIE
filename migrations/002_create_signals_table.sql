-- Create signals table
CREATE TABLE IF NOT EXISTS signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL,
    context JSONB,
    simulation JSONB,
    score JSONB,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on chain and type for faster lookups
CREATE INDEX IF NOT EXISTS idx_signals_chain_type ON signals(chain, type);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at);