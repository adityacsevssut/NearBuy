require("dotenv").config();
const pool = require("./config/db");

async function run() {
  try {
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS advance_fee DECIMAL(10,2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS advance_paid BOOLEAN DEFAULT false;
    `);
    console.log("Migration successful: added advance payment columns");
  } catch (err) {
    console.error("Migration failed", err);
  } finally {
    pool.end();
  }
}

run();
