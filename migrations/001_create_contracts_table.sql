-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain VARCHAR(100) NOT NULL,
    address VARCHAR(66) NOT NULL,
    fingerprint JSONB,
    contract_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contracts_chain ON contracts(chain);
CREATE INDEX IF NOT EXISTS idx_contracts_address ON contracts(address);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts(contract_type);

-- Add comments for documentation
COMMENT ON TABLE contracts IS 'Stores contract fingerprints and metadata';
COMMENT ON COLUMN contracts.id IS 'Unique identifier for the contract record';
COMMENT ON COLUMN contracts.chain IS 'Blockchain network identifier';
COMMENT ON COLUMN contracts.address IS 'Contract address on the blockchain';
COMMENT ON COLUMN contracts.fingerprint IS 'JSON object containing contract analysis results';
COMMENT ON COLUMN contracts.contract_type IS 'Classified contract type (AMM, Staking, Governance, etc.)';
COMMENT ON COLUMN contracts.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN contracts.updated_at IS 'Timestamp when the record was last updated';