require('dotenv').config();
const pool = require('./config/db');

async function run() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS homepage_carousel_posters (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        image_url TEXT,
        dark_image_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_homepage_carousel_posters_type 
      ON homepage_carousel_posters (type, created_at ASC);
    `;
    await pool.query(query);
    console.log('Created homepage_carousel_posters table successfully!');
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    process.exit(0);
  }
}

run();
