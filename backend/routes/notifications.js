const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");

// GET /api/notifications
// Fetch user's notifications
router.get("/", authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    return res.json({ notifications: rows });
  } catch (err) {
    console.error("Get notifications error:", err);
    return res.status(500).json({ error: "Failed to fetch notifications." });
  }
});

// PATCH /api/notifications/:id/read
// Mark a notification as read
router.patch("/:id/read", authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }
    return res.json({ notification: rows[0] });
  } catch (err) {
    console.error("Update notification error:", err);
    return res.status(500).json({ error: "Failed to update notification." });
  }
});

// PATCH /api/notifications/read-all
// Mark all as read
router.patch("/read-all", authenticate, async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );
    return res.json({ message: "All notifications marked as read." });
  } catch (err) {
    console.error("Mark all read error:", err);
    return res.status(500).json({ error: "Failed to update notifications." });
  }
});

// DELETE /api/notifications/:id
// Delete a specific notification
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Notification not found or unauthorized" });
    }
    return res.json({ message: "Notification deleted successfully" });
  } catch (err) {
    console.error("Delete notification error:", err);
    return res.status(500).json({ error: "Failed to delete notification." });
  }
});

// POST /api/notifications/fcm-token
// Save FCM device token for push notifications
router.post("/fcm-token", authenticate, async (req, res) => {
  try {
    const { token, device_type = 'web' } = req.body;
    if (!token || typeof token !== 'string' || token.length > 500) {
      return res.status(400).json({ error: "Invalid FCM token." });
    }
    const allowedDeviceTypes = ['web', 'android', 'ios'];
    if (!allowedDeviceTypes.includes(device_type)) {
      return res.status(400).json({ error: "Invalid device_type. Must be web, android, or ios." });
    }

    await pool.query(
      `INSERT INTO fcm_tokens (user_id, token, device_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id, updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, token, device_type]
    );
    
    return res.json({ message: "Token registered successfully" });
  } catch (err) {
    console.error("Save FCM token error:", err);
    return res.status(500).json({ error: "Failed to save token" });
  }
});

module.exports = router;
