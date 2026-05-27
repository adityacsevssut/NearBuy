const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createServiceCenterSchema, patchServiceCenterSchema } = require("../validators/serviceCenters.validators");

// Only developer can access these
const isDev = (req, res, next) => {
  if (req.user && req.user.email === "nahakaditya344@gmail.com") {
    return next();
  }
  return res.status(403).json({ error: "Forbidden: Developer access only" });
};

// GET all service centers
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM service_centers ORDER BY created_at DESC");
    res.json({ centers: rows });
  } catch (err) {
    console.error("GET /service-centers error:", err);
    res.status(500).json({ error: "Failed to fetch service centers" });
  }
});

// POST new service center
router.post("/", authenticate, isDev, validate(createServiceCenterSchema), async (req, res) => {
  const { name, landmark, pincode, latitude, longitude, radius_km } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO service_centers (name, landmark, pincode, latitude, longitude, radius_km)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, landmark || null, pincode, latitude, longitude, radius_km || 8.0]
    );
    res.json({ message: "Service center created successfully", center: rows[0] });
  } catch (err) {
    console.error("POST /service-centers error:", err);
    res.status(500).json({ error: "Failed to create service center" });
  }
});

// PATCH update status or radius
router.patch("/:id", authenticate, isDev, validate(patchServiceCenterSchema), async (req, res) => {
  const { id } = req.params;
  const { is_active, radius_km } = req.body;
  
  try {
    const updates = [];
    const values = [];
    let query = "UPDATE service_centers SET updated_at = CURRENT_TIMESTAMP";
    
    if (is_active !== undefined) {
      values.push(is_active);
      updates.push(`is_active = $${values.length}`);
    }
    
    if (radius_km !== undefined) {
      values.push(radius_km);
      updates.push(`radius_km = $${values.length}`);
    }
    
    if (updates.length > 0) {
      query += ", " + updates.join(", ");
    }
    
    values.push(id);
    query += ` WHERE id = $${values.length} RETURNING *`;
    
    const { rows } = await pool.query(query, values);
    if (!rows.length) return res.status(404).json({ error: "Center not found" });
    
    res.json({ message: "Service center updated successfully", center: rows[0] });
  } catch (err) {
    console.error("PATCH /service-centers error:", err);
    res.status(500).json({ error: "Failed to update service center" });
  }
});

// DELETE service center
router.delete("/:id", authenticate, isDev, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query("DELETE FROM service_centers WHERE id = $1 RETURNING *", [id]);
    if (!rows.length) return res.status(404).json({ error: "Center not found" });
    res.json({ message: "Service center deleted successfully" });
  } catch (err) {
    console.error("DELETE /service-centers error:", err);
    res.status(500).json({ error: "Failed to delete service center" });
  }
});

module.exports = router;
