// Migration: Fix applications table and transactions table
// Run with: npx tsx src/db/fix-tables.ts

import { db } from '../config/database.js';

async function fixTables() {
  console.log('🔧 Fixing database tables...\n');

  try {
    // 1. Add event_id column to applications table
    console.log('Adding event_id to applications...');
    try {
      await db.execute({
        sql: 'ALTER TABLE applications ADD COLUMN event_id TEXT REFERENCES events(id)',
        args: [],
      });
      console.log('✅ Added event_id column');
    } catch (e: any) {
      if (e.message.includes('duplicate column')) {
        console.log('⏭️  event_id already exists');
      } else {
        console.log('⚠️  event_id:', e.message);
      }
    }

    // 2. Add user_id column to applications (alias for worker_id)
    console.log('Adding user_id to applications...');
    try {
      await db.execute({
        sql: 'ALTER TABLE applications ADD COLUMN user_id TEXT REFERENCES users(id)',
        args: [],
      });
      console.log('✅ Added user_id column');
    } catch (e: any) {
      if (e.message.includes('duplicate column')) {
        console.log('⏭️  user_id already exists');
      } else {
        console.log('⚠️  user_id:', e.message);
      }
    }

    // 3. Add reference_type to transactions
    console.log('Adding reference_type to transactions...');
    try {
      await db.execute({
        sql: 'ALTER TABLE transactions ADD COLUMN reference_type TEXT',
        args: [],
      });
      console.log('✅ Added reference_type column');
    } catch (e: any) {
      if (e.message.includes('duplicate column')) {
        console.log('⏭️  reference_type already exists');
      } else {
        console.log('⚠️  reference_type:', e.message);
      }
    }

    // 4. Create index on event_id for applications
    console.log('Creating index on event_id...');
    try {
      await db.execute({
        sql: 'CREATE INDEX IF NOT EXISTS idx_applications_event ON applications(event_id)',
        args: [],
      });
      console.log('✅ Created index');
    } catch (e: any) {
      console.log('⚠️  Index:', e.message);
    }

    // 5. Create index on user_id for applications
    console.log('Creating index on user_id...');
    try {
      await db.execute({
        sql: 'CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id)',
        args: [],
      });
      console.log('✅ Created index');
    } catch (e: any) {
      console.log('⚠️  Index:', e.message);
    }

    console.log('\n✅ Database tables fixed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

fixTables();
