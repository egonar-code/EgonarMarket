const assert = require("assert");
const { spawn } = require("child_process");
const db = require("../apps/api/src/db");

const BASE = "http://127.0.0.1:3020";
const JWT_SECRET = process.env.JWT_SECRET || "egonarmarket-storefront-test-secret";
const children = [];

function start() {
  const child = spawn(process.execPath, ["-r", "./apps/api/src/order-hardening-preload.js", "apps/api/src/server.js"], {
    env: { ...process.env, PORT: "3020", JWT_SECRET, NODE_ENV: "test" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout.on("data", d => process.stdout.write(d));
  child.stderr.on("data", d => process.stderr.write(d));
  children.push(child);
}

async function waitFor(url) {
  for (let i = 0; i < 30; i++) {
    try { const r = await fetch(url); if (r.ok) return; } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error("Service indisponible: " + url);
}

async function json(path, options) {
  const r = await fetch(BASE + path, options);
  const data = await r.json().catch(() => ({}));
  return { r, data };
}

async function main() {
  const stamp = Date.now();
  const products = [
    ["MARKET", "Mode & Vêtements", "Produit test Market " + stamp],
    ["SAVEURS", "Restaurants", "Produit test Saveurs " + stamp],
    ["EVASION", "Hôtels", "Produit test Evasion " + stamp]
  ];
  const ids = [];

  for (const [universe, category, name] of products) {
    const result = await db.query(
      `INSERT INTO products(name,slug,universe,category,description,price_fcfa,stock,active,approval_status,image_url)
       VALUES($1,$2,$3,$4,$5,10000,10,TRUE,'APPROVED','/images/product-cover.svg') RETURNING id`,
      [name, "storefront-" + universe.toLowerCase() + "-" + stamp, universe, category, "Produit d'intégration " + universe]
    );
    ids.push(result.rows[0].id);
  }

  start();
  try {
    await waitFor(BASE + "/api/health");

    for (const [universe, category, name] of products) {
      const list = await json("/api/products?universe=" + universe + "&q=" + encodeURIComponent(name));
      assert.equal(list.r.status, 200);
      assert.ok(list.data.some(p => p.name === name && p.universe === universe));
      assert.ok(list.data.every(p => p.universe === universe));

      const categoryList = await json("/api/products?universe=" + universe + "&category=" + encodeURIComponent(category));
      assert.equal(categoryList.r.status, 200);
      assert.ok(categoryList.data.some(p => p.name === name));
      assert.ok(categoryList.data.every(p => p.universe === universe && p.category === category));

      const product = await json("/api/products/" + ids[products.findIndex(x => x[0] === universe)]);
      assert.equal(product.r.status, 200);
      assert.equal(product.data.universe, universe);
    }

    const marketFromSaveurs = await json("/api/products?universe=SAVEURS&q=" + encodeURIComponent(products[0][2]));
    assert.equal(marketFromSaveurs.r.status, 200);
    assert.ok(!marketFromSaveurs.data.some(p => p.name === products[0][2]));

    const invalidUniverse = await json("/api/products?universe=UNKNOWN");
    assert.equal(invalidUniverse.r.status, 400);

    const invalidCategories = await Promise.all(
      ["MARKET", "SAVEURS", "EVASION"].map(async universe => json("/api/categories?universe=" + universe))
    );
    assert.ok(invalidCategories.every(x => x.r.status === 200 && x.data.length > 0));
    assert.ok(invalidCategories[0].data.every(x => x.universe === "MARKET"));
    assert.ok(invalidCategories[1].data.every(x => x.universe === "SAVEURS"));
    assert.ok(invalidCategories[2].data.every(x => x.universe === "EVASION"));

    console.log("✓ Catalogue isolé par univers.");
    console.log("✓ Filtrage par catégorie respecte l'univers.");
    console.log("✓ Fiches produits respectent l'univers.");
    console.log("✓ Univers invalide refusé.");
    console.log("✓ Taxonomie API cohérente avec chaque univers.");
    console.log("\nstorefront-integration-test: OK");
  } finally {
    await db.query("DELETE FROM products WHERE id = ANY($1::uuid[])", [ids]);
    await db.pool.end();
    for (const child of children) { try { child.kill("SIGTERM"); } catch {} }
  }
}

main().catch(async error => {
  console.error("\n✗ storefront-integration-test:", error.message || error);
  try { await db.pool.end(); } catch {}
  for (const child of children) { try { child.kill("SIGTERM"); } catch {} }
  process.exit(1);
});
