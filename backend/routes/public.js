const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const validate = require("../middleware/validate");
const { updateSettingsSchema } = require("../validators/manager.validators");
const { authenticate } = require("../middleware/auth");

// In-memory cache for Vendors
let vendorsCache = {};
const VENDORS_TTL = 5 * 60 * 1000; // 5 minutes

// GET /api/public/vendors
router.get("/vendors", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100); // max 100, min 1
    const offset = (page - 1) * limit;

    const { search, foodPref, lat, lon, pincode } = req.query;
    
    // Set Cache-Control header so the browser/CDN caches the response for 5 minutes
    res.set("Cache-Control", "public, max-age=300");

    // Round lat/lon to nearest 0.005 (~550m grid) to group very close requests
    const cacheLat = lat && !isNaN(parseFloat(lat)) ? (Math.round(parseFloat(lat) * 200) / 200).toFixed(3) : '';
    const cacheLon = lon && !isNaN(parseFloat(lon)) ? (Math.round(parseFloat(lon) * 200) / 200).toFixed(3) : '';

    // Generate a unique cache key based on all filter parameters
    const cacheKey = `${page}_${limit}_${search||''}_${foodPref||''}_${cacheLat}_${cacheLon}_${pincode||''}`;

    // Return from in-memory cache if valid
    if (vendorsCache[cacheKey] && vendorsCache[cacheKey].expiry > Date.now()) {
      return res.json(vendorsCache[cacheKey].data);
    }

    let whereClause = "WHERE v.is_active = TRUE AND u.is_active = TRUE AND u.role = 'vendor'";
    const queryParams = [];
    let paramIndex = 1;

    // Search filter
    if (search) {
      whereClause += ` AND (v.restaurant_name ILIKE $${paramIndex} OR v.cuisine ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Food preference filter
    if (foodPref === 'veg') {
      whereClause += ` AND v.cuisine ILIKE '%veg%'`;
    } else if (foodPref === 'non-veg') {
      whereClause += ` AND v.cuisine NOT ILIKE '%veg%'`;
    } else if (foodPref === 'avail-all') {
      whereClause += ` AND v.is_open = TRUE`;
    } else if (foodPref === 'avail-veg') {
      whereClause += ` AND v.is_open = TRUE AND v.cuisine ILIKE '%veg%'`;
    } else if (foodPref === 'avail-non-veg') {
      whereClause += ` AND v.is_open = TRUE AND v.cuisine NOT ILIKE '%veg%'`;
    }

    // Distance / Pincode filter
    if (lat && lon) {
      whereClause += ` AND (
        v.latitude IS NOT NULL AND v.longitude IS NOT NULL AND
        (6371 * acos(
          LEAST(1.0, GREATEST(-1.0,
            cos(radians($${paramIndex}::numeric)) * cos(radians(CAST(v.latitude AS numeric))) *
            cos(radians(CAST(v.longitude AS numeric)) - radians($${paramIndex+1}::numeric)) +
            sin(radians($${paramIndex}::numeric)) * sin(radians(CAST(v.latitude AS numeric)))
          ))
        )) <= COALESCE(CAST(v.delivery_range AS numeric), 5)
      )`;
      queryParams.push(parseFloat(lat), parseFloat(lon));
      paramIndex += 2;
    } else if (pincode) {
      whereClause += ` AND v.pincode = $${paramIndex}`;
      queryParams.push(pincode);
      paramIndex++;
    }

    const countQuery = `
      SELECT COUNT(*)
      FROM vendor_profiles v
      JOIN users u ON v.user_id = u.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Add limit & offset params
    queryParams.push(limit, offset);

    const dataQuery = `
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
        u.manager_type,
        u.first_name,
        u.last_name
      FROM vendor_profiles v
      JOIN users u ON v.user_id = u.id
      ${whereClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const { rows } = await pool.query(dataQuery, queryParams);
    
    const formatted = rows.map(r => ({
      ...r,
      badgeColor: "bg-orange-100 text-orange-700",
      rating: r.rating !== null && r.rating !== undefined ? parseFloat(r.rating) : 0.0,
      reviews: 120,
      veg: r.cuisine ? r.cuisine.toLowerCase().includes('veg') : false,
      ownerName: `${r.first_name || "Guest"} ${r.last_name || ""}`.trim()
    }));

    const responseData = {
      data: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };

    // Update cache
    vendorsCache[cacheKey] = {
      data: responseData,
      expiry: Date.now() + VENDORS_TTL
    };

    return res.json(responseData);
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
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const offset = (page - 1) * limit;
    
    const { foodPref, lat, lon, pincode, sortOrder } = req.query;

    let baseWhereClause = "WHERE m.front_page_category ILIKE $1 AND m.is_available = TRUE AND v.is_active = TRUE";
    const queryParams = [req.params.category];
    let paramIndex = 2;

    if (lat && lon) {
      baseWhereClause += ` AND (
        v.latitude IS NOT NULL AND v.longitude IS NOT NULL AND
        (6371 * acos(
          LEAST(1.0, GREATEST(-1.0,
            cos(radians($${paramIndex}::numeric)) * cos(radians(CAST(v.latitude AS numeric))) *
            cos(radians(CAST(v.longitude AS numeric)) - radians($${paramIndex+1}::numeric)) +
            sin(radians($${paramIndex}::numeric)) * sin(radians(CAST(v.latitude AS numeric)))
          ))
        )) <= COALESCE(CAST(v.delivery_range AS numeric), 5)
      )`;
      queryParams.push(parseFloat(lat), parseFloat(lon));
      paramIndex += 2;
    } else if (pincode) {
      baseWhereClause += ` AND v.pincode = $${paramIndex}`;
      queryParams.push(pincode);
      paramIndex++;
    }

    // Query available types BEFORE food preference filter is applied
    const typesQuery = `
      SELECT DISTINCT m.type
      FROM vendor_menu_items m
      JOIN vendor_profiles v ON m.vendor_id = v.user_id
      ${baseWhereClause}
    `;
    const typesResult = await pool.query(typesQuery, queryParams);
    const availableTypes = typesResult.rows.map(r => r.type);

    let whereClause = baseWhereClause;

    if (foodPref === 'veg') {
      whereClause += ` AND m.type = 'veg'`;
    } else if (foodPref === 'non-veg') {
      whereClause += ` AND m.type = 'non-veg'`;
    }

    const countQuery = `
      SELECT COUNT(*)
      FROM vendor_menu_items m
      JOIN vendor_profiles v ON m.vendor_id = v.user_id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    let orderBy = "ORDER BY m.id";
    if (sortOrder === "low-to-high") {
      orderBy = "ORDER BY m.price ASC";
    } else if (sortOrder === "high-to-low") {
      orderBy = "ORDER BY m.price DESC";
    }

    queryParams.push(limit, offset);
    const dataQuery = `
      SELECT 
         m.id, m.category, m.name, m.description as desc, m.price, m.actual_price, m.type, m.badge, m.image_url as image_url, 
         m.is_available, m.sort_order, m.rating, m.prep_time as time, m.reviews, m.front_page_category,
         v.restaurant_name as vendor, v.user_id as vendor_id, v.latitude, v.longitude, v.delivery_range,
         v.is_open as vendor_is_open
      FROM vendor_menu_items m
      JOIN vendor_profiles v ON m.vendor_id = v.user_id
      ${whereClause}
      ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex+1}
    `;

    const { rows } = await pool.query(dataQuery, queryParams);
    
    const formatted = rows.map(r => ({
      ...r,
      emoji: r.image_url ? "" : "🍽️", // Fallback emoji if no image
    }));

    return res.json({ 
      dishes: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      availableTypes
    });
  } catch (err) {
    console.error("GET /api/public/dishes/:category error:", err);
    return res.status(500).json({ error: "Failed to load dishes" });
  }
});

