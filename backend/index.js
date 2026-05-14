require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRouter = require("./routes/auth");
const managerRouter = require("./routes/manager");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Headers ──────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────
// FRONTEND_URL and CORS_ORIGINS are merged (comma, pipe, or newline separated).
// Use CORS_ORIGINS as a backup on hosts where FRONTEND_URL is awkward to edit (e.g. Sensitive UI).
function parseAllowedOrigins() {
  const raw = [process.env.FRONTEND_URL, process.env.CORS_ORIGINS]
    .filter(Boolean)
    .join(",");
  let list = raw
    .split(/[,|\n\r]+/)
    .map((u) => u.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  if (list.length === 0) list = ["http://localhost:3000"];
  return list;
}

const allowedOrigins = parseAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
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
app.use("/api/managers", managerRouter);

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
