const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { getDb, FieldValue, docToData } = require("./firestore");
const { signAdmin, requireAdmin } = require("./auth");
require("dotenv").config();

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET manquant.");
if (!process.env.FIREBASE_SERVICE_ACCOUNT_FILE && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  throw new Error("Credentials Firebase manquants.");
}

const app = express();
const PORT = Number(process.env.PORT || 3000);
const webDir = path.join(__dirname, "../../web");
const FRONTEND_URL = String(process.env.FRONTEND_URL || "").trim();
const DELIVERY_DAKAR = Math.max(0, Number(process.env.DELIVERY_DAKAR_FCFA || 0));
const DELIVERY_OTHER = Math.max(0, Number(process.env.DELIVERY_OTHER_FCFA || 0));
const firestore = getDb();

app.disable("x-powered-by");
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https:"],
      scriptSrcAttr: ["'unsafe-inline'"]
    }
  }
}));
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
const reviewLimiter = rateLimit({ windowMs: 60_000, max: 8, key: req => `review:${req.ip}` });

const normalize = value => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const tokenize = value => normalize(value).split(/[^a-z0-9]+/).filter(Boolean);
const STOP_WORDS = new Set(["pour","avec","moins","plus","dans","une","des","les","the","que","cherche","recherche","donne","moi","je","veux","mon","ma","mes","un","une","a","au","aux","en","et","de","du","la","le","sur","this","that","find","show","looking","want","need","under","than","for","with","from","in","to","of"]);
const UNIVERSES = new Set(["MARKET", "SAVEURS", "EVASION"]);
function normalizeUniverse(value) {
  const u = String(value || "").trim().toUpperCase();
  return UNIVERSES.has(u) ? u : null;
}
function detectUniverse(text) {
  const words = tokenize(text);
  if (words.some(w => ["saveurs","food","restaurant","restaurants","repas","plat","plats","cuisine","manger","mange","menu","traiteur","grocery","epicerie"].includes(w))) return "SAVEURS";
  if (words.some(w => ["evasion","travel","voyage","hotel","hotels","hebergement","sejour","sejours","plage","tourisme","excursion","excursions","visite","visites","transfert"].includes(w))) return "EVASION";
  if (words.some(w => ["market","shopping","achat","achats","produit","produits","mode","tech","maison","beaute","accessoires"].includes(w))) return "MARKET";
  return null;
}
function extractAiIntent(message) {
  const text = normalize(message);
  const budgetMatch = text.match(/(?:moins de|a moins de|budget|maximum|max|under|less than)\s*([0-9\s]+)/i) || text.match(/([0-9]{3,})\s*(?:fcfa|f|francs?)/i);
  const budget = budgetMatch ? Number(budgetMatch[1].replace(/\s/g, "")) : null;
  const allWords = tokenize(text);
  const words = [...new Set(allWords.filter(w => w.length > 2 && !STOP_WORDS.has(w)))].slice(0, 16);
  const categories = ["mode","accessoires","maison","beaute","tech","charcuterie","poissonnerie","bebes","enfants"];
  const category = categories.find(c => words.some(w => w === c || w.startsWith(c)));
  return { text, budget, words, category, universe: detectUniverse(text) };
}
function sortByDateDesc(a, b) {
  return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
}
function sanitizeProduct(doc) {
  return docToData(doc);
}

app.get("/api/health", async (_req, res) => {
  try {
    await firestore.collection("health").doc("ping").get();
    res.json({ ok: true, service: "EgonarMarket API", database: "firestore" });
  } catch (error) {
    console.error(error);
    res.status(503).json({ ok: false, service: "EgonarMarket API", database: "firestore_error" });
  }
});

app.get("/api/config", (_req, res) => res.json({
  site_name: "EgonarMarket",
  currency: "FCFA",
  whatsapp_number: process.env.WHATSAPP_NUMBER || "",
  delivery: { dakar_fcfa: DELIVERY_DAKAR, other_fcfa: DELIVERY_OTHER }
}));

