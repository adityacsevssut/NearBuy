/**
 * add_vendor_profiles.js
 * Run once: node add_vendor_profiles.js
 * Adds the vendor_profiles table to the database.
 */

require("dotenv").config();
const pool = require("./config/db");

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendor_profiles (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        restaurant_name  TEXT NOT NULL DEFAULT '',
        cuisine          TEXT DEFAULT '',          -- e.g. "North Indian, Biryani, Thali"
        delivery_time    TEXT DEFAULT '30-45 min',
        min_order        INTEGER DEFAULT 0,
        offer            TEXT DEFAULT '',          -- e.g. "50% off up to ₹80"
        badge            TEXT DEFAULT '',          -- "Bestseller", "New", "Top Rated", "Late Night"
        image_url        TEXT DEFAULT '',
        gps_address      TEXT DEFAULT '',          -- auto-fetched via GPS
        manual_address   TEXT DEFAULT '',          -- typed by vendor
        latitude         DECIMAL(10, 7),
        longitude        DECIMAL(10, 7),
        pincode          TEXT DEFAULT '',
        rating           DECIMAL(3,1) DEFAULT 0.0,
        is_active        BOOLEAN DEFAULT TRUE,
        created_at       TIMESTAMPTZ DEFAULT NOW(),
        updated_at       TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user
        ON vendor_profiles(user_id);

      CREATE OR REPLACE FUNCTION update_vendor_profiles_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS set_vendor_profiles_updated_at ON vendor_profiles;
      CREATE TRIGGER set_vendor_profiles_updated_at
        BEFORE UPDATE ON vendor_profiles
        FOR EACH ROW EXECUTE FUNCTION update_vendor_profiles_updated_at();

      ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;
      DO $$ BEGIN
        CREATE POLICY "service role bypass" ON vendor_profiles FOR ALL USING (true);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    console.log("✅  vendor_profiles table created successfully!");
  } catch (err) {
    console.error("❌  Migration failed:", err.message);
  } finally {
    await pool.end();
  }
}

migrate();
