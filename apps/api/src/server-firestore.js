const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const multer = require("multer");
const { getDb, getBucket, getDownloadURL, FieldValue, docToData } = require("./firestore");
const { signAdmin, requireAdmin } = require("./auth");
const { signCustomer, requireCustomer } = require("./customer-auth");
const { requireAdminPage, requireSupplierPage } = require("./page-auth");
const { signService, requireService, authenticateService, ROLES: SERVICE_ROLES } = require("./service-auth");
const { startWorkflowTimer, transitionWorkflowTimer, getWorkflowTimerView } = require("./workflow-timers");
const { notifyWorkflowAdvance, createNotification } = require("./notifications");
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
      scriptSrc: ["'self'", "'unsafe-inline'"],
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
function normalizeImageUrls(value) {
  let list = value;
  if (typeof list === "string") {
    try { list = JSON.parse(list); } catch { list = list ? [list] : []; }
  }
  if (!Array.isArray(list)) list = [];
  const urls = list.map(x => String(x || "").trim()).filter(Boolean).filter(url => /^https?:\/\//i.test(url) || /^\/assets\//i.test(url));
  return [...new Set(urls)].slice(0, 8);
}
function normalizeProductMedia(row = {}) {
  const gallery = normalizeImageUrls(row.image_gallery);
  const image = String(row.image_url || "").trim();
  const merged = [...new Set([image, ...gallery].filter(Boolean))].slice(0, 8);
  return { ...row, image_url: merged[0] || "", image_gallery: merged };
}
function sanitizeProduct(doc) {
  return normalizeProductMedia(docToData(doc));
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
  return snap.docs.map(doc => normalizeProductMedia(docToData(doc))).filter(x => x.approval_status === "APPROVED").sort((a, b) => {
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
    const product = normalizeProductMedia(docToData(doc));
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

app.get("/api/admin/notifications", requireAdmin, async (_req, res) => {
  try {
    const snap = await firestore.collection("notifications").get();
    const rows = snap.docs.map(docToData).filter(x => x.recipient_type === "ADMIN").sort(sortByDateDesc);
    res.json({ unread: rows.filter(x => x.read !== true).length, notifications: rows.slice(0, 100) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Impossible de charger les notifications." });
  }
});
app.patch("/api/admin/notifications/:id/read", requireAdmin, async (req, res) => {
  const ref = firestore.collection("notifications").doc(String(req.params.id));
  const snap = await ref.get();
  if (!snap.exists || snap.data().recipient_type !== "ADMIN") return res.status(404).json({ error: "Notification introuvable." });
  await ref.update({ read: true, updated_at: new Date() });
  res.json({ ok: true });
});

app.get("/api/service/notifications", requireService, async (req, res) => {
  try {
    const snap = await firestore.collection("notifications").get();
    const rows = snap.docs.map(docToData)
      .filter(x => x.recipient_type === "SERVICE" && String(x.recipient_id) === String(req.service.sub))
      .sort(sortByDateDesc);
    res.json({ unread: rows.filter(x => x.read !== true).length, notifications: rows.slice(0, 100) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Impossible de charger les notifications." });
  }
});
app.patch("/api/service/notifications/:id/read", requireService, async (req, res) => {
  const ref = firestore.collection("notifications").doc(String(req.params.id));
  const snap = await ref.get();
  if (!snap.exists || snap.data().recipient_type !== "SERVICE" || String(snap.data().recipient_id) !== String(req.service.sub)) return res.status(404).json({ error: "Notification introuvable." });
  await ref.update({ read: true, updated_at: new Date() });
  res.json({ ok: true });
});

app.get("/api/admin/products", requireAdmin, async (_req, res) => {
  const snap = await firestore.collection("products").get();
  res.json(snap.docs.map(docToData).sort(sortByDateDesc));
});

app.post("/api/admin/products", requireAdmin, async (req, res) => {
  try {
    const { name, category, subcategory = "", description = "", price_fcfa, old_price_fcfa = null, stock = 0, sku = null, image_url = "", image_gallery = [] } = req.body || {};
    const universe = normalizeUniverse(req.body?.universe || "MARKET");
    if (!universe) return res.status(400).json({ error: "Univers invalide." });
    if (!String(name || "").trim() || !String(category || "").trim() || !Number.isInteger(Number(price_fcfa)) || Number(price_fcfa) < 0) return res.status(400).json({ error: "Nom, catégorie et prix valides sont obligatoires." });
    const price = Number(price_fcfa);
    const oldPrice = old_price_fcfa === null || old_price_fcfa === "" ? null : Number(old_price_fcfa);
    if (oldPrice !== null && (!Number.isInteger(oldPrice) || oldPrice < price)) return res.status(400).json({ error: "L'ancien prix doit être supérieur ou égal au prix actuel." });
    let publishAt = null;
    if (req.body?.publish_at) {
      publishAt = new Date(req.body.publish_at);
      if (Number.isNaN(publishAt.getTime())) return res.status(400).json({ error: "Date de publication invalide." });
    }
    const id = crypto.randomUUID();
    const now = new Date();
    const slug = `${String(name).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`;
    const gallery = normalizeImageUrls(image_gallery);
    const primaryImage = String(image_url || "").trim() || gallery[0] || "";
    const row = {
      id, name: String(name).trim(), slug, universe, category: String(category).trim(),
      subcategory: String(subcategory).trim(), description: String(description),
      price_fcfa: price, old_price_fcfa: oldPrice, stock: Math.max(0, Number(stock) || 0),
      sku: sku ? String(sku).trim() : null, image_url: primaryImage, image_gallery: [...new Set([primaryImage, ...gallery].filter(Boolean))].slice(0, 8),
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
    const allowed = ["name","universe","category","subcategory","description","price_fcfa","old_price_fcfa","stock","sku","image_url","image_gallery","active"];
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
    if (patch.image_gallery !== undefined) patch.image_gallery = normalizeImageUrls(patch.image_gallery);
    if (patch.image_url !== undefined) patch.image_url = String(patch.image_url || "").trim();
    if (patch.image_gallery !== undefined && patch.image_url === undefined) patch.image_url = patch.image_gallery[0] || String(existing.data().image_url || "");
    if (patch.image_url !== undefined && patch.image_gallery !== undefined) patch.image_gallery = [...new Set([patch.image_url, ...patch.image_gallery].filter(Boolean))].slice(0, 8);
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
    city: row.customer?.city || "",
    workflow: safeWorkflow(row),
    status_history: Array.isArray(row.status_history) ? row.status_history : [],
    timer: getWorkflowTimerView(row),
    timer_history: Array.isArray(row.workflow_timer_history) ? row.workflow_timer_history : []
  })));
});


const WORKFLOW_ROLE_LABELS = {
  CUSTOMER_SERVICE: "Service client",
  PAYMENT: "Paiement",
  SUPPLIER: "Fournisseur",
  LOGISTICS: "Logistique",
  COURIER: "Livreur"
};
const WORKFLOW_NEXT = {
  CUSTOMER_SERVICE: { from: "EN_ATTENTE_SERVICE_CLIENT", to: null, key: "customer_service", label: "Commande validée par le service client" },
  PAYMENT: { from: "EN_ATTENTE_PAIEMENT", to: "CONFIRMEE", key: "payment", label: "Paiement confirmé" },
  LOGISTICS: { from: "EXPEDIEE", to: "EN_LIVRAISON", key: "logistics", label: "Commande prise en charge par la logistique" },
  COURIER: { from: "EN_LIVRAISON", to: "LIVREE", key: "courier", label: "Commande livrée" }
};
const SERVICE_STAGE_BY_STATUS = {
  EN_ATTENTE_SERVICE_CLIENT: "CUSTOMER_SERVICE",
  EN_ATTENTE_PAIEMENT: "PAYMENT",
  EXPEDIEE: "LOGISTICS",
  EN_LIVRAISON: "COURIER"
};
function workflowHistoryAppend(current, entry) {
  return [...(Array.isArray(current?.status_history) ? current.status_history : []), entry];
}
function safeWorkflow(order) {
  return {
    customer_service: {},
    payment: {},
    supplier: {},
    logistics: {},
    courier: {},
    ...(order?.workflow || {})
  };
}
function serviceActor(req) {
  return {
    id: req.service.sub,
    email: req.service.email,
    name: req.service.name || req.service.email,
    role: req.service.role
  };
}
function serviceAssignment(workflow, role) {
  const key = WORKFLOW_NEXT[role]?.key;
  return key ? workflow?.[key]?.assigned_to || null : null;
}
function serviceAssignmentMatches(assignment, actor) {
  return !assignment?.id || assignment.id === actor.id;
}
async function serviceConfirmOrder({ req, res, role, orderId }) {
  const step = WORKFLOW_NEXT[role];
  if (!step) return res.status(400).json({ error: "Étape de workflow invalide." });
  const ref = firestore.collection("orders").doc(String(orderId));
  const actor = serviceActor(req);
  const paymentReference = String(req.body?.payment_reference || "").trim().slice(0, 120);
  if (role === "PAYMENT" && !paymentReference) return res.status(400).json({ error: "La référence de transaction est obligatoire pour confirmer ce paiement." });

  try {
    const updated = await firestore.runTransaction(async transaction => {
      const currentSnap = await transaction.get(ref);
      if (!currentSnap.exists) {
        const error = new Error("Commande introuvable.");
        error.httpStatus = 404;
        throw error;
      }
      const current = currentSnap.data();
      if (current.status !== step.from) {
        const error = new Error(`Transition impossible. La commande est actuellement "${current.status}".`);
        error.httpStatus = 409;
        error.payload = { status: current.status, expected_status: step.from };
        throw error;
      }

      const now = new Date();
      const workflow = safeWorkflow(current);
      const existingAssignment = serviceAssignment(workflow, role);
      if (!serviceAssignmentMatches(existingAssignment, actor)) {
        const error = new Error(`Cette commande est affectée à ${existingAssignment.name || existingAssignment.email}.`);
        error.httpStatus = 409;
        error.payload = { assigned_to: existingAssignment };
        throw error;
      }

      const assignedTo = existingAssignment || {
        ...actor,
        assigned_at: now,
        assigned_by: actor.id
      };
      workflow[step.key] = {
        ...(workflow[step.key] || {}),
        assigned_to: assignedTo,
        confirmed: true,
        confirmed_at: now,
        confirmed_by: actor.email,
        confirmed_name: actor.name,
        confirmed_user_id: actor.id,
        service_role: role
      };

      let nextStatus = step.to;
      if (role === "CUSTOMER_SERVICE") {
        nextStatus = ["WAVE", "ORANGE_MONEY"].includes(String(current.payment_method || "")) ? "EN_ATTENTE_PAIEMENT" : "CONFIRMEE";
      }

      const entry = {
        from: current.status,
        to: nextStatus,
        actor_type: "service",
        actor_role: role,
        actor_id: actor.id,
        actor_name: actor.name,
        actor_email: actor.email,
        label: step.label,
        at: now
      };
      const timerTransition = transitionWorkflowTimer(current, nextStatus, now);
      const patch = {
        status: nextStatus,
        workflow,
        ...(role === "PAYMENT" ? {
          payment_status: "PAID",
          payment: {
            ...(current.payment || {}),
            provider: current.payment?.provider || current.payment_method || "",
            method: current.payment?.method || current.payment_method || "",
            status: "PAID",
            reference: paymentReference,
            verified_at: now,
            updated_at: now,
            verified_by: { id: actor.id, name: actor.name, email: actor.email }
          }
        } : {}),
        status_history: workflowHistoryAppend(current, entry),
        workflow_timer: timerTransition.current,
        workflow_timer_history: timerTransition.history,
        updated_at: now
      };
      transaction.update(ref, patch);
    });

    const finalOrder = docToData(await ref.get());
    if (role === "PAYMENT") {
      const paymentAttemptId = crypto.randomUUID();
      await firestore.collection("payment_attempts").doc(paymentAttemptId).set({
        id: paymentAttemptId,
        order_id: finalOrder.id,
        order_number: finalOrder.order_number,
        provider: finalOrder.payment?.provider || finalOrder.payment_method || "",
        reference: paymentReference,
        status: "VERIFIED",
        verified_by: { id: actor.id, name: actor.name, email: actor.email },
        verified_at: new Date(),
        created_at: new Date()
      });
    }
    await notifyWorkflowAdvance(finalOrder, finalOrder.status);
    return res.json(finalOrder);
  } catch (error) {
    const status = Number(error.httpStatus) || 400;
    if (status >= 500) console.error(error);
    return res.status(status).json({
      error: error.message || "Impossible de valider cette étape.",
      ...(error.payload || {})
    });
  }
}

app.post("/api/service/login", authLimiter, async (req, res) => {
  try {
    const requestedRole = String(req.body?.role || "").trim().toUpperCase();
    const user = await authenticateService(req.body?.email, req.body?.password);
    if (!user) return res.status(401).json({ error: "Identifiants de service incorrects." });
    if (requestedRole && user.role !== requestedRole) return res.status(403).json({ error: "Ce compte n'est pas autorisé pour ce service." });
    const token = signService(user);
    res.cookie("egonar_service", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 12 * 60 * 60 * 1000 });
    res.json({ ok: true, role: user.role, email: user.email });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Connexion service impossible." });
  }
});

app.post("/api/service/logout", async (_req, res) => {
  res.clearCookie("egonar_service", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  res.json({ ok: true });
});

app.get("/api/service/me", requireService(), (req, res) => {
  res.json({ id: req.service.sub, name: req.service.name || req.service.email, email: req.service.email, role: req.service.role });
});

app.get("/api/service/orders", requireService(), async (req, res) => {
  const relevant = {
    CUSTOMER_SERVICE: ["EN_ATTENTE_SERVICE_CLIENT"],
    PAYMENT: ["EN_ATTENTE_PAIEMENT"],
    LOGISTICS: ["EXPEDIEE"],
    COURIER: ["EN_LIVRAISON"]
  };
  const allowedStatuses = relevant[req.service.role] || [];
  const stageKey = WORKFLOW_NEXT[req.service.role]?.key || null;
  const snap = await firestore.collection("orders").get();
  const rows = snap.docs
    .map(docToData)
    .filter(row => allowedStatuses.includes(row.status))
    .filter(row => {
      const assignment = stageKey ? safeWorkflow(row)?.[stageKey]?.assigned_to : null;
      return !assignment?.id || assignment.id === req.service.sub;
    })
    .sort(sortByDateDesc);

  res.json(rows.map(row => {
    const workflow = safeWorkflow(row);
    return {
      ...row,
      customer_name: row.customer?.name || "",
      phone: row.customer?.phone || "",
      address: row.customer?.address || "",
      city: row.customer?.city || "",
      assignment: stageKey ? workflow?.[stageKey]?.assigned_to || null : null,
      timer: getWorkflowTimerView(row),
      timer_history: Array.isArray(row.workflow_timer_history) ? row.workflow_timer_history : []
    };
  }));
});

app.post("/api/service/orders/:id/confirm", requireService(), async (req, res) => {
  await serviceConfirmOrder({ req, res, role: req.service.role, orderId: req.params.id });
});

app.get("/api/admin/service-users", requireAdmin, async (_req, res) => {
  const snap = await firestore.collection("service_users").get();
  res.json(snap.docs.map(doc => {
    const row = docToData(doc);
    delete row.password_hash;
    return row;
  }).sort(sortByDateDesc));
});

app.post("/api/admin/service-users", requireAdmin, async (req, res) => {
  try {
    const role = String(req.body?.role || "").trim().toUpperCase();
    const name = String(req.body?.name || "").trim().slice(0, 120);
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!SERVICE_ROLES.has(role)) return res.status(400).json({ error: "Rôle de service invalide." });
    if (!name || !email || password.length < 8) return res.status(400).json({ error: "Nom, email et mot de passe (8 caractères minimum) sont obligatoires." });
    const existing = await firestore.collection("service_users").where("email", "==", email).limit(1).get();
    if (!existing.empty) return res.status(409).json({ error: "Cet email de service existe déjà." });
    const id = crypto.randomUUID();
    const row = {
      id, name, email, role,
      role_label: WORKFLOW_ROLE_LABELS[role],
      password_hash: await bcrypt.hash(password, 12),
      active: true,
      created_at: new Date(),
      updated_at: new Date()
    };
    await firestore.collection("service_users").doc(id).set(row);
    res.status(201).json({ id, name, email, role, role_label: row.role_label, active: true });
  } catch (e) {
    console.error(e);
    console.error("Service user creation failed:", e?.stack || e);
    const message = String(e?.code || "").toUpperCase() === "ALREADY_EXISTS"
      ? "Ce compte service existe déjà."
      : (String(e?.message || "").slice(0, 300) || "Impossible de créer le compte service.");
    res.status(400).json({ error: message });
  }
});

app.post("/api/admin/service-users/cleanup", requireAdmin, async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Email de service requis." });
    const snap = await firestore.collection("service_users").where("email", "==", email).get();
    if (snap.empty) return res.status(404).json({ error: "Aucun compte service trouvé." });
    const rows = snap.docs.map(doc => ({ doc, data: docToData(doc) }));
    const keep = rows.find(x => x.data.active === true) || rows[0];
    const batch = firestore.batch();
    let deleted = 0;
    for (const row of rows) {
      if (row.doc.id === keep.doc.id) continue;
      batch.delete(row.doc.ref);
      deleted += 1;
    }
    await batch.commit();
    res.json({
      ok: true,
      email,
      kept: { id: keep.doc.id, active: keep.data.active === true, role: keep.data.role },
      deleted
    });
  } catch (e) {
    console.error("Service user cleanup failed:", e?.stack || e);
    res.status(400).json({ error: String(e?.message || "Nettoyage impossible.").slice(0, 300) });
  }
});

app.delete("/api/admin/service-users/:id", requireAdmin, async (req, res) => {
  try {
    const ref = firestore.collection("service_users").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Compte service introuvable." });
    await ref.delete();
    res.json({ ok: true });
  } catch (e) {
    console.error("Service user deletion failed:", e?.stack || e);
    res.status(400).json({ error: String(e?.message || "Suppression impossible.").slice(0, 300) });
  }
});

app.patch("/api/admin/service-users/:id", requireAdmin, async (req, res) => {
  const ref = firestore.collection("service_users").doc(req.params.id);
  const current = await ref.get();
  if (!current.exists) return res.status(404).json({ error: "Compte service introuvable." });
  const patch = { updated_at: new Date() };
  if (req.body?.name !== undefined) {
    const name = String(req.body.name || "").trim().slice(0, 120);
    if (!name) return res.status(400).json({ error: "Le nom de l'utilisateur est obligatoire." });
    patch.name = name;
  }
  if (req.body?.active !== undefined) patch.active = Boolean(req.body.active);
  if (req.body?.password) {
    if (String(req.body.password).length < 8) return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères." });
    patch.password_hash = await bcrypt.hash(String(req.body.password), 12);
  }
  await ref.update(patch);
  const updated = docToData(await ref.get());
  delete updated.password_hash;
  res.json(updated);
});

app.patch("/api/admin/orders/:id/assignment", requireAdmin, async (req, res) => {
  const role = String(req.body?.role || "").trim().toUpperCase();
  const serviceUserId = String(req.body?.service_user_id || "").trim();

  if (!["CUSTOMER_SERVICE", "PAYMENT", "LOGISTICS", "COURIER"].includes(role)) {
    return res.status(400).json({ error: "Rôle de service invalide." });
  }

  const step = WORKFLOW_NEXT[role];
  const ref = firestore.collection("orders").doc(req.params.id);
  const currentSnap = await ref.get();
  if (!currentSnap.exists) return res.status(404).json({ error: "Commande introuvable." });
  const current = currentSnap.data();

  if (current.status !== step.from) {
    return res.status(409).json({
      error: `Cette commande n'est plus à l'étape "${step.label}".`,
      status: current.status,
      expected_status: step.from
    });
  }

  const workflow = safeWorkflow(current);
  if (!serviceUserId) {
    workflow[step.key] = { ...(workflow[step.key] || {}), assigned_to: null };
  } else {
    const userRef = firestore.collection("service_users").doc(serviceUserId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return res.status(404).json({ error: "Compte service introuvable." });
    const user = docToData(userSnap);
    if (user.active === false || user.role !== role) {
      return res.status(409).json({ error: "Ce compte service n'est pas actif ou n'appartient pas à cette étape." });
    }
    workflow[step.key] = {
      ...(workflow[step.key] || {}),
      assigned_to: {
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        role: user.role,
        assigned_at: new Date(),
        assigned_by: req.admin.email
      }
    };
  }

  const now = new Date();
  await ref.update({
    workflow,
    updated_at: now,
    status_history: workflowHistoryAppend(current, {
      from: current.status || null,
      to: current.status || null,
      actor_type: "admin",
      actor_role: "ADMIN",
      actor_email: req.admin.email,
      actor_name: req.admin.email,
      label: serviceUserId ? `Affectation ${WORKFLOW_ROLE_LABELS[role]}` : `Désaffectation ${WORKFLOW_ROLE_LABELS[role]}`,
      at: now
    })
  });

  res.json(docToData(await ref.get()));
});

const STATUSES = new Set(["EN_ATTENTE_SERVICE_CLIENT","EN_ATTENTE_PAIEMENT","CONFIRMEE","PREPARATION","EXPEDIEE","EN_LIVRAISON","LIVREE","ANNULEE"]);
app.patch("/api/admin/orders/:id/status", requireAdmin, async (req, res) => {
  const status = String(req.body?.status || "");
  if (!STATUSES.has(status)) return res.status(400).json({ error: "Statut invalide." });
  const ref = firestore.collection("orders").doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404).json({ error: "Commande introuvable." });
  const current = doc.data();
  const now = new Date();
  const timerTransition = transitionWorkflowTimer(current, status, now);
  await ref.update({
    status,
    workflow_timer: timerTransition.current,
    workflow_timer_history: timerTransition.history,
    updated_at: now,
    status_history: workflowHistoryAppend(current, {
      from: current.status || null,
      to: status,
      actor_type: "admin",
      actor_email: req.admin.email,
      label: "Modification administrateur",
      at: now
    })
  });
  const finalOrder = docToData(await ref.get());
  await notifyWorkflowAdvance(finalOrder, finalOrder.status);
  return res.json(finalOrder);
});

function customerSafe(row) {
  if (!row) return null;
  return { id: row.id, name: row.name || "", email: row.email || "", phone: row.phone || "", address: row.address || "", city: row.city || "" };
}

async function getCustomerByEmail(email) {
  const snap = await firestore.collection("customers").where("email", "==", String(email || "").trim().toLowerCase()).limit(1).get();
  return snap.docs[0] ? docToData(snap.docs[0]) : null;
}

app.post("/api/customer/register", authLimiter, async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim().slice(0,100);
    const email = String(req.body?.email || "").trim().toLowerCase().slice(0,160);
    const phone = String(req.body?.phone || "").trim().slice(0,30);
    const password = String(req.body?.password || "");
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return res.status(400).json({ error: "Nom, email valide et mot de passe de 8 caractères minimum sont requis." });
    const existing = await getCustomerByEmail(email);
    if (existing) return res.status(409).json({ error: "Un compte existe déjà avec cet email." });
    const id = crypto.randomUUID();
    const row = { id, name, email, phone, password_hash: await bcrypt.hash(password, 12), address: "", city: "Dakar", created_at: new Date(), updated_at: new Date() };
    await firestore.collection("customers").doc(id).set(row);
    const token = signCustomer(row);
    res.cookie("egonar_customer", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ ok: true, customer: customerSafe(row) });
  } catch (e) { console.error(e); res.status(400).json({ error: "Création du compte impossible." }); }
});

