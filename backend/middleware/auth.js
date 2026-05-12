const { verifyAccessToken } = require("../utils/jwt");

/**
 * Middleware: verifies Bearer access token
 */
function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No access token provided" });
    }
    const token = auth.slice(7);
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired access token" });
  }
}

/**
 * Middleware: checks user role
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
