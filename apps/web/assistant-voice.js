(() => {
  const domain = () => {
    if (document.body?.dataset?.egonarPage) return document.body.dataset.egonarPage;
    if (document.body?.classList.contains('food-page')) return 'food';
    if (document.body?.classList.contains('travel-page')) return 'travel';
    return 'marketplace';
  };

  const configs = {
    marketplace: ['Assistant vocal', 'Parlez à Egonar…', 'Produits, budget, catégorie, cadeau ou besoin précis.'],
    food: ['Assistant vocal Food', 'Ex. trouve-moi du poisson frais à Dakar…', 'Restaurants, plats, charcuterie, poissonnerie et courses.'],
    travel: ['Assistant vocal Travel', 'Ex. trouve-moi un hôtel à Dakar…', 'Hôtels, séjours, activités, transferts et destinations.']
  };

  const money = v => new Intl.NumberFormat('fr-FR').format(Number(v) || 0) + ' FCFA';
  const current = () => configs[domain()] || configs.marketplace;

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    u.rate = 0.98;
    window.speechSynthesis.speak(u);
  }

  function show(text) {
    const box = document.getElementById('egonar-voice-answer');
    if (box) box.textContent = text;
  }

  function getFoodResults(text) {
    const items = Array.isArray(window.foodOffers) ? window.foodOffers : [];
    const q = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const budgetMatch = q.match(/(?:moins de|a moins de|budget|maximum|max)\s*([0-9\s]+)/i) || q.match(/([0-9]{3,})\s*(?:fcfa|f)/i);
    const budget = budgetMatch ? Number(budgetMatch[1].replace(/\s/g, '')) : null;
    if (!items.length) return { items: [], budget };
    const words = q.split(/\s+/).filter(w => w.length > 2);
    const filtered = items.filter(item => {
      const hay = `${item.title} ${item.type} ${item.city} ${item.tags}`.toLowerCase();
      const match = words.length === 0 || words.some(w => hay.includes(w));
      return match && (!budget || item.price <= budget);
    });
    return { items: filtered.length ? filtered : items.slice(0, 3), budget };
  }

  function getTravelResults(text) {
    const items = Array.isArray(window.travelOffers) ? window.travelOffers : [];
    const q = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const budgetMatch = q.match(/(?:moins de|a moins de|budget|maximum|max)\s*([0-9\s]+)/i) || q.match(/([0-9]{3,})\s*(?:fcfa|f)/i);
    const budget = budgetMatch ? Number(budgetMatch[1].replace(/\s/g, '')) : null;
    if (!items.length) return { items: [], budget };
    const words = q.split(/\s+/).filter(w => w.length > 2);
    const filtered = items.filter(item => {
      const hay = `${item.title} ${item.type} ${item.destination} ${item.tags}`.toLowerCase();
      const match = words.length === 0 || words.some(w => hay.includes(w));
      return match && (!budget || item.price <= budget);
    });
    return { items: filtered.length ? filtered : items.slice(0, 3), budget };
  }

  function localAnswer(text, items, area) {
    const q = text.toLowerCase();
    if (area === 'food') {
      if (/poisson|poissonnerie|fruit de mer/.test(q)) return `J’ai compris : vous cherchez de la poissonnerie${items.length ? `, et j’ai ${items.length} suggestion${items.length > 1 ? 's' : ''}` : ''}.`;
      if (/charcuterie|saucisse|jambon/.test(q)) return `J’ai compris : vous cherchez de la charcuterie${items.length ? `, avec ${items.length} suggestion${items.length > 1 ? 's' : ''}` : ''}.`;
      if (/restaurant|manger|plat|déjeuner|dîner/.test(q)) return `Je privilégie les offres Food adaptées à votre demande${items.length ? ` et j’ai ${items.length} suggestion${items.length > 1 ? 's' : ''}` : ''}.`;
      return `J’ai analysé votre demande Food et je vous propose les options les plus pertinentes.`;
    }
    if (area === 'travel') {
      if (/hôtel|hotel|hébergement/.test(q)) return `J’ai compris : vous cherchez un hébergement${items.length ? `, avec ${items.length} suggestion${items.length > 1 ? 's' : ''}` : ''}.`;
      if (/séjour|vacances|week-end/.test(q)) return `J’ai compris : vous cherchez un séjour${items.length ? `, avec ${items.length} suggestion${items.length > 1 ? 's' : ''}` : ''}.`;
      if (/activité|excursion|visite/.test(q)) return `J’ai compris : vous cherchez une activité${items.length ? `, avec ${items.length} suggestion${items.length > 1 ? 's' : ''}` : ''}.`;
      return 'J’ai analysé votre demande Travel et je vous propose les options les plus pertinentes.';
    }
    return items.length ? `J’ai trouvé ${items.length} suggestion${items.length > 1 ? 's' : ''} correspondant à votre demande.` : 'J’analyse votre demande et je recherche les produits les plus pertinents.';
  }

  function mount() {
    if (document.getElementById('egonar-voice-assistant')) return;
    const [label, placeholder, intro] = current();
    const section = document.createElement('section');
    section.id = 'egonar-voice-assistant';
    section.className = `voice-assistant voice-${domain()}`;
    section.innerHTML = `<div class="voice-head"><div><strong>🎙️ ${label}</strong><small>${intro}</small></div><button type="button" class="voice-close" aria-label="Fermer">×</button></div><div class="voice-form"><input id="egonar-voice-input" type="search" placeholder="${placeholder}"><button id="egonar-mic" type="button" title="Parler">🎙️</button><button id="egonar-voice-send" type="button">Analyser</button></div><div id="egonar-voice-answer" class="voice-answer" aria-live="polite"></div>`;
    (document.querySelector('main') || document.body).appendChild(section);
    section.querySelector('.voice-close').addEventListener('click', () => section.remove());
    section.querySelector('#egonar-mic').addEventListener('click', listen);
    section.querySelector('#egonar-voice-send').addEventListener('click', () => analyze(section.querySelector('#egonar-voice-input').value));
    section.querySelector('#egonar-voice-input').addEventListener('keydown', e => { if (e.key === 'Enter') analyze(e.currentTarget.value); });
    show('Je suis prêt. Décrivez votre besoin naturellement.');
  }

  function listen() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return show('La recherche vocale n’est pas disponible sur ce navigateur. Vous pouvez utiliser le clavier.');
    const recognition = new Recognition();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    show('🎙️ Je vous écoute…');
    speak('Je vous écoute.');
    recognition.onresult = e => {
      const text = e.results?.[0]?.[0]?.transcript || '';
      const input = document.getElementById('egonar-voice-input');
      if (input) input.value = text;
      analyze(text);
    };
    recognition.onerror = () => show('Je n’ai pas bien entendu votre demande. Réessayez.');
    recognition.start();
  }

  async function analyze(message) {
    const text = String(message || '').trim();
    const area = domain();
    if (!text) return show('Dites-moi ce que vous recherchez.');
    show('Analyse intelligente en cours…');

    if (area === 'marketplace' && typeof window.smartSearch === 'function') {
      try { await window.smartSearch(text); } catch (_) {}
      const reply = localAnswer(text, [], area);
      show(reply);
      speak(reply);
      return;
    }

    if (area === 'food') {
      const result = getFoodResults(text);
      if (typeof window.renderFoodResults === 'function') window.renderFoodResults(result.items, text, result.budget);
      const reply = localAnswer(text, result.items, area);
      show(reply);
      speak(reply);
      return;
    }

    if (area === 'travel') {
      const result = getTravelResults(text);
      if (typeof window.renderTravelResults === 'function') window.renderTravelResults(result.items, text, result.budget, '');
      const reply = localAnswer(text, result.items, area);
      show(reply);
      speak(reply);
    }
  }

  function injectStyles() {
    if (document.getElementById('egonar-voice-style')) return;
    const s = document.createElement('style');
    s.id = 'egonar-voice-style';
    s.textContent = `.voice-assistant{max-width:1180px;margin:12px auto 45px;padding:22px;border-radius:24px;background:#111;color:#fff;box-shadow:0 18px 50px rgba(0,0,0,.12)}.voice-food{background:#2c2219}.voice-travel{background:#092338}.voice-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.voice-head strong{display:block;font-size:18px}.voice-head small{display:block;color:#aaa;margin-top:7px;line-height:1.5}.voice-form{display:grid;grid-template-columns:1fr auto auto;gap:10px;margin-top:18px}.voice-form input{border:0;border-radius:12px;padding:15px 16px;min-width:0}.voice-form button{border:0;border-radius:12px;padding:0 16px;font-weight:800;cursor:pointer}.voice-form #egonar-mic{background:#fff;color:#111}.voice-form #egonar-voice-send{background:#f59e0b;color:#111}.voice-close{border:0;background:transparent;color:#fff;font-size:26px;cursor:pointer}.voice-answer{margin-top:14px;min-height:26px;color:#f5f5f5;line-height:1.5}@media(max-width:600px){.voice-form{grid-template-columns:1fr auto}.voice-form #egonar-voice-send{grid-column:1/-1;padding:13px}.voice-form #egonar-mic{padding:0 14px}}`;
    document.head.appendChild(s);
  }

  function boot() { injectStyles(); mount(); }
  document.addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') boot();
})();
