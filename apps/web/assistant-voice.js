(() => {
  const page = document.body?.dataset?.egonarPage || "marketplace";
  const configs = {
    marketplace: {
      label: "Assistant vocal",
      placeholder: "Parlez à Egonar…",
      intro: "Je peux vous aider à trouver un produit, comparer des options ou préciser votre recherche."
    },
    food: {
      label: "Assistant vocal Food",
      placeholder: "Ex. cherche-moi du poisson frais à Dakar…",
      intro: "Je peux vous aider à trouver un plat, un restaurant, de la poissonnerie, de la charcuterie ou des courses."
    },
    travel: {
      label: "Assistant vocal Travel",
      placeholder: "Ex. trouve-moi un hôtel à Dakar…",
      intro: "Je peux vous aider à chercher un hôtel, un séjour, une activité ou un transfert."
    }
  };
  const cfg = configs[page] || configs.marketplace;

  function money(v) { return new Intl.NumberFormat("fr-FR").format(Number(v) || 0) + " FCFA"; }
  function root() {
    let el = document.getElementById("egonar-voice-assistant");
    if (el) return el;
    el = document.createElement("section");
    el.id = "egonar-voice-assistant";
    el.className = `voice-assistant voice-${page}`;
    el.innerHTML = `<div class="voice-head"><div><strong>🎙️ ${cfg.label}</strong><small>${cfg.intro}</small></div><button type="button" class="voice-close" aria-label="Fermer">×</button></div><div class="voice-form"><input id="egonar-voice-input" type="search" placeholder="${cfg.placeholder}"><button id="egonar-mic" type="button" title="Parler">🎙️</button><button id="egonar-voice-send" type="button">Analyser</button></div><div id="egonar-voice-answer" class="voice-answer" aria-live="polite"></div>`;
    const anchor = document.querySelector("main");
    (anchor || document.body).appendChild(el);
    el.querySelector(".voice-close")?.addEventListener("click", () => el.remove());
    el.querySelector("#egonar-mic")?.addEventListener("click", listen);
    el.querySelector("#egonar-voice-send")?.addEventListener("click", () => analyze(el.querySelector("#egonar-voice-input")?.value || ""));
    el.querySelector("#egonar-voice-input")?.addEventListener("keydown", e => { if (e.key === "Enter") analyze(e.currentTarget.value); });
    return el;
  }

  function listen() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return show("La reconnaissance vocale n'est pas disponible sur ce navigateur. Vous pouvez utiliser le clavier.");
    const recognition = new Recognition();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    show("Je vous écoute…");
    recognition.onresult = e => {
      const text = e.results?.[0]?.[0]?.transcript || "";
      const input = document.getElementById("egonar-voice-input");
      if (input) input.value = text;
      analyze(text);
    };
    recognition.onerror = () => show("Je n'ai pas bien entendu. Réessayez ou utilisez le clavier.");
    recognition.start();
  }

  function show(text) {
    const box = document.getElementById("egonar-voice-answer");
    if (box) box.textContent = text;
  }

  function say(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR";
    u.rate = 1;
    window.speechSynthesis.speak(u);
  }

  async function analyze(message) {
    const text = String(message || "").trim();
    if (!text) return show("Dites-moi ce que vous recherchez.");
    show("Analyse intelligente en cours…");
    try {
      const endpoint = page === "marketplace" ? "/api/ai/search" : "/api/ai/assistant";
      const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, domain: page }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erreur");
      const answer = data.answer || buildLocalAnswer(text, data.products || data.offers || []);
      show(answer);
      say(answer);
      if (page === "marketplace" && Array.isArray(data.products) && data.products.length && typeof window.smartSearch === "function") {
        window.smartSearch(text);
      } else if (page === "food" && typeof window.renderFoodResults === "function") {
        window.renderFoodResults(data.offers || [], text, data.budget || null);
      } else if (page === "travel" && typeof window.renderTravelResults === "function") {
        window.renderTravelResults(data.offers || [], text, data.budget || null, data.dates || "");
      }
    } catch {
      const local = buildLocalAnswer(text, []);
      show(local);
      say(local);
      if (page === "food" && typeof window.foodSearch === "function") window.foodSearch(text);
      if (page === "travel" && typeof window.travelSearch === "function") window.travelSearch(text, "", "");
      if (page === "marketplace" && typeof window.smartSearch === "function") window.smartSearch(text);
    }
  }

  function buildLocalAnswer(text, items) {
    const q = text.toLowerCase();
    if (page === "food") {
      if (/poisson|poissonnerie|fruit de mer/.test(q)) return "Je vais privilégier les offres de poissonnerie et produits de la mer correspondant à votre demande.";
      if (/charcuterie|saucisse|jambon/.test(q)) return "Je vais privilégier les offres de charcuterie adaptées à votre demande.";
      if (/restaurant|manger|plat|déjeuner|dîner/.test(q)) return "Je vais chercher les offres Food les plus pertinentes selon votre demande.";
      return "Je vais analyser votre demande Food et vous proposer les options les plus pertinentes.";
    }
    if (page === "travel") {
      if (/hôtel|hotel|hébergement/.test(q)) return "Je vais privilégier les hébergements correspondant à votre destination et à votre budget.";
      if (/séjour|vacances|week-end/.test(q)) return "Je vais privilégier les séjours et escapades correspondant à vos critères.";
      if (/activité|excursion|visite/.test(q)) return "Je vais privilégier les activités et expériences disponibles dans votre destination.";
      return "Je vais analyser votre demande Travel et vous proposer les options les plus pertinentes.";
    }
    return items?.length ? `J'ai trouvé ${items.length} suggestion${items.length > 1 ? "s" : ""} qui peuvent correspondre à votre demande.` : "Je vais analyser votre demande et rechercher les produits les plus pertinents.";
  }

  function injectStyles() {
    if (document.getElementById("egonar-voice-style")) return;
    const s = document.createElement("style");
    s.id = "egonar-voice-style";
    s.textContent = `.voice-assistant{max-width:1180px;margin:0 auto 45px;padding:22px;border-radius:24px;background:#111;color:#fff;box-shadow:0 18px 50px rgba(0,0,0,.12)}.voice-food{background:#2c2219}.voice-travel{background:#092338}.voice-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.voice-head strong{display:block;font-size:18px}.voice-head small{display:block;color:#aaa;margin-top:7px;line-height:1.5}.voice-form{display:grid;grid-template-columns:1fr auto auto;gap:10px;margin-top:18px}.voice-form input{border:0;border-radius:12px;padding:15px 16px;min-width:0}.voice-form button{border:0;border-radius:12px;padding:0 16px;font-weight:800;cursor:pointer}.voice-form #egonar-mic{background:#fff;color:#111}.voice-form #egonar-voice-send{background:#f59e0b;color:#111}.voice-close{border:0;background:transparent;color:#fff;font-size:26px;cursor:pointer}.voice-answer{margin-top:14px;min-height:26px;color:#f5f5f5;line-height:1.5}@media(max-width:600px){.voice-form{grid-template-columns:1fr auto}.voice-form #egonar-voice-send{grid-column:1/-1;padding:13px}.voice-form #egonar-mic{padding:0 14px}}`;
    document.head.appendChild(s);
  }

  document.addEventListener("DOMContentLoaded", () => { injectStyles(); root(); });
})();
