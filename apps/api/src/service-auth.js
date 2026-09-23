const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { getDb, docToData } = require("./firestore");

const ROLES = new Set(["PAYMENT", "LOGISTICS", "COURIER"]);

function signService(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, type: "service" },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
}

function requireService(role) {
  return async (req, res, next) => {
    try {
      const bearer = String(req.headers.authorization || "");
      const headerToken = bearer.startsWith("Bearer ") ? bearer.slice(7).trim() : "";
      const token = headerToken || req.cookies?.egonar_service;
      if (!token) return res.status(401).json({ error: "Authentification service requise." });
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload.type !== "service" || !ROLES.has(payload.role)) {
        return res.status(401).json({ error: "Session service invalide." });
      }
      if (role && payload.role !== role) {
        return res.status(403).json({ error: "Ce service n'est pas autorisé pour cette action." });
      }
      req.service = payload;
      next();
    } catch {
      return res.status(401).json({ error: "Session service invalide." });
    }
  };
}

async function authenticateService(email, password) {
  const db = getDb();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const snap = await db.collection("service_users").where("email", "==", normalizedEmail).limit(1).get();
  const doc = snap.docs[0];
  if (!doc) return null;
  const user = docToData(doc);
  if (!ROLES.has(user.role) || user.active === false) return null;
  const valid = await bcrypt.compare(String(password || ""), user.password_hash || "");
  if (!valid) return null;
  return user;
}

module.exports = { ROLES, signService, requireService, authenticateService };
