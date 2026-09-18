const assert = require("assert");
const { spawn } = require("child_process");
const db = require("../apps/api/src/db");
const API = "http://127.0.0.1:3000";
const JWT_SECRET = process.env.JWT_SECRET || "egonarmarket-ci-secret";
const children = [];
const wait = ms => new Promise(r => setTimeout(r, ms));
async function json(url, options = {}) {
  const r = await fetch(url, options);
  let data = {};
  try { data = await r.json(); } catch {}
  return { r, data };
}
async function waitFor(url) {
  for (let i = 0; i < 30; i++) {
    try { if ((await fetch(url)).ok) return; } catch {}
    await wait(500);
  }
  throw new Error("API indisponible");
}
async function main() {
  const child = spawn("node", ["-r", "./apps/api/src/order-hardening-preload.js", "apps/api/src/server.js"], {
    env: { ...process.env, PORT: "3000", JWT_SECRET }
  });
  children.push(child);
  await waitFor(API + "/api/health");
  const stamp = Date.now();
  const rows = await db.query(
    "INSERT INTO products(name,slug,universe,category,description,price_fcfa,stock,active,approval_status) VALUES($1,$2,'SAVEURS','RESTAURANTS',$3,15000,4,TRUE,'APPROVED') RETURNING id",
    ["AI CI " + stamp, "ai-ci-" + stamp, "Test recherche AI"]
  );
  const id = rows.rows[0].id;
  const ok = await json(API + "/api/ai/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ universe: "SAVEURS", message: "AI CI " + stamp + " budget 20000" })
  });
  assert.equal(ok.r.status, 200);
  assert.equal(ok.data.universe, "SAVEURS");
  assert.equal(ok.data.budget, 20000);
  assert.ok(ok.data.products.some(p => p.id === id));
  assert.ok(ok.data.products.every(p => p.universe === "SAVEURS"));
  const wrong = await json(API + "/api/ai/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ universe: "MARKET", message: "AI CI " + stamp })
  });
  assert.equal(wrong.r.status, 200);
  assert.ok(!wrong.data.products.some(p => p.id === id));
  assert.ok(wrong.data.products.every(p => p.universe === "MARKET"));
  await db.query("DELETE FROM products WHERE id=$1", [id]);
  await db.pool.end();
  console.log("AI integration: OK");
}
main().catch(async e => {
  console.error("AI integration: FAIL", e.message || e);
  try { await db.pool.end(); } catch {}
  process.exitCode = 1;
}).finally(() => children.forEach(c => { try { c.kill("SIGTERM"); } catch {} }));
