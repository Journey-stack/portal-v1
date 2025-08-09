import express from 'express';
import { listPackages } from '../lib/esimaccess.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const locationCode = req.query.location;
    const supplier = await listPackages({ locationCode, type: 'PACKAGE' });
    const rows = supplier?.data || supplier?.list || [];
    const operators = new Map();
    for (const p of rows) {
      for (const op of (p.operatorList || [])) {
        const name = op.operatorName || op.name || 'Unknown';
        const t = op.networkType || op.network || '';
        if (!operators.has(name)) operators.set(name, { name, networkType: t });
      }
    }
    res.json({ location: locationCode, operators: Array.from(operators.values()) });
  } catch (e) {
    res.status(500).json({ error: 'networks_failed', detail: e.response?.data || e.message });
  }
});

export default router;
