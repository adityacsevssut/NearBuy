require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection setup (PostgreSQL)
// This will require a .env file with DATABASE_URL or individual PG variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Basic test route
app.get("/", (req, res) => {
  res.send("NearBuy Backend is running!");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
