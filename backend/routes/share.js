const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Initialize table
pool.query(`
  CREATE TABLE IF NOT EXISTS shared_links (
    id VARCHAR(15) PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    extra_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.error("Error creating shared_links table:", err));

// Generate a random alphanumeric string
function generateShortId(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// POST /api/share
// Creates a new shared link
router.post("/", async (req, res) => {
  const { type, target_id, extra_data } = req.body;

  if (!type || !target_id) {
    return res.status(400).json({ error: "type and target_id are required." });
  }

  try {
    const shortId = generateShortId(8);
    await pool.query(
      `INSERT INTO shared_links (id, type, target_id, extra_data) VALUES ($1, $2, $3, $4)`,
      [shortId, type, String(target_id), extra_data ? JSON.stringify(extra_data) : null]
    );

    return res.json({ id: shortId });
  } catch (err) {
    console.error("Create share link error:", err);
    return res.status(500).json({ error: "Failed to create share link." });
  }
});

// GET /api/share/:id
// Gets the target for a shared link
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM shared_links WHERE id = $1`, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Link not found." });
    }

    return res.json({ data: rows[0] });
  } catch (err) {
    console.error("Get share link error:", err);
    return res.status(500).json({ error: "Failed to get share link." });
  }
});

module.exports = router;
