const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { getDb, docToData } = require("./firestore");
const { requireAdmin } = require("./auth");
const { requireAdminPage, requireSupplierPage } = require("./page-auth");
require("dotenv").config();

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET manquant.");
if (!process.env.FIREBASE_SERVICE_ACCOUNT_FILE && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  throw new Error("Credentials Firebase manquants.");
}

const app = express();
const PORT = Number(process.env.SUPPLIER_PORT || process.env.PORT || 3001);
const webDir = path.join(__dirname, "../../web");
const secure = process.env.NODE_ENV === "production";
const firestore = getDb();

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

const SUPPLIER_UNIVERSES = new Set(["MARKET", "SAVEURS", "EVASION"]);
const APPROVALS = new Set(["PENDING", "APPROVED", "REJECTED"]);
const SUPPLIER_STATUSES = new Set(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]);

function normalizeUniverse(value) {
  const universe = String(value || "MARKET").trim().toUpperCase();
  return SUPPLIER_UNIVERSES.has(universe) ? universe : null;
}
function validInteger(value, { min = 0 } = {}) {
  return Number.isInteger(Number(value)) && Number(value) >= min;
}
function supplierToken(supplier) {
  return jwt.sign(
    { sub: supplier.id, email: supplier.email, type: "supplier" },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
}
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
  } catch {
    return res.status(401).json({ error: "Session fournisseur invalide." });
  }
}
function setSupplierCookie(res, token) {
  res.cookie("egonar_supplier", token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: 12 * 60 * 60 * 1000
  });
}
function sortDesc(rows, field = "created_at") {
  return rows.sort((a, b) => new Date(b[field] || 0).getTime() - new Date(a[field] || 0).getTime());
}
function sanitizeSupplier(row) {
  if (!row) return null;
  const copy = { ...row };
  delete copy.password_hash;
  return copy;
}
async function supplierById(id) {
  const doc = await firestore.collection("suppliers").doc(String(id)).get();
  return doc.exists ? docToData(doc) : null;
}
async function supplierProducts(supplierId) {
  const snap = await firestore.collection("products").where("supplier_id", "==", String(supplierId)).get();
  return snap.docs.map(docToData);
}

app.get("/api/health", async (_req, res) => {
  try {
    await firestore.collection("health").doc("ping").get();
    res.json({ ok: true, service: "EgonarMarket Supplier Portal", database: "firestore" });
  } catch (error) {
    console.error(error);
    res.status(503).json({ ok: false, database: "firestore_error" });
  }
});

