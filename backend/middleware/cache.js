const { Redis } = require("@upstash/redis");

// Initialize Redis only if URLs are provided (graceful degradation)
let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} else {
  console.warn("Upstash Redis credentials are not set. Caching will be disabled.");
}

/**
 * Express middleware to cache responses using Upstash Redis.
 * Only caches 200 OK responses.
 * @param {number} durationInSeconds - How long to cache the response.
 */
const cacheMiddleware = (durationInSeconds = 300) => {
  return async (req, res, next) => {
    // If Redis isn't configured or the request isn't a GET, bypass cache
    if (!redis || req.method !== "GET") {
      return next();
    }

    try {
      // Create a unique cache key based on the URL and query parameters
      const key = `cache:${req.originalUrl || req.url}`;
      
      // Try fetching from cache
      const cachedData = await redis.get(key);

      if (cachedData) {
        // If data is in cache, return it immediately
        // Note: Upstash automatically parses JSON strings to objects,
        // so we check if it's already an object before sending.
        const responseData = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
        return res.status(200).json(responseData);
      }

      // Overwrite res.json to intercept the response
      const originalJson = res.json;
      res.json = function (body) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Fire and forget caching (don't await to avoid blocking response)
          redis.set(key, JSON.stringify(body), { ex: durationInSeconds }).catch(err => {
            console.error("Redis set error:", err);
          });
        }
        // Send the response to the user
        originalJson.call(this, body);
      };

      next();
    } catch (err) {
      console.error("Cache middleware error:", err);
      // Proceed without caching if Redis throws an error
      next();
    }
  };
};

module.exports = cacheMiddleware;
