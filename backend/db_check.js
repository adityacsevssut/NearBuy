require("dotenv").config();
const pool = require("./config/db");

async function checkDb() {
  try {
    console.log("--- ORDERS ---");
    const ordersRes = await pool.query("SELECT id, user_id, vendor_id, status, created_at FROM orders;");
    console.log(ordersRes.rows);

    console.log("\n--- VENDORS (vendor_profiles) ---");
    const vendorsRes = await pool.query("SELECT user_id, restaurant_name FROM vendor_profiles;");
    console.log(vendorsRes.rows);

    console.log("\n--- USERS (roles) ---");
    const usersRes = await pool.query("SELECT id, email, first_name, last_name, role FROM users;");
    console.log(usersRes.rows);

  } catch (err) {
    console.error("Failed to query DB:", err);
  } finally {
    await pool.end();
  }
}

checkDb();
