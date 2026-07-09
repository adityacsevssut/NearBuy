const Joi = require("joi");

const email = Joi.string().email({ tlds: { allow: false } }).lowercase().trim();
const password = (min = 8) => Joi.string().min(min).max(128);
const mobile10 = Joi.string().pattern(/^[6-9]\d{9}$/).message("Enter a valid 10-digit mobile number");

/* ── send-otp ─────────────────────────────────────────────────────── */
const sendOtpSchema = Joi.object({
  purpose: Joi.string().valid("signup", "reset").required().messages({
    "any.only": "purpose must be 'signup' or 'reset'",
    "any.required": "purpose is required"
  }),
  email: Joi.when("purpose", {
    is: "signup",
    then: email.required().messages({ "any.required": "Email is required" }),
    otherwise: email.required().messages({ "any.required": "Email is required" })
  }),
  mobile: Joi.when("purpose", {
    is: "signup",
    then: mobile10.required().messages({ "any.required": "Mobile number is required" }),
    otherwise: Joi.optional()
  })
});

/* ── verify-otp ───────────────────────────────────────────────────── */
const verifyOtpSchema = Joi.object({
  email: email.required().messages({ "any.required": "Email is required" }),
  mobile: Joi.string().optional(),
  otp: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    "string.length": "OTP must be exactly 6 digits",
    "string.pattern.base": "OTP must be exactly 6 digits",
    "any.required": "OTP is required"
  }),
  purpose: Joi.string().valid("signup", "reset").required()
});

/* ── signup ───────────────────────────────────────────────────────── */
const signupSchema = Joi.object({
  verificationToken: Joi.string().required().messages({
    "any.required": "Verification token is required"
  }),
  firstName: Joi.string().trim().min(1).max(50).required().messages({
    "any.required": "First name is required",
    "string.empty": "First name is required"
  }),
  lastName: Joi.string().trim().min(1).max(50).required().messages({
    "any.required": "Last name is required",
    "string.empty": "Last name is required"
  }),
  mobile: mobile10.optional(),
  password: password(8).required().messages({
    "string.min": "Password must be at least 8 characters",
    "any.required": "Password is required"
  })
});

/* signup-firebase schema removed — mobile OTP feature disabled; email OTP flow is used instead */

/* ── login ────────────────────────────────────────────────────────── */
const loginSchema = Joi.object({
  email:    email.required().messages({ "any.required": "Email is required" }),
  password: Joi.string().min(1).required().messages({ "any.required": "Password is required" })
});

/* ── vendor-login / manager-login ─────────────────────────────────── */
const typedLoginSchema = Joi.object({
  email:    email.required(),
  password: Joi.string().min(1).required(),
  type:     Joi.string().min(1).required().messages({ "any.required": "Vendor type is required" })
});

/* ── reset-password ───────────────────────────────────────────────── */
const resetPasswordSchema = Joi.object({
  verificationToken: Joi.string().required(),
  newPassword: password(8).required().messages({
    "string.min": "Password must be at least 8 characters",
    "any.required": "New password is required"
  })
});

/* ── update location ──────────────────────────────────────────────── */
const updateLocationSchema = Joi.object({
  locationName: Joi.string().trim().min(1).required().messages({
    "any.required": "Location name is required",
    "string.empty": "Location name is required"
  }),
  pincode:   Joi.string().optional().allow("", null),
  landmark:  Joi.string().optional().allow("", null),
  latitude:  Joi.number().min(-90).max(90).optional().allow(null),
  longitude: Joi.number().min(-180).max(180).optional().allow(null)
});

/* ── update profile ──────────────────────────────────────────────── */
const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(50).required().messages({
    "any.required": "First name is required",
    "string.empty": "First name is required",
    "string.max": "First name must be 50 characters or fewer"
  }),
  lastName: Joi.string().trim().min(0).max(50).allow("", null).optional()
});

/* ── save address ─────────────────────────────────────────────────── */
const saveAddressSchema = Joi.object({
  name:        Joi.string().trim().min(1).required().messages({ "any.required": "Address name is required" }),
  fullAddress: Joi.string().optional().allow("", null),
  pincode:     Joi.string().optional().allow("", null),
  landmark:    Joi.string().optional().allow("", null),
  latitude:    Joi.number().min(-90).max(90).optional().allow(null),
  longitude:   Joi.number().min(-180).max(180).optional().allow(null)
});

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
  signupSchema,
  loginSchema,
  typedLoginSchema,
  resetPasswordSchema,
  updateLocationSchema,
  saveAddressSchema,
  updateProfileSchema
};
