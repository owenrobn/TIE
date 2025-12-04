// run.ts
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'tie_db',
    user: process.env.DB_USER || 'tie_user',
    password: process.env.DB_PASSWORD || 'tie_password',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read migration files
    const migrationsDir = path.join(__dirname);
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') && file.startsWith('00'))
      .sort();

    console.log(`Found ${migrationFiles.length} migrations`);

    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
      
      console.log(`Completed migration: ${file}`);
    }

    console.log('All migrations completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigrations();