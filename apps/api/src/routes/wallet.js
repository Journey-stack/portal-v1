import express from 'express';
import Stripe from 'stripe';
import { pool } from '../lib/db.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

router.get('/', async (_req, res) => {
  const { rows } = await pool.query("SELECT COALESCE(SUM(CASE WHEN type='credit' THEN amount_cents ELSE -amount_cents END),0) AS bal FROM wallet_ledger");
  res.json({ currency: process.env.DEFAULT_CURRENCY || 'USD', balance_cents: Number(rows[0]?.bal||0) });
});

router.post('/checkout', async (req, res) => {
  const amount = Number(req.body?.amount || 0);
  const min = Number(process.env.MIN_TOPUP_USD || 50);
  const cents = Math.max(amount, min) * 100;
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: { currency: 'usd', unit_amount: cents, product_data: { name: 'Journey Stack Wallet Top-up' } },
      quantity: 1
    }],
    success_url: `${process.env.APP_URL_FRONTEND}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL_FRONTEND}/billing/cancel`
  });
  res.json({ url: session.url });
});

export default router;