// In-memory cache for Hot Deals
let hotDealsCache = {};
const HOT_DEALS_TTL = 5 * 60 * 1000; // 5 minutes

// GET /api/public/hot-deals
router.get("/hot-deals", async (req, res) => {
  try {
    const { lat, lon, pincode } = req.query;
    
    // Set Cache-Control header so the browser/CDN caches the response for 5 minutes
    res.set("Cache-Control", "public, max-age=300");

    // Generate a cache key based on location
    const cacheKey = `${lat || 'default'}_${lon || 'default'}_${pincode || 'default'}`;

    // Return from in-memory cache if valid
    if (hotDealsCache[cacheKey] && hotDealsCache[cacheKey].expiry > Date.now()) {
      return res.json(hotDealsCache[cacheKey].data);
    }

    let whereClause = "WHERE m.price <= 130 AND m.price > 0 AND m.is_available = TRUE AND v.is_active = TRUE";
    const queryParams = [];
    let paramIndex = 1;

    if (lat && lon) {
      whereClause += ` AND (
        v.latitude IS NOT NULL AND v.longitude IS NOT NULL AND
        (6371 * acos(
          LEAST(1.0, GREATEST(-1.0,
            cos(radians($${paramIndex}::numeric)) * cos(radians(CAST(v.latitude AS numeric))) *
            cos(radians(CAST(v.longitude AS numeric)) - radians($${paramIndex+1}::numeric)) +
            sin(radians($${paramIndex}::numeric)) * sin(radians(CAST(v.latitude AS numeric)))
          ))
        )) <= COALESCE(CAST(v.delivery_range AS numeric), 5)
      )`;
      queryParams.push(parseFloat(lat), parseFloat(lon));
      paramIndex += 2;
    } else if (pincode) {
      whereClause += ` AND v.pincode = $${paramIndex}`;
      queryParams.push(pincode);
      paramIndex++;
    }

    const dataQuery = `
      SELECT 
         m.id, m.name, m.price as "discountPrice", m.actual_price as "originalPrice", m.type, m.image_url as image, m.rating,
         v.restaurant_name as "restaurantName", v.user_id as "restaurantId",
         v.latitude, v.longitude, v.delivery_range as "deliveryRange"
      FROM vendor_menu_items m
      JOIN vendor_profiles v ON m.vendor_id = v.user_id
      ${whereClause}
      ORDER BY RANDOM()
      LIMIT 150
    `;

    const { rows } = await pool.query(dataQuery, queryParams);
    
    // Provide default values and formatting
    const formatDeal = (r) => ({
      ...r,
      originalPrice: (r.originalPrice && r.originalPrice > r.discountPrice) 
        ? r.originalPrice 
        : Math.floor(r.discountPrice * 1.5), // fallback if originalPrice missing or invalid
      rating: r.rating ? parseFloat(r.rating).toFixed(1) : "4.0",
    });

    // Extract deals (up to 50 items for each category to allow up to 100 items total)
    const under60 = rows.filter(r => parseFloat(r.discountPrice) <= 60).slice(0, 50).map(formatDeal);
    const under130 = rows.filter(r => parseFloat(r.discountPrice) > 60 && parseFloat(r.discountPrice) <= 130).slice(0, 50).map(formatDeal);

    const resultData = { under60, under130 };

    // Update cache
    hotDealsCache[cacheKey] = {
      data: resultData,
      expiry: Date.now() + HOT_DEALS_TTL
    };

    return res.json(resultData);
  } catch (err) {
    console.error("GET /api/public/hot-deals error:", err);
    return res.status(500).json({ error: "Failed to load hot deals" });
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
        gst DECIMAL(10,2) NOT NULL DEFAULT 10.00,
        instagram_link VARCHAR(255) DEFAULT 'https://instagram.com/',
        food_email VARCHAR(255) DEFAULT 'manager@nearbuy.com',
        store_email VARCHAR(255) DEFAULT 'manager@nearbuy.com'
      );
    `);
    
    // Insert default if empty
    await pool.query(`
      INSERT INTO global_settings (id, platform_fee, gst)
      VALUES (1, 5.00, 10.00)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Ensure columns exist (for migration)
    await pool.query(`ALTER TABLE global_settings ADD COLUMN IF NOT EXISTS instagram_link VARCHAR(255) DEFAULT 'https://instagram.com/';`);
    await pool.query(`ALTER TABLE global_settings ADD COLUMN IF NOT EXISTS food_email VARCHAR(255) DEFAULT 'manager@nearbuy.com';`);
    await pool.query(`ALTER TABLE global_settings ADD COLUMN IF NOT EXISTS store_email VARCHAR(255) DEFAULT 'manager@nearbuy.com';`);
    await pool.query(`ALTER TABLE global_settings ADD COLUMN IF NOT EXISTS enable_food BOOLEAN DEFAULT TRUE;`);
    await pool.query(`ALTER TABLE global_settings ADD COLUMN IF NOT EXISTS enable_store BOOLEAN DEFAULT FALSE;`);

    const { rows } = await pool.query("SELECT platform_fee, gst, instagram_link, food_email, store_email, enable_food, enable_store FROM global_settings WHERE id = 1");
    return res.json({
      platform_fee: parseFloat(rows[0].platform_fee),
      gst: parseFloat(rows[0].gst),
      instagram_link: rows[0].instagram_link,
      food_email: rows[0].food_email,
      store_email: rows[0].store_email,
      enable_food: rows[0].enable_food,
      enable_store: rows[0].enable_store
    });
  } catch (err) {
    console.error("GET /api/public/settings error:", err);
    return res.status(500).json({ error: "Failed to load settings" });
  }
});

