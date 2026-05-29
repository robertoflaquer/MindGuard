import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __dir = dirname(fileURLToPath(import.meta.url));

const pool = new Pool(
  process.env.DATABASE_PRIVATE_URL
    ? { connectionString: process.env.DATABASE_PRIVATE_URL }
    : process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host:     process.env.PGHOST     || process.env.DB_HOST     || 'localhost',
        port:     process.env.PGPORT     || process.env.DB_PORT     || 5432,
        database: process.env.PGDATABASE || process.env.DB_NAME     || 'mindguard',
        user:     process.env.PGUSER     || process.env.DB_USER     || 'postgres',
        password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
      }
);

const sql = readFileSync(join(__dir, 'schema.sql'), 'utf8');

try {
  await pool.query(sql);
  console.log('✅ Migration concluída com sucesso!');
} catch (err) {
  // Log the error but don't exit — server must start even if schema already exists
  console.error('⚠️  Migration warning (schema may already exist):', err.message);
} finally {
  await pool.end();
}
