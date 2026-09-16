const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");
const { requireAdmin } = require("./auth");
require("dotenv").config();

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL manquant.");
if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET manquant.");

const app = express();
const PORT = Number(process.env.SUPPLIER_PORT || 3001);
const webDir = path.join(__dirname, "../../web");
const secure = process.env.NODE_ENV === "production";
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

const SUPPLIER_UNIVERSES = new Set(["MARKET", "SAVEURS", "EVASION"]);
function normalizeUniverse(value) {
  const universe = String(value || "MARKET").trim().toUpperCase();
  return SUPPLIER_UNIVERSES.has(universe) ? universe : null;
}

const supplierToken = supplier => jwt.sign({ sub: supplier.id, email: supplier.email, type: "supplier" }, process.env.JWT_SECRET, { expiresIn: "12h" });

function requireSupplier(req, res, next) {
  try {
    const bearer = String(req.headers.authorization || "");
    const headerToken = bearer.startsWith("Bearer ") ? bearer.slice(7).trim() : "";
    const token = headerToken || req.cookies?.egonar_supplier;
    if (!token) return res.status(401).json({ error: "Authentification fournisseur requise." });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== "supplier") return res.status(401).json({ error: "Session fournisseur invalide." });
    req.supplier = payload;
    next();
  } catch { return res.status(401).json({ error: "Session fournisseur invalide." }); }
}

function setSupplierCookie(res, token) { res.cookie("egonar_supplier", token, { httpOnly: true, sameSite: "lax", secure, maxAge: 12 * 60 * 60 * 1000 }); }
function validInteger(value, { min = 0 } = {}) { return Number.isInteger(Number(value)) && Number(value) >= min; }

app.get("/api/health", async (_req, res) => {
  try { await db.query("SELECT 1"); res.json({ ok: true, service: "EgonarMarket Supplier Portal", database: "ok" }); }
  catch { res.status(503).json({ ok: false, database: "error" }); }
});

app.post("/api/supplier/register", async (req, res) => {
  try {
    const { business_name, contact_name, phone, email, password } = req.body || {};
    if (!business_name || !contact_name || !email || !password) return res.status(400).json({ error: "Entreprise, contact, email et mot de passe sont obligatoires." });
    if (String(password).length < 8) return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères." });
    const hash = await bcrypt.hash(String(password), 12);
    const result = await db.query(`INSERT INTO suppliers(business_name,contact_name,phone,email,password_hash,status) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,business_name,contact_name,phone,email,status,commission_percent`, [String(business_name).trim().slice(0, 160), String(contact_name).trim().slice(0, 120), String(phone || "").trim().slice(0, 30), String(email).trim().toLowerCase().slice(0, 160), hash, "PENDING"]);
    res.status(201).json({ supplier: result.rows[0], message: "Demande envoyée. Votre compte sera activé après validation par EgonarMarket." });
  } catch (e) { if (String(e.code) === "23505") return res.status(409).json({ error: "Cet email fournisseur existe déjà." }); console.error(e); res.status(400).json({ error: "Impossible de créer le compte fournisseur." }); }
});

app.post("/api/supplier/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const result = await db.query("SELECT * FROM suppliers WHERE email=$1", [String(email || "").trim().toLowerCase()]);
    const supplier = result.rows[0];
    if (!supplier || !(await bcrypt.compare(String(password || ""), supplier.password_hash || ""))) return res.status(401).json({ error: "Identifiants fournisseur incorrects." });
    if (supplier.status !== "APPROVED") { const message = supplier.status === "PENDING" ? "Votre compte est encore en attente de validation." : "Votre compte fournisseur n'est pas actif."; return res.status(403).json({ error: message, status: supplier.status }); }
    const token = supplierToken(supplier); setSupplierCookie(res, token);
    res.json({ ok: true, token, supplier: { id: supplier.id, business_name: supplier.business_name, email: supplier.email } });
  } catch (e) { console.error(e); res.status(500).json({ error: "Connexion fournisseur impossible." }); }
});

