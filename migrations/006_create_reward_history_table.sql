CREATE TABLE reward_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) REFERENCES wallets(address),
    token VARCHAR(255),
    amount NUMERIC,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(100)
);