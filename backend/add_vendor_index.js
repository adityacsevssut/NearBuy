require("dotenv").config();
const pool = require("./config/db");async function addIndexes() {
  try {
    console.log("Adding database indexes for vendors query optimization...");
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_vendor_profiles_is_active ON vendor_profiles(is_active);
      CREATE INDEX IF NOT EXISTS idx_users_role_is_active ON users(role, is_active);
      CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON vendor_profiles(user_id);
    `);
    console.log("Indexes created successfully!");
  } catch (err) {
    console.error("Error creating indexes:", err);
  } finally {
    process.exit(0);
  }
}

addIndexes();
