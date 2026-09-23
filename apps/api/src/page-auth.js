const jwt = require("jsonwebtoken");

function cookieValue(req, name) {
  const cookies = String(req.headers.cookie || "").split(";");
  const item = cookies.map(x => x.trim()).find(x => x.startsWith(name + "="));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : "";
}

function isAuthenticated(req, cookieName, predicate) {
  try {
    const token = cookieValue(req, cookieName);
    if (!token) return false;
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return predicate(payload);
  } catch {
    return false;
  }
}

function requireAdminPage(req, res, next) {
  if (isAuthenticated(req, "egonar_admin", payload => payload.role === "admin")) return next();
  return res.redirect(302, "/admin-login.html");
}

function requireSupplierPage(req, res, next) {
  if (isAuthenticated(req, "egonar_supplier", payload => payload.type === "supplier")) return next();
  return res.redirect(302, "/supplier-login.html");
}

module.exports = { requireAdminPage, requireSupplierPage, isAuthenticated };