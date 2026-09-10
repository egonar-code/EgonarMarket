const jwt = require("jsonwebtoken");

function signAdmin(admin) {
  return jwt.sign(
    { sub: admin.id, email: admin.email, role: admin.role || "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
}

function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.egonar_admin;
    if (!token) return res.status(401).json({ error: "Authentification requise." });
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Session administrateur invalide." });
  }
}

module.exports = { signAdmin, requireAdmin };
