require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  try {
    console.log("Adding contact number columns to vendor_profiles...");
    await pool.query(`
      ALTER TABLE vendor_profiles 
      ADD COLUMN IF NOT EXISTS owner_number VARCHAR(20),
      ADD COLUMN IF NOT EXISTS delivery_boy_number VARCHAR(20)
    `);
    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

runMigration();
