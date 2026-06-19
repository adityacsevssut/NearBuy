require('dotenv').config();
const pool = require("./config/db");

const sql = `
ALTER TABLE refund_requests 
ADD COLUMN IF NOT EXISTS payment_id TEXT;
`;

async function run() {
  try {
    await pool.query(sql);
    console.log("refund_requests table altered successfully with payment_id.");
    process.exit(0);
  } catch (err) {
    console.error("Error altering table:", err);
    process.exit(1);
  }
}

run();
