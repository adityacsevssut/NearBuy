const Joi = require("joi");

/* ── Create service center ────────────────────────────────────────── */
const createServiceCenterSchema = Joi.object({
  name:      Joi.string().trim().min(2).max(150).required().messages({
    "any.required": "Service center name is required"
  }),
  landmark:  Joi.string().trim().max(200).optional().allow("", null),
  pincode:   Joi.string().trim().pattern(/^\d{6}$/).required().messages({
    "any.required": "Pincode is required",
    "string.pattern.base": "Pincode must be a valid 6-digit number"
  }),
  latitude:  Joi.number().min(-90).max(90).required().messages({
    "any.required": "Latitude is required",
    "number.min": "Latitude must be between -90 and 90",
    "number.max": "Latitude must be between -90 and 90"
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    "any.required": "Longitude is required",
    "number.min": "Longitude must be between -180 and 180",
    "number.max": "Longitude must be between -180 and 180"
  }),
  radius_km: Joi.number().min(0.1).max(500).optional().default(8.0)
});

/* ── Patch service center (status or radius) ──────────────────────── */
const patchServiceCenterSchema = Joi.object({
  is_active: Joi.boolean().optional(),
  radius_km: Joi.number().min(0.1).max(500).optional()
}).min(1).messages({ "object.min": "Provide is_active or radius_km to update" });

module.exports = { createServiceCenterSchema, patchServiceCenterSchema };
