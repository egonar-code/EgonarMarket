const API = "/api";
let products = [];
let category = "";
let searchMode = "classic";

const money = n => new Intl.NumberFormat("fr-FR").format(Number(n) || 0) + " FCFA";
const cart = () => {
  try { return JSON.parse(localStorage.getItem("egonarCart") || "[]"); }
  catch { return []; }
};
const saveCart = c => { localStorage.setItem("egonarCart", JSON.stringify(c)); updateCount(); };
const updateCount = () => {
  const e = document.getElementById("cart-count");
  if (e) e.textContent = cart().reduce((s, x) => s + Number(x.quantity || 0), 0);
};
const esc = s => String(s ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

async function api(path, options = {}) {
  const r = await fetch(API + path, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Une erreur est survenue.");
  return data;
}

async function load() {
  const box = document.getElementById("products-list") || document.getElementById("products");
  if (box) box.innerHTML = '<div class="empty-state"><h3>Chargement…</h3><p>Nous préparons votre sélection.</p></div>';
  try {
    const qs = category ? `?category=${encodeURIComponent(category)}` : "";
    const data = await api(`/products${qs}`);
    products = Array.isArray(data) ? data : (data.products || []);
    render();
  } catch (e) {
    if (box) box.innerHTML = `<div class="empty-state"><h3>Catalogue temporairement indisponible</h3><p>${esc(e.message)}</p><button class="btn primary" type="button" id="retry">Réessayer</button></div>`;
    document.getElementById("retry")?.addEventListener("click", load);
  }
  updateCount();
}

async function smartSearch(message) {
  const text = String(message || "").trim();
  if (!text) return;
  const box = document.getElementById("products-list") || document.getElementById("products");
  if (box) box.innerHTML = '<div class="empty-state"><h3>Recherche intelligente…</h3><p>Analyse de votre demande en cours.</p></div>';
  searchMode = "ai";
  try {
    const data = await api("/ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });
    products = Array.isArray(data.products) ? data.products : [];
    render();
  } catch (e) {
    searchMode = "classic";
    const input = document.getElementById("search");
    if (input) input.value = text;
    render();
    if (box && !products.length) box.innerHTML = `<div class="empty-state"><h3>Recherche indisponible</h3><p>${esc(e.message)}</p></div>`;
  }
}

function add(id) {
  const p = products.find(x => String(x.id) === String(id));
  if (!p) return;
  const stock = Number(p.stock || 0);
  if (stock <= 0) return alert("Ce produit est en rupture de stock.");
  const c = cart();
  const row = c.find(x => String(x.product_id) === String(id));
  if (row) {
    if (row.quantity >= stock) return alert(`Stock maximum atteint : ${stock} unité(s).`);
    row.quantity += 1;
  } else {
    c.push({
      product_id: p.id,
      name: p.name,
      price_fcfa: Number(p.price_fcfa || 0),
      image_url: p.image_url || "",
      quantity: 1
    });
  }
  saveCart(c);
  showToast(`${p.name} a été ajouté au panier.`);
}

function showToast(text) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
  t.textContent = text;
  t.classList.add("show");
  window.clearTimeout(t._timer);
  t._timer = window.setTimeout(() => t.classList.remove("show"), 1800);
}

function render() {
  const box = document.getElementById("products-list") || document.getElementById("products");
  if (!box) return;
  const q = searchMode === "classic" ? (document.getElementById("search")?.value || "").trim().toLowerCase() : "";
  let list = products.filter(p => !category || String(p.category || "").toLowerCase() === category.toLowerCase());
  if (q) list = list.filter(p => `${p.name || ""} ${p.description || ""} ${p.category || ""} ${p.sku || ""}`.toLowerCase().includes(q));
  const sort = document.getElementById("sort")?.value;
  if (sort === "priceAsc") list.sort((a,b) => Number(a.price_fcfa) - Number(b.price_fcfa));
  if (sort === "priceDesc") list.sort((a,b) => Number(b.price_fcfa) - Number(a.price_fcfa));
  box.innerHTML = list.map(p => {
    const stock = Number(p.stock || 0);
    return `<article class="product-card">
      <a class="product-image" href="produit.html?id=${encodeURIComponent(p.id)}">
        ${p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none'">` : `<div class="image-placeholder">EgonarMarket</div>`}
      </a>
      <div class="product-body">
        <span class="badge">${esc(p.category)}</span>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.description)}</p>
        <div class="product-bottom"><strong>${money(p.price_fcfa)}</strong><button class="add-btn" data-id="${esc(p.id)}" ${stock <= 0 ? "disabled" : ""}>${stock > 0 ? "Ajouter" : "Rupture"}</button></div>
      </div>
    </article>`;
  }).join("") || '<div class="empty-state"><h3>Aucun produit trouvé</h3><p>Essayez une autre recherche ou catégorie.</p><button type="button" class="btn" id="reset-search">Voir tous les produits</button></div>';
  const count = document.getElementById("result-count");
  if (count) count.textContent = `${list.length} produit${list.length > 1 ? "s" : ""}`;
  box.querySelectorAll(".add-btn").forEach(b => b.addEventListener("click", () => add(b.dataset.id)));
  document.getElementById("reset-search")?.addEventListener("click", () => { searchMode = "classic"; category = ""; const i = document.getElementById("search"); if (i) i.value = ""; document.querySelectorAll("[data-category]").forEach(x => x.classList.toggle("active", x.dataset.category === "")); load(); });
}

function voiceSearch() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) return alert("La recherche vocale n'est pas disponible sur ce navigateur.");
  const recognition = new Recognition();
  recognition.lang = "fr-FR";
  recognition.interimResults = false;
  recognition.onresult = event => { const text = event.results[0][0].transcript; const input = document.getElementById("search"); if (input) input.value = text; smartSearch(text); };
  recognition.start();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("search-form")?.addEventListener("submit", e => { e.preventDefault(); const text = document.getElementById("search")?.value || ""; runClassicSearch(text); });
  document.getElementById("smart-form")?.addEventListener("submit", e => { e.preventDefault(); smartSearch(document.getElementById("smart-search")?.value || ""); document.getElementById("produits")?.scrollIntoView({ behavior: "smooth" }); });
  document.getElementById("sort")?.addEventListener("change", render);
  document.querySelectorAll("[data-category]").forEach(b => b.addEventListener("click", () => { document.querySelectorAll("[data-category]").forEach(x => x.classList.remove("active")); b.classList.add("active"); category = b.dataset.category || ""; searchMode = "classic"; load(); }));
  document.getElementById("voice-search")?.addEventListener("click", voiceSearch);
  updateCount();
  load();
});

function runClassicSearch(text) {
  searchMode = "classic";
  const input = document.getElementById("search");
  if (input) input.value = String(text || "");
  render();
  document.getElementById("produits")?.scrollIntoView({ behavior: "smooth" });
}