app.post("/api/customer/login", authLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const customer = await getCustomerByEmail(email);
    if (!customer || !(await bcrypt.compare(password, customer.password_hash || ""))) return res.status(401).json({ error: "Email ou mot de passe incorrect." });
    const token = signCustomer(customer);
    res.cookie("egonar_customer", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.json({ ok: true, customer: customerSafe(customer) });
  } catch (e) { console.error(e); res.status(500).json({ error: "Connexion impossible." }); }
});

app.post("/api/customer/logout", requireCustomer, (_req, res) => {
  res.clearCookie("egonar_customer", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  res.json({ ok: true });
});

app.get("/api/customer/me", requireCustomer, async (req, res) => {
  const snap = await firestore.collection("customers").doc(req.customer.sub).get();
  if (!snap.exists) return res.status(404).json({ error: "Compte client introuvable." });
  res.json({ customer: customerSafe(docToData(snap)) });
});

app.patch("/api/customer/me", requireCustomer, async (req, res) => {
  const ref = firestore.collection("customers").doc(req.customer.sub);
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ error: "Compte client introuvable." });
  const patch = {};
  for (const key of ["name","phone","address","city"]) if (req.body?.[key] !== undefined) patch[key] = String(req.body[key] || "").trim().slice(0, key === "address" ? 250 : 100);
  if (req.body?.email !== undefined) {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Email invalide." });
    const existing = await getCustomerByEmail(email);
    if (existing && existing.id !== req.customer.sub) return res.status(409).json({ error: "Cet email est déjà utilisé." });
    patch.email = email;
  }
  if (req.body?.password) {
    if (String(req.body.password).length < 8) return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères." });
    patch.password_hash = await bcrypt.hash(String(req.body.password), 12);
  }
  patch.updated_at = new Date();
  await ref.update(patch);
  res.json({ customer: customerSafe(docToData(await ref.get())) });
});

