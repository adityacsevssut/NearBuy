const express = require("express");
const router = express.Router();
const multer = require("multer");
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createMenuItemSchema, updateMenuItemSchema } = require("../validators/vendorMenu.validators");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL || "https://cwaiqkgimqdjsznrizgt.supabase.co",
  process.env.SUPABASE_ANON_KEY || "dummy_key"
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ─── Ensure vendor_menu_items table exists ───────────────────────────────────
async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendor_menu_items (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vendor_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category      TEXT NOT NULL,
      name          TEXT NOT NULL,
      description   TEXT DEFAULT '',
      price         INTEGER NOT NULL DEFAULT 0,
      type          TEXT NOT NULL DEFAULT 'veg',   -- 'veg' | 'non-veg'
      badge         TEXT DEFAULT '',               -- 'Bestseller', 'Must Try', etc.
      image_url     TEXT DEFAULT '',
      is_available  BOOLEAN DEFAULT TRUE,
      sort_order    INTEGER DEFAULT 0,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_vendor_menu_vendor ON vendor_menu_items(vendor_id);
    CREATE INDEX IF NOT EXISTS idx_vendor_menu_category ON vendor_menu_items(vendor_id, category);
  `);

  // Add new columns if they don't exist
  await pool.query(`
    ALTER TABLE vendor_menu_items ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1) DEFAULT 4.5;
    ALTER TABLE vendor_menu_items ADD COLUMN IF NOT EXISTS prep_time TEXT DEFAULT '15 min';
    ALTER TABLE vendor_menu_items ADD COLUMN IF NOT EXISTS reviews INTEGER DEFAULT 0;
    ALTER TABLE vendor_menu_items ADD COLUMN IF NOT EXISTS front_page_category TEXT DEFAULT '';
    ALTER TABLE vendor_menu_items ADD COLUMN IF NOT EXISTS actual_price INTEGER DEFAULT 0;
  `).catch(err => console.error("Error adding columns:", err));
}

ensureTables().catch(console.error);

// ── GET /api/vendor-menu  →  fetch all menu items for this vendor ─────────────
router.get("/", authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM vendor_menu_items WHERE vendor_id = $1 ORDER BY category, sort_order, created_at`,
      [req.user.id]
    );
    return res.json({ items: rows });
  } catch (err) {
    console.error("GET /api/vendor-menu error:", err);
    return res.status(500).json({ error: "Failed to fetch menu." });
  }
});

// ── POST /api/vendor-menu  →  add a new menu item ────────────────────────────
router.post("/", authenticate, upload.single("image"), validate(createMenuItemSchema), async (req, res) => {
  const { category, name, description, price, actual_price, type, badge, sort_order, rating, prep_time, reviews, front_page_category } = req.body;

  try {
    let imageUrl = "";
    if (req.file) {
      const fileExt = req.file.mimetype.split("/")[1] || "jpeg";
      const fileName = `menu_${req.user.id}_${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage
        .from("vendor-images")
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
      if (error) throw new Error("Image upload failed: " + error.message);
      const { data: pub } = supabase.storage.from("vendor-images").getPublicUrl(fileName);
      imageUrl = pub.publicUrl;
    }

    const { rows } = await pool.query(
      `INSERT INTO vendor_menu_items (vendor_id, category, name, description, price, actual_price, type, badge, image_url, sort_order, rating, prep_time, reviews, front_page_category)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [req.user.id, category.trim(), name.trim(), description || "", parseInt(price), actual_price ? parseInt(actual_price) : 0, type || "veg", badge || "", imageUrl, parseInt(sort_order) || 0, rating ? parseFloat(rating) : 4.5, prep_time || "15 min", reviews ? parseInt(reviews) : 0, front_page_category || ""]
    );

    return res.status(201).json({ item: rows[0] });
  } catch (err) {
    console.error("POST /api/vendor-menu error:", err);
    return res.status(500).json({ error: "Failed to add menu item." });
  }
});

// ── PATCH /api/vendor-menu/:id  →  update a menu item ────────────────────────
router.patch("/:id", authenticate, upload.single("image"), validate(updateMenuItemSchema), async (req, res) => {
  const { id } = req.params;
  try {
    // Verify ownership
    const check = await pool.query(
      "SELECT id, image_url FROM vendor_menu_items WHERE id=$1 AND vendor_id=$2",
      [id, req.user.id]
    );
    if (!check.rows.length) return res.status(404).json({ error: "Item not found." });

    const existing = check.rows[0];
    const { category, name, description, price, actual_price, type, badge, is_available, sort_order, rating, prep_time, reviews, front_page_category } = req.body;

    let imageUrl = existing.image_url;
    if (req.file) {
      const fileExt = req.file.mimetype.split("/")[1] || "jpeg";
      const fileName = `menu_${req.user.id}_${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage
        .from("vendor-images")
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
      if (error) throw new Error("Image upload failed: " + error.message);
      const { data: pub } = supabase.storage.from("vendor-images").getPublicUrl(fileName);
      imageUrl = pub.publicUrl;
    }

    const { rows } = await pool.query(
      `UPDATE vendor_menu_items SET
        category = COALESCE($1, category),
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        price = COALESCE($4, price),
        actual_price = COALESCE($5, actual_price),
        type = COALESCE($6, type),
        badge = COALESCE($7, badge),
        image_url = $8,
        is_available = COALESCE($9, is_available),
        sort_order = COALESCE($10, sort_order),
        rating = COALESCE($11, rating),
        prep_time = COALESCE($12, prep_time),
        reviews = COALESCE($13, reviews),
        front_page_category = COALESCE($14, front_page_category),
        updated_at = NOW()
       WHERE id=$15 AND vendor_id=$16 RETURNING *`,
      [
        category?.trim() || null,
        name?.trim() || null,
        description !== undefined ? description : null,
        price ? parseInt(price) : null,
        actual_price ? parseInt(actual_price) : null,
        type || null,
        badge !== undefined ? badge : null,
        imageUrl,
        is_available !== undefined ? (is_available === "true" || is_available === true) : null,
        sort_order ? parseInt(sort_order) : null,
        rating ? parseFloat(rating) : null,
        prep_time !== undefined ? prep_time : null,
        reviews ? parseInt(reviews) : null,
        front_page_category !== undefined ? front_page_category : null,
        id,
        req.user.id,
      ]
    );

    return res.json({ item: rows[0] });
  } catch (err) {
    console.error("PATCH /api/vendor-menu/:id error:", err);
    return res.status(500).json({ error: "Failed to update item." });
  }
});

// ── DELETE /api/vendor-menu/:id  →  delete a menu item ───────────────────────
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM vendor_menu_items WHERE id=$1 AND vendor_id=$2",
      [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: "Item not found." });
    return res.json({ message: "Item deleted." });
  } catch (err) {
    console.error("DELETE /api/vendor-menu/:id error:", err);
    return res.status(500).json({ error: "Failed to delete item." });
  }
});

module.exports = router;
