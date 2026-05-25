const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// GET /api/public/vendors
router.get("/vendors", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        v.user_id as id,
        v.restaurant_name as name,
        v.cuisine,
        v.delivery_time as time,
        v.min_order as "minOrder",
        v.offer,
        v.badge,
        v.image_url as image,
        v.rating,
        v.latitude,
        v.longitude,
        v.pincode,
        v.manual_address as "manualAddress",
        v.gps_address as "gpsAddress",
        v.is_open as "isOpen",
        v.delivery_range as "deliveryRange",
        u.manager_type
      FROM vendor_profiles v
      JOIN users u ON v.user_id = u.id
      WHERE v.is_active = TRUE AND u.is_active = TRUE AND u.role = 'vendor'
    `);
    
    // Default fallback mappings
    const formatted = rows.map(r => ({
      ...r,
      badgeColor: "bg-orange-100 text-orange-700",
      rating: r.rating !== null && r.rating !== undefined ? parseFloat(r.rating) : 0.0,
      reviews: 120,
      veg: r.cuisine ? r.cuisine.toLowerCase().includes('veg') : false
    }));

    return res.json(formatted);
  } catch (err) {
    console.error("GET /api/public/vendors error:", err);
    return res.status(500).json({ error: "Failed to load vendors" });
  }
});

// GET /api/public/vendors/:id
router.get("/vendors/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        v.user_id as id,
        v.restaurant_name as name,
        v.cuisine,
        v.delivery_time as time,
        v.min_order as "minOrder",
        v.offer,
        v.badge,
        v.image_url as image,
        v.rating,
        v.latitude,
        v.longitude,
        v.pincode,
        v.manual_address as "manualAddress",
        v.gps_address as "gpsAddress",
        v.is_open as "isOpen",
        v.delivery_range as "deliveryRange",
        u.manager_type
      FROM vendor_profiles v
      JOIN users u ON v.user_id = u.id
      WHERE v.user_id = $1
    `, [req.params.id]);

    if (!rows.length) return res.status(404).json({ error: "Vendor not found" });

    const vendor = {
      ...rows[0],
      badgeColor: "bg-orange-100 text-orange-700",
      rating: rows[0].rating !== null && rows[0].rating !== undefined ? parseFloat(rows[0].rating) : 0.0,
      reviews: 120
    };

    return res.json(vendor);
  } catch (err) {
    console.error("GET /api/public/vendors/:id error:", err);
    return res.status(500).json({ error: "Failed to load vendor" });
  }
});

// GET /api/public/vendors/:id/menu  →  public menu items for a vendor
router.get("/vendors/:id/menu", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, category, name, description, price, type, badge, image_url, is_available, sort_order, rating, prep_time, reviews
       FROM vendor_menu_items
       WHERE vendor_id = $1
       ORDER BY category, sort_order, created_at`,
      [req.params.id]
    );
    return res.json({ items: rows });
  } catch (err) {
    console.error("GET /api/public/vendors/:id/menu error:", err);
    return res.status(500).json({ error: "Failed to load menu" });
  }
});


// GET /api/public/service-centers
router.get("/service-centers", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, pincode, latitude, longitude, radius_km FROM service_centers WHERE is_active = TRUE"
    );
    return res.json({ centers: rows });
  } catch (err) {
    console.error("GET /api/public/service-centers error:", err);
    return res.status(500).json({ error: "Failed to load service centers" });
  }
});

module.exports = router;
