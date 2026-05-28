const express = require("express");
const router = express.Router();
const multer = require("multer");
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL || "https://cwaiqkgimqdjsznrizgt.supabase.co",
  process.env.SUPABASE_ANON_KEY || "dummy_key"
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
});

// ── GET /api/homepage-poster?type=food|medicine|store  (public) ───────────────
router.get("/", async (req, res) => {
  try {
    const type = (req.query.type || "food").toLowerCase();
    const { rows } = await pool.query(
      "SELECT * FROM homepage_posters WHERE type = $1",
      [type]
    );
    return res.json({ poster: rows[0] || null });
  } catch (err) {
    console.error("GET /api/homepage-poster error:", err);
    return res.status(500).json({ error: "Failed to load poster." });
  }
});

// ── POST /api/homepage-poster  (manager / admin only) ────────────────────────
router.post("/", authenticate, upload.single("image"), async (req, res) => {
  try {
    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }

    const managerType = (req.user.manager_type || "food").toLowerCase();

    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." });
    }

    if (!process.env.SUPABASE_ANON_KEY) {
      throw new Error("SUPABASE_ANON_KEY is missing from backend/.env!");
    }

    // Upload image to the 'homepage-posters' Supabase Storage bucket
    const fileExt = req.file.mimetype.split("/")[1] || "jpeg";
    const fileName = `poster_${managerType}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("homepage-posters")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase Storage Error:", uploadError);
      throw new Error("Failed to upload image to bucket");
    }

    const { data: publicUrlData } = supabase.storage
      .from("homepage-posters")
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    // Upsert poster record
    const { rows } = await pool.query(
      `INSERT INTO homepage_posters (type, image_url, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (type) DO UPDATE SET
         image_url = EXCLUDED.image_url,
         updated_at = NOW()
       RETURNING *`,
      [managerType, imageUrl]
    );

    return res.json({
      message: "Poster updated successfully!",
      poster: rows[0],
    });
  } catch (err) {
    console.error("POST /api/homepage-poster error:", err);
    return res.status(500).json({ error: "Failed to update poster." });
  }
});

module.exports = router;