app.get("/api/categories", async (req, res) => {
  try {
    const universe = req.query.universe ? normalizeUniverse(req.query.universe) : null;
    if (req.query.universe && !universe) return res.status(400).json({ error: "Univers invalide." });
    let query = firestore.collection("categories");
    if (universe) query = query.where("universe", "==", universe);
    const snap = await query.get();
    const rows = snap.docs.map(docToData)
      .filter(x => x.active !== false)
      .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) || String(a.name).localeCompare(String(b.name)));
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Impossible de charger les catégories." });
  }
});

async function getPublicProducts() {
  const snap = await firestore.collection("products").where("active", "==", true).get();
  return snap.docs.map(docToData).filter(x => x.approval_status === "APPROVED").sort((a, b) => {
    const stockDiff = Number(b.stock || 0) > 0 ? 1 : 0;
    const stockDiffA = Number(a.stock || 0) > 0 ? 1 : 0;
    return stockDiff - stockDiffA ||
      Number(b.verification_score || 0) - Number(a.verification_score || 0) ||
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
}

app.get("/api/products", async (req, res) => {
  try {
    const q = normalize(req.query.q || "").trim();
    const category = String(req.query.category || "").trim();
    const universe = req.query.universe ? normalizeUniverse(req.query.universe) : null;
    if (req.query.universe && !universe) return res.status(400).json({ error: "Univers invalide." });
    let products = await getPublicProducts();
    if (universe) products = products.filter(p => p.universe === universe);
    if (category) products = products.filter(p => p.category === category);
    if (q) products = products.filter(p => normalize(`${p.name} ${p.description} ${p.category} ${p.sku || ""}`).includes(q));
    res.json(products);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Impossible de charger les produits." });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const doc = await firestore.collection("products").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Produit introuvable." });
    const product = docToData(doc);
    if (product.active !== true || product.approval_status !== "APPROVED") return res.status(404).json({ error: "Produit introuvable." });
    if (product.supplier_id) {
      const supplier = await firestore.collection("suppliers").doc(String(product.supplier_id)).get();
      product.supplier_name = supplier.exists ? String(supplier.data().business_name || "") : "";
    } else {
      product.supplier_name = "";
    }
    res.json(product);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Impossible de charger le produit." });
  }
});

app.get("/api/products/:id/reviews", async (req, res) => {
  try {
    const productSnap = await firestore.collection("products").doc(req.params.id).get();
    if (!productSnap.exists) return res.status(404).json({ error: "Produit introuvable." });
    const snap = await firestore.collection("reviews").where("product_id", "==", req.params.id).get();
    const reviews = snap.docs.map(docToData).sort(sortByDateDesc);
    const average = reviews.length ? Number((reviews.reduce((sum, x) => sum + Number(x.rating || 0), 0) / reviews.length).toFixed(2)) : 0;
    res.json({
      reviews: reviews.slice(0, 30).map(r => ({ ...r, customer_name: r.customer_name || "" })),
      average,
      count: reviews.length
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Impossible de charger les avis." });
  }
});

app.post("/api/admin/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis." });
    const normalizedEmail = String(email).trim().toLowerCase();
    const snap = await firestore.collection("admins").where("email", "==", normalizedEmail).limit(1).get();
    const adminDoc = snap.docs[0];
    const admin = adminDoc ? docToData(adminDoc) : null;
    if (!admin || !(await bcrypt.compare(String(password), admin.password_hash || ""))) return res.status(401).json({ error: "Identifiants incorrects." });
    const token = signAdmin({ id: admin.id, email: admin.email, role: admin.role || "admin" });
    res.cookie("egonar_admin", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 8 * 60 * 60 * 1000 });
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
  const snap = await firestore.collection("products").get();
  res.json(snap.docs.map(docToData).sort(sortByDateDesc));
});

