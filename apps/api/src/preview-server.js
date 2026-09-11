const path = require("path");
const crypto = require("crypto");
const express = require("express");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const webDir = path.join(__dirname, "../../web");

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

const products = [
  {
    id: "8cc6a8d0-9c33-4869-bb47-380aa6fb6ed7",
    name: "T-shirt qualité premium",
    slug: "t-shirt-premium",
    category: "MODE",
    subcategory: "",
    description: "T-shirt confortable et élégant pour le quotidien.",
    price_fcfa: 10000,
    old_price_fcfa: 12000,
    stock: 20,
    sku: "TSH-PREMIUM",
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
    active: true
  },
  {
    id: "c6a38a9d-9c33-4869-bb47-380aa6fb6ed7",
    name: "Sac Élégance",
    slug: "sac-elegance",
    category: "ACCESSOIRES",
    subcategory: "",
    description: "Sac moderne et élégant, facile à porter.",
    price_fcfa: 18000,
    old_price_fcfa: 22000,
    stock: 12,
    sku: "SAC-ELEGANCE",
    image_url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80",
    active: true
  },
  {
    id: "74454a9c-9d70-43f6-827c-5c15d4d5f940",
    name: "Montre classique",
    slug: "montre-classique",
    category: "MODE",
    subcategory: "",
    description: "Montre au design intemporel.",
    price_fcfa: 25000,
    old_price_fcfa: null,
    stock: 8,
    sku: "MONTRE-CLASSIQUE",
    image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
    active: true
  },
  {
    id: crypto.randomUUID(),
    name: "Écouteurs sans fil",
    slug: "ecouteurs-sans-fil",
    category: "TECH",
    subcategory: "",
    description: "Écouteurs sans fil compacts pour musique et appels.",
    price_fcfa: 15000,
    old_price_fcfa: 18000,
    stock: 10,
    sku: "TECH-EARPHONE",
    image_url: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=80",
    active: true
  }
];

const orders = [];
let adminSession = false;

