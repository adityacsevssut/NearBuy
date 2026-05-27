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
        v.landmark,
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
        v.landmark,
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
      `SELECT id, category, name, description, price, actual_price, type, badge, image_url, is_available, sort_order, rating, prep_time, reviews
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

// GET /api/public/dishes/:category
router.get("/dishes/:category", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
         m.id, m.category, m.name, m.description as desc, m.price, m.actual_price, m.type, m.badge, m.image_url as image_url, 
         m.is_available, m.sort_order, m.rating, m.prep_time as time, m.reviews, m.front_page_category,
         v.restaurant_name as vendor, v.user_id as vendor_id, v.latitude, v.longitude, v.delivery_range
       FROM vendor_menu_items m
       JOIN vendor_profiles v ON m.vendor_id = v.user_id
       WHERE m.front_page_category ILIKE $1 AND m.is_available = TRUE AND v.is_active = TRUE`,
      [req.params.category]
    );
    
    const formatted = rows.map(r => ({
      ...r,
      emoji: r.image_url ? "" : "🍽️", // Fallback emoji if no image
    }));

    return res.json({ dishes: formatted });
  } catch (err) {
    console.error("GET /api/public/dishes/:category error:", err);
    return res.status(500).json({ error: "Failed to load dishes" });
  }
});

// GET /api/public/settings
router.get("/settings", async (req, res) => {
  try {
    // Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS global_settings (
        id INT PRIMARY KEY DEFAULT 1,
        platform_fee DECIMAL(10,2) NOT NULL DEFAULT 5.00,
        gst DECIMAL(10,2) NOT NULL DEFAULT 10.00
      );
    `);
    
    // Insert default if empty
    await pool.query(`
      INSERT INTO global_settings (id, platform_fee, gst)
      VALUES (1, 5.00, 10.00)
      ON CONFLICT (id) DO NOTHING;
    `);

    const { rows } = await pool.query("SELECT platform_fee, gst FROM global_settings WHERE id = 1");
    return res.json({
      platform_fee: parseFloat(rows[0].platform_fee),
      gst: parseFloat(rows[0].gst)
    });
  } catch (err) {
    console.error("GET /api/public/settings error:", err);
    return res.status(500).json({ error: "Failed to load settings" });
  }
});

// POST /api/public/settings
router.post("/settings", async (req, res) => {
  try {
    const { platform_fee, gst } = req.body;
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS global_settings (
        id INT PRIMARY KEY DEFAULT 1,
        platform_fee DECIMAL(10,2) NOT NULL DEFAULT 5.00,
        gst DECIMAL(10,2) NOT NULL DEFAULT 10.00
      );
    `);
    
    await pool.query(`
      INSERT INTO global_settings (id, platform_fee, gst)
      VALUES (1, $1, $2)
      ON CONFLICT (id) DO UPDATE SET platform_fee = $1, gst = $2;
    `, [platform_fee, gst]);

    return res.json({ success: true });
  } catch (err) {
    console.error("POST /api/public/settings error:", err);
    return res.status(500).json({ error: "Failed to update settings" });
  }
});

module.exports = router;
