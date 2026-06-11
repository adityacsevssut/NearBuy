require("dotenv").config();
const pool = require("./config/db");

async function setupCartDb() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS user_carts (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        items JSONB DEFAULT '[]',
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await pool.query(query);
    console.log("Successfully created user_carts table.");
  } catch (err) {
    console.error("Failed to create user_carts table:", err);
  } finally {
    pool.end();
  }
}

setupCartDb();
