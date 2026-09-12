const foodOffers = [
  { title: "Poisson frais du jour", type: "Poissonnerie", city: "Dakar", tags: "poisson frais fruits de mer poissonnerie", price: 9000, note: "Disponible aujourd'hui" },
  { title: "Plateau de grillades", type: "Restaurant", city: "Dakar", tags: "restaurant grillade poulet viande repas", price: 7500, note: "Livraison possible" },
  { title: "Pack charcuterie familiale", type: "Charcuterie", city: "Dakar", tags: "charcuterie saucisse jambon viande apéritif", price: 15000, note: "Pack partenaire" },
  { title: "Menu déjeuner sénégalais", type: "Restaurant", city: "Dakar", tags: "restaurant déjeuner thieb yassa mafé plat local", price: 5000, note: "Service midi" },
  { title: "Panier courses essentielles", type: "Courses", city: "Dakar", tags: "courses épicerie alimentation huile riz lait", price: 12000, note: "Commande rapide" }
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
  box.innerHTML = `<div class="food-result-head"><strong>Résultats pour « ${query} »${budgetText}</strong><span>${results.length} suggestion${results.length > 1 ? "s" : ""}</span></div><div class="menu-grid">${results.map(item => `<article class="menu-card"><div class="menu-body"><span class="badge">${item.type}</span><h3>${item.title}</h3><p>${item.city} · ${item.note}</p><div class="product-bottom"><strong>${foodMoney(item.price)}</strong><a class="btn primary" href="index.html#categories">Voir l'offre</a></div></div></article>`).join("")}</div>`;
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
