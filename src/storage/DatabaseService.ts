import { Client } from 'pg';
// Removed direct import of 'config' for DB credentials to rely on process.env

interface DetectorRecord {
  id: string;
  name: string;
  enabled: boolean;
  last_run: Date | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

interface SignalRecord {
  id: string;
  chain: string;
  type: string;
  context: any;
  simulation: any;
  score: any;
  status: string;
  created_at: Date;
  detector: string;
}

interface AutomationRuleRecord {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: any; // JSONB type in DB
  status: string;
  created_at: Date;
  updated_at: Date;
}

interface WalletRecord {
  id: string;
  address: string;
  private_key: string; // Stored encrypted in a real app
  persona: any; // JSONB type in DB
  last_used: Date | null;
  created_at: Date;
  updated_at: Date;
}

export class DatabaseService {
  private client: Client;
  // private dbConfig: any; // No longer needed as we directly use process.env

  constructor() {
    // Directly use process.env for database credentials, with defaults for local development/Docker Compose
    this.client = new Client({
      host: process.env.DB_HOST || 'localhost', // 'postgres' in Docker, 'localhost' for local dev
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'tie_db',
      user: process.env.DB_USER || 'tie_user',
      password: process.env.DB_PASSWORD || 'tie_password',
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log('DatabaseService connected to PostgreSQL');
    } catch (error) {
      console.error('Failed to connect to PostgreSQL:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.end();
      console.log('DatabaseService disconnected from PostgreSQL');
    } catch (error) {
      console.error('Failed to disconnect from PostgreSQL:', error);
    }
  }

  // Detector methods
  async getDetectors(): Promise<DetectorRecord[]> {
    const res = await this.client.query('SELECT * FROM detectors ORDER BY name ASC');
    return res.rows;
  }

  async saveDetector(detector: Omit<DetectorRecord, 'id' | 'created_at' | 'updated_at'>): Promise<DetectorRecord> {
    const res = await this.client.query(
      'INSERT INTO detectors (name, enabled, last_run, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [detector.name, detector.enabled, detector.last_run, detector.status]
    );
    return res.rows[0];
  }

  async updateDetector(id: string, updates: Partial<Omit<DetectorRecord, 'id' | 'created_at'>>): Promise<DetectorRecord | null> {
    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = Object.values(updates);
    
    if (fields.length === 0) return null;

    const res = await this.client.query(
      `UPDATE detectors SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return res.rows[0] || null;
  }

  async updateDetectorByName(name: string, updates: Partial<Omit<DetectorRecord, 'id' | 'created_at'>>): Promise<DetectorRecord | null> {
    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = Object.values(updates);
    
    if (fields.length === 0) return null;

    const res = await this.client.query(
      `UPDATE detectors SET ${fields}, updated_at = NOW() WHERE name = $1 RETURNING *`,
      [name, ...values]
    );
    return res.rows[0] || null;
  }

  // Signal methods
  async saveSignal(signal: Omit<SignalRecord, 'id' | 'created_at'>): Promise<SignalRecord> {
    const res = await this.client.query(
      'INSERT INTO signals (chain, type, context, simulation, score, status, detector) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [signal.chain, signal.type, signal.context, signal.simulation, signal.score, signal.status, signal.detector]
    );
    return res.rows[0];
  }

  async getSignals(limit: number = 50, offset: number = 0): Promise<SignalRecord[]> {
    const res = await this.client.query(
      'SELECT * FROM signals ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return res.rows;
  }

  // Automation Rule methods
  async getAutomationRules(): Promise<AutomationRuleRecord[]> {
    const res = await this.client.query('SELECT * FROM automation_rules ORDER BY name ASC');
    return res.rows;
  }

  async getAutomationRuleById(id: string): Promise<AutomationRuleRecord | null> {
    const res = await this.client.query('SELECT * FROM automation_rules WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async saveAutomationRule(rule: Omit<AutomationRuleRecord, 'id' | 'created_at' | 'updated_at'>): Promise<AutomationRuleRecord> {
    const res = await this.client.query(
      'INSERT INTO automation_rules (name, description, enabled, conditions, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [rule.name, rule.description, rule.enabled, rule.conditions, rule.status]
    );
    return res.rows[0];
  }

  async updateAutomationRule(id: string, updates: Partial<Omit<AutomationRuleRecord, 'id' | 'created_at'>>): Promise<AutomationRuleRecord | null> {
    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = Object.values(updates);
    
    if (fields.length === 0) return null;

    const res = await this.client.query(
      `UPDATE automation_rules SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return res.rows[0] || null;
  }

  async deleteAutomationRule(id: string): Promise<boolean> {
    const res = await this.client.query('DELETE FROM automation_rules WHERE id = $1 RETURNING id', [id]);
    return res.rowCount > 0;
  }

  // Wallet methods
  async getWallets(): Promise<WalletRecord[]> {
    const res = await this.client.query('SELECT * FROM wallets ORDER BY created_at DESC');
    return res.rows;
  }

  async saveWallet(wallet: Omit<WalletRecord, 'id' | 'created_at' | 'updated_at'>): Promise<WalletRecord> {
    const res = await this.client.query(
      'INSERT INTO wallets (address, private_key, persona, last_used) VALUES ($1, $2, $3, $4) RETURNING *',
      [wallet.address, wallet.private_key, wallet.persona, wallet.last_used]
    );
    return res.rows[0];
  }

  async updateWallet(id: string, updates: Partial<Omit<WalletRecord, 'id' | 'created_at'>>): Promise<WalletRecord | null> {
    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = Object.values(updates);
    
    if (fields.length === 0) return null;

    const res = await this.client.query(
      `UPDATE wallets SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return res.rows[0] || null;
  }

  async deleteWallet(id: string): Promise<boolean> {
    const res = await this.client.query('DELETE FROM wallets WHERE id = $1 RETURNING id', [id]);
    return res.rowCount > 0;
  }
}