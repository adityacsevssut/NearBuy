const express = require("express");
const router = express.Router();
const validate = require("../middleware/validate");
const { createVendorRequestSchema, editVendorRequestSchema } = require("../validators/vendorRequests.validators");
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");
const bcrypt = require("bcryptjs");

// POST /api/vendor-requests — create a new vendor request
router.post(
  "/",
  validate(createVendorRequestSchema),
  async (req, res) => {

    const { restaurantName, ownerName, ownerMobile, ownerEmail, password, vendorType, requestType, collegeName, serviceCenterId } = req.body;
    try {
      // Check if email already exists in vendor_requests
      const existing = await pool.query("SELECT id FROM vendor_requests WHERE owner_email=$1", [ownerEmail]);
      if (existing.rows.length) {
        return res.status(409).json({ error: "A request with this email already exists." });
      }

      // Check if user already exists in users
      const userExists = await pool.query("SELECT id FROM users WHERE email=$1", [ownerEmail]);
      if (userExists.rows.length) {
        return res.status(409).json({ error: "An account with this email already exists. Please log in." });
      }
      
      // Hash the password BEFORE storing — never store plaintext credentials
      const passwordHash = await bcrypt.hash(password, 10);

      const { rows } = await pool.query(
        `INSERT INTO vendor_requests (restaurant_name, owner_name, owner_mobile, owner_email, password, vendor_type, request_type, college_name, service_center_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [restaurantName, ownerName, ownerMobile, ownerEmail, passwordHash, vendorType, requestType || 'vendor', collegeName, serviceCenterId]
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
    
    // Note: 'password' column intentionally excluded — never return credentials in API responses
    let queryStr = `SELECT id, restaurant_name, owner_name, owner_mobile, owner_email, vendor_type, request_type, college_name, status, created_at 
                    FROM vendor_requests`;
    let queryParams = [];

    // Filter by manager_type and service_center_id if it is a manager (admin sees all)
    if (req.user.role === "manager") {
      const mType = (req.user.manager_type || "").toLowerCase();
      const scId = req.user.service_center_id;
      if (mType && scId) {
        queryStr += ` WHERE LOWER(vendor_type) = $1 AND service_center_id = $2`;
        queryParams.push(mType, scId);
      } else {
        // If manager has no type or service center assigned, they shouldn't see anything for safety
        queryStr += ` WHERE 1=0`; 
      }
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

    if (req.user.role === "manager") {
      const userType = (req.user.manager_type || "").toLowerCase();
      const targetType = (request.vendor_type || "").toLowerCase();
      
      if (userType !== targetType) {
        return res.status(403).json({ 
          error: `Cannot approve request for a different vendor type.`
        });
      }
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
    const lastName = parts.slice(1).join(' ') || (request.request_type === 'student' ? 'Student' : 'Vendor');

    // password is now a bcrypt hash (stored pre-hashed at submission) — use directly
    const passwordHash = request.password;

    const newUser = await pool.query(
      `INSERT INTO users (first_name, last_name, email, mobile, password_hash, role, is_verified, is_active, college_name, request_type, manager_type, service_center_id)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, TRUE, $7, $8, $9, $10) RETURNING id`,
      [
        firstName, lastName, request.owner_email, request.owner_mobile, 
        passwordHash, request.request_type || 'vendor', 
        request.college_name, request.request_type, request.vendor_type,
        request.service_center_id
      ]
    );

    const userId = newUser.rows[0].id;

    // 4. Create initial vendor_profile with the restaurant name
    await pool.query(
      `INSERT INTO vendor_profiles (user_id, restaurant_name, owner_number)
       VALUES ($1, $2, $3)`,
      [userId, request.restaurant_name, request.owner_mobile]
    );

    // 5. Update request status
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


    if (req.user.role === "manager") {
      const userType = (req.user.manager_type || "").toLowerCase();
      const targetType = (request.vendor_type || "").toLowerCase();
      
      if (userType !== targetType) {
        return res.status(403).json({ 
          error: `Cannot reject request for a different vendor type. Manager is '${userType}', Request is '${targetType}'.` 
        });
      }
    }

    await pool.query("DELETE FROM vendor_requests WHERE id=$1", [id]);
    return res.json({ message: "Vendor request deleted." });
  } catch (err) {
    console.error("reject vendor request error:", err);
    return res.status(500).json({ error: "Failed to reject request." });
  }
});

// DELETE /api/vendor-requests/:id — hard-delete a vendor request
router.delete("/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }
    const check = await pool.query("SELECT vendor_type, owner_email, status FROM vendor_requests WHERE id=$1", [id]);
    if (!check.rows.length) return res.status(404).json({ error: "Request not found." });

    if (req.user.role === "manager") {
      const userType = (req.user.manager_type || "").toLowerCase();
      const targetType = (check.rows[0].vendor_type || "").toLowerCase();
      if (userType !== targetType) {
        return res.status(403).json({ error: "Cannot delete request for a different vendor type." });
      }
    }

    // If the request was approved, deleting it should also remove the registered shop account
    if (check.rows[0].status === 'approved') {
      await pool.query("DELETE FROM users WHERE email=$1 AND role='vendor'", [check.rows[0].owner_email]);
    }

    await pool.query("DELETE FROM vendor_requests WHERE id=$1", [id]);
    return res.json({ message: "Vendor request deleted successfully." });
  } catch (err) {
    console.error("delete vendor request error:", err);
    return res.status(500).json({ error: "Failed to delete request." });
  }
});

// PUT /api/vendor-requests/:id — edit vendor details (name, email, mobile)
router.put("/:id", authenticate, validate(editVendorRequestSchema), async (req, res) => {
  const { id } = req.params;
  const { owner_name, owner_email, owner_mobile } = req.body;
  try {
    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }
    const check = await pool.query("SELECT vendor_type FROM vendor_requests WHERE id=$1", [id]);
    if (!check.rows.length) return res.status(404).json({ error: "Request not found." });

    if (req.user.role === "manager") {
      const userType = (req.user.manager_type || "").toLowerCase();
      const targetType = (check.rows[0].vendor_type || "").toLowerCase();
      if (userType !== targetType) {
        return res.status(403).json({ error: "Cannot edit request for a different vendor type." });
      }
    }

    await pool.query(
      `UPDATE vendor_requests SET owner_name=$1, owner_email=$2, owner_mobile=$3 WHERE id=$4`,
      [owner_name, owner_email, owner_mobile, id]
    );
    return res.json({ message: "Vendor updated successfully." });
  } catch (err) {
    console.error("edit vendor request error:", err);
    return res.status(500).json({ error: "Failed to update request." });
  }
});

module.exports = router;

