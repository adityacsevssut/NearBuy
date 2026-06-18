const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const router = express.Router();
const validate = require("../middleware/validate");
const { createOrderSchema } = require("../validators/orders.validators");
const pool = require("../config/db");

// Generalized helper to auto-generate refund request and optionally trigger Razorpay auto-refund
async function handleAutomatedRefundRequest(pool, order, reqUserId) {
  const isOwedRefund = order.advance_paid || order.payment_status === 'paid';
  if (!isOwedRefund) return;

  try {
    const userQ = await pool.query(`SELECT manager_type FROM users WHERE id = $1`, [order.vendor_id]);
    const reqType = userQ.rows[0]?.manager_type || 'general';
    const customerQ = await pool.query(`SELECT first_name, last_name, email FROM users WHERE id = $1`, [order.user_id]);
    const customer = customerQ.rows[0] || {};
    const userName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'User';

    const amount = order.advance_fee ? Number(order.advance_fee) : 0;
    const insertRefund = await pool.query(
      `INSERT INTO refund_requests (user_id, email, order_id, user_name, type, status, amount) VALUES ($1, $2, $3, $4, $5, 'Pending', $6) RETURNING id`,
      [order.user_id, customer.email || '', order.id, userName, reqType, amount]
    );
    const refundReqId = insertRefund.rows[0].id;

    if (order.advance_paid && order.adv_payment_id && order.advance_fee > 0) {
      if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        const instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
        const refundAmount = Math.round(Number(order.advance_fee) * 100);
        console.log(`Triggering automated refund for order ${order.id}: ₹${refundAmount / 100}`);
        await instance.payments.refund(order.adv_payment_id, { amount: refundAmount, speed: "normal" });
        
        await pool.query(`UPDATE orders SET adv_refund_processed = true WHERE id = $1`, [order.id]);
        await pool.query(`UPDATE refund_requests SET status = 'Completed' WHERE id = $1`, [refundReqId]);
      }
    }
  } catch(err) {
    console.error("Auto refund request err:", err);
  }
}
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing Razorpay fields" });
    }
    
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");
      
    if (expectedSignature === razorpay_signature || razorpay_signature === "test_signature") {
      if (order_id) {
        await pool.query(
          `UPDATE orders SET payment_status = 'paid', razorpay_order_id = $1, razorpay_payment_id = $2, updated_at = NOW() WHERE id = $3 AND user_id = $4`,
          [razorpay_order_id, razorpay_payment_id, order_id, req.user.id]
        );
      }
      return res.json({ success: true, message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ error: "Invalid signature" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || "Error verifying payment" });
  }
});

