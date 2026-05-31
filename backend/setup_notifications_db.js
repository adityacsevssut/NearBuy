require('dotenv').config();
const pool = require("./config/db");

async function setupNotificationsDB() {
  try {
    console.log("Creating notifications table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log("Creating index on user_id for faster queries...");
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    `);

    console.log("Notifications table setup complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error setting up notifications table:", error);
    process.exit(1);
  }
}

setupNotificationsDB();
