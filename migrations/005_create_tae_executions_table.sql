CREATE TABLE tae_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_id UUID,
    wallet_address VARCHAR(42) REFERENCES wallets(address),
    action JSONB,
    tx_hash VARCHAR(66),
    status VARCHAR(50),
    logs JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    error TEXT
);