// POST /api/public/settings
// Update global settings — restricted to managers and admins
router.post("/settings", authenticate, validate(updateSettingsSchema), async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: "Access denied. Managers and admins only." });
    }
    const { platform_fee, gst, instagram_link, food_email, store_email, enable_food, enable_store } = req.body;
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS global_settings (
        id INT PRIMARY KEY DEFAULT 1,
        platform_fee DECIMAL(10,2) NOT NULL DEFAULT 5.00,
        gst DECIMAL(10,2) NOT NULL DEFAULT 10.00,
        instagram_link VARCHAR(255) DEFAULT 'https://instagram.com/',
        food_email VARCHAR(255) DEFAULT 'manager@nearbuy.com',
        store_email VARCHAR(255) DEFAULT 'manager@nearbuy.com'
      );
    `);

    await pool.query(`ALTER TABLE global_settings ADD COLUMN IF NOT EXISTS instagram_link VARCHAR(255) DEFAULT 'https://instagram.com/';`);
    await pool.query(`ALTER TABLE global_settings ADD COLUMN IF NOT EXISTS food_email VARCHAR(255) DEFAULT 'manager@nearbuy.com';`);
    await pool.query(`ALTER TABLE global_settings ADD COLUMN IF NOT EXISTS store_email VARCHAR(255) DEFAULT 'manager@nearbuy.com';`);
    await pool.query(`ALTER TABLE global_settings ADD COLUMN IF NOT EXISTS enable_food BOOLEAN DEFAULT TRUE;`);
    await pool.query(`ALTER TABLE global_settings ADD COLUMN IF NOT EXISTS enable_store BOOLEAN DEFAULT FALSE;`);
    
    await pool.query(`
      INSERT INTO global_settings (id, platform_fee, gst, instagram_link, food_email, store_email, enable_food, enable_store)
      VALUES (1, $1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET 
        platform_fee = EXCLUDED.platform_fee, 
        gst = EXCLUDED.gst,
        instagram_link = EXCLUDED.instagram_link,
        food_email = EXCLUDED.food_email,
        store_email = EXCLUDED.store_email,
        enable_food = EXCLUDED.enable_food,
        enable_store = EXCLUDED.enable_store;
    `, [platform_fee, gst, instagram_link || '', food_email || '', store_email || '', 
        enable_food !== undefined ? enable_food : true, 
        enable_store !== undefined ? enable_store : false]);

    return res.json({ success: true });
  } catch (err) {
    console.error("POST /api/public/settings error:", err);
    return res.status(500).json({ error: "Failed to update settings" });
  }
});

// POST /api/public/feedback
router.post("/feedback", authenticate, async (req, res) => {
  try {
    const { email, message, type } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required." });
    }
    if (message.length > 2000) {
      return res.status(400).json({ error: "Message must be 2000 characters or less." });
    }
    const feedbackType = type || 'general';
    await pool.query(
      `INSERT INTO feedbacks (user_id, email, type, message) VALUES ($1, $2, $3, $4)`,
      [req.user.id, email || null, feedbackType, message]
    );
    return res.json({ success: true, message: "Feedback submitted successfully." });
  } catch (err) {
    console.error("POST /api/public/feedback error:", err);
    return res.status(500).json({ error: "Failed to submit feedback." });
  }
});

// POST /api/public/support
router.post("/support", authenticate, async (req, res) => {
  try {
    const { email, issue, contact_method, contact_number, type } = req.body;
    if (!issue || issue.trim().length === 0) {
      return res.status(400).json({ error: "Issue description is required." });
    }
    if (issue.length > 2000) {
      return res.status(400).json({ error: "Issue description must be 2000 characters or less." });
    }
    if (!contact_method || !contact_number) {
      return res.status(400).json({ error: "Contact method and number are required." });
    }
    
    const requestType = type || 'general';
    await pool.query(
      `INSERT INTO support_requests (user_id, email, issue, contact_method, contact_number, type) VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, email || null, issue, contact_method, contact_number, requestType]
    );
    return res.json({ success: true, message: "Support request submitted successfully." });
  } catch (err) {
    console.error("POST /api/public/support error:", err);
    return res.status(500).json({ error: "Failed to submit support request." });
  }
});

