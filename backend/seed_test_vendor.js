/**
 * seed_test_vendor.js
 * Run once: node seed_test_vendor.js
 * Creates a dummy food vendor account for testing the Vendor Dashboard.
 *
 *   Email    : vendor.food@nearbuy.test
 *   Password : vendor123
 *   Type     : food
 */

require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool   = require("./config/db");

async function seed() {
  const email    = "vendor.food@nearbuy.test";
  const password = "vendor123";
  const hash     = await bcrypt.hash(password, 10);

  try {
    // Remove existing test vendor (idempotent)
    await pool.query("DELETE FROM users WHERE email = $1", [email]);

    const { rows } = await pool.query(
      `INSERT INTO users
         (first_name, last_name, email, password_hash, role, manager_type, is_verified, is_active)
       VALUES ($1, $2, $3, $4, 'vendor', 'food', TRUE, TRUE)
       RETURNING id, email, role, manager_type`,
      ["Sharma", "Dhaba", email, hash]   // first_name = owner, last_name = shop name
    );

    console.log("\n✅  Test food vendor created successfully!\n");
    console.log("  ┌─────────────────────────────────────────┐");
    console.log("  │  Email    : vendor.food@nearbuy.test    │");
    console.log("  │  Password : vendor123                   │");
    console.log("  │  Type     : food                        │");
    console.log("  │  Name     : Sharma Dhaba                │");
    console.log("  └─────────────────────────────────────────┘\n");
    console.log("  → Open the app, click Login → Vendor Login → food");
    console.log("  → Use the credentials above\n");

    console.log("  DB row:", rows[0]);
  } catch (err) {
    console.error("❌  Seed failed:", err.message);
  } finally {
    await pool.end();
  }
}

seed();
