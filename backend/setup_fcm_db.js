require("dotenv").config();
const pool = require("./config/db");

async function setup() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fcm_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        device_type VARCHAR(50) DEFAULT 'web',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Create an index to quickly lookup tokens by user_id
      CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);
    `);
    console.log("fcm_tokens table created successfully!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

setup();
