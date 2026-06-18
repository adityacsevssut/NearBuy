require("dotenv").config();
const pool = require("./config/db");

async function run() {
  try {
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS adv_payment_id VARCHAR(255);
    `);
    console.log("Migration successful: added adv_payment_id column");
  } catch (err) {
    console.error("Migration failed", err);
  } finally {
    pool.end();
  }
}

run();
