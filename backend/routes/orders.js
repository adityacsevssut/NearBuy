const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const router = express.Router();
const validate = require("../middleware/validate");
const { createOrderSchema } = require("../validators/orders.validators");
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");
const { sendNotification } = require("../utils/notifications");

// POST /api/orders/create-razorpay-order
router.post("/create-razorpay-order", authenticate, async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount < 1) {
      return res.status(400).json({ error: "Minimum Amount is ₹1" });
    }
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: "Razorpay keys not configured" });
    }
    const instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const order = await instance.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: "receipt_order_" + Date.now(),
    });
    res.json(order);
  } catch (error) {
    const errorMsg = error.error?.description || error.message || "Error creating Razorpay order";
    res.status(500).json({ error: errorMsg });
  }
});

// POST /api/orders/verify-payment
router.post("/verify-payment", authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing Razorpay fields" });
    }
    
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");
      
    if (expectedSignature === razorpay_signature) {
      return res.json({ success: true, message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ error: "Invalid signature" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || "Error verifying payment" });
  }
});

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

      const newOrder = rows[0];

      // Notify the customer
      sendNotification(
        req.user.id, 
        "Order Placed !!!", 
        "Your order has been placed successfully. Awaiting confirmation.",
        "order_placed"
      );

      // Notify the vendor
      sendNotification(
        vendor_id,
        "New Order !!!",
        "You have received a new order.",
        "new_order"
      );

      return res.status(201).json({ message: "Order placed successfully", order: newOrder });
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM orders WHERE user_id = $1`,
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const { rows } = await pool.query(
      `SELECT o.*, v.restaurant_name, v.image_url, v.gps_address, v.manual_address, v.pincode as vendor_pincode
       FROM orders o
       JOIN vendor_profiles v ON o.vendor_id = v.user_id
       WHERE o.user_id = $1 
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    
    return res.json({ 
      orders: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("Get my orders error:", err);
    return res.status(500).json({ error: "Failed to fetch orders." });
  }
});

// GET /api/orders/vendor
// Get orders for a specific vendor
router.get("/vendor", authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM orders WHERE vendor_id = $1`,
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const { rows } = await pool.query(
      `SELECT o.*, u.first_name, u.last_name 
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.vendor_id = $1 
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    
    return res.json({ 
      orders: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("Get vendor orders error:", err);
    return res.status(500).json({ error: "Failed to fetch vendor orders." });
  }
});

// GET /api/orders/stats
// Get order statistics for the user
router.get("/stats", authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status ILIKE 'delivered' THEN 1 END) as received_orders
       FROM orders WHERE user_id = $1`,
      [req.user.id]
    );
    return res.json({
      totalOrders: parseInt(rows[0].total_orders) || 0,
      receivedOrders: parseInt(rows[0].received_orders) || 0
    });
  } catch (err) {
    console.error("Get order stats error:", err);
    return res.status(500).json({ error: "Failed to fetch order stats." });
  }
});

// GET /api/orders/:id
// Get specific order details
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.*, v.restaurant_name, v.image_url, v.gps_address, v.manual_address, v.pincode as vendor_pincode, v.owner_number, v.delivery_boy_number
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


// PATCH /api/orders/:id/status
// Update order status by vendor
router.patch("/:id/status", authenticate, async (req, res) => {
  const { status, delivery_charge } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: "Status is required." });
  }

  try {
    let query = `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 AND vendor_id = $3 RETURNING *`;
    let values = [status, req.params.id, req.user.id];

    if (status === "Confirmed" && delivery_charge !== undefined) {
      // Also update delivery_charge and recalculate total_amount
      query = `
        UPDATE orders 
        SET status = $1, 
            delivery_charge = $4,
            total_amount = subtotal + gst + platform_fee + $4,
            updated_at = NOW() 
        WHERE id = $2 AND vendor_id = $3 
        RETURNING *
      `;
      values = [status, req.params.id, req.user.id, delivery_charge];
    }

    const { rows } = await pool.query(query, values);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Order not found or unauthorized." });
    }
    
    const updatedOrder = rows[0];

    // Notify the user about the status update
    let notifTitle = "Order Update";
    let notifMessage = `Your order status has been updated to: ${status}`;
    
    if (status.toLowerCase() === 'confirmed') {
      notifTitle = "Order Confirmed !!!";
      notifMessage = "Your order has been confirmed by the restaurant.";
    } else if (status.toLowerCase() === 'out for delivery') {
      notifTitle = "Out for Delivery !!!";
      notifMessage = "Your order is out for delivery.";
    } else if (status.toLowerCase() === 'delivered') {
      notifTitle = "Order Delivered !!!";
      notifMessage = "Your order has been delivered successfully.";
    } else if (status.toLowerCase() === 'cancelled') {
      notifTitle = "Order Cancelled !!!";
      notifMessage = "Your order has been cancelled.";
    }

    sendNotification(updatedOrder.user_id, notifTitle, notifMessage, "order_status");

    return res.json({ message: "Status updated successfully", order: updatedOrder });
  } catch (err) {
    console.error("Update order status error:", err);
    return res.status(500).json({ error: "Failed to update order status." });
  }
});

// PATCH /api/orders/:id/cancel
// Cancel order by user
router.patch("/:id/cancel", authenticate, async (req, res) => {
  try {
    // First, check the current status of the order to see if it's eligible for cancellation
    const checkQuery = `SELECT status FROM orders WHERE id = $1 AND user_id = $2`;
    const checkResult = await pool.query(checkQuery, [req.params.id, req.user.id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found or unauthorized." });
    }
    
    const currentStatus = checkResult.rows[0].status.toLowerCase();
    if (currentStatus !== "pending" && currentStatus !== "confirmed") {
      return res.status(400).json({ error: "Order cannot be cancelled at this stage." });
    }

    const { rows } = await pool.query(
      `UPDATE orders SET status = 'Cancelled', updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    
    return res.json({ message: "Order cancelled successfully", order: rows[0] });
  } catch (err) {
    console.error("Cancel order error:", err);
    return res.status(500).json({ error: "Failed to cancel order." });
  }
});

module.exports = router;
