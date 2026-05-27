require("dotenv").config();
const pool = require("./config/db");

async function migrate() {
  try {
    console.log("Adding delivery_charge to orders...");
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_charge DECIMAL(10,2) DEFAULT 0.00;");
    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    pool.end();
  }
}

migrate();
