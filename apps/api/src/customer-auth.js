const jwt = require("jsonwebtoken");

function signCustomer(customer) {
  return jwt.sign(
    { sub: customer.id, email: customer.email, role: "customer" },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

function requireCustomer(req, res, next) {
  try {
    const bearer = String(req.headers.authorization || "");
    const headerToken = bearer.startsWith("Bearer ") ? bearer.slice(7).trim() : "";
    const token = headerToken || req.cookies?.egonar_customer;
    if (!token) return res.status(401).json({ error: "Connexion client requise." });
    req.customer = jwt.verify(token, process.env.JWT_SECRET);
    if (req.customer.role !== "customer") throw new Error("role");
    next();
  } catch {
    return res.status(401).json({ error: "Session client invalide." });
  }
}

module.exports = { signCustomer, requireCustomer };