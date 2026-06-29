const { Redis } = require("@upstash/redis");
require("dotenv").config();

let redis = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    // Note: Upstash Redis handles HTTP requests and doesn't require a persistent socket connection,
    // which makes it very resilient for serverless/edge environments.
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL.replace(/^"|"$/g, ''),
      token: process.env.UPSTASH_REDIS_REST_TOKEN.replace(/^"|"$/g, ''),
    });
    console.log("Redis client initialized.");
  } catch (err) {
    console.error("Failed to initialize Redis:", err.message);
  }
} else {
  console.warn("Redis environment variables missing. Falling back to in-memory caching.");
}

module.exports = redis;
