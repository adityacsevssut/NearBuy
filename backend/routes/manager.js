const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const validate = require("../middleware/validate");
const { createManagerSchema, updateManagerSchema, createVendorAccountSchema, editVendorAccountSchema } = require("../validators/manager.validators");
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");

const DEV_EMAIL = "nahakaditya344@gmail.com";

// Middleware: only allow the developer
function devOnly(req, res, next) {
  if (!req.user || req.user.email !== DEV_EMAIL) {
    return res.status(403).json({ error: "Access denied. Developer only." });
  }
  next();
}

// ════════════════════════════════════════════════════════════════════
// GET /api/managers  — list all managers
// ════════════════════════════════════════════════════════════════════
router.get("/", authenticate, devOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, first_name, last_name, email, mobile, role, manager_type, is_active, created_at
       FROM users
       WHERE role IN ('manager','admin') AND email != $1
       ORDER BY created_at DESC`,
      [DEV_EMAIL]
    );
    return res.json({ managers: rows });
  } catch (err) {
    console.error("list managers error:", err);
    return res.status(500).json({ error: "Failed to fetch managers." });
  }
});

// ════════════════════════════════════════════════════════════════════
// POST /api/managers  — create a new manager
// ════════════════════════════════════════════════════════════════════
router.post(
  "/",
  authenticate,
  devOnly,
  validate(createManagerSchema),
  async (req, res) => {
    const { email, password, managerType } = req.body;
    try {
      // Check if email already exists
      const existing = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
      if (existing.rows.length) {
        return res.status(409).json({ error: "A user with this email already exists." });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const { rows } = await pool.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, role, manager_type, is_verified, is_active)
         VALUES ('Manager', $2, $1, $3, 'manager', $4, TRUE, TRUE)
         RETURNING id, first_name, last_name, email, role, manager_type, is_active, created_at`,
        [email, managerType.charAt(0).toUpperCase() + managerType.slice(1), passwordHash, managerType]
      );

      return res.status(201).json({ message: "Manager created successfully.", manager: rows[0] });
    } catch (err) {
      console.error("create manager error:", err);
      return res.status(500).json({ error: "Failed to create manager." });
    }
  }
);

// ════════════════════════════════════════════════════════════════════
// PATCH /api/managers/:id  — update manager (email, password, type)
// ════════════════════════════════════════════════════════════════════
router.patch(
  "/:id",
  authenticate,
  devOnly,
  validate(updateManagerSchema),
  async (req, res) => {
    const { id } = req.params;
    const { email, password, managerType } = req.body;

    try {
      // Fetch the manager first
      const existing = await pool.query("SELECT * FROM users WHERE id=$1 AND role='manager'", [id]);
      if (!existing.rows.length) return res.status(404).json({ error: "Manager not found." });

      const updates = [];
      const values = [];
      let idx = 1;

      if (email) { updates.push(`email=$${idx++}`); values.push(email); }
      if (password) { updates.push(`password_hash=$${idx++}`); values.push(await bcrypt.hash(password, 10)); }
      if (managerType) {
        updates.push(`manager_type=$${idx++}`);
        updates.push(`last_name=$${idx++}`);
        values.push(managerType);
        values.push(managerType.charAt(0).toUpperCase() + managerType.slice(1));
      }

      if (!updates.length) return res.status(400).json({ error: "No fields to update." });

      values.push(id);
      const { rows } = await pool.query(
        `UPDATE users SET ${updates.join(", ")}, updated_at=NOW() WHERE id=$${idx}
         RETURNING id, first_name, last_name, email, role, manager_type, is_active, created_at`,
        values
      );

      return res.json({ message: "Manager updated.", manager: rows[0] });
    } catch (err) {
      console.error("update manager error:", err);
      return res.status(500).json({ error: "Failed to update manager." });
    }
  }
);

// ════════════════════════════════════════════════════════════════════
// DELETE /api/managers/:id  — delete a manager
// ════════════════════════════════════════════════════════════════════
router.delete("/:id", authenticate, devOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM users WHERE id=$1 AND role='manager' RETURNING id",
      [id]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Manager not found." });
    return res.json({ message: "Manager deleted." });
  } catch (err) {
    console.error("delete manager error:", err);
    return res.status(500).json({ error: "Failed to delete manager." });
  }
});