app.post("/api/supplier/register", async (req, res) => {
  try {
    const { business_name, contact_name, phone, email, password } = req.body || {};
    if (!business_name || !contact_name || !email || !password) {
      return res.status(400).json({ error: "Entreprise, contact, email et mot de passe sont obligatoires." });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères." });
    }

    const normalizedEmail = String(email).trim().toLowerCase().slice(0, 160);
    const existing = await firestore.collection("suppliers").where("email", "==", normalizedEmail).limit(1).get();
    if (!existing.empty) return res.status(409).json({ error: "Cet email fournisseur existe déjà." });

    const id = crypto.randomUUID();
    const row = {
      id,
      business_name: String(business_name).trim().slice(0, 160),
      contact_name: String(contact_name).trim().slice(0, 120),
      phone: String(phone || "").trim().slice(0, 30),
      email: normalizedEmail,
      password_hash: await bcrypt.hash(String(password), 12),
      status: "PENDING",
      commission_percent: 10,
      verification_level: "STANDARD",
      rating_average: 0,
      rating_count: 0,
      orders_count: 0,
      cancellation_rate: 0,
      verified_at: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    await firestore.collection("suppliers").doc(id).set(row);
    res.status(201).json({
      supplier: sanitizeSupplier(row),
      message: "Demande envoyée. Votre compte sera activé après validation par EgonarMarket."
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Impossible de créer le compte fournisseur." });
  }
});

app.post("/api/supplier/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const snap = await firestore.collection("suppliers").where("email", "==", normalizedEmail).limit(1).get();
    const supplier = snap.empty ? null : docToData(snap.docs[0]);

    if (!supplier || !(await bcrypt.compare(String(password || ""), supplier.password_hash || ""))) {
      return res.status(401).json({ error: "Identifiants fournisseur incorrects." });
    }

    if (supplier.status !== "APPROVED") {
      const message = supplier.status === "PENDING"
        ? "Votre compte est encore en attente de validation."
        : "Votre compte fournisseur n'est pas actif.";
      return res.status(403).json({ error: message, status: supplier.status });
    }

    const token = supplierToken(supplier);
    setSupplierCookie(res, token);
    res.json({
      ok: true,
      token,
      supplier: {
        id: supplier.id,
        business_name: supplier.business_name,
        email: supplier.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Connexion fournisseur impossible." });
  }
});

app.post("/api/supplier/logout", requireSupplier, (_req, res) => {
  res.clearCookie("egonar_supplier", { httpOnly: true, sameSite: "lax", secure });
  res.json({ ok: true });
});

app.get("/api/supplier/me", requireSupplier, async (req, res) => {
  const supplier = await supplierById(req.supplier.sub);
  if (!supplier) return res.status(404).json({ error: "Fournisseur introuvable." });
  res.json(sanitizeSupplier({
    id: supplier.id,
    business_name: supplier.business_name,
    contact_name: supplier.contact_name,
    phone: supplier.phone,
    email: supplier.email,
    status: supplier.status,
    commission_percent: supplier.commission_percent,
    created_at: supplier.created_at
  }));
});

app.get("/api/supplier/stats", requireSupplier, async (req, res) => {
  const products = await supplierProducts(req.supplier.sub);
  const active = products.filter(x => x.active === true && x.approval_status === "APPROVED");
  const pending = products.filter(x => x.approval_status === "PENDING");
  res.json({
    active_products: active.length,
    pending_products: pending.length,
    total_stock: active.reduce((sum, x) => sum + Number(x.stock || 0), 0)
  });
});

app.get("/api/supplier/sales-stats", requireSupplier, async (req, res) => {
  const products = await supplierProducts(req.supplier.sub);
  const productIds = new Set(products.map(p => String(p.id)));
  const supplier = await supplierById(req.supplier.sub);
  const ordersSnap = await firestore.collection("orders").get();

  let ordersCount = 0;
  let unitsSold = 0;
  let grossSales = 0;

  for (const doc of ordersSnap.docs) {
    const order = docToData(doc);
    if (["ANNULEE", "ANNULEE_CLIENT"].includes(order.status)) continue;
    let counted = false;
    for (const item of Array.isArray(order.items) ? order.items : []) {
      if (!productIds.has(String(item.product_id))) continue;
      counted = true;
      const qty = Number(item.quantity || 0);
      unitsSold += qty;
      grossSales += qty * Number(item.unit_price_fcfa || 0);
    }
    if (counted) ordersCount += 1;
  }

  const commission = Math.round(grossSales * Number(supplier?.commission_percent || 0) / 100);
  res.json({
    orders_count: ordersCount,
    units_sold: unitsSold,
    gross_sales_fcfa: grossSales,
    estimated_commission_fcfa: commission
  });
});

app.get("/api/supplier/orders", requireSupplier, async (req, res) => {
  const products = await supplierProducts(req.supplier.sub);
  const productIds = new Set(products.map(p => String(p.id)));
  const ordersSnap = await firestore.collection("orders").get();
  const result = [];

  for (const doc of ordersSnap.docs) {
    const order = docToData(doc);
    const items = (Array.isArray(order.items) ? order.items : [])
      .filter(item => productIds.has(String(item.product_id)))
      .map(item => ({
        product_id: item.product_id,
        name: item.product_name,
        quantity: Number(item.quantity || 0),
        unit_price_fcfa: Number(item.unit_price_fcfa || 0),
        image_url: products.find(p => String(p.id) === String(item.product_id))?.image_url || "",
        universe: products.find(p => String(p.id) === String(item.product_id))?.universe || ""
      }));

    if (!items.length) continue;

    result.push({
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      subtotal_fcfa: order.subtotal_fcfa,
      delivery_fcfa: order.delivery_fcfa,
      total_fcfa: order.total_fcfa,
      created_at: order.created_at,
      updated_at: order.updated_at,
      customer_name: order.customer?.name || "",
      customer_phone: order.customer?.phone || "",
      customer_address: order.customer?.address || "",
      customer_city: order.customer?.city || "",
      supplier_units: items.reduce((sum, item) => sum + item.quantity, 0),
      supplier_total_fcfa: items.reduce((sum, item) => sum + item.quantity * item.unit_price_fcfa, 0),
      items
    });
  }

  res.json(sortDesc(result).slice(0, 100));
});

app.post("/api/supplier/orders/:id/workflow", requireSupplier, async (req, res) => {
  try {
    const action = String(req.body?.action || "").trim().toUpperCase();
    if (!["PREPARE", "SHIP"].includes(action)) return res.status(400).json({ error: "Action fournisseur invalide." });

    const orderRef = firestore.collection("orders").doc(req.params.id);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return res.status(404).json({ error: "Commande introuvable." });
    const order = orderSnap.data();

    const supplierProductsList = await supplierProducts(req.supplier.sub);
    const supplierIds = new Set(supplierProductsList.map(product => String(product.id)));
    const belongs = (Array.isArray(order.items) ? order.items : []).some(item => supplierIds.has(String(item.product_id)));
    if (!belongs) return res.status(403).json({ error: "Cette commande ne contient aucun produit de votre catalogue." });

    const transitions = {
      PREPARE: { from: "CONFIRMEE", to: "PREPARATION", label: "Préparation démarrée" },
      SHIP: { from: "PREPARATION", to: "EXPEDIEE", label: "Commande expédiée par le fournisseur" }
    };
    const transition = transitions[action];
    if (order.status !== transition.from) {
      return res.status(409).json({
        error: `Transition impossible. La commande est actuellement "${order.status}".`,
        status: order.status,
        expected_status: transition.from
      });
    }

    const now = new Date();
    const workflow = {
      ...(order.workflow || {}),
      supplier: {
        ...(order.workflow?.supplier || {}),
        ...(action === "PREPARE" ? { preparation_started_at: now } : { shipped_at: now }),
        confirmed_by: req.supplier.email
      }
    };
    const history = Array.isArray(order.status_history) ? order.status_history : [];
    history.push({
      from: transition.from,
      to: transition.to,
      actor_type: "supplier",
      actor_role: "SUPPLIER",
      actor_email: req.supplier.email,
      label: transition.label,
      at: now
    });

    await orderRef.update({ status: transition.to, workflow, status_history: history, updated_at: now });
    res.json(docToData(await orderRef.get()));
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Impossible de valider l'étape fournisseur." });
  }
});

app.get("/api/supplier/products", requireSupplier, async (req, res) => {
  const universe = String(req.query.universe || "").trim() ? normalizeUniverse(req.query.universe) : null;
  if (req.query.universe && !universe) return res.status(400).json({ error: "Univers invalide." });
  let products = await supplierProducts(req.supplier.sub);
  if (universe) products = products.filter(product => product.universe === universe);
  res.json(sortDesc(products));
});

app.post("/api/supplier/products", requireSupplier, async (req, res) => {
  try {
    const { name, category, subcategory = "", description = "", price_fcfa, old_price_fcfa = null, stock = 0, sku = null, image_url = "" } = req.body || {};
    const universe = normalizeUniverse(req.body?.universe);
    if (!universe) return res.status(400).json({ error: "Univers invalide. Choisissez MARKET, SAVEURS ou EVASION." });
    if (!String(name || "").trim() || !String(category || "").trim() || !validInteger(price_fcfa)) {
      return res.status(400).json({ error: "Nom, catégorie et prix valides sont obligatoires." });
    }
    if (!validInteger(stock)) return res.status(400).json({ error: "Le stock doit être un nombre entier positif ou nul." });

    const price = Number(price_fcfa);
    const oldPrice = old_price_fcfa === null || old_price_fcfa === "" ? null : Number(old_price_fcfa);
    if (oldPrice !== null && (!validInteger(oldPrice) || oldPrice < price)) {
      return res.status(400).json({ error: "L'ancien prix doit être supérieur ou égal au prix actuel." });
    }

    if (sku) {
      const duplicate = await firestore.collection("products").where("sku", "==", String(sku).trim()).limit(1).get();
      if (!duplicate.empty) return res.status(409).json({ error: "Ce SKU existe déjà." });
    }

    const id = crypto.randomUUID();
    const now = new Date();
    const slug = `${String(name).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`;
    const row = {
      id,
      name: String(name).trim().slice(0, 160),
      slug,
      universe,
      category: String(category).trim().toUpperCase(),
      subcategory: String(subcategory).trim(),
      description: String(description).trim(),
      price_fcfa: price,
      old_price_fcfa: oldPrice,
      stock: Number(stock),
      sku: sku ? String(sku).trim() : null,
      image_url: String(image_url || "").trim(),
      active: false,
      approval_status: "PENDING",
      supplier_id: String(req.supplier.sub),
      verified_level: "STANDARD",
      verification_score: 0,
      rating_average: 0,
      rating_count: 0,
      delivery_min_minutes: 0,
      delivery_max_minutes: 0,
      delivery_city: "Dakar",
      verified_at: null,
      created_at: now,
      updated_at: now
    };

    await firestore.collection("products").doc(id).set(row);
    res.status(201).json(row);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Impossible de soumettre le produit." });
  }
});

app.patch("/api/supplier/products/:id", requireSupplier, async (req, res) => {
  try {
    const ref = firestore.collection("products").doc(req.params.id);
    const currentSnap = await ref.get();
    if (!currentSnap.exists || String(currentSnap.data().supplier_id) !== String(req.supplier.sub)) {
      return res.status(404).json({ error: "Produit introuvable." });
    }

    const allowed = ["name", "universe", "category", "subcategory", "description", "price_fcfa", "old_price_fcfa", "stock", "sku", "image_url"];
    const patch = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) patch[key] = req.body[key];
    }
    if (!Object.keys(patch).length) return res.status(400).json({ error: "Aucune modification." });

    if (patch.universe !== undefined) {
      patch.universe = normalizeUniverse(patch.universe);
      if (!patch.universe) return res.status(400).json({ error: "Univers invalide. Choisissez MARKET, SAVEURS ou EVASION." });
    }
    if (patch.name !== undefined && !String(patch.name || "").trim()) return res.status(400).json({ error: "Le nom du produit est obligatoire." });
    if (patch.category !== undefined && !String(patch.category || "").trim()) return res.status(400).json({ error: "La catégorie est obligatoire." });
    if (patch.price_fcfa !== undefined && !validInteger(patch.price_fcfa)) return res.status(400).json({ error: "Le prix doit être un nombre entier positif ou nul." });
    if (patch.stock !== undefined && !validInteger(patch.stock)) return res.status(400).json({ error: "Le stock doit être un nombre entier positif ou nul." });
    if (patch.old_price_fcfa !== undefined && patch.old_price_fcfa !== null && patch.old_price_fcfa !== "" && !validInteger(patch.old_price_fcfa)) return res.status(400).json({ error: "L'ancien prix doit être un nombre entier positif ou nul." });

    const current = currentSnap.data();
    const nextPrice = patch.price_fcfa !== undefined ? Number(patch.price_fcfa) : Number(current.price_fcfa || 0);
    const nextOld = patch.old_price_fcfa !== undefined ? patch.old_price_fcfa : current.old_price_fcfa;
    if (nextOld !== null && nextOld !== "" && Number(nextOld) < nextPrice) {
      return res.status(400).json({ error: "L'ancien prix doit être supérieur ou égal au prix actuel." });
    }

    if (patch.sku) {
      const duplicate = await firestore.collection("products").where("sku", "==", String(patch.sku).trim()).limit(2).get();
      const other = duplicate.docs.find(doc => doc.id !== req.params.id);
      if (other) return res.status(409).json({ error: "Ce SKU existe déjà." });
      patch.sku = String(patch.sku).trim();
    }
    if (patch.category !== undefined) patch.category = String(patch.category).trim().toUpperCase();
    if (patch.name !== undefined) patch.name = String(patch.name).trim();
    patch.active = false;
    patch.approval_status = "PENDING";
    patch.updated_at = new Date();

    await ref.update(patch);
    res.json(docToData(await ref.get()));
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || "Modification impossible." });
  }
});

