import express from 'express';
import Stripe from 'stripe';
import { pool } from '../lib/db.js';

const router = express.Router();

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  await pool.query(`INSERT INTO webhook_events (provider, event_type, payload) VALUES ('stripe',$1,$2)`, [event.type, event]);
  if (event.type === 'checkout.session.completed') {
    const amount_total = event.data.object.amount_total;
    await pool.query(
      `INSERT INTO wallet_ledger (org_id, type, amount_cents, currency, source, reference, meta)
       VALUES ((SELECT id FROM organizations LIMIT 1),'credit', $1, $2, 'stripe', $3, $4)`,
      [amount_total, (event.data.object.currency||'usd').toUpperCase(), event.data.object.id, event.data.object]
    );
  }
  res.json({ received: true });
});

router.post('/esim', express.json(), async (req, res) => {
  const payload = req.body;
  await pool.query(`INSERT INTO webhook_events (provider, event_type, payload) VALUES ('supplier',$1,$2)`, [payload?.event || payload?.type || 'unknown', payload]);
  // Optionally update an order record if orderNo/iccid present
  try {
    const orderNo = payload?.orderNo || payload?.data?.orderNo;
    const iccid = payload?.iccid || payload?.data?.iccid;
    const status = payload?.status || payload?.data?.status || payload?.event;
    if (orderNo || iccid) {
      await pool.query(
        `UPDATE orders SET status=$1, updated_at=NOW() WHERE (order_no=$2 AND $2 IS NOT NULL) OR (iccid=$3 AND $3 IS NOT NULL)`,
        [status, orderNo || null, iccid || null]
      );
    }
  } catch {}
  res.json({ ok: true });
});

export default router;