app.post("/api/supplier/logout", requireSupplier, (_req, res) => { res.clearCookie("egonar_supplier", { httpOnly: true, sameSite: "lax", secure }); res.json({ ok: true }); });

app.get("/api/supplier/me", requireSupplier, async (req, res) => {
  const result = await db.query("SELECT id,business_name,contact_name,phone,email,status,commission_percent,created_at FROM suppliers WHERE id=$1", [req.supplier.sub]);
  if (!result.rows[0]) return res.status(404).json({ error: "Fournisseur introuvable." }); res.json(result.rows[0]);
});

app.get("/api/supplier/stats", requireSupplier, async (req, res) => {
  const result = await db.query(`SELECT COUNT(*) FILTER (WHERE active=TRUE AND approval_status='APPROVED')::int AS active_products, COUNT(*) FILTER (WHERE approval_status='PENDING')::int AS pending_products, COALESCE(SUM(stock) FILTER (WHERE active=TRUE),0)::int AS total_stock FROM products WHERE supplier_id=$1`, [req.supplier.sub]);
  res.json(result.rows[0]);
});

app.get("/api/supplier/sales-stats", requireSupplier, async (req, res) => {
  const result = await db.query(`SELECT COUNT(DISTINCT o.id)::int AS orders_count, COALESCE(SUM(oi.quantity),0)::int AS units_sold, COALESCE(SUM(oi.quantity * oi.unit_price_fcfa),0)::int AS gross_sales_fcfa, COALESCE((SUM(oi.quantity * oi.unit_price_fcfa) * MAX(s.commission_percent) / 100),0)::int AS estimated_commission_fcfa FROM orders o JOIN order_items oi ON oi.order_id=o.id JOIN products p ON p.id=oi.product_id JOIN suppliers s ON s.id=p.supplier_id WHERE p.supplier_id=$1 AND o.status NOT IN ('ANNULEE','ANNULEE_CLIENT')`, [req.supplier.sub]);
  res.json(result.rows[0]);
});

app.get("/api/supplier/orders", requireSupplier, async (req, res) => {
  const result = await db.query(`SELECT o.id,o.order_number,o.status,o.payment_method,o.payment_status,o.subtotal_fcfa,o.delivery_fcfa,o.total_fcfa,o.created_at,o.updated_at,c.name AS customer_name,c.phone AS customer_phone,c.address AS customer_address,c.city AS customer_city,COALESCE(SUM(oi.quantity),0)::int AS supplier_units,COALESCE(SUM(oi.quantity * oi.unit_price_fcfa),0)::int AS supplier_total_fcfa,JSON_AGG(JSON_BUILD_OBJECT('product_id',p.id,'name',oi.product_name,'quantity',oi.quantity,'unit_price_fcfa',oi.unit_price_fcfa,'image_url',p.image_url,'universe',p.universe) ORDER BY oi.id) AS items FROM orders o JOIN customers c ON c.id=o.customer_id JOIN order_items oi ON oi.order_id=o.id JOIN products p ON p.id=oi.product_id WHERE p.supplier_id=$1 GROUP BY o.id,c.id ORDER BY o.created_at DESC LIMIT 100`, [req.supplier.sub]);
  res.json(result.rows);
});

app.get("/api/supplier/products", requireSupplier, async (req, res) => {
  const universe = String(req.query.universe || "").trim() ? normalizeUniverse(req.query.universe) : null;
  if (req.query.universe && !universe) return res.status(400).json({ error: "Univers invalide." });
  const params = [req.supplier.sub];
  let sql = `SELECT id,name,slug,universe,category,subcategory,description,price_fcfa,old_price_fcfa,stock,sku,image_url,active,approval_status,created_at,updated_at FROM products WHERE supplier_id=$1`;
  if (universe) { params.push(universe); sql += ` AND universe=$${params.length}`; }
  sql += " ORDER BY created_at DESC";
  const result = await db.query(sql, params);
  res.json(result.rows);
});

