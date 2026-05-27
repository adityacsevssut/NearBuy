require('dotenv').config();
const pool = require('./config/db');

async function updateSchema() {
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS landmark TEXT;`);
    console.log("Added landmark to users table.");

    await pool.query(`ALTER TABLE user_saved_addresses ADD COLUMN IF NOT EXISTS landmark TEXT;`);
    console.log("Added landmark to user_saved_addresses table.");

    await pool.query(`ALTER TABLE service_centers ADD COLUMN IF NOT EXISTS landmark TEXT;`);
    console.log("Added landmark to service_centers table.");

    await pool.query(`ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS landmark TEXT;`);
    console.log("Added landmark to vendor_profiles table.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    process.exit(0);
  }
}

updateSchema();
