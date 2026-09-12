(() => {
  const domain = () => document.body?.classList.contains('food-page') ? 'food' : document.body?.classList.contains('travel-page') ? 'travel' : 'marketplace';
  const configs = {
    marketplace: { label: 'Egonar AI', placeholder: 'Écrivez ou dites ce que vous cherchez…', intro: 'Recherche intelligente + vocale dans une seule interface.' },
    food: { label: 'Saveurs AI', placeholder: 'Ex. poisson frais à Dakar à moins de 10 000 FCFA…', intro: 'Écrivez ou dites naturellement votre besoin.' },
    travel: { label: 'Évasion AI', placeholder: 'Ex. hôtel à Dakar à moins de 30 000 FCFA…', intro: 'Recherchez un hôtel, séjour, activité ou transfert par texte ou par voix.' }
  };
  const languages = { fr: { code: 'fr-FR', flag: '🇫🇷' }, en: { code: 'en-US', flag: '🇬🇧' } };
  const current = () => configs[domain()];
  const normalize = text => String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const selectedLanguage = () => localStorage.getItem('egonarVoiceLanguage') === 'en' ? 'en' : 'fr';
  const detectLanguage = text => /\b(the|this|that|find|show|looking|look|need|want|buy|search|price|budget|under|less|than|hotel|restaurant|food|travel|product|gift|for|with|in|to|from|today|tomorrow|please|hello|help|cheap|best|available)\b/i.test(normalize(text)) ? 'en' : 'fr';
  const languageForReply = text => ['fr','en'].includes(localStorage.getItem('egonarVoiceLanguage')) ? localStorage.getItem('egonarVoiceLanguage') : detectLanguage(text);
  const speak = (text, lang) => {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = languages[lang].code;
    u.rate = 0.98;
    speechSynthesis.speak(u);
  };
  const replies = {
    fr: { ready: 'Je suis prêt. Écrivez ou dites-moi naturellement ce que vous cherchez.', listening: 'Je vous écoute…', analyzing: 'Analyse intelligente en cours…', empty: 'Dites-moi ce que vous recherchez.', found: n => n ? `J’ai trouvé ${n} résultat${n > 1 ? 's' : ''} correspondant à votre demande.` : 'Je n’ai pas trouvé de résultat exact. Précisez votre budget, votre ville ou votre besoin.', food: n => `J’ai analysé votre demande Saveurs${n ? ` et trouvé ${n} suggestion${n > 1 ? 's' : ''}` : ''}.`, travel: n => `J’ai analysé votre demande Évasion${n ? ` et trouvé ${n} suggestion${n > 1 ? 's' : ''}` : ''}.`, unavailable: 'La recherche vocale n’est pas disponible sur ce navigateur. Utilisez le champ texte.' },
    en: { ready: 'I’m ready. Type or tell me naturally what you are looking for.', listening: 'I’m listening…', analyzing: 'Smart search is analyzing your request…', empty: 'Tell me what you are looking for.', found: n => n ? `I found ${n} result${n > 1 ? 's' : ''} matching your request.` : 'I could not find an exact match. Add your budget, city, or need.', food: n => `I analyzed your Saveurs request${n ? ` and found ${n} suggestion${n > 1 ? 's' : ''}` : ''}.`, travel: n => `I analyzed your Évasion request${n ? ` and found ${n} suggestion${n > 1 ? 's' : ''}` : ''}.`, unavailable: 'Voice search is not available in this browser. Use the text field instead.' }
  };
  const message = (lang, key, value) => typeof replies[lang][key] === 'function' ? replies[lang][key](value) : replies[lang][key];
  const show = text => { const box = document.getElementById('egonar-voice-answer'); if (box) box.textContent = text; };
  const localResults = (list, text, fields) => {
    const q = normalize(text);
    const budgetMatch = q.match(/(?:moins de|a moins de|budget|maximum|max|under|less than)\s*([0-9\s]+)/i) || q.match(/([0-9]{3,})\s*(?:fcfa|f|francs?)/i);
    const budget = budgetMatch ? Number(budgetMatch[1].replace(/\s/g,'')) : null;
    const words = q.split(/\s+/).filter(w => w.length > 2 && !['moins','under','less','than'].includes(w));
    return { budget, items: list.filter(item => (words.length === 0 || words.some(w => normalize(fields.map(k => item[k]).join(' ')).includes(w))) && (!budget || Number(item.price) <= budget)) };
  };
  function mount() {
    if (document.getElementById('egonar-voice-assistant')) return;
    const cfg = current();
    const host = document.querySelector(domain() === 'marketplace' ? '.smart' : domain() === 'food' ? '.food-search' : '.travel-search');
    const section = document.createElement('section');
    section.id = 'egonar-voice-assistant'; section.className = `voice-assistant voice-${domain()}`;
    section.innerHTML = `<div class="voice-head"><div><strong>🤖 ${cfg.label}</strong><small>${cfg.intro}</small></div><button type="button" class="voice-close" aria-label="Fermer">×</button></div><div class="voice-language-row"><button type="button" class="voice-lang-btn" data-lang="fr" aria-label="Français" title="Français">🇫🇷</button><button type="button" class="voice-lang-btn" data-lang="en" aria-label="English" title="English">🇬🇧</button></div><div class="voice-form"><input id="egonar-voice-input" type="search" placeholder="${cfg.placeholder}"><button id="egonar-mic" type="button" title="Parler">🎙️</button><button id="egonar-voice-send" type="button">Rechercher</button></div><div id="egonar-voice-answer" class="voice-answer" aria-live="polite"></div>`;
    host ? host.replaceWith(section) : (document.querySelector('main') || document.body).appendChild(section);
    const saved = selectedLanguage();
    section.querySelectorAll('.voice-lang-btn').forEach(btn => { btn.classList.toggle('active', btn.dataset.lang === saved); btn.addEventListener('click', () => { localStorage.setItem('egonarVoiceLanguage', btn.dataset.lang); section.querySelectorAll('.voice-lang-btn').forEach(x => x.classList.toggle('active', x.dataset.lang === btn.dataset.lang)); show(message(btn.dataset.lang,'ready')); }); });
    section.querySelector('.voice-close').addEventListener('click', () => section.remove());
    section.querySelector('#egonar-mic').addEventListener('click', listen);
    section.querySelector('#egonar-voice-send').addEventListener('click', () => analyze(section.querySelector('#egonar-voice-input').value));
    section.querySelector('#egonar-voice-input').addEventListener('keydown', e => { if (e.key === 'Enter') analyze(e.currentTarget.value); });
    show(message(saved,'ready'));
  }
  function listen() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition; const lang = selectedLanguage();
    if (!Recognition) return show(message(lang,'unavailable'));
    const recognition = new Recognition(); recognition.lang = languages[lang].code; recognition.interimResults = false; recognition.maxAlternatives = 1;
    show(message(lang,'listening')); recognition.onresult = e => { const text = e.results?.[0]?.[0]?.transcript || ''; const input = document.getElementById('egonar-voice-input'); if (input) input.value = text; analyze(text); }; recognition.onerror = () => show(message(lang,'unavailable')); try { recognition.start(); } catch (_) {}
  }
  async function analyze(text) {
    const value = String(text || '').trim(); if (!value) return show(message(selectedLanguage(),'empty'));
    const lang = languageForReply(value); const area = domain(); show(message(lang,'analyzing'));
    if (area === 'marketplace' && typeof window.smartSearch === 'function') { try { await window.smartSearch(value); } catch (_) {} const count = document.querySelectorAll('#products-list .product-card').length; const reply = message(lang,'found',count); show(reply); speak(reply,lang); return; }
    if (area === 'food') { const result = localResults(Array.isArray(window.foodOffers)?window.foodOffers:[], value, ['title','type','city','tags']); window.renderFoodResults?.(result.items,value,result.budget); const reply = message(lang,'food',result.items.length); show(reply); speak(reply,lang); return; }
    if (area === 'travel') { const result = localResults(Array.isArray(window.travelOffers)?window.travelOffers:[], value, ['title','type','destination','tags']); window.renderTravelResults?.(result.items,value,result.budget,''); const reply = message(lang,'travel',result.items.length); show(reply); speak(reply,lang); }
  }
  function injectStyles() {
    if (document.getElementById('egonar-voice-style')) return;
    const s = document.createElement('style'); s.id='egonar-voice-style'; s.textContent = `.voice-assistant{max-width:1180px;margin:12px auto 45px;padding:22px;border-radius:24px;background:#111;color:#fff;box-shadow:0 18px 50px rgba(0,0,0,.12)}.voice-food{background:#2c2219}.voice-travel{background:#092338}.voice-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.voice-head strong{display:block;font-size:19px}.voice-head small{display:block;color:#aaa;margin-top:7px;line-height:1.5}.voice-language-row{display:flex;align-items:center;gap:8px;margin-top:15px;flex-wrap:wrap}.voice-lang-btn{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;border-radius:10px;min-width:44px;padding:8px 10px;font-size:20px;line-height:1;cursor:pointer}.voice-lang-btn.active{background:#fff;color:#111}.voice-form{display:grid;grid-template-columns:1fr auto auto;gap:10px;margin-top:16px}.voice-form input{border:0;border-radius:12px;padding:15px 16px;min-width:0}.voice-form button{border:0;border-radius:12px;padding:0 16px;font-weight:800;cursor:pointer}.voice-form #egonar-mic{background:#fff;color:#111}.voice-form #egonar-voice-send{background:#f59e0b;color:#111}.voice-close{border:0;background:transparent;color:#fff;font-size:26px;cursor:pointer}.voice-answer{margin-top:14px;min-height:26px;color:#f5f5f5;line-height:1.5}@media(max-width:600px){.voice-form{grid-template-columns:1fr auto}.voice-form #egonar-voice-send{grid-column:1/-1;padding:13px}.voice-form #egonar-mic{padding:0 14px}}`;
    document.head.appendChild(s);
  }
  const boot = () => { injectStyles(); mount(); };
  document.addEventListener('DOMContentLoaded',boot); if (document.readyState !== 'loading') boot();
})();