app.delete("/api/supplier/products/:id", requireSupplier, async (req, res) => {
  const ref = firestore.collection("products").doc(req.params.id);
  const current = await ref.get();
  if (!current.exists || String(current.data().supplier_id) !== String(req.supplier.sub)) {
    return res.status(404).json({ error: "Produit introuvable." });
  }
  await ref.update({ active: false, updated_at: new Date() });
  res.json({ ok: true });
});

app.get("/api/supplier/admin/suppliers", requireAdmin, async (_req, res) => {
  const snap = await firestore.collection("suppliers").get();
  res.json(sortDesc(snap.docs.map(docToData)));
});

app.patch("/api/supplier/admin/suppliers/:id/status", requireAdmin, async (req, res) => {
  const status = String(req.body?.status || "");
  if (!SUPPLIER_STATUSES.has(status)) return res.status(400).json({ error: "Statut fournisseur invalide." });
  const ref = firestore.collection("suppliers").doc(req.params.id);
  const current = await ref.get();
  if (!current.exists) return res.status(404).json({ error: "Fournisseur introuvable." });
  await ref.update({
    status,
    updated_at: new Date(),
    verified_at: status === "APPROVED" ? new Date() : current.data().verified_at || null,
    verification_level: status === "APPROVED" ? (current.data().verification_level || "STANDARD") : current.data().verification_level || "STANDARD"
  });
  const updated = docToData(await ref.get());
  res.json({ id: updated.id, business_name: updated.business_name, status: updated.status });
});