app.post("/api/admin/products", requireAdmin, async (req, res) => {
  try {
    const { name, category, subcategory = "", description = "", price_fcfa, old_price_fcfa = null, stock = 0, sku = null, image_url = "" } = req.body || {};
    const universe = normalizeUniverse(req.body?.universe || "MARKET");
    if (!universe) return res.status(400).json({ error: "Univers invalide." });
    if (!String(name || "").trim() || !String(category || "").trim() || !Number.isInteger(Number(price_fcfa)) || Number(price_fcfa) < 0) return res.status(400).json({ error: "Nom, catégorie et prix valides sont obligatoires." });
    const price = Number(price_fcfa);
    const oldPrice = old_price_fcfa === null || old_price_fcfa === "" ? null : Number(old_price_fcfa);
    if (oldPrice !== null && (!Number.isInteger(oldPrice) || oldPrice < price)) return res.status(400).json({ error: "L'ancien prix doit être supérieur ou égal au prix actuel." });
    const id = crypto.randomUUID();
    const now = new Date();
    const slug = `${String(name).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`;
    const row = {
      id, name: String(name).trim(), slug, universe, category: String(category).trim(),
      subcategory: String(subcategory).trim(), description: String(description),
      price_fcfa: price, old_price_fcfa: oldPrice, stock: Math.max(0, Number(stock) || 0),
      sku: sku ? String(sku).trim() : null, image_url: String(image_url || "").trim(),
      active: true, approval_status: "APPROVED", verified_level: "STANDARD",
      verification_score: 0, rating_average: 0, rating_count: 0,
      delivery_min_minutes: 0, delivery_max_minutes: 0, delivery_city: "Dakar",
      verified_at: null, created_at: now, updated_at: now
    };
    await firestore.collection("products").doc(id).set(row);
    res.status(201).json(row);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Impossible de créer le produit." });
  }
});

app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const ref = firestore.collection("products").doc(req.params.id);
    const existing = await ref.get();
    if (!existing.exists) return res.status(404).json({ error: "Produit introuvable." });
    const allowed = ["name","universe","category","subcategory","description","price_fcfa","old_price_fcfa","stock","sku","image_url","active"];
    const patch = {};
    for (const key of allowed) if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) patch[key] = req.body[key];
    if (Object.keys(patch).length === 0) return res.status(400).json({ error: "Aucune modification." });
    if (patch.universe !== undefined) {
      patch.universe = normalizeUniverse(patch.universe);
      if (!patch.universe) return res.status(400).json({ error: "Univers invalide." });
    }
    if (patch.price_fcfa !== undefined) patch.price_fcfa = Number(patch.price_fcfa);
    if (patch.stock !== undefined) patch.stock = Math.max(0, Number(patch.stock) || 0);
    if (patch.old_price_fcfa !== undefined && patch.old_price_fcfa !== null && patch.old_price_fcfa !== "") patch.old_price_fcfa = Number(patch.old_price_fcfa);
    const nextPrice = patch.price_fcfa !== undefined ? patch.price_fcfa : Number(existing.data().price_fcfa);
    const nextOld = patch.old_price_fcfa !== undefined ? patch.old_price_fcfa : existing.data().old_price_fcfa;
    if (nextOld !== null && nextOld !== "" && Number(nextOld) < Number(nextPrice)) return res.status(400).json({ error: "L'ancien prix doit être supérieur ou égal au prix actuel." });
    patch.updated_at = new Date();
    await ref.update(patch);
    res.json(docToData(await ref.get()));
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || "Modification impossible." });
  }
});

app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
  const ref = firestore.collection("products").doc(req.params.id);
  const current = await ref.get();
  if (!current.exists) return res.status(404).json({ error: "Produit introuvable." });
  await ref.update({ active: false, updated_at: new Date() });
  res.json({ ok: true });
});

