require('dotenv').config();
const pool = require('./config/db');

async function testInsert() {
  try {
    const existingRes = await pool.query("SELECT id FROM users LIMIT 1");
    const userId = existingRes.rows[0].id;
    console.log("Testing with user_id:", userId);
    
    const min_order = "";
    const final_min_order = min_order !== undefined ? parseInt(min_order) : 0;
    console.log("final_min_order:", final_min_order);

    const { rows } = await pool.query(
      `INSERT INTO vendor_profiles (
        user_id, restaurant_name, cuisine, delivery_time, min_order, 
        offer, badge, image_url, gps_address, manual_address, 
        latitude, longitude, pincode, rating, is_open, delivery_range
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        userId,
        "Test Name",
        "Test Cuisine",
        "30-45 min",
        final_min_order, // this is NaN
        "10% off",
        "New",
        "",
        "Test GPS",
        "Test Manual",
        0.0,
        0.0,
        "123456",
        4.5,
        true,
        5.0
      ]
    );
    console.log("Success:", rows[0]);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    pool.end();
  }
}

testInsert();
