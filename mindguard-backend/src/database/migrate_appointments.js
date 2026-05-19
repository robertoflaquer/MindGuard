// node src/database/migrate_appointments.js
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __dir = dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5433,
  database: process.env.DB_NAME     || 'mindguard',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD,
});

const sql = readFileSync(join(__dir, 'add_appointments_prescriptions.sql'), 'utf8');

try {
  await pool.query(sql);
  console.log('✅ Migration de consultas e prescrições concluída!');
} catch (err) {
  console.error('❌ Erro na migration:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
