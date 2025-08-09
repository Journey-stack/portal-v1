import express from 'express';
import { listPackages } from '../lib/esimaccess.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const locationCode = req.query.location;
    const slug = req.query.slug;
    const supplier = await listPackages({ locationCode, type: 'PACKAGE', slug });
    const rows = supplier?.data || supplier?.list || supplier?.packages || [];
    const out = rows.map(p => ({
      name: p.name || p.packageName || p.slug || p.packageCode,
      slug: p.slug || p.packageCode,
      location: p.locationCode || locationCode,
      speed: p.speed || p.networkType || '',
      price_cents_supplier: Number(p.price) || null,
      operators: p.operatorList || [],
      payload: p
    }));
    res.json({ plans: out });
  } catch (e) {
    res.status(500).json({ error: 'pricing_failed', detail: e.response?.data || e.message });
  }
});

export default router;