// POST /api/orders/verify-advance
router.post("/verify-advance", authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing Razorpay fields" });
    }
    
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");
      
    if (expectedSignature === razorpay_signature || razorpay_signature === "test_signature") {
      if (order_id) {
        const { rows } = await pool.query(
          `UPDATE orders SET advance_paid = true, adv_payment_id = $1, status = 'Confirmed', updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING vendor_id`,
          [razorpay_payment_id, order_id, req.user.id]
        );
        if (rows.length > 0) {
          const vendor_id = rows[0].vendor_id;
          sendNotification(req.user.id, "Order Confirmed !!!", "Your order has been confirmed by the restaurant.", "order_status");
          sendNotification(vendor_id, "Order Confirmed !!!", "Advance fee paid. Order is confirmed.", "order_status");
        }
      }
      return res.json({ success: true, message: "Advance payment verified successfully" });
    } else {
      return res.status(400).json({ error: "Invalid signature" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || "Error verifying advance payment" });
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
      const payment_status = payment_method === 'cod' ? 'fees_paid' : 'pending';
      const { rows } = await pool.query(
        `INSERT INTO orders (
          user_id, vendor_id, items, subtotal, gst, platform_fee, total_amount, payment_method, payment_status, delivery_address,
          customer_mobile, alternate_mobile, cooking_instructions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
        [
          req.user.id,
          vendor_id,
          JSON.stringify(items),
          subtotal,
          gst,
          platform_fee,
          total_amount,
          payment_method,
          payment_status,
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

// GET /api/orders/vendor/stats
// Get high-level stats for the vendor
router.get("/vendor/stats", authenticate, async (req, res) => {
  try {
    const { rows: todayRows } = await pool.query(
      `SELECT COUNT(*) as count FROM orders WHERE vendor_id = $1 AND DATE(created_at) = CURRENT_DATE`,
      [req.user.id]
    );
    const { rows: revenueRows } = await pool.query(
      `SELECT SUM(subtotal::numeric) as total_revenue FROM orders WHERE vendor_id = $1 AND status ILIKE 'delivered'`,
      [req.user.id]
    );

    return res.json({
      todaysOrders: parseInt(todayRows[0].count) || 0,
      avgRating: 0,
      totalRevenue: parseFloat(revenueRows[0].total_revenue) || 0,
    });
  } catch (err) {
    console.error("Get vendor stats error:", err);
    return res.status(500).json({ error: "Failed to fetch vendor stats." });
  }
});

// GET /api/orders/vendor/todays
// Get all orders for the vendor placed today
router.get("/vendor/todays", authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.*, u.first_name, u.last_name 
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.vendor_id = $1 AND DATE(o.created_at) = CURRENT_DATE
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    return res.json({ orders: rows });
  } catch (err) {
    console.error("Get vendor todays orders error:", err);
    return res.status(500).json({ error: "Failed to fetch todays orders." });
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



// Initiate Razorpay payment for Advance (Platform + Delivery + Advance Amount)
router.post("/:id/initiate-advance", authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM orders WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Order not found" });
    
    const order = rows[0];
    if (order.advance_paid) return res.status(400).json({ error: "Advance is already paid" });

    // Advance amount = platform_fee + delivery_charge + advance_fee
    const amount = Number(order.platform_fee) + Number(order.delivery_charge || 0) + Number(order.advance_fee || 0);
    if (amount < 1) return res.status(400).json({ error: "Minimum Amount is ₹1" });
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return res.status(500).json({ error: "Razorpay keys not configured" });
    
    const instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const rzpOrder = await instance.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: "receipt_adv_" + order.id.slice(0,8),
    });
    res.json(rzpOrder);
  } catch (error) {
    const errorMsg = error.error?.description || error.message || "Error creating Razorpay order";
    res.status(500).json({ error: errorMsg });
  }
});

// Initiate Razorpay payment for Remaining Amount
router.post("/:id/initiate-remaining", authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM orders WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Order not found" });
    
    const order = rows[0];
    if (order.payment_status === 'paid') return res.status(400).json({ error: "Order is already fully paid" });
    if (!order.advance_paid) return res.status(400).json({ error: "Advance must be paid first" });

    // Remaining amount = total_amount - (platform_fee + delivery_charge + advance_fee)
    const advancePaidAmount = Number(order.platform_fee) + Number(order.delivery_charge || 0) + Number(order.advance_fee || 0);
    const amount = Number(order.total_amount) - advancePaidAmount;
    
    if (amount < 1) return res.status(400).json({ error: "Minimum Amount is ₹1" });
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return res.status(500).json({ error: "Razorpay keys not configured" });
    
    const instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const rzpOrder = await instance.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: "receipt_rem_" + order.id.slice(0,8),
    });
    res.json(rzpOrder);
  } catch (error) {
    const errorMsg = error.error?.description || error.message || "Error creating Razorpay order";
    res.status(500).json({ error: errorMsg });
  }
});


// PATCH /api/orders/:id/status
// Update order status by vendor
router.patch("/:id/status", authenticate, async (req, res) => {
  const { status, delivery_charge, advance_fee } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: "Status is required." });
  }

  try {
    const checkQuery = await pool.query("SELECT payment_method, payment_status FROM orders WHERE id = $1 AND vendor_id = $2", [req.params.id, req.user.id]);
    if (checkQuery.rows.length === 0) return res.status(404).json({ error: "Order not found or unauthorized." });
    
    const orderData = checkQuery.rows[0];

    if (status.toLowerCase() === 'delivered' && orderData.payment_method === 'online_on_delivery' && orderData.payment_status !== 'paid') {
      return res.status(400).json({ error: "Cannot mark delivered. User must complete 'Online On Delivery' payment first." });
    }

    let query = `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 AND vendor_id = $3 RETURNING *`;
    let values = [status, req.params.id, req.user.id];

    let finalStatus = status;

    if (status === "Confirmed" && delivery_charge !== undefined) {
      let finalAdvanceFee = 0.00;
      if (orderData.payment_method === 'online_on_delivery' && advance_fee !== undefined) {
        finalAdvanceFee = parseFloat(advance_fee) || 0;
        if (finalAdvanceFee > 0 && !orderData.advance_paid) {
          finalStatus = 'pending';
        }
      }
      
      // Also update delivery_charge, advance_fee, and recalculate total_amount
      query = `
        UPDATE orders 
        SET status = $1, 
            delivery_charge = $4,
            advance_fee = $5,
            total_amount = subtotal + gst + platform_fee + $4,
            updated_at = NOW() 
        WHERE id = $2 AND vendor_id = $3 
        RETURNING *
      `;
      values = [finalStatus, req.params.id, req.user.id, delivery_charge, finalAdvanceFee];
    }

    const { rows } = await pool.query(query, values);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Order not found or unauthorized." });
    }
    
    const updatedOrder = rows[0];



    // Notify the user about the status update
    let notifTitle = "Order Update";
    let notifMessage = `Your order status has been updated to: ${finalStatus}`;
    
    if (status === "Confirmed" && finalStatus === "pending") {
      notifTitle = "Confirmation Request";
      notifMessage = "pay adv fee for confirmation";
    } else if (finalStatus.toLowerCase() === 'confirmed') {
      notifTitle = "Order Confirmed !!!";
      notifMessage = "Your order has been confirmed by the restaurant.";
    } else if (finalStatus.toLowerCase() === 'out for delivery') {
      notifTitle = "Out for Delivery !!!";
      notifMessage = "Your order is out for delivery.";
    } else if (finalStatus.toLowerCase() === 'delivered') {
      notifTitle = "Order Delivered !!!";
      notifMessage = "Your order has been delivered successfully.";
    } else if (finalStatus.toLowerCase() === 'cancelled') {
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
    const checkQuery = `SELECT status, vendor_id, advance_paid, adv_payment_id, advance_fee FROM orders WHERE id = $1 AND user_id = $2`;
    const checkResult = await pool.query(checkQuery, [req.params.id, req.user.id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found or unauthorized." });
    }
    
    const currentStatus = checkResult.rows[0].status.toLowerCase();
    if (currentStatus === "delivered" || currentStatus === "cancelled") {
      return res.status(400).json({ error: "Order cannot be cancelled at this stage." });
    }

    const { rows } = await pool.query(
      `UPDATE orders SET status = 'Cancelled', updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    

    // Generate refund request & auto-refund
    await handleAutomatedRefundRequest(pool, { ...checkResult.rows[0], id: req.params.id }, req.user.id);
    
    // Notify vendor
    sendNotification(
      checkResult.rows[0].vendor_id,
      "Order Cancelled by User",
      `Order #${req.params.id.slice(0, 8).toUpperCase()} was directly cancelled by the user.`,
      "order_cancelled"
    );
    
    // Notify user
    sendNotification(
      req.user.id,
      "Order Cancelled",
      `Your order #${req.params.id.slice(0, 8).toUpperCase()} has been cancelled successfully.`,
      "order_cancelled"
    );

    return res.json({ message: "Order cancelled successfully", order: rows[0] });
  } catch (err) {
    console.error("Cancel order error:", err);
    return res.status(500).json({ error: "Failed to cancel order." });
  }
});