app.get("/api/customer/orders", requireCustomer, async (req, res) => {
  const snap = await firestore.collection("orders").where("customer_id", "==", req.customer.sub).get();
  const rows = snap.docs.map(docToData).sort(sortByDateDesc);
  res.json(rows);
});

app.get("/api/customer/favorites", requireCustomer, async (req, res) => {
  const snap = await firestore.collection("favorites").where("customer_id", "==", req.customer.sub).get();
  const ids = snap.docs.map(d => String(d.data().product_id));
  const products = await getPublicProducts();
  res.json(products.filter(p => ids.includes(String(p.id))));
});

app.post("/api/customer/favorites/:productId", requireCustomer, async (req, res) => {
  const productRef = firestore.collection("products").doc(String(req.params.productId));
  const product = await productRef.get();
  if (!product.exists || product.data().active !== true || product.data().approval_status !== "APPROVED") return res.status(404).json({ error: "Produit introuvable." });
  const id = req.customer.sub + "_" + String(req.params.productId);
  const ref = firestore.collection("favorites").doc(id);
  const current = await ref.get();
  if (current.exists) { await ref.delete(); return res.json({ favorite: false }); }
  await ref.set({ id, customer_id: req.customer.sub, product_id: String(req.params.productId), created_at: new Date() });
  res.status(201).json({ favorite: true });
});

