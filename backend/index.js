require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRouter = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Headers ──────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// ── Body Parser ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));

// ── Global Rate Limiter ───────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use(globalLimiter);

// ── Auth-specific stricter rate limit ────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,                  // max 20 auth attempts per 15 min per IP
  message: { error: "Too many auth attempts, please wait 15 minutes." },
});
app.use("/api/auth", authLimiter);

// ── Routes ────────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "NearBuy API is running 🚀" }));
app.use("/api/auth", authRouter);

// ── 404 Handler ───────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// ── Global Error Handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start Server ──────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✅ NearBuy backend running on http://localhost:${PORT}`);
  });
}

// Export the app for Vercel Serverless Functions
module.exports = app;