app.get("/api/admin/orders", requireAdmin, async (_req, res) => {
  const snap = await firestore.collection("orders").get();
  const rows = snap.docs.map(docToData).sort(sortByDateDesc);
  res.json(rows.map(row => ({
    ...row,
    customer_name: row.customer?.name || "",
    phone: row.customer?.phone || "",
    address: row.customer?.address || "",
    city: row.customer?.city || ""
  })));
});

const STATUSES = new Set(["EN_ATTENTE_PAIEMENT","CONFIRMEE","PREPARATION","EXPEDIEE","EN_LIVRAISON","LIVREE","ANNULEE"]);
app.patch("/api/admin/orders/:id/status", requireAdmin, async (req, res) => {
  const status = String(req.body?.status || "");
  if (!STATUSES.has(status)) return res.status(400).json({ error: "Statut invalide." });
  const ref = firestore.collection("orders").doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404).json({ error: "Commande introuvable." });
  await ref.update({ status, updated_at: new Date() });
  res.json(docToData(await ref.get()));
});

app.post("/api/orders", orderLimiter, async (req, res) => {
  const { customer, items, payment_method = "A_PAYER", delivery_fcfa = 0 } = req.body || {};
  if (!customer?.name || !customer?.phone || !customer?.address || !Array.isArray(items) || !items.length) return res.status(400).json({ error: "Informations client ou panier incomplets." });
  const productIds = [...new Set(items.map(x => String(x.product_id)))];
  const normalizedItems = items.map(item => ({ product_id: String(item.product_id), quantity: Number(item.quantity) }));
  const orderId = crypto.randomUUID();
  const customerId = crypto.randomUUID();
  const orderNumber = `EG-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const chosenPayment = new Set(["A_PAYER","LIVRAISON","WAVE","ORANGE_MONEY"]).has(String(payment_method)) ? String(payment_method) : "A_PAYER";
  try {
    const result = await firestore.runTransaction(async transaction => {
      const refs = productIds.map(id => firestore.collection("products").doc(id));
      const docs = [];
      for (const ref of refs) docs.push(await transaction.get(ref));
      const byId = new Map(docs.map(doc => [doc.id, doc]));
      const totals = new Map();
      for (const item of normalizedItems) {
        const product = byId.get(item.product_id);
        if (!product || !product.exists || product.data().active !== true || product.data().approval_status !== "APPROVED") throw new Error("Produit indisponible.");
        if (!Number.isInteger(item.quantity) || item.quantity < 1) throw new Error("Quantité invalide.");
        totals.set(item.product_id, (totals.get(item.product_id) || 0) + item.quantity);
      }
      let subtotal = 0;
      const orderItems = [];
      for (const [id, qty] of totals) {
        const productDoc = byId.get(id);
        const product = productDoc.data();
        if (qty > Number(product.stock || 0)) throw new Error(`Stock insuffisant pour ${product.name}.`);
        subtotal += Number(product.price_fcfa || 0) * qty;
        orderItems.push({
          product_id: id,
          product_name: product.name,
          unit_price_fcfa: Number(product.price_fcfa || 0),
          quantity: qty
        });
      }
      const delivery = Math.max(0, Number(delivery_fcfa) || 0);
      const initialStatus = ["WAVE","ORANGE_MONEY"].includes(chosenPayment) ? "EN_ATTENTE_PAIEMENT" : "CONFIRMEE";
      const customerRow = {
        id: customerId,
        name: String(customer.name).trim().slice(0,100),
        phone: String(customer.phone).trim().slice(0,30),
        email: customer.email ? String(customer.email).trim().slice(0,160) : null,
        address: String(customer.address).trim().slice(0,250),
        city: String(customer.city || "Dakar").trim().slice(0,80),
        created_at: new Date()
      };
      const orderRow = {
        id: orderId,
        order_number: orderNumber,
        customer_id: customerId,
        customer: customerRow,
        status: initialStatus,
        payment_method: chosenPayment,
        payment_status: "PENDING",
        subtotal_fcfa: subtotal,
        delivery_fcfa: delivery,
        total_fcfa: subtotal + delivery,
        items: orderItems,
        created_at: new Date(),
        updated_at: new Date()
      };
      transaction.set(firestore.collection("customers").doc(customerId), customerRow);
      transaction.set(firestore.collection("orders").doc(orderId), orderRow);
      for (const [id, qty] of totals) {
        const productRef = firestore.collection("products").doc(id);
        transaction.update(productRef, { stock: FieldValue.increment(-qty), updated_at: new Date() });
      }
      return orderRow;
    });
    res.status(201).json({ order_number: result.order_number, status: result.status, payment_status: result.payment_status, subtotal_fcfa: result.subtotal_fcfa, delivery_fcfa: result.delivery_fcfa, total_fcfa: result.total_fcfa });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || "Commande impossible." });
  }
});

app.post("/api/reviews", reviewLimiter, async (req, res) => {
  const { order_number, product_id, rating, comment = "" } = req.body || {};
  const score = Number(rating);
  if (!order_number || !product_id || !Number.isInteger(score) || score < 1 || score > 5) return res.status(400).json({ error: "Commande, produit et note valides sont obligatoires." });
  try {
    const orderSnap = await firestore.collection("orders").where("order_number", "==", String(order_number).trim()).limit(1).get();
    const orderDoc = orderSnap.docs[0];
    if (!orderDoc) return res.status(404).json({ error: "Commande introuvable." });
    const order = orderDoc.data();
    if (order.status !== "LIVREE") return res.status(400).json({ error: "Un avis vérifié peut être déposé après la livraison." });
    const item = (order.items || []).find(x => String(x.product_id) === String(product_id));
    if (!item) return res.status(400).json({ error: "Ce produit ne fait pas partie de cette commande." });
    const reviewId = `${orderDoc.id}_${product_id}`;
    const reviewRef = firestore.collection("reviews").doc(reviewId);
    const productRef = firestore.collection("products").doc(String(product_id));
    const result = await firestore.runTransaction(async transaction => {
      const reviewDoc = await transaction.get(reviewRef);
      const productDoc = await transaction.get(productRef);
      if (reviewDoc.exists) throw new Error("Vous avez déjà évalué ce produit pour cette commande.");
      if (!productDoc.exists) throw new Error("Produit introuvable.");
      const old = productDoc.data();
      const oldCount = Number(old.rating_count || 0);
      const oldAverage = Number(old.rating_average || 0);
      const nextCount = oldCount + 1;
      const nextAverage = Number(((oldAverage * oldCount + score) / nextCount).toFixed(2));
      const row = {
        id: reviewId,
        order_id: orderDoc.id,
        product_id: String(product_id),
        customer_id: order.customer_id,
        customer_name: order.customer?.name || "",
        rating: score,
        comment: String(comment || "").trim().slice(0,1200),
        verified_purchase: true,
        created_at: new Date()
      };
      transaction.create(reviewRef, row);
      transaction.update(productRef, { rating_average: nextAverage, rating_count: nextCount, updated_at: new Date() });
      return { average: nextAverage, count: nextCount };
    });
    res.status(201).json({ ok: true, verified_purchase: true, rating_average: result.average, rating_count: result.count });
  } catch (e) {
    const duplicate = String(e.message || "").includes("déjà évalué");
    res.status(duplicate ? 409 : 400).json({ error: e.message || "Avis impossible." });
  }
});

app.get("/api/orders/:number", async (req, res) => {
  try {
    const snap = await firestore.collection("orders").where("order_number", "==", req.params.number).limit(1).get();
    const doc = snap.docs[0];
    if (!doc) return res.status(404).json({ error: "Commande introuvable." });
    const row = docToData(doc);
    res.json({
      order_number: row.order_number, status: row.status, payment_status: row.payment_status,
      payment_method: row.payment_method, total_fcfa: row.total_fcfa, created_at: row.created_at,
      name: row.customer?.name || "", phone: row.customer?.phone || "",
      address: row.customer?.address || "", city: row.customer?.city || "", items: row.items || []
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Impossible de suivre la commande." });
  }
});

app.post("/api/ai/search", async (req, res) => {
  const message = String(req.body?.message || "").trim();
  if (!message) return res.status(400).json({ error: "Décrivez ce que vous recherchez." });
  const requestedUniverse = req.body?.universe ? normalizeUniverse(req.body.universe) : null;
  if (req.body?.universe && !requestedUniverse) return res.status(400).json({ error: "Univers invalide." });
  const intent = extractAiIntent(message);
  const universe = requestedUniverse || intent.universe;
  let products = await getPublicProducts();
  if (universe) products = products.filter(p => p.universe === universe);
  if (intent.budget) products = products.filter(p => Number(p.price_fcfa || 0) <= intent.budget);
  const searchable = intent.words.filter(w => !["saveurs","evasion","market","food","travel"].includes(w)).slice(0,12);
  const ranked = products.filter(p => {
    const haystack = tokenize(`${p.name} ${p.description} ${p.category} ${p.subcategory} ${p.sku || ""}`);
    return !searchable.length || searchable.some(word => haystack.includes(word));
  }).map(p => {
    const haystack = tokenize(`${p.name} ${p.description} ${p.category} ${p.subcategory} ${p.sku || ""}`);
    const exact = intent.words.reduce((score, w) => score + (haystack.includes(w) ? 1 : 0), 0);
    const budgetBoost = intent.budget ? Math.max(0, 1 - (Number(p.price_fcfa || 0) / intent.budget)) * 20 : 0;
    const verifiedBoost = Number(p.verification_score || 0) * 0.12;
    const ratingBoost = Number(p.rating_average || 0) * 3;
    const stockBoost = Number(p.stock) > 0 ? 8 : 0;
    return { ...p, ai_score: Number((exact * 12 + budgetBoost + verifiedBoost + ratingBoost + stockBoost).toFixed(2)) };
  }).sort((a,b) => b.ai_score - a.ai_score).slice(0,12);
  res.json({ message, budget: intent.budget, category: intent.category, universe, keywords: intent.words, products: ranked });
});

app.use("/supplier-api", async (req, res) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const targetPath = req.originalUrl.replace(/^\/supplier-api/, "") || "/";
    const supplierBase = String(process.env.SUPPLIER_API_URL || `http://127.0.0.1:${process.env.SUPPLIER_PORT || "3001"}`).replace(/\/$/, "");
    const upstreamUrl = `${supplierBase}${targetPath}`;
    const headers = { "content-type": req.headers["content-type"] || "" };
    if (req.headers.cookie) headers.cookie = req.headers.cookie;
    if (req.headers.authorization) headers.authorization = req.headers.authorization;
    const options = { method: req.method, headers, signal: controller.signal };
    if (!["GET","HEAD"].includes(req.method)) options.body = JSON.stringify(req.body || {});
    const upstream = await fetch(upstreamUrl, options);
    const setCookie = typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : (upstream.headers.get("set-cookie") ? [upstream.headers.get("set-cookie")] : []);
    if (setCookie.length) res.setHeader("set-cookie", setCookie);
    const contentType = upstream.headers.get("content-type");
    if (contentType) res.setHeader("content-type", contentType);
    res.status(upstream.status).send(await upstream.text());
  } catch (error) {
    const message = error?.name === "AbortError" ? "Service fournisseur indisponible." : "Impossible de joindre le service fournisseur.";
    res.status(503).json({ error: message });
  } finally {
    clearTimeout(timeout);
  }
});

app.use(express.static(webDir, { extensions: ["html"] }));
app.get("/", (_req, res) => res.sendFile(path.join(webDir, "index.html")));
app.listen(PORT, "0.0.0.0", () => console.log(`EgonarMarket Firestore: http://localhost:${PORT}`));
