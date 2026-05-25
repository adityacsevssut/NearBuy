require('dotenv').config();
const pool = require('./config/db');

async function alterTable() {
  try {
    await pool.query(`
      ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;
      ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS delivery_range DECIMAL(5, 2) DEFAULT 5.0;
    `);
    console.log("Successfully altered vendor_profiles table");
  } catch (err) {
    console.error("Error altering table", err);
  } finally {
    pool.end();
  }
}

alterTable();