app.get("/api/customer/favorites/ids", requireCustomer, async (req, res) => {
  const snap = await firestore.collection("favorites").where("customer_id", "==", req.customer.sub).get();
  res.json({ product_ids: snap.docs.map(d => String(d.data().product_id)) });
});

app.post("/api/customer/recently-viewed/:productId", requireCustomer, async (req, res) => {
  const productId = String(req.params.productId);
  const product = await firestore.collection("products").doc(productId).get();
  if (!product.exists || product.data().active !== true || product.data().approval_status !== "APPROVED") return res.status(404).json({ error: "Produit introuvable." });
  const ref = firestore.collection("recently_viewed").doc(req.customer.sub + "_" + productId);
  await ref.set({ id: ref.id, customer_id: req.customer.sub, product_id: productId, viewed_at: new Date() }, { merge: true });
  res.json({ ok: true });
});

app.get("/api/customer/recently-viewed", requireCustomer, async (req, res) => {
  const snap = await firestore.collection("recently_viewed").where("customer_id", "==", req.customer.sub).get();
  const ids = snap.docs.map(d => docToData(d)).sort((a,b) => new Date(b.viewed_at || 0)-new Date(a.viewed_at || 0)).slice(0,20).map(x => x.product_id);
  const products = await getPublicProducts();
  res.json(products.filter(p => ids.includes(String(p.id))));
});

