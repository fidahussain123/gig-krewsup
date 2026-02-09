import { db } from '../config/database.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrate() {
  console.log('🚀 Starting database migration...\n');

  try {
    // Read the schema file
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Split by semicolons and filter empty statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 60).replace(/\n/g, ' ') + '...';
      
      try {
        await db.execute(statement);
        console.log(`✅ [${i + 1}/${statements.length}] ${preview}`);
      } catch (error: any) {
        console.error(`❌ [${i + 1}/${statements.length}] Failed: ${preview}`);
        console.error(`   Error: ${error.message}\n`);
      }
    }

    console.log('\n✨ Migration completed successfully!');
    
    // Verify tables were created
    const tables = await db.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    console.log('\n📊 Tables in database:');
    tables.rows.forEach((row: any) => {
      console.log(`   - ${row.name}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
