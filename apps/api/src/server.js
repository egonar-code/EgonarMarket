const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("./db");
const { signAdmin, requireAdmin } = require("./auth");
require("dotenv").config();

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL manquant.");
if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET manquant.");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const webDir = path.join(__dirname, "../../web");
const FRONTEND_URL = String(process.env.FRONTEND_URL || "").trim();
const DELIVERY_DAKAR = Math.max(0, Number(process.env.DELIVERY_DAKAR_FCFA || 0));
const DELIVERY_OTHER = Math.max(0, Number(process.env.DELIVERY_OTHER_FCFA || 0));

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: FRONTEND_URL || true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

const buckets = new Map();
function rateLimit({ windowMs, max, key = req => req.ip }) {
  return (req, res, next) => {
    const now = Date.now();
    const id = key(req);
    const current = buckets.get(id);
    if (!current || now - current.startedAt > windowMs) {
      buckets.set(id, { startedAt: now, count: 1 });
      return next();
    }
    current.count += 1;
    if (current.count > max) return res.status(429).json({ error: "Trop de requêtes. Réessayez dans un instant." });
    next();
  };
}
const authLimiter = rateLimit({ windowMs: 60_000, max: 10, key: req => `auth:${req.ip}` });
const orderLimiter = rateLimit({ windowMs: 60_000, max: 20, key: req => `order:${req.ip}` });

app.get("/api/health", async (_req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ ok: true, service: "EgonarMarket API", database: "ok" });
  } catch {
    res.status(503).json({ ok: false, service: "EgonarMarket API", database: "error" });
  }
});

app.get("/api/config", (_req, res) => {
  res.json({
    site_name: "EgonarMarket",
    currency: "FCFA",
    whatsapp_number: process.env.WHATSAPP_NUMBER || "",
    delivery: { dakar_fcfa: DELIVERY_DAKAR, other_fcfa: DELIVERY_OTHER }
  });
});

app.get("/api/categories", async (_req, res) => {
  try {
    const result = await db.query("SELECT DISTINCT category FROM products WHERE active=TRUE ORDER BY category ASC");
    res.json(result.rows.map(x => x.category));
  } catch {
    res.status(500).json({ error: "Impossible de charger les catégories." });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const category = String(req.query.category || "").trim();
    const params = [];
    const where = ["active = TRUE"];
    if (q) {
      params.push(`%${q}%`);
      const n = params.length;
      where.push(`(name ILIKE $${n} OR description ILIKE $${n} OR category ILIKE $${n} OR sku ILIKE $${n})`);
    }
    if (category) {
      params.push(category);
      where.push(`category = $${params.length}`);
    }
    const result = await db.query(
      `SELECT id,name,slug,category,subcategory,description,price_fcfa,old_price_fcfa,stock,sku,image_url
       FROM products WHERE ${where.join(" AND ")} ORDER BY stock > 0 DESC, created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Impossible de charger les produits." });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM products WHERE id=$1 AND active=TRUE", [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: "Produit introuvable." });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Impossible de charger le produit." });
  }
});

app.post("/api/admin/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis." });
    const result = await db.query("SELECT * FROM admins WHERE email=$1", [String(email).trim().toLowerCase()]);
    const admin = result.rows[0];
    if (!admin || !(await bcrypt.compare(String(password), admin.password_hash))) {
      return res.status(401).json({ error: "Identifiants incorrects." });
    }
    const token = signAdmin(admin);
    res.cookie("egonar_admin", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Connexion administrateur impossible." });
  }
});

app.post("/api/admin/logout", requireAdmin, (_req, res) => {
  res.clearCookie("egonar_admin", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  res.json({ ok: true });
});

app.get("/api/admin/me", requireAdmin, (req, res) => res.json({ email: req.admin.email, role: req.admin.role }));

app.get("/api/admin/products", requireAdmin, async (_req, res) => {
  const result = await db.query("SELECT * FROM products ORDER BY created_at DESC");
  res.json(result.rows);
});

app.post("/api/admin/products", requireAdmin, async (req, res) => {
  try {
    const { name, category, subcategory = "", description = "", price_fcfa, old_price_fcfa = null, stock = 0, sku = null, image_url = "" } = req.body || {};
    if (!String(name || "").trim() || !String(category || "").trim() || !Number.isInteger(Number(price_fcfa)) || Number(price_fcfa) < 0) {
      return res.status(400).json({ error: "Nom, catégorie et prix valides sont obligatoires." });
    }
    const price = Number(price_fcfa);
    const oldPrice = old_price_fcfa === null || old_price_fcfa === "" ? null : Number(old_price_fcfa);
    if (oldPrice !== null && (!Number.isInteger(oldPrice) || oldPrice < price)) return res.status(400).json({ error: "L'ancien prix doit être supérieur ou égal au prix actuel." });
    const slug = `${String(name).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`;
    const result = await db.query(
      `INSERT INTO products(name,slug,category,subcategory,description,price_fcfa,old_price_fcfa,stock,sku,image_url)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [String(name).trim(), slug, String(category).trim().toUpperCase(), String(subcategory).trim(), String(description), price, oldPrice, Math.max(0, Number(stock) || 0), sku ? String(sku).trim() : null, String(image_url || "").trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Impossible de créer le produit." });
  }
});

app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const allowed = ["name", "category", "subcategory", "description", "price_fcfa", "old_price_fcfa", "stock", "sku", "image_url", "active"];
    const keys = Object.keys(req.body || {}).filter(k => allowed.includes(k));
    if (!keys.length) return res.status(400).json({ error: "Aucune modification." });
    if (keys.includes("price_fcfa")) req.body.price_fcfa = Number(req.body.price_fcfa);
    if (keys.includes("stock")) req.body.stock = Math.max(0, Number(req.body.stock) || 0);
    if (keys.includes("old_price_fcfa") && req.body.old_price_fcfa !== null && req.body.old_price_fcfa !== "") req.body.old_price_fcfa = Number(req.body.old_price_fcfa);
    const values = keys.map(k => req.body[k]);
    const set = keys.map((k, i) => `${k}=$${i + 1}`).join(",");
    values.push(req.params.id);
    const result = await db.query(`UPDATE products SET ${set}, updated_at=NOW() WHERE id=$${values.length} RETURNING *`, values);
    if (!result.rows[0]) return res.status(404).json({ error: "Produit introuvable." });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(400).json({ error: e.message || "Modification impossible." });
  }
});

