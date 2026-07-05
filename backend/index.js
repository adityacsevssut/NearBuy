require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// ── Startup: crash immediately if required env vars are missing ───────────
const REQUIRED_ENV = [
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  console.error(
    `❌ FATAL: Missing required environment variables: ${missingEnv.join(", ")}. Server will not start.`
  );
  process.exit(1);
}

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

// ── Auth-specific stricter rate limits ────────────────────────────────────
// Login/signup/google — 10 attempts per 15 min (only counts failures)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 10 : 1000,
  message: { error: "Too many auth attempts, please wait 15 minutes." },
  skipSuccessfulRequests: true,
});
// OTP send/verify — 5 per 15 min (prevent OTP flooding)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 5 : 1000,
  message: { error: "Too many OTP requests. Please wait 15 minutes." },
});
app.use("/api/auth", authLimiter);
app.use("/api/auth/send-otp", otpLimiter);
app.use("/api/auth/verify-otp", otpLimiter);

// ── Routes ────────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "ZyphCart API is running 🚀" }));
app.use("/api/auth", authRouter);
app.use("/api/managers", managerRouter);
app.use("/api/vendor-requests", require("./routes/vendor-requests"));
app.use("/api/vendor-profile", require("./routes/vendor-profile"));
app.use("/api/public", require("./routes/public"));
app.use("/api/service-centers", require("./routes/service_centers"));
app.use("/api/vendor-menu", require("./routes/vendor-menu"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/homepage-poster", require("./routes/homepage-poster"));
app.use("/api/share", require("./routes/share"));
app.use("/api/notifications", require("./routes/notifications"));

// ── 404 Handler ───────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// ── Global Error Handler ──────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start Server ──────────────────────────────────────────────────────────
const http = require("http");
const socketUtil = require("./utils/socket");

const server = http.createServer(app);

// Initialize Socket.IO
const io = socketUtil.init(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }
});

const { verifyAccessToken } = require("./utils/jwt");

// ── Socket.IO Authentication Middleware ──────────────────────────────────
// Verify the JWT token on every socket connection before allowing events.
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");
    if (!token) {
      // Allow unauthenticated connections but mark socket as guest
      socket.data.userId = null;
      return next();
    }
    const decoded = verifyAccessToken(token);
    socket.data.userId = decoded.id;
    next();
  } catch {
    socket.data.userId = null;
    next(); // still allow connection, but room join will be denied
  }
});

// Socket Connection handling
io.on("connection", (socket) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("🟢 Client connected:", socket.id);
  }

  // User joins their specific notification room
  // Security: only allow joining if the requested userId matches the authenticated socket user
  socket.on("join_user_room", (userId) => {
    const parsedId = String(userId);
    const socketUserId = String(socket.data.userId);
    if (!socket.data.userId || socketUserId !== parsedId) {
      // Silently reject — do not join the room
      return;
    }
    socket.join(`user_${parsedId}`);
    if (process.env.NODE_ENV !== "production") {
      console.log(`👤 User ${parsedId} joined their notification room.`);
    }
  });

  socket.on("disconnect", () => {
    if (process.env.NODE_ENV !== "production") {
      console.log("🔴 Client disconnected:", socket.id);
    }
  });
});

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`✅ ZyphCart backend (with Socket.io) running on http://localhost:${PORT}`);
  });
}

// Keep-alive to prevent clean exit if event loop gets empty
setInterval(() => {}, 1000 * 60 * 60);

process.on('exit', (code) => {
  console.log('Node process exiting with code:', code);
  console.trace('Trace of exit');
});

// Export the server for Vercel Serverless Functions
module.exports = server;
