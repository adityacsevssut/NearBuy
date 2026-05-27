const express = require("express");
const router = express.Router();
const validate = require("../middleware/validate");
const { createOrderSchema } = require("../validators/orders.validators");
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");

// POST /api/orders
// Create a new order
router.post(
  "/",
  authenticate,
  validate(createOrderSchema),
  async (req, res) => {

    const {
      vendor_id,
      items,
      subtotal,
      gst,
      platform_fee,
      total_amount,
      payment_method,
      delivery_address,
      customer_mobile,
      alternate_mobile,
      cooking_instructions
    } = req.body;

    try {
      const { rows } = await pool.query(
        `INSERT INTO orders (
          user_id, vendor_id, items, subtotal, gst, platform_fee, total_amount, payment_method, delivery_address,
          customer_mobile, alternate_mobile, cooking_instructions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [
          req.user.id,
          vendor_id,
          JSON.stringify(items),
          subtotal,
          gst,
          platform_fee,
          total_amount,
          payment_method,
          JSON.stringify(delivery_address),
          customer_mobile,
          alternate_mobile || "",
          cooking_instructions || ""
        ]
      );

      return res.status(201).json({ message: "Order placed successfully", order: rows[0] });
    } catch (err) {
      console.error("Place order error:", err);
      return res.status(500).json({ error: "Failed to place order. " + err.message });
    }
  }
);

// GET /api/orders/me
// Get my orders
router.get("/me", authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.*, v.restaurant_name, v.image_url 
       FROM orders o
       JOIN vendor_profiles v ON o.vendor_id = v.user_id
       WHERE o.user_id = $1 
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    return res.json({ orders: rows });
  } catch (err) {
    console.error("Get my orders error:", err);
    return res.status(500).json({ error: "Failed to fetch orders." });
  }
});

// GET /api/orders/:id
// Get specific order details
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.*, v.restaurant_name, v.image_url, v.gps_address, v.manual_address, v.pincode as vendor_pincode 
       FROM orders o
       JOIN vendor_profiles v ON o.vendor_id = v.user_id
       WHERE o.id = $1 AND o.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    return res.json({ order: rows[0] });
  } catch (err) {
    console.error("Get order error:", err);
    return res.status(500).json({ error: "Failed to fetch order details." });
  }
});

module.exports = router;