app.get("/api/recommendations", async (req, res) => {
  const productId = String(req.query.product_id || "");
  const universe = req.query.universe ? normalizeUniverse(req.query.universe) : null;
  const category = String(req.query.category || "").trim();
  const products = await getPublicProducts();
  const base = products.find(p => String(p.id) === productId);
  const candidates = products.filter(p => String(p.id) !== productId && (!universe || p.universe === universe) && (!category || p.category === category));
  const scored = candidates.map(p => {
    let score = 0;
    if (base && p.category === base.category) score += 30;
    if (base && p.universe === base.universe) score += 20;
    if (Number(p.stock || 0) > 0) score += 10;
    score += Number(p.rating_average || 0) * 4;
    score += Number(p.verification_score || 0) * 0.08;
    return { ...p, recommendation_score: score };
  }).sort((a,b)=>b.recommendation_score-a.recommendation_score).slice(0,8);
  res.json({ products: scored });
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
          quantity: qty,
          universe: product.universe || "MARKET"
        });
      }
      const delivery = Math.max(0, Number(delivery_fcfa) || 0);
      const initialStatus = "EN_ATTENTE_SERVICE_CLIENT";
      const customerRow = {
        id: customerId,
        name: String(customer.name).trim().slice(0,100),
        phone: String(customer.phone).trim().slice(0,30),
        email: customer.email ? String(customer.email).trim().toLowerCase().slice(0,160) : (linkedCustomer?.email || null),
        address: String(customer.address).trim().slice(0,250) || (linkedCustomer?.address || ""),
        city: String(customer.city || linkedCustomer?.city || "Dakar").trim().slice(0,80),
        created_at: linkedCustomer?.created_at || new Date(),
        updated_at: new Date()
      };
      const orderRow = {
        id: orderId,
        order_number: orderNumber,
        customer_id: customerId,
        customer: customerRow,
        status: initialStatus,
        payment_method: chosenPayment,
        payment_status: "PENDING",
        payment: { provider: chosenPayment, method: chosenPayment, status: "PENDING", reference: null, verified_at: null, updated_at: new Date() },
        subtotal_fcfa: subtotal,
        delivery_fcfa: delivery,
        total_fcfa: subtotal + delivery,
        items: orderItems,
        workflow: {
          customer_service: { required: true, confirmed: false, confirmed_at: null, confirmed_by: null, service_role: null },
          payment: { required: ["WAVE", "ORANGE_MONEY"].includes(chosenPayment), confirmed: false, confirmed_at: null, confirmed_by: null, service_role: null },
          supplier: { preparation_started_at: null, shipped_at: null, confirmed_by: null },
          logistics: { confirmed_at: null, confirmed_by: null },
          courier: { confirmed_at: null, confirmed_by: null }
        },
        workflow_timer: startWorkflowTimer(initialStatus, new Date()),
        workflow_timer_history: [],
        status_history: [{
          from: null,
          to: initialStatus,
          actor_type: "system",
          actor_email: "system",
          label: "Commande créée — en attente de validation du service client",
          at: new Date()
        }],
        created_at: new Date(),
        updated_at: new Date()
      };
      if (!linkedCustomer) transaction.set(firestore.collection("customers").doc(customerId), customerRow);
      else transaction.update(firestore.collection("customers").doc(customerId), customerRow);
      transaction.set(firestore.collection("orders").doc(orderId), orderRow);
      for (const [id, qty] of totals) {
        const productRef = firestore.collection("products").doc(id);
        transaction.update(productRef, { stock: FieldValue.increment(-qty), updated_at: new Date() });
      }
      return orderRow;
    });
    await createNotification({recipient_type:"ADMIN",recipient_id:"admin",order_id:result.id,order_number:result.order_number,title:"Nouvelle commande",body:`La commande ${result.order_number} attend la validation du service client.`});
    const serviceSnap = await firestore.collection("service_users").get();
    for(const d of serviceSnap.docs){const u=docToData(d);if(u.role==="CUSTOMER_SERVICE"&&u.active!==false) await createNotification({recipient_type:"SERVICE",recipient_id:u.id,role:"CUSTOMER_SERVICE",order_id:result.id,order_number:result.order_number,title:"Nouvelle commande à valider",body:`La commande ${result.order_number} attend votre validation.`});}
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
      address: row.customer?.address || "", city: row.customer?.city || "", items: row.items || [],
      workflow: safeWorkflow(row),
      status_history: Array.isArray(row.status_history) ? row.status_history : [],
      timer: getWorkflowTimerView(row),
      timer_history: Array.isArray(row.workflow_timer_history) ? row.workflow_timer_history : []
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