// ════════════════════════════════════════════════════════════════════
// GET /api/managers/vendors  — list vendors under this manager's type
// ════════════════════════════════════════════════════════════════════
router.get("/vendors", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }
    const mType = (req.user.manager_type || "").toLowerCase();
    let query, params;
    if (req.user.role === "admin") {
      query = `SELECT id, first_name, last_name, email, mobile, manager_type, is_active, created_at
               FROM users WHERE role='vendor' ORDER BY created_at DESC`;
      params = [];
    } else {
      query = `SELECT id, first_name, last_name, email, mobile, manager_type, is_active, created_at
               FROM users WHERE role='vendor' AND LOWER(manager_type)=$1 ORDER BY created_at DESC`;
      params = [mType];
    }
    const { rows } = await pool.query(query, params);
    return res.json({ vendors: rows });
  } catch (err) {
    console.error("list vendors error:", err);
    return res.status(500).json({ error: "Failed to fetch vendors." });
  }
});

// ════════════════════════════════════════════════════════════════════
// POST /api/managers/vendor  — manager directly creates a vendor account
// ════════════════════════════════════════════════════════════════════
router.post(
  "/vendor",
  authenticate,
  validate(createVendorAccountSchema),
  async (req, res) => {
    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }

    const { businessName, ownerName, email, password, mobile } = req.body;
    const vendorType = (req.user.manager_type || "food").toLowerCase();

    try {
      const existing = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
      if (existing.rows.length) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }

      const parts = ownerName.trim().split(" ");
      const firstName = parts[0];
      const lastName = parts.slice(1).join(" ") || businessName;
      const passwordHash = await bcrypt.hash(password, 10);

      const { rows } = await pool.query(
        `INSERT INTO users (first_name, last_name, email, mobile, password_hash, role, manager_type, is_verified, is_active)
         VALUES ($1, $2, $3, $4, $5, 'vendor', $6, TRUE, TRUE)
         RETURNING id, first_name, last_name, email, mobile, manager_type, is_active, created_at`,
        [firstName, lastName, email, mobile || null, passwordHash, vendorType]
      );

      return res.status(201).json({ message: "Vendor account created successfully.", vendor: rows[0] });
    } catch (err) {
      console.error("create vendor error:", err);
      return res.status(500).json({ error: "Failed to create vendor." });
    }
  }
);

// ════════════════════════════════════════════════════════════════════
// PATCH /api/managers/vendor/:id  — edit a vendor account
// ════════════════════════════════════════════════════════════════════
router.patch(
  "/vendor/:id",
  authenticate,
  validate(editVendorAccountSchema),
  async (req, res) => {
    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }

    const { id } = req.params;
    const { firstName, lastName, email, mobile, password } = req.body;

    try {
      const check = await pool.query("SELECT manager_type FROM users WHERE id=$1 AND role='vendor'", [id]);
      if (!check.rows.length) return res.status(404).json({ error: "Vendor not found." });

      if (req.user.role === "manager") {
        const userType = (req.user.manager_type || "").toLowerCase();
        const targetType = (check.rows[0].manager_type || "").toLowerCase();
        if (userType !== targetType) return res.status(403).json({ error: "Cannot edit vendor of a different type." });
      }

      const updates = [];
      const values = [];
      let idx = 1;

      if (firstName) { updates.push(`first_name=$${idx++}`); values.push(firstName); }
      if (lastName !== undefined) { updates.push(`last_name=$${idx++}`); values.push(lastName); }
      if (email) { updates.push(`email=$${idx++}`); values.push(email); }
      if (mobile !== undefined) { updates.push(`mobile=$${idx++}`); values.push(mobile || null); }
      if (password) { updates.push(`password_hash=$${idx++}`); values.push(await bcrypt.hash(password, 10)); }

      if (!updates.length) return res.status(400).json({ error: "No fields to update." });

      values.push(id);
      const { rows } = await pool.query(
        `UPDATE users SET ${updates.join(", ")}, updated_at=NOW() WHERE id=$${idx} AND role='vendor'
         RETURNING id, first_name, last_name, email, mobile, manager_type, is_active`,
        values
      );
      return res.json({ message: "Vendor updated successfully.", vendor: rows[0] });
    } catch (err) {
      console.error("edit vendor error:", err);
      return res.status(500).json({ error: "Failed to update vendor." });
    }
  }
);

