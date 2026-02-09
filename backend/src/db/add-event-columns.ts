// Migration to add new columns to events table
import { db } from '../config/database.js';

async function addEventColumns() {
  console.log('Adding new columns to events table...');
  
  const columns = [
    { name: 'end_date', sql: 'ALTER TABLE events ADD COLUMN end_date TEXT' },
    { name: 'job_type', sql: 'ALTER TABLE events ADD COLUMN job_type TEXT' },
    { name: 'male_count', sql: 'ALTER TABLE events ADD COLUMN male_count INTEGER DEFAULT 0' },
    { name: 'female_count', sql: 'ALTER TABLE events ADD COLUMN female_count INTEGER DEFAULT 0' },
    { name: 'male_pay', sql: 'ALTER TABLE events ADD COLUMN male_pay REAL DEFAULT 0' },
    { name: 'female_pay', sql: 'ALTER TABLE events ADD COLUMN female_pay REAL DEFAULT 0' },
    { name: 'payment_method', sql: 'ALTER TABLE events ADD COLUMN payment_method TEXT DEFAULT \'later\'' },
    { name: 'subtotal', sql: 'ALTER TABLE events ADD COLUMN subtotal REAL DEFAULT 0' },
    { name: 'commission', sql: 'ALTER TABLE events ADD COLUMN commission REAL DEFAULT 0' },
    { name: 'total', sql: 'ALTER TABLE events ADD COLUMN total REAL DEFAULT 0' },
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
  
  console.log('Migration complete!');
}

addEventColumns().catch(console.error);
