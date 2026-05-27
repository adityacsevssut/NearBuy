const Joi = require("joi");

const indianMobile = Joi.string()
  .pattern(/^[6-9]\d{9}$/)
  .message("Must be a valid 10-digit Indian mobile number");

/* ── Order item sub-schema ────────────────────────────────────────── */
const orderItemSchema = Joi.object({
  id:             Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  name:           Joi.string().trim().min(1).required(),
  price:          Joi.number().min(0).required(),
  qty:            Joi.number().integer().min(1).required(),
  image:          Joi.string().optional().allow("", null),
  type:           Joi.string().valid("veg", "non-veg").optional(),
  restaurantId:   Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
  restaurantName: Joi.string().optional().allow("", null),
  section:        Joi.string().optional().allow("", null)
});

/* ── Create order ─────────────────────────────────────────────────── */
const createOrderSchema = Joi.object({
  vendor_id:            Joi.string().uuid().required().messages({
    "string.guid": "Valid vendor ID is required",
    "any.required": "vendor_id is required"
  }),
  items:                Joi.array().items(orderItemSchema).min(1).required().messages({
    "array.min": "Order must contain at least one item",
    "any.required": "items are required"
  }),
  subtotal:             Joi.number().min(0).required(),
  gst:                  Joi.number().min(0).required(),
  platform_fee:         Joi.number().min(0).required(),
  total_amount:         Joi.number().min(0).required(),
  payment_method:       Joi.string().trim().min(1).required().messages({ "any.required": "Payment method is required" }),
  delivery_address:     Joi.alternatives().try(Joi.object(), Joi.string()).required().messages({ "any.required": "Delivery address is required" }),
  customer_mobile:      indianMobile.required().messages({ "any.required": "Customer mobile is required" }),
  alternate_mobile:     indianMobile.optional().allow("", null),
  cooking_instructions: Joi.string().trim().max(500).optional().allow("", null)
});

module.exports = { createOrderSchema };