app.post("/api/supplier/products", requireSupplier, async (req, res) => {
  try {
    const { name, category, subcategory = "", description = "", price_fcfa, old_price_fcfa = null, stock = 0, sku = null, image_url = "" } = req.body || {};
    const universe = normalizeUniverse(req.body?.universe);
    if (!universe) return res.status(400).json({ error: "Univers invalide. Choisissez MARKET, SAVEURS ou EVASION." });
    if (!String(name || "").trim() || !String(category || "").trim() || !validInteger(price_fcfa)) return res.status(400).json({ error: "Nom, catégorie et prix valides sont obligatoires." });
    if (!validInteger(stock)) return res.status(400).json({ error: "Le stock doit être un nombre entier positif ou nul." });
    const price = Number(price_fcfa); const oldPrice = old_price_fcfa === null || old_price_fcfa === "" ? null : Number(old_price_fcfa);
    if (oldPrice !== null && (!validInteger(oldPrice) || oldPrice < price)) return res.status(400).json({ error: "L'ancien prix doit être supérieur ou égal au prix actuel." });
    const slug = `${String(name).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`;
    const result = await db.query(`INSERT INTO products(name,slug,universe,category,subcategory,description,price_fcfa,old_price_fcfa,stock,sku,image_url,active,approval_status,supplier_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,TRUE,'PENDING',$12) RETURNING *`, [String(name).trim().slice(0, 160), slug, universe, String(category).trim().toUpperCase(), String(subcategory).trim(), String(description).trim(), price, oldPrice, Number(stock), sku ? String(sku).trim() : null, String(image_url || "").trim(), req.supplier.sub]);
    res.status(201).json(result.rows[0]);
  } catch (e) { console.error(e); res.status(400).json({ error: "Impossible de soumettre le produit." }); }
});

app.patch("/api/supplier/products/:id", requireSupplier, async (req, res) => {
  try {
    const allowed = ["name", "universe", "category", "subcategory", "description", "price_fcfa", "old_price_fcfa", "stock", "sku", "image_url"]; const keys = Object.keys(req.body || {}).filter(k => allowed.includes(k));
    if (!keys.length) return res.status(400).json({ error: "Aucune modification." });
    if (keys.includes("universe")) { const universe = normalizeUniverse(req.body.universe); if (!universe) return res.status(400).json({ error: "Univers invalide. Choisissez MARKET, SAVEURS ou EVASION." }); req.body.universe = universe; }
    if (keys.includes("name") && !String(req.body.name || "").trim()) return res.status(400).json({ error: "Le nom du produit est obligatoire." });
    if (keys.includes("category") && !String(req.body.category || "").trim()) return res.status(400).json({ error: "La catégorie est obligatoire." });
    if (keys.includes("price_fcfa") && !validInteger(req.body.price_fcfa)) return res.status(400).json({ error: "Le prix doit être un nombre entier positif ou nul." });
    if (keys.includes("stock") && !validInteger(req.body.stock)) return res.status(400).json({ error: "Le stock doit être un nombre entier positif ou nul." });
    if (keys.includes("old_price_fcfa") && req.body.old_price_fcfa !== null && req.body.old_price_fcfa !== "" && !validInteger(req.body.old_price_fcfa)) return res.status(400).json({ error: "L'ancien prix doit être un nombre entier positif ou nul." });
    if (keys.includes("price_fcfa") || keys.includes("old_price_fcfa")) {
      const current = await db.query("SELECT price_fcfa,old_price_fcfa FROM products WHERE id=$1 AND supplier_id=$2", [req.params.id, req.supplier.sub]);
      if (!current.rows[0]) return res.status(404).json({ error: "Produit introuvable." });
      const nextPrice = keys.includes("price_fcfa") ? Number(req.body.price_fcfa) : current.rows[0].price_fcfa;
      const nextOld = keys.includes("old_price_fcfa") ? (req.body.old_price_fcfa === null || req.body.old_price_fcfa === "" ? null : Number(req.body.old_price_fcfa)) : current.rows[0].old_price_fcfa;
      if (nextOld !== null && nextOld < nextPrice) return res.status(400).json({ error: "L'ancien prix doit être supérieur ou égal au prix actuel." });
    }
    if (keys.includes("category")) req.body.category = String(req.body.category).trim().toUpperCase();
    const values = keys.map(k => req.body[k]); const set = keys.map((k, i) => `${k}=$${i + 1}`).join(","); values.push(req.params.id, req.supplier.sub);
    const result = await db.query(`UPDATE products SET ${set}, active=FALSE, approval_status='PENDING', updated_at=NOW() WHERE id=$${values.length - 1} AND supplier_id=$${values.length} RETURNING *`, values);
    if (!result.rows[0]) return res.status(404).json({ error: "Produit introuvable." }); res.json(result.rows[0]);
  } catch (e) { console.error(e); res.status(400).json({ error: e.message || "Modification impossible." }); }
});