const STUDIO_CONTENT_TYPES = new Set(["PAGE","BANNER","SECTION","PROMOTION","SEO"]);
const STUDIO_LOCALES = new Set(["fr","en"]);
const STUDIO_STATUSES = new Set(["DRAFT","PUBLISHED","ARCHIVED"]);
const STUDIO_CATEGORIES = new Set(["MARKET","SAVEURS","EVASION"]);

function studioClean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}
function studioActor(req) {
  return {
    actor_type: "admin",
    actor_id: req.admin?.id || null,
    actor_email: req.admin?.email || "admin",
    actor_name: req.admin?.email || "Administration"
  };
}
async function studioAudit(req, action, targetType, targetId, before, after) {
  const actor = studioActor(req);
  const now = new Date();
  const auditId = crypto.randomUUID();
  await firestore.collection("studio_audit_logs").doc(auditId).set({
    id: auditId,
    action,
    target_type: targetType,
    target_id: String(targetId || ""),
    before: before || null,
    after: after || null,
    ...actor,
    created_at: now
  });
}

app.get("/api/content", async (req, res) => {
  try {
    const universe = normalizeUniverse(req.query.universe);
    const locale = String(req.query.locale || "fr").trim().toLowerCase();
    const key = studioClean(req.query.key, 160);
    if (req.query.universe && !universe) return res.status(400).json({ error: "Univers invalide." });
    if (!STUDIO_LOCALES.has(locale)) return res.status(400).json({ error: "Langue invalide." });
    const snap = await firestore.collection("studio_contents").get();
    const now = Date.now();
    let rows = snap.docs.map(docToData).filter(row => row.status === "PUBLISHED" && row.locale === locale && row.active !== false && (!row.publish_at || new Date(row.publish_at).getTime() <= now));
    if (universe) rows = rows.filter(row => row.universe === universe);
    if (key) rows = rows.filter(row => row.key === key);
    rows.sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || sortByDateDesc(a, b));
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Impossible de charger le contenu." });
  }
});

const studioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 7 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = new Set(["image/jpeg","image/png","image/webp","image/gif"]);
    cb(allowed.has(file.mimetype) ? null : new Error("Format image non pris en charge. Utilisez JPG, PNG, WEBP ou GIF."), allowed.has(file.mimetype));
  }
});

app.post("/api/admin/studio/upload", requireAdmin, (req, res) => {
  studioUpload.single("image")(req, res, async error => {
    try {
      if (error) return res.status(400).json({ error: error.message || "Téléversement impossible." });
      if (!req.file) return res.status(400).json({ error: "Aucune image sélectionnée." });
      const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" })[req.file.mimetype];
      const now = new Date();
      const objectName = `studio/${now.getUTCFullYear()}/${String(now.getUTCMonth()+1).padStart(2,"0")}/${crypto.randomUUID()}.${extension}`;
      const file = getBucket().file(objectName);
      await file.save(req.file.buffer, {
        resumable: false,
        metadata: { contentType: req.file.mimetype, cacheControl: "public,max-age=31536000,immutable" }
      });
      const url = await getDownloadURL(file);
      const asset = { id: crypto.randomUUID(), object_name: objectName, url, content_type: req.file.mimetype, size_bytes: req.file.size, original_name: req.file.originalname, universe: normalizeUniverse(req.body?.universe) || null, uploaded_by: studioActor(req), created_at: now };
      await Promise.all([
        firestore.collection("studio_assets").doc(asset.id).set(asset),
        firestore.collection("media_assets").doc(asset.id).set(asset)
      ]);
      await studioAudit(req, "UPLOAD", "ASSET", asset.id, null, asset);
      res.status(201).json(asset);
    } catch (e) {
      console.error("Studio image upload failed:", e?.stack || e);
      res.status(500).json({ error: e.message || "Téléversement de l image impossible." });
    }
  });
});
app.get("/api/admin/studio/media", requireAdmin, async (req, res) => {
  try {
    const [studioSnap, sharedSnap] = await Promise.all([
      firestore.collection("studio_assets").get(),
      firestore.collection("media_assets").get()
    ]);
    const map = new Map();
    for (const doc of [...studioSnap.docs, ...sharedSnap.docs]) {
      const row = docToData(doc);
      if (row.active === false) continue;
      const key = row.id || doc.id;
      map.set(key, row);
    }
    const universe = req.query.universe ? normalizeUniverse(req.query.universe) : null;
    if (req.query.universe && !universe) return res.status(400).json({ error: "Univers invalide." });
    let rows = [...map.values()];
    if (universe) rows = rows.filter(x => !x.universe || x.universe === universe);
    rows.sort(sortByDateDesc);
    res.json(rows.slice(0, 300));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Impossible de charger la bibliothèque média." });
  }
});

