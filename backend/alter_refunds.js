require('dotenv').config();
const pool = require("./config/db");

async function run() {
  try {
    await pool.query(`ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2) DEFAULT 0;`);
    console.log("Added amount column to refund_requests");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
