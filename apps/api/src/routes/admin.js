import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { pool } from '../lib/db.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/pricebook/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no_file' });
    const records = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const r of records) {
        const slug = r.slug || r.Slug || r.Name;
        const location = r.location || r.Location;
        const price = r.price || r.Price;
        if (!slug || !location || !price) continue;
        const cents = Math.round(Number(price) * 100);
        await client.query(
          `INSERT INTO price_books (org_id, slug, location, price_cents) VALUES (NULL,$1,$2,$3)`,
          [slug, location, cents]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK'); throw e;
    } finally { client.release(); }
    res.json({ ok: true, inserted: records.length });
  } catch (e) {
    res.status(500).json({ error: 'upload_failed', detail: e.message });
  }
});

export default router;
