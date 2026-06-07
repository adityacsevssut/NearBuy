require('dotenv').config();
const pool = require('./config/db');

async function updateDb() {
  try {
    console.log('Altering orders table...');
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'Pending';
    `);
    console.log('Successfully updated orders table.');
    process.exit(0);
  } catch (err) {
    console.error('Error updating DB:', err);
    process.exit(1);
  }
}

updateDb();
