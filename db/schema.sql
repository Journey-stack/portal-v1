CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_ledger (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit','debit')),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  source TEXT NOT NULL,
  reference TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_books (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NULL,
  slug TEXT,
  location TEXT,
  price_cents INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plans_cache (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT,
  location TEXT,
  name TEXT,
  price_cents INTEGER,
  speed TEXT,
  operators JSONB,
  payload JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  booking_reference TEXT,
  agent_id TEXT,
  location TEXT,
  plan_slug TEXT,
  period_days INTEGER,
  order_no TEXT,
  iccid TEXT,
  status TEXT,
  qr_code_url TEXT,
  expires_at TIMESTAMPTZ,
  usage_mb INTEGER,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL,
  event_type TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO organizations (id, name)
SELECT uuid_generate_v4(), 'Wander Services Pte Ltd (Journey Stack)'
WHERE NOT EXISTS (SELECT 1 FROM organizations);