// POST /api/public/refund
router.post("/refund", authenticate, async (req, res) => {
  try {
    const { email, order_id, user_name, type } = req.body;
    if (!email || !order_id || !user_name) {
      return res.status(400).json({ error: "Email, Order ID, and User Name are required." });
    }

    // Fetch refund amount server-side from the actual order — never trust client-supplied amounts
    const orderRes = await pool.query(
      "SELECT total_amount, delivery_charge, platform_fee FROM orders WHERE id = $1 AND user_id = $2",
      [order_id, req.user.id]
    );
    if (!orderRes.rows.length) {
      return res.status(404).json({ error: "Order not found or does not belong to you." });
    }
    const o = orderRes.rows[0];
    const refundAmount = Math.max(
      0,
      Number(o.total_amount) - Number(o.delivery_charge || 0) - Number(o.platform_fee || 0)
    );

    const requestType = type || 'general';
    await pool.query(
      `INSERT INTO refund_requests (user_id, email, order_id, user_name, type, amount) VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, email, order_id, user_name, requestType, refundAmount]
    );
    return res.json({ success: true, message: "Refund request submitted successfully." });
  } catch (err) {
    console.error("POST /api/public/refund error:", err);
    return res.status(500).json({ error: "Failed to submit refund request." });
  }
});

// GET /api/public/refunds
router.get("/refunds", authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM refund_requests WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ refunds: rows });
  } catch (err) {
    console.error("GET /api/public/refunds error:", err);
    return res.status(500).json({ error: "Failed to fetch refund requests." });
  }
});

// PATCH /api/public/refunds/:id/upi
router.patch("/refunds/:id/upi", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { upi_id } = req.body;
    if (!upi_id) {
      return res.status(400).json({ error: "UPI ID is required." });
    }

    const check = await pool.query("SELECT * FROM refund_requests WHERE id = $1 AND user_id = $2", [id, req.user.id]);
    if (!check.rows.length) {
      return res.status(404).json({ error: "Refund request not found." });
    }

    if (check.rows[0].status !== "Approved") {
      return res.status(400).json({ error: "Refund request must be approved to provide UPI ID." });
    }

    await pool.query(
      "UPDATE refund_requests SET upi_id = $1, status = 'UPI Provided' WHERE id = $2",
      [upi_id, id]
    );

    return res.json({ success: true, message: "UPI ID submitted successfully." });
  } catch (err) {
    console.error("PATCH /api/public/refunds/:id/upi error:", err);
    return res.status(500).json({ error: "Failed to submit UPI ID." });
  }
});

module.exports = router;
