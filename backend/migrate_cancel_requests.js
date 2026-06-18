require("dotenv").config();
const pool = require("./config/db");

async function run() {
  try {
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS cancel_request_status VARCHAR(20) DEFAULT 'none',
      ADD COLUMN IF NOT EXISTS cancel_request_reason TEXT DEFAULT NULL;
    `);
    console.log("Migration successful: added cancel request columns");
  } catch (err) {
    console.error("Migration failed", err);
  } finally {
    pool.end();
  }
}

run();
