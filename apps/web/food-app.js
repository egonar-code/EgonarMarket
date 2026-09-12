const foodOffers = [
  { title: "Thiéboudienne traditionnelle", type: "Plat", city: "Dakar", tags: "thieb thieboudienne ceebu jen riz poisson plat senegalais", price: 3500, note: "Plat national · livraison Dakar", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85" },
  { title: "Yassa poulet", type: "Plat", city: "Dakar", tags: "yassa poulet oignon citron riz restaurant repas", price: 3000, note: "Préparé à la commande", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85" },
  { title: "Poisson grillé & accompagnement", type: "Poissonnerie", city: "Dakar", tags: "poisson frais fruits de mer poissonnerie grillade poisson", price: 4500, note: "Poisson frais · sélection du jour", image: "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?auto=format&fit=crop&w=900&q=85" },
  { title: "Mafé bœuf", type: "Plat", city: "Dakar", tags: "mafe boeuf arachide riz sauce repas senegalais", price: 2500, note: "Sauce arachide · portion généreuse", image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85" },
  { title: "Pack famille sénégalais", type: "Menu", city: "Dakar", tags: "famille menu repas thieb yassa mafe partage", price: 12000, note: "Idéal pour 4 personnes", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=85" }
];
window.foodOffers = foodOffers;

function foodMoney(value) {
  return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
}

function foodSearch(message) {
  const text = String(message || "").trim().toLowerCase();
  if (!text) return;
  const budgetMatch = text.match(/(?:moins de|à moins de|budget|maximum|max)\s*([0-9\s]+)/i) || text.match(/([0-9]{3,})\s*(?:fcfa|f)/i);
  const budget = budgetMatch ? Number(budgetMatch[1].replace(/\s/g, "")) : null;
  const words = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter(w => w.length > 2);
  const results = foodOffers.filter(item => {
    const hay = `${item.title} ${item.type} ${item.city} ${item.tags}`.toLowerCase();
    const match = words.length === 0 || words.some(w => hay.includes(w));
    return match && (!budget || item.price <= budget);
  });
  renderFoodResults(results.length ? results : foodOffers.slice(0, 3), text, budget);
}

function renderFoodResults(results, query, budget) {
  const box = document.getElementById("food-smart-results");
  if (!box) return;
  const budgetText = budget ? ` · budget ${foodMoney(budget)}` : "";
  box.innerHTML = `<div class="food-result-head"><strong>Résultats pour « ${query} »${budgetText}</strong><span>${results.length} suggestion${results.length > 1 ? "s" : ""}</span></div><div class="menu-grid">${results.map(item => `<article class="menu-card"><img src="${item.image}" alt="${item.title}" loading="lazy" style="width:100%;height:210px;object-fit:cover;display:block;border-radius:16px 16px 0 0"><div class="menu-body"><span class="badge">${item.type}</span><h3>${item.title}</h3><p>${item.city} · ${item.note}</p><div class="product-bottom"><strong>${foodMoney(item.price)}</strong><a class="btn primary" href="#explorer">Voir l'offre</a></div></div></article>`).join("")}</div>`;
  box.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".food-search form");
  const input = form?.querySelector("input");
  form?.addEventListener("submit", e => { e.preventDefault(); foodSearch(input?.value || ""); });
  form?.querySelector("button")?.addEventListener("click", () => foodSearch(input?.value || ""));
  if (!document.getElementById("egonar-voice-assistant")) {
    const script = document.createElement("script");
    script.src = "assistant-voice.js";
    document.body.appendChild(script);
  }
});
