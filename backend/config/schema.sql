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
  manager_type  TEXT,                          -- 'food' | 'store' (only for managers)
  request_type  TEXT,                          -- 'vendor' | 'student'
  college_name  TEXT,
  location_name TEXT,
  pincode       TEXT,
  latitude      DECIMAL(10, 7),
  longitude     DECIMAL(10, 7),
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
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
  vendor_type   TEXT NOT NULL, -- 'food', 'store'
  request_type  TEXT NOT NULL DEFAULT 'vendor', -- 'vendor', 'student'
  college_name  TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Saved Addresses Table
CREATE TABLE IF NOT EXISTS user_saved_addresses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  full_address TEXT,
  pincode      TEXT,
  landmark     TEXT,
  latitude     DECIMAL(10, 7),
  longitude    DECIMAL(10, 7),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_saved_addresses_user ON user_saved_addresses(user_id);
CREATE POLICY "service role bypass" ON user_saved_addresses FOR ALL USING (true);
ALTER TABLE user_saved_addresses ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- PERFORMANCE OPTIMIZATION INDEXES
-- -----------------------------------------------------------------------------
-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_active ON vendor_profiles(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_vendor_menu_available ON vendor_menu_items(is_available) WHERE is_available = TRUE;

-- Indexes for foreign keys to speed up JOINs and lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_users_active_role ON users(is_active, role);

-- Feedbacks Table
CREATE TABLE IF NOT EXISTS feedbacks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  type        TEXT NOT NULL DEFAULT 'general',
  message     TEXT NOT NULL,
  rating      INT CHECK (rating >= 1 AND rating <= 5),
  status      TEXT NOT NULL DEFAULT 'unread',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
