const Joi = require("joi");

/* ── Create menu item ─────────────────────────────────────────────── */
const createMenuItemSchema = Joi.object({
  category:            Joi.string().trim().min(1).required().messages({ "any.required": "Category is required" }),
  name:                Joi.string().trim().min(1).max(120).required().messages({ "any.required": "Item name is required" }),
  description:         Joi.string().trim().max(500).optional().allow("", null),
  price:               Joi.number().integer().min(0).required().messages({
    "any.required": "Price is required",
    "number.min": "Price cannot be negative"
  }),
  actual_price:        Joi.number().integer().min(0).optional().allow(null, ""),
  type:                Joi.string().valid("veg", "non-veg").required().messages({
    "any.only": "Type must be 'veg' or 'non-veg'",
    "any.required": "Item type is required"
  }),
  badge:               Joi.string().trim().max(40).optional().allow("", null),
  sort_order:          Joi.number().integer().min(0).optional().allow(null, ""),
  rating:              Joi.number().min(0).max(5).optional().allow(null, ""),
  prep_time:           Joi.string().trim().max(30).optional().allow("", null),
  reviews:             Joi.number().integer().min(0).optional().allow(null, ""),
  front_page_category: Joi.string().trim().max(80).optional().allow("", null)
});

/* ── Update menu item (all fields optional) ───────────────────────── */
const updateMenuItemSchema = Joi.object({
  category:            Joi.string().trim().min(1).optional(),
  name:                Joi.string().trim().min(1).max(120).optional(),
  description:         Joi.string().trim().max(500).optional().allow("", null),
  price:               Joi.number().integer().min(0).optional(),
  actual_price:        Joi.number().integer().min(0).optional().allow(null, ""),
  type:                Joi.string().valid("veg", "non-veg").optional(),
  badge:               Joi.string().trim().max(40).optional().allow("", null),
  is_available:        Joi.boolean().optional(),
  sort_order:          Joi.number().integer().min(0).optional().allow(null, ""),
  rating:              Joi.number().min(0).max(5).optional().allow(null, ""),
  prep_time:           Joi.string().trim().max(30).optional().allow("", null),
  reviews:             Joi.number().integer().min(0).optional().allow(null, ""),
  front_page_category: Joi.string().trim().max(80).optional().allow("", null)
});

module.exports = { createMenuItemSchema, updateMenuItemSchema };
