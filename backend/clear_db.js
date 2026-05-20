require("dotenv").config();
const pool = require("./config/db");

async function clear() {
  console.log("Starting database truncation to clear all dummy data...");
  try {
    // Truncate tables with CASCADE to handle foreign key references smoothly
    await pool.query("TRUNCATE TABLE refresh_tokens CASCADE");
    await pool.query("TRUNCATE TABLE otps CASCADE");
    await pool.query("TRUNCATE TABLE vendor_profiles CASCADE");
    await pool.query("TRUNCATE TABLE vendor_requests CASCADE");
    await pool.query("TRUNCATE TABLE service_centers CASCADE");
    await pool.query("TRUNCATE TABLE users CASCADE");
    
    console.log("✅ Database cleared successfully! All users, profiles, requests, service centers, and tokens have been removed.");
  } catch (err) {
    console.error("❌ Failed to clear database:", err.message);
  } finally {
    await pool.end();
  }
}

clear();
