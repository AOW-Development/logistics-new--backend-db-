const jwt = require("jsonwebtoken");
const env = require("../Config/env.js");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

// Normalize roles like "super_admin" vs "superadmin"
function requireRole(...allowedRoles) {
  const normalize = (r) => String(r || "").toLowerCase().replace(/[^a-z]/g, "");
  const allowed = new Set(allowedRoles.map(normalize));
  return (req, res, next) => {
    if (!req.user?.role) {
      return res.status(401).json({ error: "Unauthenticated" });
    }
    const userRole = normalize(req.user.role);
    if (!allowed.has(userRole)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole };
