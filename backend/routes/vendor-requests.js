const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");
const bcrypt = require("bcryptjs");

// POST /api/vendor-requests — create a new vendor request
router.post(
  "/",
  [
    body("ownerName").notEmpty().withMessage("Owner name is required"),
    body("ownerMobile").notEmpty().withMessage("Mobile is required"),
    body("ownerEmail").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("vendorType").isIn(["food", "medicine", "store"]).withMessage("Type must be food, medicine, or store"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { ownerName, ownerMobile, ownerEmail, password, vendorType } = req.body;
    try {
      // Check if email already exists in vendor_requests
      const existing = await pool.query("SELECT id FROM vendor_requests WHERE owner_email=$1", [ownerEmail]);
      if (existing.rows.length) {
        return res.status(409).json({ error: "A request with this email already exists." });
      }
      
      const passHash = await bcrypt.hash(password, 10);

      const { rows } = await pool.query(
        `INSERT INTO vendor_requests (owner_name, owner_mobile, owner_email, password, vendor_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [ownerName, ownerMobile, ownerEmail, passHash, vendorType]
      );

      return res.status(201).json({ message: "Vendor request submitted successfully.", requestId: rows[0].id });
    } catch (err) {
      console.error("submit vendor request error:", err);
      return res.status(500).json({ error: "Failed to submit request." });
    }
  }
);

// GET /api/vendor-requests — list vendor requests for manager
router.get("/", authenticate, async (req, res) => {
  try {
    // Only managers and admins can view
    if (req.user.role !== "manager" && req.user.role !== "admin") {
       return res.status(403).json({ error: "Access denied." });
    }
    
    let queryStr = `SELECT id, owner_name, owner_mobile, owner_email, vendor_type, status, created_at 
                    FROM vendor_requests`;
    let queryParams = [];

    // Filter by manager_type if it is a manager (admin sees all)
    if (req.user.role === "manager" && req.user.manager_type) {
      queryStr += ` WHERE vendor_type = $1`;
      queryParams.push(req.user.manager_type);
    }

    queryStr += ` ORDER BY created_at DESC`;

    const { rows } = await pool.query(queryStr, queryParams);
    return res.json({ requests: rows });
  } catch (err) {
    console.error("list vendor requests error:", err);
    return res.status(500).json({ error: "Failed to fetch vendor requests." });
  }
});

// PATCH /api/vendor-requests/:id/approve - approve a request (create user)
router.patch("/:id/approve", authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    if (req.user.role !== "manager" && req.user.role !== "admin") {
       return res.status(403).json({ error: "Access denied." });
    }

    // 1. Get the request
    const reqQuery = await pool.query("SELECT * FROM vendor_requests WHERE id=$1", [id]);
    if (!reqQuery.rows.length) return res.status(404).json({ error: "Request not found" });
    const request = reqQuery.rows[0];

    // Check manager type permission
    if (req.user.role === "manager" && req.user.manager_type !== request.vendor_type) {
       return res.status(403).json({ error: "Cannot approve request for a different vendor type." });
    }

    // 2. Check if user already exists in `users`
    const userQuery = await pool.query("SELECT id FROM users WHERE email=$1", [request.owner_email]);
    if (userQuery.rows.length) {
       return res.status(409).json({ error: "A user with this email already exists." });
    }

    // 3. Create Vendor in users table
    // Assuming we extract first/last name from owner_name roughly
    const parts = request.owner_name.split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || 'Vendor';

    await pool.query(
      `INSERT INTO users (first_name, last_name, email, mobile, password_hash, role, is_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, 'vendor', TRUE, TRUE)`,
      [firstName, lastName, request.owner_email, request.owner_mobile, request.password]
    );

    // 4. Update request status
    await pool.query("UPDATE vendor_requests SET status='approved' WHERE id=$1", [id]);

    return res.json({ message: "Vendor approved successfully." });
  } catch (err) {
    console.error("approve vendor request error:", err);
    return res.status(500).json({ error: "Failed to approve request." });
  }
});

// PATCH /api/vendor-requests/:id/reject - reject a request
router.patch("/:id/reject", authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    if (req.user.role !== "manager" && req.user.role !== "admin") {
       return res.status(403).json({ error: "Access denied." });
    }
    
    // Check type match
    const reqQuery = await pool.query("SELECT vendor_type FROM vendor_requests WHERE id=$1", [id]);
    if (!reqQuery.rows.length) return res.status(404).json({ error: "Request not found" });
    const request = reqQuery.rows[0];

    if (req.user.role === "manager" && req.user.manager_type !== request.vendor_type) {
       return res.status(403).json({ error: "Cannot reject request for a different vendor type." });
    }

    await pool.query("UPDATE vendor_requests SET status='rejected' WHERE id=$1", [id]);
    return res.json({ message: "Vendor rejected." });
  } catch (err) {
    console.error("reject vendor request error:", err);
    return res.status(500).json({ error: "Failed to reject request." });
  }
});

module.exports = router;
