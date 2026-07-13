const rateLimit = require("express-rate-limit");
const redis = require("../config/redis");
require("dotenv").config();

// Default Configurations with Environment Variable Overrides
const RL_PUBLIC_WINDOW_MS = parseInt(process.env.RL_PUBLIC_WINDOW_MS) || 15 * 60 * 1000;
const RL_PUBLIC_MAX = parseInt(process.env.RL_PUBLIC_MAX) || 150;

const RL_AUTH_ACTION_WINDOW_MS = parseInt(process.env.RL_AUTH_ACTION_WINDOW_MS) || 15 * 60 * 1000;
const RL_AUTH_ACTION_MAX = parseInt(process.env.RL_AUTH_ACTION_MAX) || 300;

const RL_AUTH_FAILS_MAX = parseInt(process.env.RL_AUTH_FAILS_MAX) || 5;
const RL_AUTH_BASE_DELAY_MS = parseInt(process.env.RL_AUTH_BASE_DELAY_MS) || 2000; // 2 seconds base delay

// 1. Moderate limits on public endpoints
const publicLimiter = rateLimit({
  windowMs: RL_PUBLIC_WINDOW_MS,
  max: RL_PUBLIC_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many public requests, please try again later." },
});

// 2. Looser limits for authenticated user actions
const authActionLimiter = rateLimit({
  windowMs: RL_AUTH_ACTION_WINDOW_MS,
  max: RL_AUTH_ACTION_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Prefer user ID for limits, fallback to IP if not authenticated yet
    return req.user?.id || req.ip || "unknown_ip";
  },
  message: { error: "Too many requests. Please slow down." },
});

// 3. Stricter limits on authentication routes with Exponential Backoff
const fallbackStore = new Map(); // In-memory fallback if Redis is unavailable

// Helper: Get attempt data
async function getAttempts(key) {
  if (redis) {
    try {
      const data = await redis.get(key);
      return data ? (typeof data === "string" ? JSON.parse(data) : data) : null;
    } catch (err) {
      console.error("Redis get error:", err);
    }
  }
  const data = fallbackStore.get(key);
  if (data && data.expiresAt > Date.now()) return data;
  return null;
}

// Helper: Set attempt data (Expires after 1 hour of inactivity)
async function setAttempts(key, data) {
  const ttl = 60 * 60; // 1 hour
  if (redis) {
    try {
      await redis.set(key, JSON.stringify(data), { ex: ttl });
      return;
    } catch (err) {
      console.error("Redis set error:", err);
    }
  }
  fallbackStore.set(key, { ...data, expiresAt: Date.now() + ttl * 1000 });
}

// Helper: Reset attempts on success
async function resetAttempts(key) {
  if (redis) {
    try {
      await redis.del(key);
      return;
    } catch (err) {
      console.error("Redis del error:", err);
    }
  }
  fallbackStore.delete(key);
}

const authLimiterExponential = async (req, res, next) => {
  const ip = req.ip;
  // Use email or mobile from body as account identifier, fallback to 'unknown'
  const email = req.body?.email || req.body?.identifier || req.body?.mobile || "unknown";
  
  const ipKey = `rl_auth:ip:${ip}`;
  const accountKey = `rl_auth:acc:${email}`;
  
  const ipData = await getAttempts(ipKey) || { count: 0, lastAttempt: 0 };
  const accData = await getAttempts(accountKey) || { count: 0, lastAttempt: 0 };
  
  const now = Date.now();
  
  // Apply the stricter of the two limits (IP vs Account)
  const maxFails = Math.max(ipData.count, accData.count);
  
  if (maxFails >= RL_AUTH_FAILS_MAX) {
    // Calculate exponential delay: BaseMs * 2^(fails - maxFailsAllowed)
    const delayMs = RL_AUTH_BASE_DELAY_MS * Math.pow(2, maxFails - RL_AUTH_FAILS_MAX);
    const lastAttemptTime = Math.max(ipData.lastAttempt, accData.lastAttempt);
    
    const timeToWait = (lastAttemptTime + delayMs) - now;
    
    if (timeToWait > 0) {
      const waitSeconds = Math.ceil(timeToWait / 1000);
      res.set("Retry-After", waitSeconds);
      return res.status(429).json({
        error: `Too many failed attempts. Please try again in ${waitSeconds} seconds.`,
        retryAfter: waitSeconds
      });
    }
  }
  
  // Track response to update failure counts
  res.on('finish', async () => {
    const statusCode = res.statusCode;
    
    // Success (2xx): Reset attempts
    if (statusCode >= 200 && statusCode < 300) {
      await resetAttempts(ipKey);
      if (email !== "unknown") await resetAttempts(accountKey);
    } 
    // Client Errors like Unauthorized or Not Found (400, 401, 403, 404): Count as failure
    else if ([400, 401, 403, 404].includes(statusCode)) {
      ipData.count += 1;
      ipData.lastAttempt = Date.now();
      accData.count += 1;
      accData.lastAttempt = Date.now();
      
      await setAttempts(ipKey, ipData);
      if (email !== "unknown") await setAttempts(accountKey, accData);
    }
  });

  next();
};

module.exports = {
  publicLimiter,
  authActionLimiter,
  authLimiterExponential
};
