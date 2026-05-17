require('dotenv').config();
const pool = require('./config/db');

async function alterTable() {
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS location_name TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS pincode TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);
    `);
    console.log("Successfully altered users table");
  } catch (err) {
    console.error("Error altering table", err);
  } finally {
    pool.end();
  }
}

alterTable();
