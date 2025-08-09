import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import { initDb } from './lib/db.js';
import pricingRouter from './routes/pricing.js';
import ordersRouter from './routes/orders.js';
import networksRouter from './routes/networks.js';
import walletRouter from './routes/wallet.js';
import webhooksRouter from './routes/webhooks.js';
import adminRouter from './routes/admin.js';

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('tiny'));
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/v1/pricing', pricingRouter);
app.use('/v1/orders', ordersRouter);
app.use('/v1/networks', networksRouter);
app.use('/v1/wallet', walletRouter);
app.use('/webhooks', webhooksRouter);
app.use('/admin', adminRouter);

const port = process.env.PORT || 8080;
initDb().then(() => {
  app.listen(port, () => console.log(`API listening on ${port}`));
}).catch(err => { console.error('DB init failed', err); process.exit(1); });
