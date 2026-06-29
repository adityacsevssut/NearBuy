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

// Redis cache integration
const redis = require("../config/redis");
const CACHE_TTL = 300; // 5 minutes in seconds

// ── GET /api/homepage-poster?type=food|store  (public) ───────────────
router.get("/", async (req, res) => {
  try {
    const type = (req.query.type || "food").toLowerCase();
    
    // Set Cache-Control header so the browser/CDN caches the response for 5 minutes
    res.set("Cache-Control", "public, max-age=300");

    const cacheKey = `posters_${type}`;

    // Return from Redis cache if valid
    if (redis) {
      try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          const data = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
          return res.json({ posters: data });
        }
      } catch (err) {
        console.error("Redis get error:", err.message);
      }
    }

    const { rows } = await pool.query(
      "SELECT * FROM homepage_carousel_posters WHERE type = $1 ORDER BY created_at ASC",
      [type]
    );
    
    // Update cache
    if (redis) {
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(rows));
      } catch (err) {
        console.error("Redis set error:", err.message);
      }
    }

    // Even if no rows exist, return empty array
    return res.json({ posters: rows });
  } catch (err) {
    console.error("GET /api/homepage-poster error:", err);
    return res.status(500).json({ error: "Failed to load posters." });
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

    const theme = req.body.theme === "dark" ? "dark" : "light";
    const posterId = req.body.id; // Optional: if editing an existing poster

    // Upload image to the 'homepage-posters' Supabase Storage bucket
    const fileExt = req.file.mimetype.split("/")[1] || "jpeg";
    const fileName = `poster_${managerType}_${theme}_${Date.now()}.${fileExt}`;

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

    let query, params;
    if (posterId) {
      // Update existing poster
      if (theme === "dark") {
        query = `
          UPDATE homepage_carousel_posters 
          SET dark_image_url = $1, updated_at = NOW() 
          WHERE id = $2 AND type = $3 
          RETURNING *`;
      } else {
        query = `
          UPDATE homepage_carousel_posters 
          SET image_url = $1, updated_at = NOW() 
          WHERE id = $2 AND type = $3 
          RETURNING *`;
      }
      params = [imageUrl, posterId, managerType];
    } else {
      // Create new poster
      if (theme === "dark") {
        query = `
          INSERT INTO homepage_carousel_posters (type, dark_image_url, created_at, updated_at)
          VALUES ($1, $2, NOW(), NOW())
          RETURNING *`;
      } else {
        query = `
          INSERT INTO homepage_carousel_posters (type, image_url, created_at, updated_at)
          VALUES ($1, $2, NOW(), NOW())
          RETURNING *`;
      }
      params = [managerType, imageUrl];
    }

    const { rows } = await pool.query(query, params);

    if (rows.length === 0) {
       return res.status(404).json({ error: "Poster not found or could not be updated." });
    }

    // Clear cache to reflect updates
    if (redis) {
      try {
        await redis.del(`posters_${managerType}`);
      } catch (err) {
        console.error("Redis del error:", err.message);
      }
    }

    return res.json({
      message: "Poster updated successfully!",
      poster: rows[0],
    });
  } catch (err) {
    console.error("POST /api/homepage-poster error:", err);
    return res.status(500).json({ error: "Failed to update poster." });
  }
});

// ── DELETE /api/homepage-poster/:id  (manager / admin only) ────────────────────────
router.delete("/:id", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }
    const { id } = req.params;
    const managerType = (req.user.manager_type || "food").toLowerCase();

    const { rows } = await pool.query(
      "DELETE FROM homepage_carousel_posters WHERE id = $1 AND type = $2 RETURNING *",
      [id, managerType]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Poster not found" });
    }

    // Clear cache to reflect updates
    if (redis) {
      try {
        await redis.del(`posters_${managerType}`);
      } catch (err) {
        console.error("Redis del error:", err.message);
      }
    }

    return res.json({ message: "Poster deleted successfully!" });
  } catch (err) {
    console.error("DELETE /api/homepage-poster error:", err);
    return res.status(500).json({ error: "Failed to delete poster." });
  }
});

module.exports = router;
