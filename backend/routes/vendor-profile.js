const express = require("express");
const router = express.Router();
const multer = require("multer");
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase Storage client
// NOTE: These must be added to .env!
const supabase = createClient(
  process.env.SUPABASE_URL || "https://cwaiqkgimqdjsznrizgt.supabase.co", 
  process.env.SUPABASE_ANON_KEY || "dummy_key"
);

// We use memory storage to buffer the file before pushing to the bucket
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// GET /api/vendor-profile
router.get("/", authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM vendor_profiles WHERE user_id = $1",
      [req.user.id]
    );
    if (!rows.length) {
      return res.json({ profile: null });
    }
    return res.json({ profile: rows[0] });
  } catch (err) {
    console.error("GET /api/vendor-profile error:", err);
    return res.status(500).json({ error: "Failed to load profile." });
  }
});

// POST /api/vendor-profile
router.post("/", authenticate, upload.single("image"), async (req, res) => {
  try {
    console.log("POST /api/vendor-profile body:", req.body);
    
    // Fetch existing profile to prevent overwriting missing fields with empty values
    const existingRes = await pool.query(
      "SELECT * FROM vendor_profiles WHERE user_id = $1",
      [req.user.id]
    );
    const existing = existingRes.rows[0] || {};

    const {
      restaurant_name,
      cuisine,
      delivery_time,
      min_order,
      offer,
      badge,
      gps_address,
      manual_address,
      latitude,
      longitude,
      pincode,
      landmark,
      rating,
      is_open,
      delivery_range,
    } = req.body;

    // Merge incoming values with existing ones
    const final_restaurant_name = restaurant_name !== undefined ? restaurant_name : (existing.restaurant_name || "");
    const final_cuisine = cuisine !== undefined ? cuisine : (existing.cuisine || "");
    const final_delivery_time = delivery_time !== undefined ? delivery_time : (existing.delivery_time || "30-45 min");
    const parsedMinOrder = parseInt(min_order);
    const final_min_order = !isNaN(parsedMinOrder) ? parsedMinOrder : (existing.min_order || 0);
    const final_offer = offer !== undefined ? offer : (existing.offer || "");
    const final_badge = badge !== undefined ? badge : (existing.badge || "");
    
    const final_gps_address = gps_address !== undefined ? gps_address : (existing.gps_address || "");
    const final_manual_address = manual_address !== undefined ? manual_address : (existing.manual_address || "");
    
    const parsedLat = parseFloat(latitude);
    const final_latitude = !isNaN(parsedLat) ? parsedLat : (existing.latitude !== null && existing.latitude !== undefined ? parseFloat(existing.latitude) : null);
    
    const parsedLng = parseFloat(longitude);
    const final_longitude = !isNaN(parsedLng) ? parsedLng : (existing.longitude !== null && existing.longitude !== undefined ? parseFloat(existing.longitude) : null);
    
    const final_pincode = pincode !== undefined ? pincode : (existing.pincode || "");
    const final_landmark = landmark !== undefined ? landmark : (existing.landmark || "");
    
    const parsedRating = parseFloat(rating);
    const final_rating = !isNaN(parsedRating) ? parsedRating : (existing.rating !== null && existing.rating !== undefined ? parseFloat(existing.rating) : 0.0);

    const is_open_val = is_open !== undefined && is_open !== ""
      ? (is_open === "true" || is_open === true) 
      : (existing.is_open !== undefined ? existing.is_open : true);

    const parsedDeliveryRange = parseFloat(delivery_range);
    const delivery_range_val = !isNaN(parsedDeliveryRange)
      ? parsedDeliveryRange 
      : (existing.delivery_range !== undefined && existing.delivery_range !== null ? parseFloat(existing.delivery_range) : 5.0);

    let imageUrl = existing.image_url || "";
    if (req.body.existing_image_url !== undefined) {
      imageUrl = req.body.existing_image_url;
    }

    // If a new file is uploaded, push it to Supabase bucket
    if (req.file) {
      if (!process.env.SUPABASE_ANON_KEY) {
        throw new Error("SUPABASE_ANON_KEY is missing from backend/.env! Cannot upload to bucket.");
      }

      // Generate a unique filename: user_id + timestamp
      const fileExt = req.file.mimetype.split("/")[1] || "jpeg";
      const fileName = `vendor_${req.user.id}_${Date.now()}.${fileExt}`;

      // Upload to 'vendor-images' bucket
      const { data, error } = await supabase.storage
        .from("vendor-images")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (error) {
        console.error("Supabase Storage Error:", error);
        throw new Error("Failed to upload image to bucket");
      }

      // Get the public URL for the uploaded image
      const { data: publicUrlData } = supabase.storage
        .from("vendor-images")
        .getPublicUrl(fileName);
        
      imageUrl = publicUrlData.publicUrl;
    }

    const { rows } = await pool.query(
      `INSERT INTO vendor_profiles (
        user_id, restaurant_name, cuisine, delivery_time, min_order, 
        offer, badge, image_url, gps_address, manual_address, 
        latitude, longitude, pincode, landmark, rating, is_open, delivery_range
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       ON CONFLICT (user_id) DO UPDATE SET
        restaurant_name = EXCLUDED.restaurant_name,
        cuisine = EXCLUDED.cuisine,
        delivery_time = EXCLUDED.delivery_time,
        min_order = EXCLUDED.min_order,
        offer = EXCLUDED.offer,
        badge = EXCLUDED.badge,
        image_url = EXCLUDED.image_url,
        gps_address = EXCLUDED.gps_address,
        manual_address = EXCLUDED.manual_address,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        pincode = EXCLUDED.pincode,
        landmark = EXCLUDED.landmark,
        rating = EXCLUDED.rating,
        is_open = EXCLUDED.is_open,
        delivery_range = EXCLUDED.delivery_range,
        updated_at = NOW()
       RETURNING *`,
      [
        req.user.id,
        final_restaurant_name,
        final_cuisine,
        final_delivery_time,
        final_min_order,
        final_offer,
        final_badge,
        imageUrl,
        final_gps_address,
        final_manual_address,
        final_latitude,
        final_longitude,
        final_pincode,
        final_landmark,
        final_rating,
        is_open_val,
        delivery_range_val,
      ]
    );

    return res.json({
      message: "Profile updated successfully!",
      profile: rows[0],
    });
  } catch (err) {
    console.error("POST /api/vendor-profile error:", err);
    return res.status(500).json({ error: "Failed to update profile." });
  }
});

// DELETE /api/vendor-profile
router.delete("/", authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "DELETE FROM vendor_profiles WHERE user_id = $1 RETURNING *",
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "No profile found to delete." });
    }
    return res.json({ message: "Storefront deleted successfully!" });
  } catch (err) {
    console.error("DELETE /api/vendor-profile error:", err);
    return res.status(500).json({ error: "Failed to delete profile." });
  }
});

module.exports = router;
