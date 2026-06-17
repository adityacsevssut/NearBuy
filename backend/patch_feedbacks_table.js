const pool = require("./src/config/db");

async function run() {
  try {
    await pool.query(`ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS email TEXT`);
    console.log("Added email column to feedbacks table.");
    process.exit(0);
  } catch (err) {
    console.error("Error altering table:", err);
    process.exit(1);
  }
}

run();
