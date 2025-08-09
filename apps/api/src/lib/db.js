import pg from 'pg';
import fs from 'fs';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// apps/api/src/lib/db.js
export async function initDb() {
  const schema = fs.readFileSync(
    new URL('../../../../../db/schema.sql', import.meta.url),
    'utf8'
  );
  await pool.query(schema);
}

