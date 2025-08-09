import pg from 'pg';
import fs from 'fs';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function initDb() {
  const schema = fs.readFileSync(new URL('../../../../db/schema.sql', import.meta.url)).toString();
  await pool.query(schema);
}
