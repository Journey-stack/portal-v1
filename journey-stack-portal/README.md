# Journey Stack – eSIM Partner Portal (Staging)

This repo contains:
- **apps/console** – Vite + React portal (Tailwind + Recharts)
- **apps/api** – Node/Express backend (Stripe wallet, supplier proxy, webhooks)
- **db** – SQL schema & seed
- **infra** – deployment notes

## TL;DR Deploy (Option A)
1) Create **Neon** Postgres → copy the connection string.
2) Deploy **backend** on **Render** (Web Service) → add env vars from `.env.example`.
3) Deploy **frontend** on **Vercel** → set `VITE_API_BASE_URL` to your API URL.
4) In **Stripe → Developers → Webhooks**, add endpoint `{API_URL}/webhooks/stripe` with events:
   `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`.
5) Supplier webhooks → set to your URL (e.g., Pipedream for staging).
6) Point DNS:
   - `console.journeystack.co` → Vercel CNAME
   - `api.journeystack.co` → Render CNAME

## Folder layout
- `apps/console` — React UI for agents (Dashboard, SIM Cards, Products, Network, Wallet)
- `apps/api` — REST API: pricing, orders (QR), profiles, networks, wallet, webhooks (Stripe + supplier)
- `db/schema.sql` — tables for orgs, users, wallet ledger, price books, orders/profiles
- `infra/DEPLOY.md` — step-by-step guide

## Notes
- Keep secrets server-side (ENV). Never expose supplier keys in the browser.
- Prices from supplier are stored as cents; default margin is applied unless a CSV override exists.
- Webhooks are idempotent; retries are safe.
