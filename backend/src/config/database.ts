import { createClient, SupabaseClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase configuration. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.');
}

if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL in your .env file.');
}

export const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const connectionString = process.env.DATABASE_URL || '';
const isPooler = connectionString.includes('pooler.supabase.com');

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  // Pooler connections need these limits
  max: isPooler ? 10 : 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

interface QueryResult {
  rows: any[];
  rowsAffected: number;
}

interface DbExecuteOptions {
  sql: string;
  args?: any[];
}

export const db = {
  async execute(options: DbExecuteOptions | string): Promise<QueryResult> {
    const sql = typeof options === 'string' ? options : options.sql;
    const args = typeof options === 'string' ? [] : (options.args || []);

    const convertedSql = convertPlaceholders(sql);

    try {
      const result = await pool.query(convertedSql, args);
      return {
        rows: result.rows,
        rowsAffected: result.rowCount || 0
      };
    } catch (error: any) {
      console.error('Database query error:', error.message);
      console.error('SQL:', convertedSql);
      console.error('Args:', args);
      throw error;
    }
  }
};

function convertPlaceholders(sql: string): string {
  let paramIndex = 0;
  let converted = sql.replace(/\?/g, () => {
    paramIndex++;
    return `$${paramIndex}`;
  });
  
  // Convert SQLite CURRENT_TIMESTAMP to PostgreSQL NOW()
  converted = converted.replace(/CURRENT_TIMESTAMP/gi, 'NOW()');
  
  return converted;
}

export async function testConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

export async function ensureSchema(): Promise<void> {
  console.log('✅ Using Supabase - schema managed via SQL Editor');
}

export { pool };
import dns from 'dns';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Force IPv4 — Supabase often returns only AAAA records; EC2/VPCs lack IPv6 routes.
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
dns.setDefaultResultOrder?.('ipv4first');
// Override lookup to force IPv4 (family: 4) for all connections
const origLookup = dns.lookup;
dns.lookup = function (hostname: any, options: any, callback: any) {
  if (typeof options === 'function') {
    callback = options;
    options = { family: 4 };
  } else if (typeof options === 'number') {
    options = { family: 4 };
  } else {
    options = { ...options, family: 4 };
  }
  return origLookup.call(dns, hostname, options, callback);
} as typeof dns.lookup;

const { Pool } = pg;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase configuration. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.');
}

if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL in your .env file.');
}

export const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

interface QueryResult {
  rows: any[];
  rowsAffected: number;
}

interface DbExecuteOptions {
  sql: string;
  args?: any[];
}

export const db = {
  async execute(options: DbExecuteOptions | string): Promise<QueryResult> {
    const sql = typeof options === 'string' ? options : options.sql;
    const args = typeof options === 'string' ? [] : (options.args || []);

    const convertedSql = convertPlaceholders(sql);

    try {
      const result = await pool.query(convertedSql, args);
      return {
        rows: result.rows,
        rowsAffected: result.rowCount || 0
      };
    } catch (error: any) {
      console.error('Database query error:', error.message);
      console.error('SQL:', convertedSql);
      console.error('Args:', args);
      throw error;
    }
  }
};

function convertPlaceholders(sql: string): string {
  let paramIndex = 0;
  let converted = sql.replace(/\?/g, () => {
    paramIndex++;
    return `$${paramIndex}`;
  });
  
  // Convert SQLite CURRENT_TIMESTAMP to PostgreSQL NOW()
  converted = converted.replace(/CURRENT_TIMESTAMP/gi, 'NOW()');
  
  return converted;
}

export async function testConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

export async function ensureSchema(): Promise<void> {
  console.log('✅ Using Supabase - schema managed via SQL Editor');
}

export { pool };
