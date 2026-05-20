require("dotenv").config();
const pool = require("./config/db");
async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_centers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        pincode VARCHAR(20) NOT NULL,
        latitude DECIMAL(10,8) NOT NULL,
        longitude DECIMAL(11,8) NOT NULL,
        radius_km DECIMAL(5,2) DEFAULT 8.0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Table service_centers created successfully");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
run();