app.delete("/api/supplier/products/:id", requireSupplier, async (req, res) => {
  const result = await db.query("UPDATE products SET active=FALSE, updated_at=NOW() WHERE id=$1 AND supplier_id=$2 RETURNING id", [req.params.id, req.supplier.sub]);
  if (!result.rows[0]) return res.status(404).json({ error: "Produit introuvable." }); res.json({ ok: true });
});

app.get("/api/supplier/admin/suppliers", requireAdmin, async (_req, res) => res.json((await db.query(`SELECT id,business_name,contact_name,phone,email,status,commission_percent,created_at FROM suppliers ORDER BY created_at DESC`)).rows));
app.patch("/api/supplier/admin/suppliers/:id/status", requireAdmin, async (req, res) => {
  const allowed = new Set(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]); const status = String(req.body?.status || ""); if (!allowed.has(status)) return res.status(400).json({ error: "Statut fournisseur invalide." });
  const result = await db.query("UPDATE suppliers SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING id,business_name,status", [status, req.params.id]); if (!result.rows[0]) return res.status(404).json({ error: "Fournisseur introuvable." }); res.json(result.rows[0]);
});
app.get("/api/supplier/admin/products", requireAdmin, async (req, res) => {
  const status = String(req.query.status || "").trim(); const universe = String(req.query.universe || "").trim() ? normalizeUniverse(req.query.universe) : null;
  if (req.query.universe && !universe) return res.status(400).json({ error: "Univers invalide." });
  const params = []; let sql = `SELECT p.id,p.name,p.universe,p.category,p.price_fcfa,p.stock,p.approval_status,p.active,p.supplier_id,s.business_name FROM products p LEFT JOIN suppliers s ON s.id=p.supplier_id`;
  const where = [];
  if (status) { params.push(status); where.push(`p.approval_status=$${params.length}`); }
  if (universe) { params.push(universe); where.push(`p.universe=$${params.length}`); }
  if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
  sql += " ORDER BY p.created_at DESC"; res.json((await db.query(sql, params)).rows);
});
app.patch("/api/supplier/admin/products/:id/approval", requireAdmin, async (req, res) => {
  const approval = String(req.body?.approval_status || ""); if (!new Set(["PENDING", "APPROVED", "REJECTED"]).has(approval)) return res.status(400).json({ error: "Statut de validation invalide." });
  const result = await db.query("UPDATE products SET approval_status=$1, active=$2, updated_at=NOW() WHERE id=$3 RETURNING id,name,universe,approval_status,active", [approval, approval === "APPROVED", req.params.id]); if (!result.rows[0]) return res.status(404).json({ error: "Produit introuvable." }); res.json(result.rows[0]);
});

app.use(express.static(webDir, { extensions: ["html"] }));
app.get("/", (_req, res) => res.sendFile(path.join(webDir, "supplier.html")));
app.listen(PORT, "0.0.0.0", () => console.log(`EgonarMarket Supplier Portal: http://localhost:${PORT}`));