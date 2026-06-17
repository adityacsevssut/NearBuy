require('dotenv').config();
const pool = require("./config/db");

const sql = `
ALTER TABLE refund_requests 
ADD COLUMN IF NOT EXISTS upi_id TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
`;

async function run() {
  try {
    await pool.query(sql);
    console.log("refund_requests table altered successfully with upi_id and rejection_reason.");
    process.exit(0);
  } catch (err) {
    console.error("Error altering table:", err);
    process.exit(1);
  }
}

run();
