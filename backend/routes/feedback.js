const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");

// ── Auto-create vendor_feedbacks table ───────────────────────────────────────
async function ensureFeedbackTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendor_feedbacks (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vendor_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_name   TEXT NOT NULL DEFAULT 'Anonymous',
      message     TEXT NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_vendor_feedbacks_vendor ON vendor_feedbacks(vendor_id);
    CREATE INDEX IF NOT EXISTS idx_vendor_feedbacks_created ON vendor_feedbacks(vendor_id, created_at DESC);
  `);
}

ensureFeedbackTable().catch(console.error);

// ── POST /api/feedback  →  user submits feedback for a vendor ────────────────
router.post("/", authenticate, async (req, res) => {
  try {
    const { vendor_id, message } = req.body;

    if (!vendor_id || typeof vendor_id !== "string") {
      return res.status(400).json({ error: "vendor_id is required." });
    }
    if (!message || typeof message !== "string" || message.trim().length < 3) {
      return res.status(400).json({ error: "Feedback message must be at least 3 characters." });
    }
    if (message.trim().length > 1000) {
      return res.status(400).json({ error: "Feedback message must be under 1000 characters." });
    }

    // Resolve display name
    const userQ = await pool.query(
      `SELECT first_name, last_name FROM users WHERE id = $1`,
      [req.user.id]
    );
    const u = userQ.rows[0] || {};
    const userName = `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Anonymous";

    const { rows } = await pool.query(
      `INSERT INTO vendor_feedbacks (vendor_id, user_id, user_name, message)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [vendor_id, req.user.id, userName, message.trim()]
    );

    return res.status(201).json({ feedback: rows[0] });
  } catch (err) {
    console.error("POST /api/feedback error:", err);
    return res.status(500).json({ error: "Failed to submit feedback." });
  }
});

// ── GET /api/feedback/vendor  →  vendor reads their own feedbacks ─────────────
router.get("/vendor", authenticate, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM vendor_feedbacks WHERE vendor_id = $1`,
      [req.user.id]
    );
    const total = parseInt(countRes.rows[0].count);

    const { rows } = await pool.query(
      `SELECT id, user_name, message, created_at
       FROM vendor_feedbacks
       WHERE vendor_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    return res.json({
      feedbacks: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/feedback/vendor error:", err);
    return res.status(500).json({ error: "Failed to fetch feedbacks." });
  }
});

module.exports = router;