app.delete("/api/admin/studio/media/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const [studioRef, sharedRef] = [firestore.collection("studio_assets").doc(id), firestore.collection("media_assets").doc(id)];
    const [studioSnap, sharedSnap] = await Promise.all([studioRef.get(), sharedRef.get()]);
    const asset = studioSnap.exists ? studioSnap.data() : (sharedSnap.exists ? sharedSnap.data() : null);
    if (!asset) return res.status(404).json({ error: "Média introuvable." });
    const url = String(asset.url || "");
    const refs = [];
    const [contentsSnap, categoriesSnap, productsSnap] = await Promise.all([
      firestore.collection("studio_contents").get(),
      firestore.collection("categories").get(),
      firestore.collection("products").get()
    ]);
    contentsSnap.docs.forEach(d => { const x=d.data()||{}; if(String(x.image_url||"")===url) refs.push("contenu "+d.id); });
    categoriesSnap.docs.forEach(d => { const x=d.data()||{}; if(String(x.image_url||"")===url) refs.push("catégorie "+d.id); });
    productsSnap.docs.forEach(d => { const x=d.data()||{}; const gallery=normalizeImageUrls(x.image_gallery); if(String(x.image_url||"")===url || gallery.includes(url)) refs.push("produit "+d.id); });
    if (refs.length) return res.status(409).json({ error: "Ce média est encore utilisé par : " + refs.slice(0,5).join(", ") + "." });
    const now = new Date();
    if (studioSnap.exists) await studioRef.update({ active:false, deleted_at:now, deleted_by:studioActor(req) });
    if (sharedSnap.exists) await sharedRef.update({ active:false, deleted_at:now, deleted_by:studioActor(req) });
    await studioAudit(req, "DELETE", "ASSET", id, asset, { ...asset, active:false });
    res.json({ ok:true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Impossible de supprimer le média." });
  }
});

app.get("/api/admin/studio/content", requireAdmin, async (req, res) => {
  try {
    const universe = req.query.universe ? normalizeUniverse(req.query.universe) : null;
    const status = req.query.status ? String(req.query.status).trim().toUpperCase() : null;
    if (req.query.universe && !universe) return res.status(400).json({ error: "Univers invalide." });
    if (status && !STUDIO_STATUSES.has(status)) return res.status(400).json({ error: "Statut de contenu invalide." });
    const snap = await firestore.collection("studio_contents").get();
    let rows = snap.docs.map(docToData);
    if (universe) rows = rows.filter(row => row.universe === universe);
    if (status) rows = rows.filter(row => row.status === status);
    rows.sort(sortByDateDesc);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Impossible de charger les contenus Studio." });
  }
});

app.post("/api/admin/studio/content", requireAdmin, async (req, res) => {
  try {
    const content_type = String(req.body?.content_type || "").trim().toUpperCase();
    const universe = normalizeUniverse(req.body?.universe);
    const locale = String(req.body?.locale || "fr").trim().toLowerCase();
    const key = studioClean(req.body?.key, 160);
    const title = studioClean(req.body?.title, 220);
    if (!STUDIO_CONTENT_TYPES.has(content_type) || !universe || !STUDIO_LOCALES.has(locale) || !key || !title) {
      return res.status(400).json({ error: "Type, univers, langue, identifiant et titre sont obligatoires." });
    }
    const existingContents = await firestore.collection("studio_contents").get();
    const duplicate = existingContents.docs.some(doc => {
      const item = doc.data() || {};
      return item.universe === universe && item.locale === locale && item.key === key && item.status !== "ARCHIVED";
    });
    if (duplicate) return res.status(409).json({ error: "Ce contenu existe déjà dans cet univers et cette langue." });

    const id = crypto.randomUUID();
    const now = new Date();
    const row = {
      id, content_type, universe, locale, key, title,
      subtitle: studioClean(req.body?.subtitle, 500),
      body: studioClean(req.body?.body, 12000),
      image_url: studioClean(req.body?.image_url, 2000),
      cta_label: studioClean(req.body?.cta_label, 120),
      cta_url: studioClean(req.body?.cta_url, 1000),
      meta_title: studioClean(req.body?.meta_title, 220),
      meta_description: studioClean(req.body?.meta_description, 500),
      publish_at: publishAt,
      sort_order: Number.isFinite(Number(req.body?.sort_order)) ? Number(req.body.sort_order) : 0,
      status: "DRAFT",
      active: true,
      created_at: now,
      updated_at: now,
      updated_by: studioActor(req)
    };
    await firestore.collection("studio_contents").doc(id).set(row);
    await studioAudit(req, "CREATE", "CONTENT", id, null, row);
    res.status(201).json(row);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || "Impossible de créer le contenu." });
  }
});

app.patch("/api/admin/studio/content/:id", requireAdmin, async (req, res) => {
  try {
    const ref = firestore.collection("studio_contents").doc(req.params.id);
    const currentSnap = await ref.get();
    if (!currentSnap.exists) return res.status(404).json({ error: "Contenu introuvable." });
    const current = currentSnap.data();
    const patch = {};
    for (const key of ["content_type","universe","locale","key","title","subtitle","body","image_url","cta_label","cta_url","meta_title","meta_description","publish_at","sort_order","active","status"]) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) patch[key] = req.body[key];
    }
    if (patch.content_type !== undefined) {
      patch.content_type = String(patch.content_type).trim().toUpperCase();
      if (!STUDIO_CONTENT_TYPES.has(patch.content_type)) return res.status(400).json({ error: "Type de contenu invalide." });
    }
    if (patch.universe !== undefined) {
      patch.universe = normalizeUniverse(patch.universe);
      if (!patch.universe) return res.status(400).json({ error: "Univers invalide." });
    }
    if (patch.locale !== undefined) {
      patch.locale = String(patch.locale).trim().toLowerCase();
      if (!STUDIO_LOCALES.has(patch.locale)) return res.status(400).json({ error: "Langue invalide." });
    }
    if (patch.status !== undefined) {
      patch.status = String(patch.status).trim().toUpperCase();
      if (!STUDIO_STATUSES.has(patch.status)) return res.status(400).json({ error: "Statut invalide." });
    }
    if (patch.title !== undefined && !studioClean(patch.title, 220)) return res.status(400).json({ error: "Le titre est obligatoire." });
    for (const key of ["title","subtitle","body","image_url","cta_label","cta_url","meta_title","meta_description"]) {
      if (patch[key] !== undefined) patch[key] = studioClean(patch[key], key === "body" ? 12000 : key === "meta_description" ? 500 : key === "image_url" ? 2000 : 1000);
    }
    if (patch.publish_at !== undefined) {
      if (patch.publish_at === "" || patch.publish_at === null) patch.publish_at = null;
      else {
        const parsedPublishAt = new Date(patch.publish_at);
        if (Number.isNaN(parsedPublishAt.getTime())) return res.status(400).json({ error: "Date de publication invalide." });
        patch.publish_at = parsedPublishAt;
      }
    }
    if (patch.sort_order !== undefined) patch.sort_order = Number(patch.sort_order) || 0;
    if (patch.active !== undefined) patch.active = Boolean(patch.active);

    const next = { ...current, ...patch, updated_at: new Date(), updated_by: studioActor(req) };
    await ref.set(next, { merge: true });
    await studioAudit(req, patch.status === "PUBLISHED" && current.status !== "PUBLISHED" ? "PUBLISH" : "UPDATE", "CONTENT", req.params.id, current, next);
    res.json(docToData(await ref.get()));
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || "Impossible de modifier le contenu." });
  }
});

