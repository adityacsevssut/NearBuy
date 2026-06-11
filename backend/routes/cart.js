const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");

// GET /api/cart
// Get the user's current cart
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query("SELECT items FROM user_carts WHERE user_id = $1", [userId]);
    
    if (result.rows.length === 0) {
      return res.json({ items: [] });
    }
    
    return res.json({ items: result.rows[0].items || [] });
  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// PUT /api/cart
// Replace the entire user's cart items
router.put("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body;
    
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "items must be an array" });
    }

    const query = `
      INSERT INTO user_carts (user_id, items, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET items = EXCLUDED.items, updated_at = NOW()
      RETURNING items;
    `;
    const result = await pool.query(query, [userId, JSON.stringify(items)]);
    res.json({ success: true, items: result.rows[0].items });
  } catch (err) {
    console.error("Error updating cart:", err);
    res.status(500).json({ error: "Failed to update cart" });
  }
});

// DELETE /api/cart
// Clear the user's cart
router.delete("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    // We can either delete the row or update items to '[]'. Updating is cleaner for history.
    const query = `
      UPDATE user_carts 
      SET items = '[]', updated_at = NOW() 
      WHERE user_id = $1 
      RETURNING items;
    `;
    const result = await pool.query(query, [userId]);
    // If no row exists, we return success anyway.
    res.json({ success: true, items: result.rows.length > 0 ? result.rows[0].items : [] });
  } catch (err) {
    console.error("Error clearing cart:", err);
    res.status(500).json({ error: "Failed to clear cart" });
  }
});

module.exports = router;
