(() => {
  const domain = () => {
    if (document.body?.dataset?.egonarPage) return document.body.dataset.egonarPage;
    if (document.body?.classList.contains('food-page')) return 'food';
    if (document.body?.classList.contains('travel-page')) return 'travel';
    return 'marketplace';
  };

  const configs = {
    marketplace: {
      label: 'Egonar AI',
      placeholder: 'Écrivez ou dites ce que vous cherchez…',
      intro: 'Recherche intelligente + vocale réunies dans une seule interface.'
    },
    food: {
      label: 'Egonar Food AI',
      placeholder: 'Ex. poisson frais à Dakar pour ce soir à moins de 10 000 FCFA…',
      intro: 'Décrivez votre besoin par écrit ou à la voix.'
    },
    travel: {
      label: 'Egonar Travel AI',
      placeholder: 'Ex. hôtel à Dakar à moins de 30 000 FCFA…',
      intro: 'Cherchez un voyage, un hôtel ou une activité par texte ou par voix.'
    }
  };

  const languages = {
    auto: { label: 'Automatique', code: null },
    fr: { label: 'Français', code: 'fr-FR' },
    wo: { label: 'Wolof', code: 'wo-SN' },
    en: { label: 'English', code: 'en-US' },
    ar: { label: 'العربية', code: 'ar-SA' }
  };

  const current = () => configs[domain()] || configs.marketplace;
  const money = v => new Intl.NumberFormat('fr-FR').format(Number(v) || 0) + ' FCFA';

  function normalize(text) {
    return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function selectedLanguage() {
    const saved = localStorage.getItem('egonarVoiceLanguage') || 'auto';
    return languages[saved] ? saved : 'auto';
  }

  function detectLanguage(text) {
    const forced = selectedLanguage();
    if (forced !== 'auto') return forced;
    const raw = String(text || '');
    const q = normalize(raw);
    if (/\b(السلام|مرحبا|اريد|أريد|ابحث|أبحث|سعر|فنادق|فندق|رحله|رحلة|طعام)\b/.test(raw) || /[\u0600-\u06ff]/.test(raw)) return 'ar';
    if (/\b(waaw|ndax|dama|damaay|bëgg|begg|jox|am na|am nga|ci|ak|bu|pour|dina|lan la|xam|yalla|jërëjëf|jerejef|jàppale|denc|dem)\b/.test(q)) return 'wo';
    if (/\b(the|find|looking|need|want|hotel|restaurant|food|travel|under|less than|price|budget|search|show me)\b/.test(q)) return 'en';
    return 'fr';
  }

  function languageCode(lang) {
    return languages[lang]?.code || 'fr-FR';
  }

  function speak(text, lang) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = languageCode(lang);
    u.rate = 0.98;
    const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
    const voice = voices.find(v => String(v.lang || '').toLowerCase() === u.lang.toLowerCase()) || voices.find(v => String(v.lang || '').toLowerCase().startsWith(u.lang.split('-')[0].toLowerCase()));
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  }

  const replies = {
    fr: {
      ready: 'Je suis prêt. Écrivez ou dites-moi naturellement ce que vous cherchez.',
      listening: 'Je vous écoute…',
      analyzing: 'Analyse intelligente en cours…',
      empty: 'Dites-moi ce que vous recherchez.',
      found: n => n ? `J’ai trouvé ${n} résultat${n > 1 ? 's' : ''} correspondant à votre demande.` : 'Je n’ai pas trouvé de résultat exact. Essayez de préciser votre budget, votre ville ou votre besoin.',
      food: n => `J’ai analysé votre demande Food${n ? ` et trouvé ${n} suggestion${n > 1 ? 's' : ''}` : ''}.`,
      travel: n => `J’ai analysé votre demande Travel${n ? ` et trouvé ${n} suggestion${n > 1 ? 's' : ''}` : ''}.`,
      unavailable: 'La recherche vocale n’est pas disponible sur ce navigateur. Vous pouvez utiliser le champ texte.'
    },
    en: {
      ready: 'I’m ready. Type or tell me naturally what you are looking for.',
      listening: 'I’m listening…',
      analyzing: 'Smart search is analyzing your request…',
      empty: 'Tell me what you are looking for.',
      found: n => n ? `I found ${n} result${n > 1 ? 's' : ''} matching your request.` : 'I could not find an exact match. Try adding your budget, city, or need.',
      food: n => `I analyzed your Food request${n ? ` and found ${n} suggestion${n > 1 ? 's' : ''}` : ''}.`,
      travel: n => `I analyzed your Travel request${n ? ` and found ${n} suggestion${n > 1 ? 's' : ''}` : ''}.`,
      unavailable: 'Voice search is not available in this browser. You can use the text field.'
    },
    ar: {
      ready: 'أنا جاهز. اكتب أو قل ما الذي تبحث عنه بطريقة طبيعية.',
      listening: 'أنا أستمع إليك…',
      analyzing: 'جارٍ تحليل طلبك بذكاء…',
      empty: 'أخبرني بما تبحث عنه.',
      found: n => n ? `وجدت ${n} نتيجة مناسبة لطلبك.` : 'لم أجد نتيجة مطابقة تمامًا. أضف الميزانية أو المدينة أو احتياجاتك.',
      food: n => `حللت طلبك في Food${n ? ` ووجدت ${n} اقتراحًا` : ''}.`,
      travel: n => `حللت طلبك في Travel${n ? ` ووجدت ${n} اقتراحًا` : ''}.`,
      unavailable: 'البحث الصوتي غير متاح في هذا المتصفح. يمكنك استخدام حقل النص.'
    },
    wo: {
      ready: 'Ma ngi diyaar. Waxaad qori kartaa ama hadli kartaa waxa nga xam.',
      listening: 'Ma ngi la dégg…',
      analyzing: 'Ma ngi seet sa laaj ak xel…',
      empty: 'Wax nga bëgg seet?',
      found: n => n ? `Gis naa ${n} résultat yu méngoo ak sa laaj.` : 'Gisu ma benn résultat bu méngoo. Joxeel xaal, dëkk bi walla budget bi.',
      food: n => `Xam naa sa laaj Food${n ? ` te gis naa ${n} suggestion` : ''}.`,
      travel: n => `Xam naa sa laaj Travel${n ? ` te gis naa ${n} suggestion` : ''}.`,
      unavailable: 'Recherche vocale bi amul ci navigateur bii. Mën nga bind ci champ bi.'
    }
  };

  function message(lang, key, value) {
    const pack = replies[lang] || replies.fr;
    const item = pack[key];
    return typeof item === 'function' ? item(value) : item;
  }

  function show(text) {
    const box = document.getElementById('egonar-voice-answer');
    if (box) box.textContent = text;
  }

  function getFoodResults(text) {
    const items = Array.isArray(window.foodOffers) ? window.foodOffers : [];
    const q = normalize(text);
    const budgetMatch = q.match(/(?:moins de|a moins de|budget|maximum|max|under|less than)\s*([0-9\s]+)/i) || q.match(/([0-9]{3,})\s*(?:fcfa|f|francs?)/i);
    const budget = budgetMatch ? Number(budgetMatch[1].replace(/\s/g, '')) : null;
    if (!items.length) return { items: [], budget };
    const words = q.split(/\s+/).filter(w => w.length > 2 && !['moins', 'under', 'less', 'than'].includes(w));
    const filtered = items.filter(item => {
      const hay = normalize(`${item.title} ${item.type} ${item.city} ${item.tags}`);
      const match = words.length === 0 || words.some(w => hay.includes(w));
      return match && (!budget || item.price <= budget);
    });
    return { items: filtered.length ? filtered : [], budget };
  }

  function getTravelResults(text) {
    const items = Array.isArray(window.travelOffers) ? window.travelOffers : [];
    const q = normalize(text);
    const budgetMatch = q.match(/(?:moins de|a moins de|budget|maximum|max|under|less than)\s*([0-9\s]+)/i) || q.match(/([0-9]{3,})\s*(?:fcfa|f|francs?)/i);
    const budget = budgetMatch ? Number(budgetMatch[1].replace(/\s/g, '')) : null;
    if (!items.length) return { items: [], budget };
    const words = q.split(/\s+/).filter(w => w.length > 2 && !['moins', 'under', 'less', 'than'].includes(w));
    const filtered = items.filter(item => {
      const hay = normalize(`${item.title} ${item.type} ${item.destination} ${item.tags}`);
      const match = words.length === 0 || words.some(w => hay.includes(w));
      return match && (!budget || item.price <= budget);
    });
    return { items: filtered.length ? filtered : [], budget };
  }

  function replaceSearchArea() {
    const area = domain();
    const selector = area === 'marketplace' ? '.smart' : area === 'food' ? '.food-search' : '.travel-search';
    const host = document.querySelector(selector);
    return host || null;
  }

  function mount() {
    const existing = document.getElementById('egonar-voice-assistant');
    if (existing) return;
    const cfg = current();
    const host = replaceSearchArea();
    const section = document.createElement('section');
    section.id = 'egonar-voice-assistant';
    section.className = `voice-assistant voice-${domain()}`;
    section.innerHTML = `<div class="voice-head"><div><strong>🎙️ ${cfg.label}</strong><small>${cfg.intro}</small></div><button type="button" class="voice-close" aria-label="Fermer">×</button></div><div class="voice-languages"><label for="egonar-voice-language">🌐 Langue</label><select id="egonar-voice-language"><option value="auto">Automatique</option><option value="fr">Français</option><option value="wo">Wolof</option><option value="en">English</option><option value="ar">العربية</option></select><small>En mode automatique, Egonar détecte la langue de votre demande.</small></div><div class="voice-form"><input id="egonar-voice-input" type="search" placeholder="${cfg.placeholder}"><button id="egonar-mic" type="button" title="Parler">🎙️</button><button id="egonar-voice-send" type="button">Rechercher</button></div><div id="egonar-voice-answer" class="voice-answer" aria-live="polite"></div>`;

    if (host) {
      host.replaceWith(section);
    } else {
      (document.querySelector('main') || document.body).appendChild(section);
    }

    const select = section.querySelector('#egonar-voice-language');
    select.value = selectedLanguage();
    select.addEventListener('change', () => localStorage.setItem('egonarVoiceLanguage', select.value));
    section.querySelector('.voice-close').addEventListener('click', () => section.remove());
    section.querySelector('#egonar-mic').addEventListener('click', listen);
    section.querySelector('#egonar-voice-send').addEventListener('click', () => analyze(section.querySelector('#egonar-voice-input').value));
    section.querySelector('#egonar-voice-input').addEventListener('keydown', e => { if (e.key === 'Enter') analyze(e.currentTarget.value); });
    show(message('fr', 'ready'));
  }

  function listen() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return show(message('fr', 'unavailable'));
    const lang = selectedLanguage();
    const recognition = new Recognition();
    recognition.lang = languageCode(lang === 'auto' ? detectLanguage(document.getElementById('egonar-voice-input')?.value || '') : lang);
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    show(message(lang === 'auto' ? 'fr' : lang, 'listening'));
    try { recognition.start(); } catch (_) {}
    recognition.onresult = e => {
      const text = e.results?.[0]?.[0]?.transcript || '';
      const input = document.getElementById('egonar-voice-input');
      if (input) input.value = text;
      analyze(text);
    };
    recognition.onerror = () => show(message(lang === 'auto' ? 'fr' : lang, 'unavailable'));
  }

  async function analyze(messageText) {
    const text = String(messageText || '').trim();
    if (!text) return show(message('fr', 'empty'));
    const area = domain();
    const lang = detectLanguage(text);
    show(message(lang, 'analyzing'));

    if (area === 'marketplace' && typeof window.smartSearch === 'function') {
      try { await window.smartSearch(text); } catch (_) {}
      const count = Array.isArray(window.products) ? window.products.length : document.querySelectorAll('#products-list .product-card').length;
      const reply = message(lang, 'found', count);
      show(reply);
      speak(reply, lang);
      return;
    }

    if (area === 'food') {
      const result = getFoodResults(text);
      if (typeof window.renderFoodResults === 'function') window.renderFoodResults(result.items, text, result.budget);
      const reply = message(lang, 'food', result.items.length);
      show(reply);
      speak(reply, lang);
      return;
    }

    if (area === 'travel') {
      const result = getTravelResults(text);
      if (typeof window.renderTravelResults === 'function') window.renderTravelResults(result.items, text, result.budget, '');
      const reply = message(lang, 'travel', result.items.length);
      show(reply);
      speak(reply, lang);
    }
  }

  function injectStyles() {
    if (document.getElementById('egonar-voice-style')) return;
    const s = document.createElement('style');
    s.id = 'egonar-voice-style';
    s.textContent = `.voice-assistant{max-width:1180px;margin:12px auto 45px;padding:22px;border-radius:24px;background:#111;color:#fff;box-shadow:0 18px 50px rgba(0,0,0,.12)}.voice-food{background:#2c2219}.voice-travel{background:#092338}.voice-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.voice-head strong{display:block;font-size:18px}.voice-head small{display:block;color:#aaa;margin-top:7px;line-height:1.5}.voice-languages{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:16px}.voice-languages label{font-weight:800}.voice-languages select{border:0;border-radius:10px;padding:9px 12px}.voice-languages small{color:#aaa}.voice-form{display:grid;grid-template-columns:1fr auto auto;gap:10px;margin-top:14px}.voice-form input{border:0;border-radius:12px;padding:15px 16px;min-width:0}.voice-form button{border:0;border-radius:12px;padding:0 16px;font-weight:800;cursor:pointer}.voice-form #egonar-mic{background:#fff;color:#111}.voice-form #egonar-voice-send{background:#f59e0b;color:#111}.voice-close{border:0;background:transparent;color:#fff;font-size:26px;cursor:pointer}.voice-answer{margin-top:14px;min-height:26px;color:#f5f5f5;line-height:1.5}@media(max-width:600px){.voice-form{grid-template-columns:1fr auto}.voice-form #egonar-voice-send{grid-column:1/-1;padding:13px}.voice-form #egonar-mic{padding:0 14px}}`;
    document.head.appendChild(s);
  }

  function boot() { injectStyles(); mount(); }
  document.addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') boot();
})();