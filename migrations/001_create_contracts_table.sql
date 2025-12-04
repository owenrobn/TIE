-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain VARCHAR(100) NOT NULL,
    address VARCHAR(66) NOT NULL,
    fingerprint JSONB,
    contract_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chain, address)
);

-- Create index on chain and address for faster lookups
CREATE INDEX IF NOT EXISTS idx_contracts_chain_address ON contracts(chain, address);