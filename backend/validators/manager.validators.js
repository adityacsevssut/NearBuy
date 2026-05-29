const Joi = require("joi");

const email    = Joi.string().email({ tlds: { allow: false } }).lowercase().trim();
const mobile10 = Joi.string().pattern(/^[6-9]\d{9}$/).message("Enter a valid 10-digit mobile number");

/* ── Create manager ───────────────────────────────────────────────── */
const createManagerSchema = Joi.object({
  email:       email.required().messages({ "any.required": "Email is required" }),
  password:    Joi.string().min(8).max(128).required().messages({
    "string.min": "Password must be at least 8 characters",
    "any.required": "Password is required"
  }),
  managerType: Joi.string().valid("food", "medicine", "store").required().messages({
    "any.only": "Manager type must be food, medicine, or store",
    "any.required": "Manager type is required"
  })
});

/* ── Update manager ───────────────────────────────────────────────── */
const updateManagerSchema = Joi.object({
  email:       email.optional(),
  password:    Joi.string().min(8).max(128).optional().messages({ "string.min": "Password must be at least 8 characters" }),
  managerType: Joi.string().valid("food", "medicine", "store").optional()
}).min(1).messages({ "object.min": "At least one field must be provided to update" });

/* ── Create vendor account (by manager) ───────────────────────────── */
const createVendorAccountSchema = Joi.object({
  businessName: Joi.string().trim().min(1).max(150).required().messages({ "any.required": "Business name is required" }),
  ownerName:    Joi.string().trim().min(2).max(100).required().messages({ "any.required": "Owner name is required" }),
  email:        email.required().messages({ "any.required": "Email is required" }),
  password:     Joi.string().min(6).max(128).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required"
  }),
  mobile: mobile10.optional().allow("", null)
});

/* ── Edit vendor account (by manager) ────────────────────────────── */
const editVendorAccountSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(50).optional(),
  lastName:  Joi.string().trim().max(50).optional().allow("", null),
  email:     email.optional(),
  mobile:    mobile10.optional().allow("", null),
  password:  Joi.string().min(6).max(128).optional().messages({ "string.min": "Password must be at least 6 characters" })
}).min(1).messages({ "object.min": "At least one field must be provided to update" });

/* ── Update global settings (platform fee & GST) ─────────────────── */
const updateSettingsSchema = Joi.object({
  platform_fee: Joi.number().min(0).max(10000).required().messages({
    "any.required": "platform_fee is required",
    "number.min": "platform_fee cannot be negative"
  }),
  gst: Joi.number().min(0).max(100).required().messages({
    "any.required": "gst is required",
    "number.min": "GST cannot be negative",
    "number.max": "GST cannot exceed 100%"
  }),
  instagram_link: Joi.string().uri().allow("", null).optional(),
  food_email: email.allow("", null).optional(),
  medicine_email: email.allow("", null).optional(),
  store_email: email.allow("", null).optional()
});

module.exports = {
  createManagerSchema,
  updateManagerSchema,
  createVendorAccountSchema,
  editVendorAccountSchema,
  updateSettingsSchema
};
