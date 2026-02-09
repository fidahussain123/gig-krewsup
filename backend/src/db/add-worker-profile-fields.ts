// Migration to extend worker profiles and add worker photos
import { db } from '../config/database.js';

async function addWorkerProfileFields() {
  console.log('Adding worker profile fields...');

  const columns = [
    { name: 'age', sql: 'ALTER TABLE worker_profiles ADD COLUMN age INTEGER' },
    { name: 'gender', sql: 'ALTER TABLE worker_profiles ADD COLUMN gender TEXT' },
    { name: 'aadhaar_doc_url', sql: 'ALTER TABLE worker_profiles ADD COLUMN aadhaar_doc_url TEXT' },
    { name: 'verification_status', sql: "ALTER TABLE worker_profiles ADD COLUMN verification_status TEXT DEFAULT 'pending'" },
  ];

  for (const col of columns) {
    try {
      await db.execute({ sql: col.sql, args: [] });
      console.log(`✓ Added column: ${col.name}`);
    } catch (error: any) {
      if (error.message?.includes('duplicate column')) {
        console.log(`  Column ${col.name} already exists, skipping`);
      } else {
        console.log(`  Note: ${col.name} - ${error.message}`);
      }
    }
  }

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
    console.log('✓ worker_photos table ready');
  } catch (error: any) {
    console.log(`  Note: worker_photos - ${error.message}`);
  }

  try {
    await db.execute({
      sql: 'CREATE INDEX IF NOT EXISTS idx_worker_photos_user ON worker_photos(user_id)',
      args: [],
    });
    console.log('✓ worker_photos index ready');
  } catch (error: any) {
    console.log(`  Note: worker_photos index - ${error.message}`);
  }

  console.log('Migration complete!');
}

addWorkerProfileFields().catch(console.error);
