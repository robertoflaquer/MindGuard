// config/database.js
import pg from 'pg';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

const { Pool } = pg;

// Priority order:
// 1. DATABASE_PRIVATE_URL — Railway internal connection string (fastest, no SSL)
// 2. DATABASE_URL — Railway external connection string (needs SSL)
// 3. PGHOST etc. — Railway PostgreSQL plugin auto-injects these into all project services
// 4. DB_HOST etc. — local .env fallback
const base = { max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000 };

const poolConfig = process.env.DATABASE_PRIVATE_URL
  ? { ...base, connectionString: process.env.DATABASE_PRIVATE_URL }
  : process.env.DATABASE_URL
  ? { ...base, connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : {
      ...base,
      host:     process.env.PGHOST     || process.env.DB_HOST,
      port:     process.env.PGPORT     || process.env.DB_PORT,
      database: process.env.PGDATABASE || process.env.DB_NAME,
      user:     process.env.PGUSER     || process.env.DB_USER,
      password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
    };

const pool = new Pool(poolConfig);

// Test connection
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database error');
});

// Query helper
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug({ duration, rows: res.rowCount }, 'Query executed');
    return res;
  } catch (error) {
    logger.error({ error }, 'Database query error');
    throw error;
  }
};

// Transaction helper
export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
