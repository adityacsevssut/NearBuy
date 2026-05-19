const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
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
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("managerType").isIn(["food", "medicine", "store"]).withMessage("Type must be food, medicine, or store"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

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
  [
    body("email").optional().isEmail().normalizeEmail(),
    body("password").optional().isLength({ min: 8 }),
    body("managerType").optional().isIn(["food", "medicine", "store"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

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
  [
    body("businessName").trim().notEmpty().withMessage("Business name is required"),
    body("ownerName").trim().notEmpty().withMessage("Owner name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("mobile").optional().isMobilePhone(),
  ],
  async (req, res) => {
    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

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
  [
    body("email").optional().isEmail().normalizeEmail(),
    body("password").optional().isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

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

module.exports = router;

