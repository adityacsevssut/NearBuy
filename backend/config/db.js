const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: (process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === "production") || (process.env.DATABASE_URL && process.env.DATABASE_URL.includes("supabase.co")) ? { rejectUnauthorized: false } : false,
  max: 20,                // max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
});

module.exports = pool;
