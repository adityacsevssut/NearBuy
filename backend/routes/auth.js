const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const validate = require("../middleware/validate");
const {
  sendOtpSchema, verifyOtpSchema, signupSchema, signupFirebaseSchema,
  loginSchema, typedLoginSchema, resetPasswordSchema,
  updateLocationSchema, saveAddressSchema, updateProfileSchema
} = require("../validators/auth.validators");

const pool = require("../config/db");
const { sendOtpEmail, sendWelcomeEmail } = require("../config/mailer");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { authenticate } = require("../middleware/auth");

// Comma-separated list allowed (e.g. web + staging). Must include the same client id as
// NEXT_PUBLIC_GOOGLE_CLIENT_ID on the frontend or verifyIdToken returns 401.
// Strips wrapping quotes (common when pasting from Vercel / docs).
function normalizeGoogleClientIds() {
  return (process.env.GOOGLE_CLIENT_ID || "")
    .split(",")
    .map((s) =>
      s
        .trim()
        .replace(/^["']+|["']+$/g, "")
        .trim()
    )
    .filter(Boolean);
}
const GOOGLE_CLIENT_IDS = normalizeGoogleClientIds();
const googleClient =
  GOOGLE_CLIENT_IDS.length > 0 ? new OAuth2Client(GOOGLE_CLIENT_IDS[0]) : null;

// ── Helper: generate 6-digit OTP (cryptographically secure) ──────────────
function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

// ── Helper: hash a value ──────────────────────────────────────────────────
async function hashValue(value) {
  return bcrypt.hash(value, 10);
}

// ── Helper: issue tokens and store refresh token ──────────────────────────
async function issueTokens(user, client) {
  const payload = { id: user.id, email: user.email, role: user.role, manager_type: user.manager_type };
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
    manager_type: u.manager_type,
    service_center_id: u.service_center_id || null,
    locationName: u.location_name,
    pincode: u.pincode,
    landmark: u.landmark,
    latitude: u.latitude ? parseFloat(u.latitude) : null,
    longitude: u.longitude ? parseFloat(u.longitude) : null,
    notifications_enabled: u.notifications_enabled
  };
}

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/send-otp
// signup → sends SMS OTP to mobile
// reset  → sends email OTP to email (unchanged)
// ════════════════════════════════════════════════════════════════════════════
router.post(
  "/send-otp",
  validate(sendOtpSchema),
  async (req, res) => {

    const { email, mobile, purpose } = req.body;

    try {
      // ── SIGNUP: OTP via SMS to mobile ──────────────────────────────────
      if (purpose === "signup") {
        if (!email || !mobile) return res.status(400).json({ error: "Email and mobile number are required." });
        if (!/^[0-9]{10}$/.test(mobile)) return res.status(400).json({ error: "Enter a valid 10-digit mobile number." });

        // Email must not already exist
        const emailCheck = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
        if (emailCheck.rows.length) return res.status(409).json({ error: "An account with this email already exists. Please log in." });

        // Mobile must not already exist
        const mobileCheck = await pool.query("SELECT id FROM users WHERE mobile=$1", [mobile]);
        if (mobileCheck.rows.length) return res.status(409).json({ error: "An account with this mobile number already exists." });

        const otp = generateOtp();
        const otpHash = await hashValue(otp);

        // Invalidate old OTPs for this email + purpose
        await pool.query("UPDATE otps SET used=TRUE WHERE identifier=$1 AND purpose=$2 AND used=FALSE", [email, purpose]);
        await pool.query("INSERT INTO otps (identifier, otp_hash, purpose) VALUES ($1, $2, $3)", [email, otpHash, purpose]);

        await sendOtpEmail(email, otp, "verify");
        return res.json({ message: "OTP sent to your email." });
      }

      // ── RESET: OTP via email (unchanged) ───────────────────────────────
      if (purpose === "reset") {
        if (!email) return res.status(400).json({ error: "Email is required." });

        const { rows } = await pool.query("SELECT id FROM users WHERE email=$1 AND is_active=TRUE", [email]);
        if (!rows.length) return res.status(404).json({ error: "No account found with this email." });

        const otp = generateOtp();
        const otpHash = await hashValue(otp);

        await pool.query("UPDATE otps SET used=TRUE WHERE identifier=$1 AND purpose=$2 AND used=FALSE", [email, purpose]);
        await pool.query("INSERT INTO otps (identifier, otp_hash, purpose) VALUES ($1, $2, $3)", [email, otpHash, purpose]);

        await sendOtpEmail(email, otp, "reset");
        return res.json({ message: "OTP sent to your email." });
      }
    } catch (err) {
      console.error("send-otp error:", err);
      return res.status(500).json({ error: "Failed to send OTP. " + (err.message || "Try again.") });
    }
  }
);

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/verify-otp
// signup → looks up OTP by mobile
// reset  → looks up OTP by email
// ════════════════════════════════════════════════════════════════════════════
router.post(
  "/verify-otp",
  validate(verifyOtpSchema),
  async (req, res) => {

    const { email, mobile, otp, purpose } = req.body;

    const identifier = email;
    if (!identifier) return res.status(400).json({ error: "Email required." });

    try {
      const { rows } = await pool.query(
        "SELECT * FROM otps WHERE identifier=$1 AND purpose=$2 AND used=FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
        [identifier, purpose]
      );
      if (!rows.length) return res.status(400).json({ error: "OTP expired or invalid. Please request a new one." });

      const match = await bcrypt.compare(otp, rows[0].otp_hash);
      if (!match) return res.status(400).json({ error: "Incorrect OTP. Please try again." });

      // Mark OTP as used
      await pool.query("UPDATE otps SET used=TRUE WHERE id=$1", [rows[0].id]);

      // Token payload includes email (for account creation) and mobile (for verification)
      const tokenPayload = purpose === "signup"
        ? { email, mobile, purpose, verified: true }
        : { email: identifier, purpose, verified: true };

      const verificationToken = signAccessToken(tokenPayload);
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
  validate(signupSchema),
  async (req, res) => {

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

      // Trigger Welcome Email via ZeptoMail
      sendWelcomeEmail(user.email, user.first_name);

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
// POST /api/auth/signup-firebase
// Step 2 — create user account after Firebase OTP verified on frontend
// ════════════════════════════════════════════════════════════════════════════
router.post(
  "/signup-firebase",
  validate(signupFirebaseSchema),
  async (req, res) => {

    const { firstName, lastName, email, mobile, password } = req.body;
    try {
      // For this implementation, we trust the frontend verified the phone number via Firebase.
      const existing = await pool.query("SELECT id FROM users WHERE email=$1 OR mobile=$2", [email, mobile]);
      if (existing.rows.length) return res.status(409).json({ error: "Account with this email or mobile already exists." });

      const passwordHash = await hashValue(password);
      const { rows } = await pool.query(
        `INSERT INTO users (first_name, last_name, email, mobile, password_hash, is_verified)
         VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING *`,
        [firstName, lastName, email, mobile, passwordHash]
      );

      const user = rows[0];
      const { accessToken, refreshToken } = await issueTokens(user);

      // Trigger Welcome Email via ZeptoMail
      sendWelcomeEmail(user.email, user.first_name);

      return res.status(201).json({
        message: "Account created successfully!",
        user: safeUser(user),
        accessToken,
        refreshToken,
      });
    } catch (err) {
      console.error("firebase signup error:", err);
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
  validate(loginSchema),
  async (req, res) => {

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
// POST /api/auth/vendor-login
// Email + password login for Vendors
// ════════════════════════════════════════════════════════════════════════════
router.post(
  "/vendor-login",
  validate(typedLoginSchema),
  async (req, res) => {

    const { email, password, type } = req.body;
    try {
      const { rows } = await pool.query("SELECT * FROM users WHERE email=$1 AND is_active=TRUE", [email]);
      if (!rows.length) return res.status(401).json({ error: "Invalid email or password." });

      const user = rows[0];
      if (user.role !== 'vendor') {
        return res.status(403).json({ error: "Access denied. Not a vendor account." });
      }

      // Check type if it is set in DB (some vendors might not have manager_type set yet)
      if (user.manager_type && user.manager_type.toLowerCase() !== type.toLowerCase()) {
        return res.status(403).json({ error: `Access denied. Not a ${type} vendor.` });
      }

      if (!user.password_hash) {
        return res.status(400).json({ error: "This account uses Google Sign-In. Please log in with Google." });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: "Invalid email or password." });

      const { accessToken, refreshToken } = await issueTokens(user);
      return res.json({ user: safeUser(user), accessToken, refreshToken });
    } catch (err) {
      console.error("vendor login error:", err);
      return res.status(500).json({ error: "Login failed. Please try again." });
    }
  }
);

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/manager-login
// Email + password login for Managers
// ════════════════════════════════════════════════════════════════════════════
router.post(
  "/manager-login",
  validate(typedLoginSchema),
  async (req, res) => {

    const { email, password, type } = req.body;
    try {
      const { rows } = await pool.query("SELECT * FROM users WHERE email=$1 AND is_active=TRUE", [email]);
      if (!rows.length) return res.status(401).json({ error: "Invalid email or password." });

      const user = rows[0];
      if (user.role !== 'admin' && user.role !== 'manager') {
        return res.status(403).json({ error: "Access denied. Not a manager account." });
      }

      if (user.manager_type && user.manager_type.toLowerCase() !== type.toLowerCase()) {
        return res.status(403).json({ error: `Access denied. Account is not assigned to the ${type} division.` });
      }

      if (!user.password_hash) {
        return res.status(400).json({ error: "This account uses Google Sign-In. Please log in with Google." });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: "Invalid email or password." });

      const { accessToken, refreshToken } = await issueTokens(user);
      return res.json({ user: safeUser(user), accessToken, refreshToken });
    } catch (err) {
      console.error("manager login error:", err);
      return res.status(500).json({ error: "Login failed. Please try again." });
    }
  }
);

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/google
// Google OAuth — login or auto-signup
// ════════════════════════════════════════════════════════════════════════════
router.post("/google", async (req, res) => {
  const { idToken, accessToken } = req.body;
  if (!idToken && !accessToken) {
    return res.status(400).json({ error: "Provide Google idToken or accessToken." });
  }
  if (!googleClient || GOOGLE_CLIENT_IDS.length === 0) {
    return res.status(503).json({
      error: "Google sign-in is not configured. Set GOOGLE_CLIENT_ID on the server (same value as NEXT_PUBLIC_GOOGLE_CLIENT_ID on the frontend).",
    });
  }

  try {
    let googleId;
    let email;
    let given_name;
    let family_name;
    let picture;

    if (idToken) {
      const audience =
        GOOGLE_CLIENT_IDS.length === 1 ? GOOGLE_CLIENT_IDS[0] : GOOGLE_CLIENT_IDS;
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience,
      });
      const payload = ticket.getPayload();
      googleId = payload.sub;
      email = payload.email;
      given_name = payload.given_name;
      family_name = payload.family_name;
      picture = payload.picture;
      if (!email) {
        return res.status(400).json({ error: "Google token has no email." });
      }
    } else {
      let info;
      try {
        info = await googleClient.getTokenInfo(accessToken);
      } catch (e) {
        console.error("google getTokenInfo:", e);
        return res.status(401).json({ error: "Invalid or expired Google access token." });
      }
      // User access tokens: aud is often a Google APIs audience; OAuth Web client id is in azp.
      const presenters = [
        info.azp,
        info.client_id,
        info.aud,
        info.audience,
      ]
        .filter(Boolean)
        .map(String);
      const okClient = presenters.some((p) => GOOGLE_CLIENT_IDS.includes(p));
      if (!okClient) {
        console.warn("google token client mismatch presenters=", presenters.slice(0, 4));
        return res.status(401).json({
          error:
            "Google token client does not match this app. Ensure Vercel GOOGLE_CLIENT_ID is the same Web OAuth client as NEXT_PUBLIC_GOOGLE_CLIENT_ID.",
        });
      }
      const ur = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!ur.ok) {
        console.error("google userinfo:", ur.status, await ur.text());
        return res.status(401).json({ error: "Could not load Google profile." });
      }
      const profile = await ur.json();
      googleId = profile.sub;
      email = profile.email;
      given_name = profile.given_name;
      family_name = profile.family_name;
      picture = profile.picture;
      if (!email) {
        return res.status(400).json({ error: "Google account has no email on file." });
      }
    }

    const firstName = given_name ? given_name.trim() : email.split("@")[0];
    const lastName = family_name ? family_name.trim() : "";

    const { rows } = await pool.query(
      `INSERT INTO users (first_name, last_name, email, google_id, avatar_url, is_verified, password_hash)
       VALUES ($1, $2, $3, $4, $5, TRUE, NULL)
       ON CONFLICT (email) DO UPDATE SET
         google_id   = COALESCE(users.google_id, EXCLUDED.google_id),
         avatar_url  = EXCLUDED.avatar_url,
         is_verified = TRUE,
         updated_at  = NOW()
       RETURNING *`,
      [firstName, lastName, email, googleId, picture || null]
    );

    const user = rows[0];
    const tokens = await issueTokens(user);
    return res.json({ user: safeUser(user), accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  } catch (err) {
    console.error("google auth error:", err);
    const msg = err?.message || String(err);
    const audienceHint =
      /audience|Wrong number of segments|token signature|Token used too late/i.test(msg)
        ? " Ensure Vercel backend GOOGLE_CLIENT_ID matches the frontend NEXT_PUBLIC_GOOGLE_CLIENT_ID (same OAuth Web client)."
        : "";
    return res.status(401).json({ error: "Google auth failed: " + msg + audienceHint });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/reset-password
// Set new password after OTP verified
// ════════════════════════════════════════════════════════════════════════════
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  async (req, res) => {

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
      manager_type: user.rows[0].manager_type,
    });

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("Token refresh error:", err);
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

// ════════════════════════════════════════════════════════════════════════════
// DELETE /api/auth/me
// Delete current user account and all associated data
// ════════════════════════════════════════════════════════════════════════════


router.delete("/me", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Because of ON DELETE CASCADE in the database schema, 
    // deleting the user will automatically delete their refresh_tokens.
    // Assuming other tables (orders, wishlists, etc.) are also set up with
    // ON DELETE CASCADE referencing the users table, they will be deleted too.
    
    // Perform the deletion
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [userId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found or already deleted." });
    }

    return res.json({ message: "Account successfully deleted." });
  } catch (err) {
    console.error("Delete account error:", err);
    return res.status(500).json({ error: "Failed to delete account. Please try again later." });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// PUT /api/auth/me/location
// Update user location
// ════════════════════════════════════════════════════════════════════════════
router.put(
  "/me/location",
  authenticate,
  validate(updateLocationSchema),
  async (req, res) => {

    const { locationName, pincode, landmark, latitude, longitude } = req.body;
    try {
      const { rows } = await pool.query(
        `UPDATE users SET 
           location_name = $1, 
           pincode = $2, 
           landmark = $3,
           latitude = $4, 
           longitude = $5,
           updated_at = NOW()
         WHERE id = $6 AND is_active = TRUE 
         RETURNING *`,
        [locationName, pincode || null, landmark || null, latitude || null, longitude || null, req.user.id]
      );

      if (!rows.length) return res.status(404).json({ error: "User not found." });

      return res.json({ message: "Location updated successfully.", user: safeUser(rows[0]) });
    } catch (err) {
      console.error("update location error:", err);
      return res.status(500).json({ error: "Failed to update location." });
    }
  }
);

// ════════════════════════════════════════════════════════════════════════════
// Ensure user_saved_addresses table exists (idempotent)
// ════════════════════════════════════════════════════════════════════════════
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_saved_addresses (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name         TEXT NOT NULL,
        full_address TEXT,
        pincode      TEXT,
        landmark     TEXT,
        latitude     DECIMAL(10, 7),
        longitude    DECIMAL(10, 7),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_saved_addresses_user ON user_saved_addresses(user_id)
    `);

    // Add service_center_id to users if not exists (idempotent)
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS service_center_id UUID
        REFERENCES service_centers(id) ON DELETE SET NULL
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_ratings (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INT NOT NULL CHECK(rating BETWEEN 1 AND 5),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error("Could not ensure tables exist:", err.message);
  }
})();

// ════════════════════════════════════════════════════════════════════════════
// GET /api/auth/me/saved-addresses
// List all saved addresses for the logged-in user
// ════════════════════════════════════════════════════════════════════════════
router.get("/me/saved-addresses", authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, full_address, pincode, landmark, latitude, longitude, created_at
         FROM user_saved_addresses
        WHERE user_id = $1
        ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ addresses: rows });
  } catch (err) {
    console.error("get saved-addresses error:", err);
    return res.status(500).json({ error: "Failed to fetch saved addresses." });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/me/saved-addresses
// Add a new saved address (max 10 per user; deduplicates by name+pincode)
// ════════════════════════════════════════════════════════════════════════════
router.post(
  "/me/saved-addresses",
  authenticate,
  validate(saveAddressSchema),
  async (req, res) => {

    const { name, fullAddress, pincode, landmark, latitude, longitude } = req.body;
    try {
      // Remove duplicate by name + pincode + landmark for this user
      await pool.query(
        `DELETE FROM user_saved_addresses
          WHERE user_id = $1 AND name = $2 AND COALESCE(pincode,'') = COALESCE($3,'') AND COALESCE(landmark,'') = COALESCE($4,'')`,
        [req.user.id, name, pincode || "", landmark || ""]
      );

      // Enforce max 10 saved addresses — delete oldest if over limit
      await pool.query(
        `DELETE FROM user_saved_addresses
          WHERE id IN (
            SELECT id FROM user_saved_addresses
             WHERE user_id = $1
             ORDER BY created_at ASC
             LIMIT GREATEST(0,
               (SELECT COUNT(*) FROM user_saved_addresses WHERE user_id = $1) - 9
             )
          )`,
        [req.user.id]
      );

      const { rows } = await pool.query(
        `INSERT INTO user_saved_addresses (user_id, name, full_address, pincode, landmark, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, full_address, pincode, landmark, latitude, longitude, created_at`,
        [
          req.user.id,
          name,
          fullAddress || null,
          pincode || null,
          landmark || null,
          latitude || null,
          longitude || null,
        ]
      );

      return res.status(201).json({ address: rows[0] });
    } catch (err) {
      console.error("post saved-addresses error:", err);
      return res.status(500).json({ error: "Failed to save address." });
    }
  }
);

// ════════════════════════════════════════════════════════════════════════════
// DELETE /api/auth/me/saved-addresses/:id
// Remove a saved address
// ════════════════════════════════════════════════════════════════════════════
router.delete("/me/saved-addresses/:id", authenticate, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM user_saved_addresses WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!rowCount)
      return res.status(404).json({ error: "Address not found." });
    return res.json({ message: "Address deleted." });
  } catch (err) {
    console.error("delete saved-address error:", err);
    return res.status(500).json({ error: "Failed to delete address." });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/rate-app
// Submit a rating for the app
// ════════════════════════════════════════════════════════════════════════════
router.post("/rate-app", authenticate, async (req, res) => {
  const { rating } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5." });
  }
  
  try {
    // Upsert rating so user only has 1 rating
    await pool.query(
      `INSERT INTO app_ratings (user_id, rating) 
       VALUES ($1, $2)
       ON CONFLICT (id) DO NOTHING`, // Since id is serial, we can't easily upsert by user_id without unique constraint. Let's just insert multiple or delete previous.
      [req.user.id, rating]
    ); // Wait, there's no unique constraint on user_id. Let's just delete their previous ratings.
    
    await pool.query(`DELETE FROM app_ratings WHERE user_id = $1`, [req.user.id]);
    await pool.query(
      `INSERT INTO app_ratings (user_id, rating) VALUES ($1, $2)`,
      [req.user.id, rating]
    );

    return res.json({ message: "Thanks for giving rating!" });
  } catch (err) {
    console.error("rate-app error:", err);
    return res.status(500).json({ error: "Failed to submit rating." });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// PATCH /api/auth/me/notifications
// Toggle notifications enabled/disabled
// ════════════════════════════════════════════════════════════════════════════
router.patch("/me/notifications", authenticate, async (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: "enabled must be a boolean." });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE users SET notifications_enabled = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [enabled, req.user.id]
    );

    if (!rows.length) return res.status(404).json({ error: "User not found." });

    return res.json({ message: "Notification preferences updated.", user: safeUser(rows[0]) });
  } catch (err) {
    console.error("update notifications pref error:", err);
    return res.status(500).json({ error: "Failed to update notification preferences." });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// PUT /api/auth/profile
// Update user profile info (firstName, lastName)
// ════════════════════════════════════════════════════════════════════════════
router.put(
  "/profile",
  authenticate,
  async (req, res) => {
    try {
      const { firstName, lastName } = req.body;
      const result = await pool.query(
        "UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3 RETURNING *",
        [firstName, lastName, req.user.id]
      );
      if (!result.rows.length) return res.status(404).json({ error: "User not found" });
      res.json({ message: "Profile updated successfully", user: safeUser(result.rows[0]) });
    } catch (err) {
      console.error("Update profile error:", err);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
);

module.exports = router;
