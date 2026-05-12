const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const { body, validationResult } = require("express-validator");

const pool = require("../config/db");
const { sendOtpEmail } = require("../config/mailer");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// ── Helper: generate 6-digit OTP ──────────────────────────────────────────
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── Helper: hash a value ──────────────────────────────────────────────────
async function hashValue(value) {
  return bcrypt.hash(value, 10);
}

// ── Helper: issue tokens and store refresh token ──────────────────────────
async function issueTokens(user, client) {
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const tokenHash    = crypto.createHash("sha256").update(refreshToken).digest("hex");

  await (client || pool).query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
    [user.id, tokenHash]
  );

  return { accessToken, refreshToken };
}

// ── Helper: safe user object (strip secrets) ─────────────────────────────
function safeUser(u) {
  return {
    id: u.id, firstName: u.first_name, lastName: u.last_name,
    email: u.email, mobile: u.mobile, avatar: u.avatar_url, role: u.role,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/send-otp
// Sends OTP to email — used for both signup verification and password reset
// ════════════════════════════════════════════════════════════════════════════
router.post(
  "/send-otp",
  [
    body("email").isEmail().normalizeEmail(),
    body("purpose").isIn(["signup", "reset"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { email, purpose } = req.body;
    try {
      // For reset OTP, user must exist
      if (purpose === "reset") {
        const { rows } = await pool.query("SELECT id FROM users WHERE email=$1 AND is_active=TRUE", [email]);
        if (!rows.length) return res.status(404).json({ error: "No account found with this email." });
      }
      // For signup OTP, email must NOT exist
      if (purpose === "signup") {
        const { rows } = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
        if (rows.length) return res.status(409).json({ error: "An account with this email already exists. Please log in." });
      }

      const otp = generateOtp();
      const otpHash = await hashValue(otp);

      // Invalidate old OTPs for this identifier + purpose
      await pool.query("UPDATE otps SET used=TRUE WHERE identifier=$1 AND purpose=$2 AND used=FALSE", [email, purpose]);

      // Insert new OTP
      await pool.query(
        "INSERT INTO otps (identifier, otp_hash, purpose) VALUES ($1, $2, $3)",
        [email, otpHash, purpose]
      );

      await sendOtpEmail(email, otp, purpose === "reset" ? "reset" : "verify");

      return res.json({ message: "OTP sent to your email." });
    } catch (err) {
      console.error("send-otp error:", err);
      return res.status(500).json({ error: "Failed to send OTP. Try again." });
    }
  }
);

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/verify-otp
// Verifies OTP without consuming it — returns a short-lived verification token
// ════════════════════════════════════════════════════════════════════════════
router.post(
  "/verify-otp",
  [body("email").isEmail().normalizeEmail(), body("otp").isLength({ min: 6, max: 6 }), body("purpose").isIn(["signup", "reset"])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { email, otp, purpose } = req.body;
    try {
      const { rows } = await pool.query(
        "SELECT * FROM otps WHERE identifier=$1 AND purpose=$2 AND used=FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
        [email, purpose]
      );
      if (!rows.length) return res.status(400).json({ error: "OTP expired or invalid. Please request a new one." });

      const match = await bcrypt.compare(otp, rows[0].otp_hash);
      if (!match) return res.status(400).json({ error: "Incorrect OTP. Please try again." });

      // Mark OTP as used
      await pool.query("UPDATE otps SET used=TRUE WHERE id=$1", [rows[0].id]);

      // Issue a short-lived verification token so next step is secure
      const verificationToken = signAccessToken({ email, purpose, verified: true });

      return res.json({ verified: true, verificationToken });
    } catch (err) {
      console.error("verify-otp error:", err);
      return res.status(500).json({ error: "OTP verification failed." });
    }
  }
);

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/signup
// Step 2 — create user account after OTP verified
// ════════════════════════════════════════════════════════════════════════════
router.post(
  "/signup",
  [
    body("verificationToken").notEmpty(),
    body("firstName").trim().notEmpty().withMessage("First name is required"),
    body("lastName").trim().notEmpty().withMessage("Last name is required"),
    body("mobile").optional().isMobilePhone(),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { verificationToken, firstName, lastName, mobile, password } = req.body;
    try {
      // Decode verification token
      const { verifyAccessToken } = require("../utils/jwt");
      let decoded;
      try {
        decoded = verifyAccessToken(verificationToken);
      } catch {
        return res.status(401).json({ error: "Verification token expired. Please verify OTP again." });
      }

      if (decoded.purpose !== "signup" || !decoded.verified) {
        return res.status(400).json({ error: "Invalid verification token." });
      }

      const email = decoded.email;

      // Double-check email uniqueness
      const existing = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
      if (existing.rows.length) return res.status(409).json({ error: "Account already exists." });

      const passwordHash = await hashValue(password);
      const { rows } = await pool.query(
        `INSERT INTO users (first_name, last_name, email, mobile, password_hash, is_verified)
         VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING *`,
        [firstName, lastName, email, mobile || null, passwordHash]
      );

      const user = rows[0];
      const { accessToken, refreshToken } = await issueTokens(user);

      return res.status(201).json({
        message: "Account created successfully!",
        user: safeUser(user),
        accessToken,
        refreshToken,
      });
    } catch (err) {
      console.error("signup error:", err);
      return res.status(500).json({ error: "Signup failed. Please try again." });
    }
  }
);

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/login
// Email + password login
// ════════════════════════════════════════════════════════════════════════════
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { email, password } = req.body;
    try {
      const { rows } = await pool.query("SELECT * FROM users WHERE email=$1 AND is_active=TRUE", [email]);
      if (!rows.length) return res.status(401).json({ error: "Invalid email or password." });

      const user = rows[0];
      if (!user.password_hash) {
        return res.status(400).json({ error: "This account uses Google Sign-In. Please log in with Google." });
      }
      if (!user.is_verified) {
        return res.status(403).json({ error: "Please verify your email before logging in." });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: "Invalid email or password." });

      const { accessToken, refreshToken } = await issueTokens(user);
      return res.json({ user: safeUser(user), accessToken, refreshToken });
    } catch (err) {
      console.error("login error:", err);
      return res.status(500).json({ error: "Login failed. Please try again." });
    }
  }
);

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/google
// Google OAuth — login or auto-signup
// ════════════════════════════════════════════════════════════════════════════
router.post("/google", async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: "Google ID token required." });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, given_name, family_name, picture } = ticket.getPayload();

    // Upsert user
    const { rows } = await pool.query(
      `INSERT INTO users (first_name, last_name, email, google_id, avatar_url, is_verified, password_hash)
       VALUES ($1, $2, $3, $4, $5, TRUE, NULL)
       ON CONFLICT (email) DO UPDATE SET
         google_id   = COALESCE(users.google_id, EXCLUDED.google_id),
         avatar_url  = EXCLUDED.avatar_url,
         is_verified = TRUE,
         updated_at  = NOW()
       RETURNING *`,
      [given_name, family_name || "", email, googleId, picture]
    );

    const user = rows[0];
    const { accessToken, refreshToken } = await issueTokens(user);
    return res.json({ user: safeUser(user), accessToken, refreshToken });
  } catch (err) {
    console.error("google auth error:", err);
    return res.status(401).json({ error: "Google authentication failed." });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/reset-password
// Set new password after OTP verified
// ════════════════════════════════════════════════════════════════════════════
router.post(
  "/reset-password",
  [
    body("verificationToken").notEmpty(),
    body("newPassword").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { verificationToken, newPassword } = req.body;
    try {
      const { verifyAccessToken } = require("../utils/jwt");
      let decoded;
      try {
        decoded = verifyAccessToken(verificationToken);
      } catch {
        return res.status(401).json({ error: "Verification token expired. Please request a new OTP." });
      }

      if (decoded.purpose !== "reset" || !decoded.verified) {
        return res.status(400).json({ error: "Invalid verification token." });
      }

      const passwordHash = await hashValue(newPassword);
      const { rows } = await pool.query(
        "UPDATE users SET password_hash=$1 WHERE email=$2 AND is_active=TRUE RETURNING *",
        [passwordHash, decoded.email]
      );
      if (!rows.length) return res.status(404).json({ error: "User not found." });

      // Revoke all existing refresh tokens for security
      await pool.query("DELETE FROM refresh_tokens WHERE user_id=$1", [rows[0].id]);

      return res.json({ message: "Password reset successfully. Please log in with your new password." });
    } catch (err) {
      console.error("reset-password error:", err);
      return res.status(500).json({ error: "Password reset failed. Please try again." });
    }
  }
);

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/refresh
// Refresh access token
// ════════════════════════════════════════════════════════════════════════════
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "Refresh token required." });

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const { rows } = await pool.query(
      "SELECT * FROM refresh_tokens WHERE token_hash=$1 AND expires_at > NOW()",
      [tokenHash]
    );
    if (!rows.length) return res.status(401).json({ error: "Invalid or expired refresh token." });

    const user = await pool.query("SELECT * FROM users WHERE id=$1 AND is_active=TRUE", [decoded.id]);
    if (!user.rows.length) return res.status(401).json({ error: "User not found." });

    const newAccessToken = signAccessToken({
      id: user.rows[0].id,
      email: user.rows[0].email,
      role: user.rows[0].role,
    });

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(401).json({ error: "Token refresh failed." });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/logout
// Revoke refresh token
// ════════════════════════════════════════════════════════════════════════════
router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    await pool.query("DELETE FROM refresh_tokens WHERE token_hash=$1", [tokenHash]).catch(() => {});
  }
  return res.json({ message: "Logged out." });
});

module.exports = router;
