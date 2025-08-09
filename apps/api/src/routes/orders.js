import express from 'express';
import { createOrder, queryEsim } from '../lib/esimaccess.js';
import { pool } from '../lib/db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { booking_reference, agent_id, location, slug, days = 7 } = req.body || {};
  if (!location || !slug) return res.status(400).json({ error: 'missing_params' });
  try {
    const data = await createOrder({ locationCode: location, slug, periodNum: days, qty: 1 });
    const orderNo = data?.data?.orderNo || data?.orderNo;
    let qrCodeUrl = null, iccid = null;
    if (orderNo) {
      const q = await queryEsim({ orderNo });
      const profile = q?.data?.list?.[0] || q?.data || q?.list?.[0];
      qrCodeUrl = profile?.qrCodeUrl || null;
      iccid = profile?.iccid || null;
    }
    await pool.query(
      `INSERT INTO orders (org_id, booking_reference, agent_id, location, plan_slug, period_days, order_no, iccid, status, qr_code_url, raw)
       VALUES ((SELECT id FROM organizations LIMIT 1), $1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [booking_reference || null, agent_id || null, location, slug, days, orderNo || null, iccid || null, 'created', qrCodeUrl, data]
    );
    res.json({ orderNo, iccid, qrCodeUrl });
  } catch (e) {
    res.status(500).json({ error: 'order_failed', detail: e.response?.data || e.message });
  }
});

router.get('/:orderNo', async (req, res) => {
  try {
    const orderNo = req.params.orderNo;
    const q = await queryEsim({ orderNo });
    const profile = q?.data?.list?.[0] || q?.data || q?.list?.[0];
    const out = {
      orderNo,
      iccid: profile?.iccid,
      status: profile?.esimStatus || profile?.smdpStatus,
      qrCodeUrl: profile?.qrCodeUrl,
      usage: profile?.orderUsage || profile?.usage,
      expiredTime: profile?.expiredTime
    };
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: 'query_failed', detail: e.response?.data || e.message });
  }
});

export default router;
