const Joi = require("joi");

const mobile10 = Joi.string()
  .pattern(/^[6-9]\d{9}$/)
  .message("Enter a valid 10-digit mobile number");

/* ── Create vendor request (public signup) ────────────────────────── */
const createVendorRequestSchema = Joi.object({
  ownerName:   Joi.string().trim().min(2).max(100).required().messages({
    "any.required": "Owner name is required",
    "string.min": "Owner name must be at least 2 characters"
  }),
  ownerMobile: mobile10.required().messages({ "any.required": "Mobile number is required" }),
  ownerEmail:  Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required().messages({
    "string.email": "Enter a valid email address",
    "any.required": "Email is required"
  }),
  password:    Joi.string().min(6).max(128).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required"
  }),
  vendorType:  Joi.string().valid("food", "store").required().messages({
    "any.only": "Vendor type must be food or store",
    "any.required": "Vendor type is required"
  }),
  requestType: Joi.string().valid("vendor", "student").optional().default("vendor"),
  collegeName: Joi.string().trim().max(150).optional().allow("", null)
});

/* ── Edit vendor request (manager updates name/email/mobile) ──────── */
const editVendorRequestSchema = Joi.object({
  owner_name:   Joi.string().trim().min(2).max(100).optional(),
  owner_email:  Joi.string().email({ tlds: { allow: false } }).lowercase().trim().optional(),
  owner_mobile: mobile10.optional()
}).min(1).messages({ "object.min": "At least one field must be provided to update" });

module.exports = { createVendorRequestSchema, editVendorRequestSchema };
