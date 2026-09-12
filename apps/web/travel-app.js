const travelOffers = [
  { title: "Hôtel à Dakar", type: "Hôtel", destination: "Dakar", tags: "hôtel dakar senegal chambre séjour", price: 25000, note: "À partir de 25 000 FCFA / nuit" },
  { title: "Escapade Saly", type: "Séjour", destination: "Saly", tags: "saly plage séjour week-end famille", price: 75000, note: "Séjour week-end" },
  { title: "Visite de Gorée", type: "Activité", destination: "Gorée", tags: "goree ile visite culture excursion activité", price: 15000, note: "Expérience locale" },
  { title: "Transfert aéroport Dakar", type: "Transfert", destination: "Dakar", tags: "transfert aeroport taxi voiture dakar", price: 12000, note: "Prise en charge" },
  { title: "Circuit Sénégal", type: "Séjour", destination: "Sénégal", tags: "circuit senegal découverte voyage vacances", price: 150000, note: "Itinéraire découverte" }
];
window.travelOffers = travelOffers;

function travelMoney(value) {
  return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
}

function travelSearch(message, type, dates) {
  const text = String(message || "").trim().toLowerCase();
  if (!text && (!type || type === "Type de voyage")) return;
  const budgetMatch = text.match(/(?:moins de|à moins de|budget|maximum|max)\s*([0-9\s]+)/i) || text.match(/([0-9]{3,})\s*(?:fcfa|f)/i);
  const budget = budgetMatch ? Number(budgetMatch[1].replace(/\s/g, "")) : null;
  const words = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter(w => w.length > 2);
  const results = travelOffers.filter(item => {
    const hay = `${item.title} ${item.type} ${item.destination} ${item.tags}`.toLowerCase();
    const textMatch = words.length === 0 || words.some(w => hay.includes(w));
    const typeMatch = !type || type === "Type de voyage" || item.type.toLowerCase() === type.toLowerCase();
    return textMatch && typeMatch && (!budget || item.price <= budget);
  });
  renderTravelResults(results.length ? results : travelOffers.slice(0, 3), text || type, budget, dates);
}

function renderTravelResults(results, query, budget, dates) {
  const box = document.getElementById("travel-smart-results");
  if (!box) return;
  const parts = [query ? `« ${query} »` : "votre recherche", budget ? `budget ${travelMoney(budget)}` : "", dates ? `dates ${dates}` : ""].filter(Boolean);
  box.innerHTML = `<div class="travel-result-head"><strong>Suggestions pour ${parts.join(" · ")}</strong><span>${results.length} résultat${results.length > 1 ? "s" : ""}</span></div><div class="destinations">${results.map(item => `<article class="destination"><b>${item.type} · ${item.title}</b><span>${item.destination} · ${item.note}</span><strong>${travelMoney(item.price)}</strong><a class="btn primary" href="#explorer">Explorer</a></article>`).join("")}</div>`;
  box.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".travel-search form");
  const input = form?.querySelector("input[type='search']");
  const type = form?.querySelector("select");
  const dates = form?.querySelector("input[type='text']");
  form?.addEventListener("submit", e => { e.preventDefault(); travelSearch(input?.value || "", type?.value || "", dates?.value || ""); });
  form?.querySelector("button")?.addEventListener("click", () => travelSearch(input?.value || "", type?.value || "", dates?.value || ""));
  if (!document.getElementById("egonar-voice-assistant")) {
    const script = document.createElement("script");
    script.src = "assistant-voice.js";
    document.body.appendChild(script);
  }
});
