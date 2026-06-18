require('dotenv').config();
const pool = require('./config/db');

async function run() {
  try {
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS adv_refund_processed BOOLEAN DEFAULT false;');
    console.log("Column adv_refund_processed added");
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
