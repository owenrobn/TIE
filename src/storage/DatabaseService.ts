import { Client } from 'pg';
import config from 'config'; // Using the 'config' package for configuration

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

export class DatabaseService {
  private client: Client;
  private dbConfig: any;

  constructor() {
    this.dbConfig = config.get('database');
    this.client = new Client({
      host: this.dbConfig.host,
      port: this.dbConfig.port,
      database: this.dbConfig.name,
      user: this.dbConfig.user,
      password: this.dbConfig.password,
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
}