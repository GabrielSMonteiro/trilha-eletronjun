#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config({ path: '.env.local' });
dotenv.config();

const databaseUrl = process.env.DATABASE_URL || process.env.VITE_SUPABASE_DB_URL || process.env.VITE_SUPABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL not set. Please set DATABASE_URL environment variable.');
  process.exit(1);
}

const migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  console.error(`Migrations directory not found: ${migrationsDir}`);
  process.exit(1);
}

const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
if (files.length === 0) {
  console.error('No SQL migration files found in', migrationsDir);
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    for (const file of files) {
      const fullPath = path.join(migrationsDir, file);
      console.log('Applying', fullPath);
      const sql = fs.readFileSync(fullPath, 'utf8');
      await client.query(sql);
    }
    console.log('All migrations applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
