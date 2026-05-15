-- NearBuy Users Table (Supabase / PostgreSQL)
-- Run this SQL in your Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  mobile        TEXT,
  password_hash TEXT,                          -- NULL for Google-only users
  google_id     TEXT UNIQUE,                   -- NULL for manual users
  avatar_url    TEXT,
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  role          TEXT NOT NULL DEFAULT 'user',  -- 'user' | 'vendor' | 'manager' | 'admin'
  manager_type  TEXT,                          -- 'food' | 'medicine' | 'store' (only for managers)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OTPs Table (high-write; expires quickly)
CREATE TABLE IF NOT EXISTS otps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier  TEXT NOT NULL,          -- email or mobile
  otp_hash    TEXT NOT NULL,          -- bcrypt hash of OTP
  purpose     TEXT NOT NULL,          -- 'signup' | 'reset'
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Refresh Tokens Table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance at scale
CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google   ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_otps_ident     ON otps(identifier, purpose);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens ON refresh_tokens(user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_updated_at ON users;
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security (Supabase)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE otps  ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (backend uses service key, not anon)
CREATE POLICY "service role bypass" ON users    FOR ALL USING (true);
CREATE POLICY "service role bypass" ON otps     FOR ALL USING (true);
CREATE POLICY "service role bypass" ON refresh_tokens FOR ALL USING (true);

-- Vendor Requests Table
CREATE TABLE IF NOT EXISTS vendor_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_name    TEXT NOT NULL,
  owner_mobile  TEXT NOT NULL,
  owner_email   TEXT NOT NULL,
  password      TEXT NOT NULL,
  vendor_type   TEXT NOT NULL, -- 'food', 'medicine', 'store'
  status        TEXT NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