app.delete("/api/admin/studio/content/:id", requireAdmin, async (req, res) => {
  const ref = firestore.collection("studio_contents").doc(req.params.id);
  const currentSnap = await ref.get();
  if (!currentSnap.exists) return res.status(404).json({ error: "Contenu introuvable." });
  const before = currentSnap.data();
  const patch = { active: false, status: "ARCHIVED", updated_at: new Date(), updated_by: studioActor(req) };
  await ref.update(patch);
  const after = { ...before, ...patch };
  await studioAudit(req, "ARCHIVE", "CONTENT", req.params.id, before, after);
  res.json({ ok: true });
});

app.get("/api/admin/studio/categories", requireAdmin, async (req, res) => {
  try {
    const universe = req.query.universe ? normalizeUniverse(req.query.universe) : null;
    if (req.query.universe && !universe) return res.status(400).json({ error: "Univers invalide." });
    let snap = await firestore.collection("categories").get();
    let rows = snap.docs.map(docToData);
    if (universe) rows = rows.filter(row => row.universe === universe);
    rows.sort((a,b) => Number(a.sort_order||0) - Number(b.sort_order||0) || String(a.name||"").localeCompare(String(b.name||"")));
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Impossible de charger les catégories." });
  }
});

app.post("/api/admin/studio/categories", requireAdmin, async (req, res) => {
  try {
    const universe = normalizeUniverse(req.body?.universe);
    const name = studioClean(req.body?.name, 120);
    const slug = studioClean(req.body?.slug || name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,""), 140);
    if (!universe || !name || !slug) return res.status(400).json({ error: "Univers, nom et slug sont obligatoires." });
    const categorySnap = await firestore.collection("categories").get();
    const duplicate = categorySnap.docs.some(doc => {
      const item = doc.data() || {};
      return item.universe === universe && item.slug === slug && item.active !== false;
    });
    if (duplicate) return res.status(409).json({ error: "Cette catégorie existe déjà." });
    const id = crypto.randomUUID();
    const now = new Date();
    const row = {
      id, universe, slug, name,
      description: studioClean(req.body?.description, 500),
      image_url: studioClean(req.body?.image_url, 2000),
      icon: studioClean(req.body?.icon, 80),
      parent_slug: studioClean(req.body?.parent_slug, 140) || null,
      sort_order: Number(req.body?.sort_order)||0,
      active: req.body?.active !== false,
      created_at: now,
      updated_at: now
    };
    await firestore.collection("categories").doc(id).set(row);
    await studioAudit(req, "CREATE", "CATEGORY", id, null, row);
    res.status(201).json(row);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || "Impossible de créer la catégorie." });
  }
});

app.patch("/api/admin/studio/categories/:id", requireAdmin, async (req, res) => {
  try {
    const ref = firestore.collection("categories").doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Catégorie introuvable." });
    const before = snap.data();
    const patch = {};
    for (const key of ["name","slug","description","image_url","icon","parent_slug","sort_order","active","universe"]) {
      if (Object.prototype.hasOwnProperty.call(req.body||{},key)) patch[key]=req.body[key];
    }
    if (patch.universe !== undefined) {
      patch.universe=normalizeUniverse(patch.universe);
      if (!patch.universe) return res.status(400).json({ error: "Univers invalide." });
    }
    if (patch.name !== undefined) patch.name=studioClean(patch.name,120);
    if (patch.slug !== undefined) patch.slug=studioClean(patch.slug,140);
    if (patch.description !== undefined) patch.description=studioClean(patch.description,500);
    if (patch.image_url !== undefined) patch.image_url=studioClean(patch.image_url,2000);
    if (patch.icon !== undefined) patch.icon=studioClean(patch.icon,80);
    if (patch.parent_slug !== undefined) patch.parent_slug=studioClean(patch.parent_slug,140)||null;
    if (patch.sort_order !== undefined) patch.sort_order=Number(patch.sort_order)||0;
    if (patch.active !== undefined) patch.active=Boolean(patch.active);
    await ref.update({ ...patch, updated_at: new Date() });
    const after=docToData(await ref.get());
    await studioAudit(req,"UPDATE","CATEGORY",req.params.id,before,after);
    res.json(after);
  } catch(e) {
    console.error(e);
    res.status(400).json({ error:e.message||"Impossible de modifier la catégorie." });
  }
});

app.delete("/api/admin/studio/categories/:id", requireAdmin, async (req, res) => {
  const ref=firestore.collection("categories").doc(req.params.id);
  const snap=await ref.get();
  if(!snap.exists)return res.status(404).json({error:"Catégorie introuvable."});
  const before=snap.data();
  const patch={active:false,updated_at:new Date()};
  await ref.update(patch);
  await studioAudit(req,"ARCHIVE","CATEGORY",req.params.id,before,{...before,...patch});
  res.json({ok:true});
});

app.get("/api/admin/studio/audit", requireAdmin, async (req, res) => {
  try {
    const limit=Math.min(200,Math.max(1,Number(req.query.limit)||100));
    const snap=await firestore.collection("studio_audit_logs").get();
    const rows=snap.docs.map(docToData).sort(sortByDateDesc).slice(0,limit);
    res.json(rows);
  } catch(e) {
    console.error(e);
    res.status(500).json({error:"Impossible de charger l'historique Studio."});
  }
});

app.get("/admin.html", requireAdminPage, (_req,res)=>res.sendFile(path.join(webDir,"admin.html")));
app.get("/egonar-studio.html", requireAdminPage, (_req,res)=>res.sendFile(path.join(webDir,"egonar-studio.html")));
app.get("/supplier-admin.html", requireAdminPage, (_req,res)=>res.sendFile(path.join(webDir,"supplier-admin.html")));
app.get("/supplier.html", requireSupplierPage, (_req,res)=>res.sendFile(path.join(webDir,"supplier.html")));

app.use(express.static(webDir, { extensions: ["html"] }));
app.get("/", (_req, res) => res.sendFile(path.join(webDir, "index.html")));
app.listen(PORT, "0.0.0.0", () => console.log(`EgonarMarket Firestore: http://localhost:${PORT}`));