app.patch("/api/supplier/admin/products/:id/approval", requireAdmin, async (req, res) => {
  const approval = String(req.body?.approval_status || "");
  if (!APPROVALS.has(approval)) return res.status(400).json({ error: "Statut de validation invalide." });
  const ref = firestore.collection("products").doc(req.params.id);
  const current = await ref.get();
  if (!current.exists) return res.status(404).json({ error: "Produit introuvable." });
  await ref.update({
    approval_status: approval,
    active: approval === "APPROVED",
    updated_at: new Date()
  });
  const updated = docToData(await ref.get());
  res.json({ id: updated.id, name: updated.name, universe: updated.universe, approval_status: updated.approval_status, active: updated.active });
});

app.get("/admin.html", requireAdminPage, (_req,res)=>res.sendFile(path.join(webDir,"admin.html")));
app.get("/supplier-admin.html", requireAdminPage, (_req,res)=>res.sendFile(path.join(webDir,"supplier-admin.html")));
app.get("/supplier.html", requireSupplierPage, (_req,res)=>res.sendFile(path.join(webDir,"supplier.html")));

app.use(express.static(webDir, { extensions: ["html"] }));
app.listen(PORT, "0.0.0.0", () => console.log(`EgonarMarket supplier Firestore portal: http://localhost:${PORT}`));
