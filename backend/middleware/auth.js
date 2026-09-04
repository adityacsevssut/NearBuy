const { verifyAccessToken } = require("../utils/jwt");

/**
 * Middleware: verifies Bearer access token
 */
function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Please log in and try again." });
    }
    const token = auth.slice(7);
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Please log in and try again." });
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
