const SUPPLIER_API = "";
const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat("fr-FR").format(Number(n) || 0) + " FCFA";
const call = (path, options = {}) => fetch(SUPPLIER_API + path, { credentials: "include", ...options }).then(async r => ({ ok: r.ok, data: await r.json().catch(() => ({})) }));

function message(id, text, ok = false) {
  const el = $(id); if (!el) return;
  el.textContent = text || "";
  el.className = text ? `state ${ok ? "success" : "error"}` : "";
}

async function boot() {
  const me = await call("/api/supplier/me");
  if (me.ok) {
    $("auth").hidden = true; $("panel").hidden = false; $("logout").hidden = false;
    await refresh();
  }
}

$("register")?.addEventListener("submit", async e => {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.currentTarget));
  const r = await call("/api/supplier/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  message("register-msg", r.data.error || r.data.message || "Demande envoyée.", r.ok);
  if (r.ok) e.currentTarget.reset();
});

$("login")?.addEventListener("submit", async e => {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.currentTarget));
  const r = await call("/api/supplier/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) return message("login-msg", r.data.error || "Connexion impossible.");
  location.reload();
});

$("logout")?.addEventListener("click", async () => { await call("/api/supplier/logout", { method: "POST" }); location.reload(); });

$("product-form")?.addEventListener("submit", async e => {
  e.preventDefault();
  const b = Object.fromEntries(new FormData(e.currentTarget));
  ["price_fcfa", "old_price_fcfa", "stock"].forEach(k => b[k] = b[k] === "" ? null : Number(b[k]));
  const r = await call("/api/supplier/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
  message("product-msg", r.data.error || "Produit soumis pour validation.", r.ok);
  if (r.ok) { e.currentTarget.reset(); await refresh(); }
});

async function refresh() {
  const [me, stats, products] = await Promise.all([call("/api/supplier/me"), call("/api/supplier/stats"), call("/api/supplier/products")]);
  if (!me.ok || !stats.ok || !products.ok) return;
  $("active-count").textContent = stats.data.active_products;
  $("pending-count").textContent = stats.data.pending_products;
  $("stock-count").textContent = stats.data.total_stock;
  const list = products.data || [];
  $("products").innerHTML = list.map(p => `<div class="admin-row"><span><b>${escapeHtml(p.name)}</b><small>${money(p.price_fcfa)} · stock ${p.stock} · ${p.approval_status === "APPROVED" ? "Publié" : p.approval_status === "REJECTED" ? "Refusé" : "En validation"}</small></span></div>`).join("") || '<p class="muted">Aucun produit soumis.</p>';
}
function escapeHtml(s) { return String(s ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

boot();