app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
  const result = await db.query("UPDATE products SET active=FALSE, updated_at=NOW() WHERE id=$1 RETURNING id", [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: "Produit introuvable." });
  res.json({ ok: true });
});

app.get("/api/admin/orders", requireAdmin, async (_req, res) => {
  const result = await db.query(
    `SELECT o.*, c.name AS customer_name, c.phone, c.address, c.city
     FROM orders o JOIN customers c ON c.id=o.customer_id ORDER BY o.created_at DESC`
  );
  res.json(result.rows);
});

app.patch("/api/admin/orders/:id/status", requireAdmin, async (req, res) => {
  const allowed = ["EN_ATTENTE_PAIEMENT", "CONFIRMEE", "PREPARATION", "EXPEDIEE", "EN_LIVRAISON", "LIVREE", "ANNULEE"];
  if (!allowed.includes(req.body?.status)) return res.status(400).json({ error: "Statut invalide." });
  const result = await db.query("UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *", [req.body.status, req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: "Commande introuvable." });
  res.json(result.rows[0]);
});

app.post("/api/orders", orderLimiter, async (req, res) => {
  const { customer, items, payment_method = "A_PAYER", delivery_fcfa = 0 } = req.body || {};
  if (!customer?.name || !customer?.phone || !customer?.address || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: "Informations client ou panier incomplets." });
  }
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    const ids = [...new Set(items.map(x => x.product_id))];
    const products = await client.query("SELECT id,name,price_fcfa,stock FROM products WHERE id = ANY($1::uuid[]) AND active=TRUE FOR UPDATE", [ids]);
    const byId = new Map(products.rows.map(p => [p.id, p]));
    const totals = new Map();
    for (const item of items) {
      const p = byId.get(item.product_id);
      const qty = Number(item.quantity);
      if (!p || !Number.isInteger(qty) || qty < 1) throw new Error("Produit ou quantité invalide.");
      totals.set(p.id, (totals.get(p.id) || 0) + qty);
    }
    let subtotal = 0;
    for (const [id, qty] of totals) {
      const p = byId.get(id);
      if (qty > p.stock) throw new Error(`Stock insuffisant pour ${p.name}.`);
      subtotal += p.price_fcfa * qty;
    }
    const delivery = Math.max(0, Number(delivery_fcfa) || 0);
    const allowedPayments = new Set(["A_PAYER", "LIVRAISON", "WAVE", "ORANGE_MONEY"]);
    const chosenPayment = allowedPayments.has(String(payment_method)) ? String(payment_method) : "A_PAYER";
    const customerResult = await client.query(
      `INSERT INTO customers(name,phone,email,address,city) VALUES($1,$2,$3,$4,$5) RETURNING id`,
      [String(customer.name).trim().slice(0, 100), String(customer.phone).trim().slice(0, 30), customer.email ? String(customer.email).trim().slice(0, 160) : null, String(customer.address).trim().slice(0, 250), String(customer.city || "Dakar").trim().slice(0, 80)]
    );
    const orderNumber = "EG-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + crypto.randomBytes(3).toString("hex").toUpperCase();
    const initialStatus = ["WAVE", "ORANGE_MONEY"].includes(chosenPayment) ? "EN_ATTENTE_PAIEMENT" : "CONFIRMEE";
    const orderResult = await client.query(
      `INSERT INTO orders(order_number,customer_id,payment_method,status,subtotal_fcfa,delivery_fcfa,total_fcfa)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [orderNumber, customerResult.rows[0].id, chosenPayment, initialStatus, subtotal, delivery, subtotal + delivery]
    );
    for (const [id, qty] of totals) {
      const p = byId.get(id);
      await client.query(`INSERT INTO order_items(order_id,product_id,product_name,unit_price_fcfa,quantity) VALUES($1,$2,$3,$4,$5)`, [orderResult.rows[0].id, p.id, p.name, p.price_fcfa, qty]);
      await client.query("UPDATE products SET stock=stock-$1, updated_at=NOW() WHERE id=$2", [qty, p.id]);
    }
    await client.query("COMMIT");
    res.status(201).json({ order_number: orderNumber, status: initialStatus, payment_status: "PENDING", total_fcfa: subtotal + delivery });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message || "Commande impossible." });
  } finally {
    client.release();
  }
});

app.get("/api/orders/:number", async (req, res) => {
  const order = await db.query(
    `SELECT o.order_number,o.status,o.payment_status,o.payment_method,o.total_fcfa,o.created_at,c.name,c.phone,c.address,c.city
     FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.order_number=$1`,
    [req.params.number]
  );
  if (!order.rows[0]) return res.status(404).json({ error: "Commande introuvable." });
  const items = await db.query(`SELECT product_name,unit_price_fcfa,quantity FROM order_items WHERE order_id=(SELECT id FROM orders WHERE order_number=$1)`, [req.params.number]);
  res.json({ ...order.rows[0], items: items.rows });
});

app.post("/api/ai/search", async (req, res) => {
  const message = String(req.body?.message || "").trim();
  const budgetMatch = message.match(/(\d[\d\s]*)\s*(?:fcfa|f|francs?)/i);
  const budget = budgetMatch ? Number(budgetMatch[1].replace(/\s/g, "")) : null;
  const rawWords = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/);
  const stop = new Set(["pour","avec","moins","plus","dans","une","des","les","the","que","cherche","recherche","donne","moi","je","veux","mon","ma","un","a","au","en","et"]);
  const words = rawWords.filter(w => w.length > 2 && !stop.has(w)).slice(0, 8);
  const clauses = words.map((_, i) => `(name ILIKE $${i + 1} OR description ILIKE $${i + 1} OR category ILIKE $${i + 1})`);
  const params = words.map(w => `%${w}%`);
  let sql = "SELECT id,name,category,description,price_fcfa,stock,image_url FROM products WHERE active=TRUE";
  if (clauses.length) sql += " AND (" + clauses.join(" OR ") + ")";
  if (budget) { params.push(budget); sql += ` AND price_fcfa <= $${params.length}`; }
  sql += " ORDER BY stock > 0 DESC, created_at DESC LIMIT 12";
  const result = await db.query(sql, params);
  res.json({ message, budget, products: result.rows });
});

app.use(express.static(webDir, { extensions: ["html"] }));
app.get("/", (_req, res) => res.sendFile(path.join(webDir, "index.html")));
app.listen(PORT, "0.0.0.0", () => console.log(`EgonarMarket: http://localhost:${PORT}`));
