CREATE TABLE wallets (
    id UUID PRIMARY KEY,
    address VARCHAR(42) UNIQUE NOT NULL,
    private_key TEXT NOT NULL, -- In a real app, this would be encrypted
    persona JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);