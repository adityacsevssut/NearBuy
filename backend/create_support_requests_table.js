require('dotenv').config();
const pool = require("./config/db");

const sql = `
CREATE TABLE IF NOT EXISTS support_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email TEXT,
    issue TEXT NOT NULL,
    contact_method VARCHAR(20) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function run() {
  try {
    await pool.query(sql);
    console.log("support_requests table created successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error creating table:", err);
    process.exit(1);
  }
}

run();
