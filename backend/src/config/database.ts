import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  throw new Error('Missing Turso database configuration. Check your .env file.');
}

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const runColumnMigrations = async (table: string, columns: { name: string; sql: string }[]) => {
  for (const col of columns) {
    try {
      await db.execute({ sql: col.sql, args: [] });
      console.log(`✓ Added column ${table}.${col.name}`);
    } catch (error: any) {
      if (error.message?.includes('duplicate column')) {
        continue;
      }
      console.log(`  Note: ${table}.${col.name} - ${error.message}`);
    }
  }
};

export async function ensureSchema(): Promise<void> {
  try {
    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS worker_photos (
            id TEXT PRIMARY KEY,
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            url TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
          )`,
      args: [],
    });
    await db.execute({
      sql: 'CREATE INDEX IF NOT EXISTS idx_worker_photos_user ON worker_photos(user_id)',
      args: [],
    });
    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS device_tokens (
            id TEXT PRIMARY KEY,
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            token TEXT NOT NULL UNIQUE,
            platform TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
          )`,
      args: [],
    });
    await db.execute({
      sql: 'CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id)',
      args: [],
    });
    await runColumnMigrations('applications', [
      { name: 'event_id', sql: 'ALTER TABLE applications ADD COLUMN event_id TEXT' },
      { name: 'user_id', sql: 'ALTER TABLE applications ADD COLUMN user_id TEXT' },
    ]);
    await runColumnMigrations('worker_profiles', [
      { name: 'age', sql: 'ALTER TABLE worker_profiles ADD COLUMN age INTEGER' },
      { name: 'gender', sql: 'ALTER TABLE worker_profiles ADD COLUMN gender TEXT' },
      { name: 'aadhaar_doc_url', sql: 'ALTER TABLE worker_profiles ADD COLUMN aadhaar_doc_url TEXT' },
      { name: 'verification_status', sql: "ALTER TABLE worker_profiles ADD COLUMN verification_status TEXT DEFAULT 'pending'" },
    ]);
    console.log('✅ Schema ensured');
  } catch (error) {
    console.error('❌ Schema ensure failed:', error);
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    await db.execute('SELECT 1');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
