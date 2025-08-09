import express from 'express';
import { listPackages } from '../lib/esimaccess.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const loc = (req.query.location || '').toUpperCase(); // e.g. "SG"
    const slug = req.query.slug || undefined;

    // Get the full catalog from supplier, then filter in our API
    const rows = await listPackages({ slug });

    // Supplier returns comma-separated locations, e.g. "SG,MY,TH"
    const filtered = loc
      ? rows.filter(p =>
          (p.location || '')
            .split(',')
            .map(s => s.trim().toUpperCase())
            .includes(loc)
        )
      : rows;

    const plans = filtered.map(p => ({
      name: p.name,
      slug: p.slug || p.packageCode,
      location: p.location,                                // comma-separated list
      speed: p.speed || p.networkType || '',
      price_raw: p.price,                                   // raw supplier price
      retail_raw: p.retailPrice,
      operators: p.locationNetworkList?.[0]?.operatorList   // where MNOs usually live
                 || p.operatorList
                 || [],
      payload: p
    }));

    res.json({ plans });
  } catch (e) {
    console.error('pricing_failed', e.response?.data || e.message);
    res.status(500).json({ error: 'pricing_failed', detail: e.response?.data || e.message });
  }
});

export default router;