function searchProducts(message) {
  const text = String(message || "").toLowerCase();
  const budgetMatch = text.match(/(\d[\d\s]*)\s*(?:fcfa|f|francs?)/i);
  const budget = budgetMatch ? Number(budgetMatch[1].replace(/\s/g, "")) : null;
  const terms = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter(w => w.length > 2);
  let list = products.filter(p => p.active && (!budget || p.price_fcfa <= budget));
  if (terms.length) {
    list = list.filter(p => {
      const hay = `${p.name} ${p.description} ${p.category} ${p.subcategory}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return terms.some(t => hay.includes(t));
    });
  }
  return { message, budget, products: list.slice(0, 12) };
}

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "EgonarMarket Preview API", database: "preview" }));
app.get("/api/config", (_req, res) => res.json({ site_name: "EgonarMarket", currency: "FCFA", whatsapp_number: "", delivery: { dakar_fcfa: 0, other_fcfa: 0 } }));
app.get("/api/categories", (_req, res) => res.json([...new Set(products.filter(p => p.active).map(p => p.category))].sort());
app.get("/api/products", (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  const category = String(req.query.category || "").trim().toLowerCase();
  let list = products.filter(p => p.active && (!category || p.category.toLowerCase() === category));
  if (q) list = list.filter(p => `${p.name} ${p.description} ${p.category} ${p.sku}`.toLowerCase().includes(q));
  res.json(list);
});
app.get("/api/products/:id", (req, res) => {
  const p = products.find(x => String(x.id) === String(req.params.id) && x.active);
  if (!p) return res.status(404).json({ error: "Produit introuvable." });
  res.json(p);
});
app.post("/api/ai/search", (req, res) => res.json(searchProducts(req.body?.message)));

app.post("/api/orders", (req, res) => {
  const { customer, items, payment_method = "A_PAYER", delivery_fcfa = 0 } = req.body || {};
  if (!customer?.name || !customer?.phone || !customer?.address || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: "Informations client ou panier incomplets." });
  }
  const lines = [];
  let subtotal = 0;
  for (const item of items) {
    const product = products.find(p => String(p.id) === String(item.product_id) && p.active);
    const quantity = Number(item.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ error: "Produit ou quantité invalide." });
    if (quantity > product.stock) return res.status(400).json({ error: `Stock insuffisant pour ${product.name}.` });
    product.stock -= quantity;
    subtotal += product.price_fcfa * quantity;
    lines.push({ product_name: product.name, unit_price_fcfa: product.price_fcfa, quantity });
  }
  const order = {
    order_number: `EG-${new Date().toISOString().slice(0,10).replace(/-/g, "")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
    status: payment_method === "WAVE" || payment_method === "ORANGE_MONEY" ? "EN_ATTENTE_PAIEMENT" : "CONFIRMEE",
    payment_status: "PENDING",
    payment_method,
    total_fcfa: subtotal + Math.max(0, Number(delivery_fcfa) || 0),
    created_at: new Date().toISOString(),
    customer,
    items: lines
  };
  orders.unshift(order);
  res.status(201).json({ order_number: order.order_number, status: order.status, payment_status: order.payment_status, total_fcfa: order.total_fcfa });
});
app.get("/api/orders/:number", (req, res) => {
  const order = orders.find(o => o.order_number === req.params.number);
  if (!order) return res.status(404).json({ error: "Commande introuvable." });
  res.json({ order_number: order.order_number, status: order.status, payment_status: order.payment_status, payment_method: order.payment_method, total_fcfa: order.total_fcfa, created_at: order.created_at, name: order.customer.name, phone: order.customer.phone, address: order.customer.address, city: order.customer.city || "Dakar", items: order.items });
});

app.post("/api/admin/login", (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (email === "admin@egonarmarket.sn" && password === "EgonarDev2026!") {
    adminSession = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: "Identifiants incorrects." });
});
app.post("/api/admin/logout", (_req, res) => { adminSession = false; res.json({ ok: true }); });
app.get("/api/admin/me", (_req, res) => adminSession ? res.json({ email: "admin@egonarmarket.sn", role: "admin" }) : res.status(401).json({ error: "Non authentifié." }));
app.get("/api/admin/products", (_req, res) => res.json(products));
app.post("/api/admin/products", (req, res) => {
  const p = req.body || {};
  const product = { id: crypto.randomUUID(), name: p.name || "Nouveau produit", slug: (p.name || "produit").toLowerCase().replace(/[^a-z0-9]+/g, "-"), category: String(p.category || "AUTRE").toUpperCase(), subcategory: p.subcategory || "", description: p.description || "", price_fcfa: Number(p.price_fcfa) || 0, old_price_fcfa: p.old_price_fcfa ? Number(p.old_price_fcfa) : null, stock: Math.max(0, Number(p.stock) || 0), sku: p.sku || null, image_url: p.image_url || "", active: true };
  products.unshift(product);
  res.status(201).json(product);
});
app.patch("/api/admin/products/:id", (req, res) => {
  const p = products.find(x => String(x.id) === String(req.params.id));
  if (!p) return res.status(404).json({ error: "Produit introuvable." });
  Object.assign(p, req.body || {});
  res.json(p);
});
app.delete("/api/admin/products/:id", (req, res) => {
  const p = products.find(x => String(x.id) === String(req.params.id));
  if (!p) return res.status(404).json({ error: "Produit introuvable." });
  p.active = false;
  res.json({ ok: true });
});
app.get("/api/admin/orders", (_req, res) => res.json(orders.map(o => ({ order_number: o.order_number, status: o.status, total_fcfa: o.total_fcfa, created_at: o.created_at, customer_name: o.customer.name, phone: o.customer.phone, address: o.customer.address, city: o.customer.city || "Dakar" }))));
app.patch("/api/admin/orders/:id/status", (req, res) => {
  const o = orders.find(x => x.order_number === req.params.id);
  if (!o) return res.status(404).json({ error: "Commande introuvable." });
  o.status = req.body?.status || o.status;
  res.json(o);
});

app.use(express.static(webDir, { extensions: ["html"] }));
app.get("/", (_req, res) => res.sendFile(path.join(webDir, "index.html")));
app.listen(PORT, "0.0.0.0", () => console.log(`EgonarMarket preview: http://localhost:${PORT}`));
