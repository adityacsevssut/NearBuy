const Joi = require("joi");

/* ── Upsert vendor profile ────────────────────────────────────────── */
const upsertProfileSchema = Joi.object({
  restaurant_name:    Joi.string().trim().min(1).max(150).optional().allow("", null),
  cuisine:            Joi.string().trim().max(120).optional().allow("", null),
  delivery_time:      Joi.string().trim().max(30).optional().allow("", null),
  min_order:          Joi.number().integer().min(0).optional().allow(null, ""),
  offer:              Joi.string().trim().max(200).optional().allow("", null),
  badge:              Joi.string().trim().max(50).optional().allow("", null),
  gps_address:        Joi.string().trim().max(300).optional().allow("", null),
  manual_address:     Joi.string().trim().max(300).optional().allow("", null),
  latitude:           Joi.number().min(-90).max(90).optional().allow(null, ""),
  longitude:          Joi.number().min(-180).max(180).optional().allow(null, ""),
  pincode:            Joi.string().trim().max(10).optional().allow("", null),
  landmark:           Joi.string().trim().max(150).optional().allow("", null),
  rating:             Joi.number().min(0).max(5).optional().allow(null, ""),
  is_open:            Joi.boolean().optional(),
  delivery_range:     Joi.number().min(0).max(100).optional().allow(null, ""),
  existing_image_url: Joi.string().uri().optional().allow("", null)
});

module.exports = { upsertProfileSchema };