// ════════════════════════════════════════════════════════════════════
// DELETE /api/managers/vendor/:id  — manager deletes a vendor account
// ════════════════════════════════════════════════════════════════════
router.delete("/vendor/:id", authenticate, async (req, res) => {
  if (req.user.role !== "manager" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied." });
  }
  const { id } = req.params;
  try {
    const check = await pool.query("SELECT manager_type FROM users WHERE id=$1 AND role='vendor'", [id]);
    if (!check.rows.length) return res.status(404).json({ error: "Vendor not found." });

    if (req.user.role === "manager") {
      const userType = (req.user.manager_type || "").toLowerCase();
      const targetType = (check.rows[0].manager_type || "").toLowerCase();
      if (userType !== targetType) return res.status(403).json({ error: "Cannot delete vendor of a different type." });
    }

    await pool.query("DELETE FROM users WHERE id=$1 AND role='vendor'", [id]);
    return res.json({ message: "Vendor deleted successfully." });
  } catch (err) {
    console.error("delete vendor error:", err);
    return res.status(500).json({ error: "Failed to delete vendor." });
  }
});

// ════════════════════════════════════════════════════════════════════
// GET /api/managers/dashboard-stats
// Fetch user analytics and rating stats (Developer only)
// ════════════════════════════════════════════════════════════════════
router.get("/dashboard-stats", authenticate, devOnly, async (req, res) => {
  try {
    // 1. Total users
    const totalUsersResult = await pool.query("SELECT COUNT(*) FROM users WHERE role='user'");
    const totalUsers = parseInt(totalUsersResult.rows[0].count, 10);

    // 2. Users today
    const usersTodayResult = await pool.query("SELECT COUNT(*) FROM users WHERE role='user' AND created_at >= CURRENT_DATE");
    const usersToday = parseInt(usersTodayResult.rows[0].count, 10);

    // 3. Users yesterday
    const usersYesterdayResult = await pool.query("SELECT COUNT(*) FROM users WHERE role='user' AND created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE");
    const usersYesterday = parseInt(usersYesterdayResult.rows[0].count, 10);

    // 4. Growth Rate
    let growthRate = 0;
    if (usersYesterday > 0) {
      growthRate = ((usersToday - usersYesterday) / usersYesterday) * 100;
    } else if (usersYesterday === 0 && usersToday > 0) {
      growthRate = 100; // Cap at 100% if going from 0 to something
    }

    // 5. Ratings
    let avgRating = 0;
    let totalRatings = 0;
    try {
      const ratingsResult = await pool.query("SELECT AVG(rating) as avg, COUNT(*) as total FROM app_ratings");
      avgRating = parseFloat(ratingsResult.rows[0].avg) || 0;
      totalRatings = parseInt(ratingsResult.rows[0].total, 10);
    } catch (e) {
      // Table might not exist yet if no ratings ever made or error
      console.error("No app_ratings table or error:", e.message);
    }

    return res.json({
      totalUsers,
      usersToday,
      usersYesterday,
      growthRate: parseFloat(growthRate.toFixed(1)),
      avgRating: parseFloat(avgRating.toFixed(1)),
      totalRatings
    });
  } catch (err) {
    console.error("dashboard stats error:", err);
    return res.status(500).json({ error: "Failed to fetch dashboard stats." });
  }
});

// ════════════════════════════════════════════════════════════════════
// GET /api/managers/feedbacks  — list feedbacks for manager's division
// ════════════════════════════════════════════════════════════════════
router.get("/feedbacks", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }
    const mType = (req.user.manager_type || "").toLowerCase();
    let query, params;
    if (req.user.role === "admin") {
      query = `SELECT f.*, u.first_name, u.last_name, u.email 
               FROM feedbacks f 
               LEFT JOIN users u ON f.user_id = u.id 
               ORDER BY f.created_at DESC`;
      params = [];
    } else {
      query = `SELECT f.*, u.first_name, u.last_name, u.email 
               FROM feedbacks f 
               LEFT JOIN users u ON f.user_id = u.id 
               WHERE f.type = $1 OR f.type = 'general'
               ORDER BY f.created_at DESC`;
      params = [mType];
    }
    const { rows } = await pool.query(query, params);
    return res.json({ feedbacks: rows });
  } catch (err) {
    console.error("list feedbacks error:", err);
    return res.status(500).json({ error: "Failed to fetch feedbacks." });
  }
});

