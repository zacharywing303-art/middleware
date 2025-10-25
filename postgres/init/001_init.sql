-- run at first container start

-- 1) Debezium user with REPLICATION
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dbz') THEN
    CREATE ROLE dbz WITH LOGIN REPLICATION PASSWORD 'dbzpass';
  END IF;
END$$;

-- 2) Ensure we're in the 'payments' DB
\connect payments

-- 3) Basic schema + sample table
CREATE SCHEMA IF NOT EXISTS public;

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(18,2) NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(18,2) NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) Grants so Debezium can snapshot & stream
GRANT CONNECT ON DATABASE payments TO dbz;
GRANT USAGE ON SCHEMA public TO dbz;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO dbz;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO dbz;

-- 5) Seed row
INSERT INTO public.payments(amount, status) VALUES (100.00, 'pending');

-- Extension for gen_random_uuid (if not present)
CREATE EXTENSION IF NOT EXISTS pgcrypto;