const assert = require("assert");
const { spawn } = require("child_process");
const db = require("../apps/api/src/db");

const MAIN = "http://127.0.0.1:3000";
const SUPPLIER = "http://127.0.0.1:3001";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@egonarmarket.sn";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "EgonarCI2026!";
const JWT_SECRET = process.env.JWT_SECRET || "egonarmarket-ci-secret";

const children = [];

function start(command, args, env) {
  const child = spawn(command, args, {
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout.on("data", data => process.stdout.write(data));
  child.stderr.on("data", data => process.stderr.write(data));
  children.push(child);
  return child;
}

async function waitFor(url, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error("Service indisponible: " + url);
}

async function json(url, options = {}) {
  const response = await fetch(url, options);
  let data = {};
  try { data = await response.json(); } catch {}
  return { response, data };
}

function cookieFrom(response, name) {
  const raw = response.headers.get("set-cookie") || "";
  const match = raw.match(new RegExp(name + "=([^;]+)"));
  return match ? match[1] : "";
}

async function main() {
  start("node", ["-r", "./apps/api/src/order-hardening-preload.js", "apps/api/src/server.js"], {
    PORT: "3000", JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
  });
  start("node", ["apps/api/src/supplier-server.js"], {
    SUPPLIER_PORT: "3001", JWT_SECRET
  });

  await waitFor(MAIN + "/api/health");
  await waitFor(SUPPLIER + "/api/health");

  const categories = {};
  for (const universe of ["MARKET", "SAVEURS", "EVASION"]) {
    const { response, data } = await json(MAIN + "/api/categories?universe=" + universe);
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(data) && data.length > 0, universe + " doit exposer ses catégories.");
    categories[universe] = data;
  }
  assert.ok(categories.MARKET.every(x => x.universe === "MARKET"));
  assert.ok(categories.SAVEURS.every(x => x.universe === "SAVEURS"));
  assert.ok(categories.EVASION.every(x => x.universe === "EVASION"));
  assert.equal(categories.MARKET.length, 45);
  assert.equal(categories.SAVEURS.length, 27);
  assert.equal(categories.EVASION.length, 31);
  console.log("✓ Taxonomie des trois univers chargée.");

  const stamp = Date.now();
  const email = "ci-supplier-" + stamp + "@example.test";
  const register = await json(SUPPLIER + "/api/supplier/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      business_name: "CI Fournisseur " + stamp,
      contact_name: "Test CI",
      phone: "770000000",
      email,
      password: "SupplierCI2026!"
    })
  });
  assert.equal(register.response.status, 201);
  const supplierId = register.data.supplier.id;
  assert.equal(register.data.supplier.status, "PENDING");
  console.log("✓ Inscription fournisseur → PENDING.");

  const blockedLogin = await json(SUPPLIER + "/api/supplier/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "SupplierCI2026!" })
  });
  assert.equal(blockedLogin.response.status, 403);
  console.log("✓ Connexion fournisseur bloquée avant validation.");

  const adminLogin = await json(MAIN + "/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  assert.equal(adminLogin.response.status, 200);
  const adminCookie = cookieFrom(adminLogin.response, "egonar_admin");
  assert.ok(adminCookie, "Cookie admin absent.");
  const adminHeaders = { Cookie: "egonar_admin=" + adminCookie };

  const approveSupplier = await json(SUPPLIER + "/api/supplier/admin/suppliers/" + encodeURIComponent(supplierId) + "/status", {
    method: "PATCH",
    headers: { ...adminHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "APPROVED" })
  });
  assert.equal(approveSupplier.response.status, 200);
  assert.equal(approveSupplier.data.status, "APPROVED");
  console.log("✓ Validation admin du fournisseur.");

  const supplierLogin = await json(SUPPLIER + "/api/supplier/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "SupplierCI2026!" })
  });
  assert.equal(supplierLogin.response.status, 200);
  const supplierToken = supplierLogin.data.token;
  assert.ok(supplierToken, "Token fournisseur absent.");
  const supplierHeaders = { Authorization: "Bearer " + supplierToken };

  const product = await json(SUPPLIER + "/api/supplier/products", {
    method: "POST",
    headers: { ...supplierHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      universe: "SAVEURS",
      name: "Produit CI " + stamp,
      category: "Restaurants",
      subcategory: "",
      description: "Produit créé pour le test d'intégration.",
      price_fcfa: 12500,
      stock: 5,
      sku: "CI-" + stamp,
      image_url: "/images/product-cover.svg"
    })
  });
  assert.equal(product.response.status, 201);
  assert.equal(product.data.universe, "SAVEURS");
  assert.equal(product.data.approval_status, "PENDING");
  assert.equal(product.data.active, false);
  const productId = product.data.id;
  console.log("✓ Produit fournisseur créé → PENDING/inactif.");

  const hidden = await json(MAIN + "/api/products/" + productId);
  assert.equal(hidden.response.status, 404);
  console.log("✓ Produit PENDING invisible côté client.");

  const approveProduct = await json(SUPPLIER + "/api/supplier/admin/products/" + encodeURIComponent(productId) + "/approval", {
    method: "PATCH",
    headers: { ...adminHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ approval_status: "APPROVED" })
  });
  assert.equal(approveProduct.response.status, 200);
  assert.equal(approveProduct.data.approval_status, "APPROVED");
  assert.equal(approveProduct.data.active, true);
  console.log("✓ Validation admin du produit → publié.");

  const published = await json(MAIN + "/api/products/" + productId);
  assert.equal(published.response.status, 200);
  assert.equal(published.data.universe, "SAVEURS");

  const universeProducts = await json(MAIN + "/api/products?universe=SAVEURS&q=" + encodeURIComponent("Produit CI " + stamp));
  assert.equal(universeProducts.response.status, 200);
  assert.ok(universeProducts.data.some(p => p.id === productId));
  const wrongUniverse = await json(MAIN + "/api/products?universe=MARKET&q=" + encodeURIComponent("Produit CI " + stamp));
  assert.equal(wrongUniverse.response.status, 200);
  assert.ok(!wrongUniverse.data.some(p => p.id === productId));
  console.log("✓ Produit publié visible uniquement dans SAVEURS.");

  const order = await json(MAIN + "/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        name: "Client CI",
        phone: "771111111",
        email: "client-" + stamp + "@example.test",
        address: "Dakar",
        city: "Dakar"
      },
      delivery_zone: "DAKAR",
      payment_method: "LIVRAISON",
      items: [{ product_id: productId, quantity: 2 }]
    })
  });
  assert.equal(order.response.status, 201);
  assert.equal(order.data.total_fcfa, 25000);
  assert.equal(order.data.status, "CONFIRMEE");
  console.log("✓ Commande client créée avec recalcul serveur.");

  const supplierStats = await json(SUPPLIER + "/api/supplier/sales-stats", { headers: supplierHeaders });
  assert.equal(supplierStats.response.status, 200);
  assert.ok(Number(supplierStats.data.orders_count) >= 1);
  assert.ok(Number(supplierStats.data.units_sold) >= 2);
  assert.ok(Number(supplierStats.data.gross_sales_fcfa) >= 25000);
  const supplierOrders = await json(SUPPLIER + "/api/supplier/orders", { headers: supplierHeaders });
  assert.equal(supplierOrders.response.status, 200);
  assert.ok(supplierOrders.data.some(o => o.order_number === order.data.order_number));
  console.log("✓ Statistiques et commandes fournisseur alimentées.");

  const tracked = await json(MAIN + "/api/orders/" + encodeURIComponent(order.data.order_number));
  assert.equal(tracked.response.status, 200);
  assert.equal(tracked.data.order_number, order.data.order_number);
  console.log("✓ Suivi client de la commande accessible.");

  await db.query("DELETE FROM orders WHERE order_number=$1", [order.data.order_number]);
  await db.query("DELETE FROM products WHERE id=$1", [productId]);
  await db.query("DELETE FROM suppliers WHERE id=$1", [supplierId]);
  await db.pool.end();
  console.log("\n✓ supplier-integration-test: OK");
}

main().catch(async error => {
  console.error("\n✗ supplier-integration-test:", error.message || error);
  try { await db.pool.end(); } catch {}
  process.exitCode = 1;
}).finally(() => {
  for (const child of children) {
    try { child.kill("SIGTERM"); } catch {}
  }
});