// ════════════════════════════════════════════════════════════════════
// GET /api/managers/orders  — list orders for manager's division
// ════════════════════════════════════════════════════════════════════
router.get("/orders", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }
    const mType = (req.user.manager_type || "").toLowerCase();
    let query, params;
    if (req.user.role === "admin") {
      query = `SELECT o.*, v.first_name as vendor_first_name, v.last_name as vendor_last_name, 
               u.first_name as user_first_name, u.last_name as user_last_name 
               FROM orders o
               LEFT JOIN users v ON o.vendor_id = v.id
               LEFT JOIN users u ON o.user_id = u.id
               ORDER BY o.created_at DESC`;
      params = [];
    } else {
      query = `SELECT o.*, v.first_name as vendor_first_name, v.last_name as vendor_last_name, 
               u.first_name as user_first_name, u.last_name as user_last_name 
               FROM orders o
               LEFT JOIN users v ON o.vendor_id = v.id
               LEFT JOIN users u ON o.user_id = u.id
               WHERE v.manager_type = $1
               ORDER BY o.created_at DESC`;
      params = [mType];
    }
    const { rows } = await pool.query(query, params);
    return res.json({ orders: rows });
  } catch (err) {
    console.error("list orders error:", err);
    return res.status(500).json({ error: "Failed to fetch orders." });
  }
});

// ════════════════════════════════════════════════════════════════════
// GET /api/managers/vendors/:vendorId/daily-stats
// Returns aggregated stats for a specific vendor on a specific date
// ════════════════════════════════════════════════════════════════════
router.get("/vendors/:vendorId/daily-stats", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }
    const { vendorId } = req.params;
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const { rows } = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN LOWER(payment_method) LIKE '%cash%' OR LOWER(payment_method) = 'cod' THEN total_amount ELSE 0 END), 0) as cod_amount,
        COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'online' THEN total_amount ELSE 0 END), 0) as online_amount,
        COALESCE(SUM(CASE WHEN LOWER(payment_method) LIKE '%online on delivery%' THEN total_amount ELSE 0 END), 0) as online_on_delivery_amount,
        COUNT(CASE WHEN LOWER(status) = 'delivered' THEN 1 END) as delivered_count,
        COUNT(CASE WHEN LOWER(status) = 'cancelled' THEN 1 END) as cancelled_count
       FROM orders 
       WHERE vendor_id = $1 AND DATE(created_at) = $2`,
      [vendorId, date]
    );

    return res.json({ stats: rows[0] });
  } catch (err) {
    console.error("daily stats error:", err);
    return res.status(500).json({ error: "Failed to fetch daily stats." });
  }
});

// ════════════════════════════════════════════════════════════════════
// GET /api/managers/vendors/:vendorId/orders
// Returns orders for a specific vendor on a specific date, optionally filtered by status
// ════════════════════════════════════════════════════════════════════
router.get("/vendors/:vendorId/orders", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }
    const { vendorId } = req.params;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const status = req.query.status ? req.query.status.toLowerCase() : null;

    let query = `
      SELECT o.id, o.status, o.total_amount, o.payment_method, u.first_name, u.last_name, o.created_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.vendor_id = $1 AND DATE(o.created_at) = $2
    `;
    let params = [vendorId, date];

    if (status) {
      query += ` AND LOWER(o.status) = $3`;
      params.push(status);
    }

    query += ` ORDER BY o.created_at DESC`;

    const { rows } = await pool.query(query, params);
    return res.json({ orders: rows });
  } catch (err) {
    console.error("vendor orders error:", err);
    return res.status(500).json({ error: "Failed to fetch vendor orders." });
  }
});

module.exports = router;

