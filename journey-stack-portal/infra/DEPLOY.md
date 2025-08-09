# Deploy Guide (Render + Vercel + Neon)

## 0) Prereqs
- GitHub account
- Stripe account (Test mode)
- Neon account
- Render account
- Vercel account

## 1) Database (Neon)
- Create a project (AWS, ap-southeast-1 if possible).
- Copy the `postgresql://...` connection string (with credentials).
- You'll paste it into Render as `DATABASE_URL`.

## 2) Backend API (Render)
- New → Web Service → Connect your GitHub repo → choose `apps/api`.
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Add Environment Variables from `apps/api/.env.example`.
- First deploy runs DB init & migrations automatically.

## 3) Frontend (Vercel)
- New Project → Import GitHub repo → set **Root Directory** to `apps/console`.
- Environment variable:
  - `VITE_API_BASE_URL` = `https://api.journeystack.co` (or Render temp URL first)
- Deploy → get a temporary Vercel URL.

## 4) Stripe webhook (TEST)
- Developers → Webhooks → + Add destination → Endpoint URL: `{API_URL}/webhooks/stripe`
- Events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
- Reveal signing secret → set env var `STRIPE_WEBHOOK_SECRET` on Render.
- Test with card 4242 4242 4242 4242.

## 5) Supplier webhooks
- Set supplier webhook URL to your staging endpoint or Pipedream.
- Ensure your API receives and logs events at `/webhooks/esim`.

## 6) DNS
- Vercel → Domains → add `console.journeystack.co` → follow CNAME instructions.
- Render → Custom Domains → add `api.journeystack.co` → CNAME to Render host.

## 7) Go Live
- Swap Stripe Test keys to Live.
- Add a new Stripe webhook for the prod API URL and use its new signing secret.
- Rotate supplier keys. Keep everything in env vars.
