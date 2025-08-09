import express from 'express';
import { createOrder, queryEsim } from '../lib/esimaccess.js';
import { pool } from '../lib/db.js';

const router = express.Router();

/**
 * POST /v1/orders
 * Body: { booking_reference?, agent_id?, location?, slug (package code), days? }
 */
router.post('/', async (req, res) => {
  const { booking_reference, agent_id, location, slug, days = 7 } = req.body || {};

  if (!slug) {
    return res
      .status(400)
      .json({ error: 'missing_params', detail: 'slug (plan code) is required' });
  }

  try {
    // Treat your input as the supplier package code. (Also pass as slug.)
    const data = await createOrder({ slug, periodNum: days, qty: 1 });

    // Supplier can return orderNo in different places; check all.
    const orderNo =
      data?.obj?.orderNo ||
      data?.data?.orderNo ||
      data?.orderNo ||
      null;

    // Try to fetch profile + QR if we have an order number
    let qrCodeUrl = null;
    let iccid = null;
    if (orderNo) {
      const q = await queryEsim({ orderNo });
      const profile =
        q?.obj?.profileList?.[0] ||
        q?.data?.list?.[0] ||
        q?.list?.[0] ||
        q?.data ||
        null;

      qrCodeUrl = profile?.qrCodeUrl || profile?.qr || null;
      iccid = profile?.iccid || null;
    }

    // Persist for history
    await pool.query(
      `INSERT INTO orders
        (org_id, booking_reference, agent_id, location, plan_slug, period_days, order_no, iccid, status, qr_code_url, raw)
       VALUES
        ((SELECT id FROM organizations LIMIT 1), $1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        booking_reference || null,
        agent_id || null,
        location || null,
        slug,
        days,
        orderNo || null,
        iccid || null,
        orderNo ? 'created' : 'failed',
        qrCodeUrl,
        data,
      ]
    );

    return res.json({ orderNo, iccid, qrCodeUrl, supplier: data });
  } catch (e) {
    const detail = e?.response?.data || { message: e.message };
    console.error('order_failed', detail);
    return res.status(400).json({ error: 'order_failed', detail });
  }
});

/**
 * GET /v1/orders/:orderNo
 */
router.get('/:orderNo', async (req, res) => {
  try {
    const orderNo = req.params.orderNo;
    const q = await queryEsim({ orderNo });

    const profile =
      q?.obj?.profileList?.[0] ||
      q?.data?.list?.[0] ||
      q?.list?.[0] ||
      q?.data ||
      null;

    return res.json({
      orderNo,
      iccid: profile?.iccid,
      status: profile?.esimStatus || profile?.smdpStatus,
      qrCodeUrl: profile?.qrCodeUrl || profile?.qr,
      usage: profile?.orderUsage || profile?.usage,
      expiredTime: profile?.expiredTime,
    });
  } catch (e) {
    return res
      .status(500)
      .json({ error: 'query_failed', detail: e?.response?.data || e.message });
  }
});

export default router;
