require('dotenv').config();
const pool = require('./config/db');

async function run() {
  try {
    await pool.query('ALTER TABLE homepage_posters ADD COLUMN IF NOT EXISTS dark_image_url TEXT');
    console.log('Added dark_image_url column successfully!');
  } catch (error) {
    console.error('Error adding column:', error);
  } finally {
    process.exit(0);
  }
}

run();
