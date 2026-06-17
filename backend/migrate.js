require('dotenv').config();
const pool = require('./config/db.js');

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
        type        TEXT NOT NULL DEFAULT 'general',
        message     TEXT NOT NULL,
        rating      INT CHECK (rating >= 1 AND rating <= 5),
        status      TEXT NOT NULL DEFAULT 'unread',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Table feedbacks created");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