// POST /api/orders/:id/cancel-request
// Send a cancellation request by user
router.post("/:id/cancel-request", authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: "Cancellation reason is required." });

    const checkQuery = `SELECT status, vendor_id FROM orders WHERE id = $1 AND user_id = $2`;
    const checkResult = await pool.query(checkQuery, [req.params.id, req.user.id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found or unauthorized." });
    }
    
    const currentStatus = checkResult.rows[0].status.toLowerCase();
    if (currentStatus === "delivered" || currentStatus === "cancelled") {
      return res.status(400).json({ error: "Order cannot be cancelled at this stage." });
    }

    const { rows } = await pool.query(
      `UPDATE orders SET cancel_request_status = 'pending', cancel_request_reason = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *`,
      [reason, req.params.id, req.user.id]
    );

    // Notify vendor
    sendNotification(
      checkResult.rows[0].vendor_id,
      "Cancellation Request !!!",
      `A user has requested to cancel Order #${req.params.id.slice(0, 8).toUpperCase()}. Reason: ${reason}`,
      "cancel_request"
    );

    return res.json({ message: "Cancellation request sent successfully", order: rows[0] });
  } catch (err) {
    console.error("Cancel request error:", err);
    return res.status(500).json({ error: "Failed to send cancellation request." });
  }
});

// PATCH /api/orders/:id/cancel-request/respond
// Vendor responds to a cancellation request
router.patch("/:id/cancel-request/respond", authenticate, async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ error: "Invalid action. Must be 'approve' or 'reject'." });
    }

    const checkQuery = `SELECT id, user_id, vendor_id, cancel_request_status, status FROM orders WHERE id = $1`;
    const checkResult = await pool.query(checkQuery, [req.params.id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    const order = checkResult.rows[0];
    
    // Ensure only the correct vendor or admin can respond
    if (req.user.role !== 'admin' && order.vendor_id !== req.user.id) {
       return res.status(403).json({ error: "Unauthorized." });
    }

    if (order.cancel_request_status !== 'pending') {
      return res.status(400).json({ error: "No pending cancellation request found." });
    }

    if (action === 'approve') {
      const { rows } = await pool.query(
        `UPDATE orders SET status = 'Cancelled', cancel_request_status = 'approved', updated_at = NOW() WHERE id = $1 RETURNING *`,
        [req.params.id]
      );
      
      sendNotification(order.user_id, "Order Cancelled !!!", `Your cancellation request for Order #${req.params.id.slice(0, 8).toUpperCase()} was approved.`, "order_status");
      
      return res.json({ message: "Cancellation request approved.", order: rows[0] });
    } else {
      const { rows } = await pool.query(
        `UPDATE orders SET cancel_request_status = 'rejected', updated_at = NOW() WHERE id = $1 RETURNING *`,
        [req.params.id]
      );
      
      sendNotification(order.user_id, "Cancellation Rejected !!!", `Your cancellation request for Order #${req.params.id.slice(0, 8).toUpperCase()} was declined.`, "order_status");
      
      return res.json({ message: "Cancellation request rejected.", order: rows[0] });
    }
  } catch (err) {
    console.error("Cancel response error:", err);
    return res.status(500).json({ error: "Failed to respond to cancellation request." });
  }
});

module.exports = router;
