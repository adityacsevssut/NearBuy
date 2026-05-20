require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addPolicies() {
  try {
    // Drop existing if any
    await pool.query(`DROP POLICY IF EXISTS "Public Insert Access" ON storage.objects;`);
    await pool.query(`DROP POLICY IF EXISTS "Public Update Access" ON storage.objects;`);
    await pool.query(`DROP POLICY IF EXISTS "Public Delete Access" ON storage.objects;`);
    
    // Create new policies for the 'vendor-images' bucket
    await pool.query(`
      CREATE POLICY "Public Insert Access"
      ON storage.objects FOR INSERT
      TO public
      WITH CHECK (bucket_id = 'vendor-images');
    `);
    
    await pool.query(`
      CREATE POLICY "Public Update Access"
      ON storage.objects FOR UPDATE
      TO public
      USING (bucket_id = 'vendor-images');
    `);

    await pool.query(`
      CREATE POLICY "Public Delete Access"
      ON storage.objects FOR DELETE
      TO public
      USING (bucket_id = 'vendor-images');
    `);

    console.log("Storage policies added successfully!");
  } catch (err) {
    console.error("Error adding policies:", err);
  } finally {
    await pool.end();
  }
}

addPolicies();
