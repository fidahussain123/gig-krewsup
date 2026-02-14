import { db } from '../config/database.js';

async function addEventLocationColumns() {
  console.log('Adding latitude/longitude columns to events table...');

  const columns = [
    { name: 'latitude', sql: 'ALTER TABLE events ADD COLUMN latitude REAL' },
    { name: 'longitude', sql: 'ALTER TABLE events ADD COLUMN longitude REAL' },
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

  console.log('Creating location index (if not exists)...');
  try {
    await db.execute({
      sql: 'CREATE INDEX IF NOT EXISTS idx_events_location ON events(latitude, longitude)',
      args: [],
    });
    console.log('✓ Location index ready');
  } catch (error: any) {
    console.log(`  Note: index - ${error.message}`);
  }

  console.log('Event location migration complete!');
}

addEventLocationColumns().catch(console.error);

