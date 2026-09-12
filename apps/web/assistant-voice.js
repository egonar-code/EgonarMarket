(() => {
  const domain = () => document.body?.classList.contains('food-page') ? 'food' : document.body?.classList.contains('travel-page') ? 'travel' : 'marketplace';
  const configs = {
    marketplace: { label: 'Egonar AI', placeholder: 'Rechercher avec Egonar AI…', intro: 'Décrivez naturellement ce que vous cherchez.' },
    food: { label: 'Saveurs AI', placeholder: 'Décrivez ce que vous voulez manger…', intro: 'Recherchez un plat, restaurant ou produit alimentaire.' },
    travel: { label: 'Évasion AI', placeholder: 'Décrivez votre prochaine évasion…', intro: 'Recherchez un hôtel, séjour, activité ou transfert.' }
  };
  const languages = { fr: { code: 'fr-FR', flag: '🇫🇷' }, en: { code: 'en-US', flag: '🇬🇧' } };
  const current = () => configs[domain()];
  const normalize = text => String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const selectedLanguage = () => localStorage.getItem('egonarVoiceLanguage') === 'en' ? 'en' : 'fr';
  const detectLanguage = text => /\b(the|this|that|find|show|looking|look|need|want|buy|search|price|budget|under|less|than|hotel|restaurant|food|travel|product|gift|for|with|in|to|from|today|tomorrow|please|hello|help|cheap|best|available)\b/i.test(normalize(text)) ? 'en' : 'fr';
  const languageForReply = text => ['fr', 'en'].includes(localStorage.getItem('egonarVoiceLanguage')) ? localStorage.getItem('egonarVoiceLanguage') : detectLanguage(text);
  const speak = (text, lang) => {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = languages[lang].code; u.rate = 0.98; speechSynthesis.speak(u);
  };
  const replies = {
    fr: { ready: 'Egonar AI est prêt. Décrivez simplement votre besoin.', listening: 'Je vous écoute…', analyzing: 'Egonar AI analyse votre demande…', empty: 'Dites-moi ce que vous recherchez.', found: n => n ? `J’ai trouvé ${n} résultat${n > 1 ? 's' : ''} correspondant à votre demande.` : 'Je n’ai pas trouvé de résultat exact. Ajoutez votre budget, votre ville ou votre besoin.', food: n => `J’ai analysé votre demande Saveurs${n ? ` et trouvé ${n} suggestion${n > 1 ? 's' : ''}` : ''}.`, travel: n => `J’ai analysé votre demande Évasion${n ? ` et trouvé ${n} suggestion${n > 1 ? 's' : ''}` : ''}.`, unavailable: 'La recherche vocale n’est pas disponible sur ce navigateur. Utilisez la barre texte.' },
    en: { ready: 'Egonar AI is ready. Describe what you need.', listening: 'I’m listening…', analyzing: 'Egonar AI is analyzing your request…', empty: 'Tell me what you are looking for.', found: n => n ? `I found ${n} result${n > 1 ? 's' : ''} matching your request.` : 'I could not find an exact match. Add your budget, city, or need.', food: n => `I analyzed your Saveurs request${n ? ` and found ${n} suggestion${n > 1 ? 's' : ''}` : ''}.`, travel: n => `I analyzed your Évasion request${n ? ` and found ${n} suggestion${n > 1 ? 's' : ''}` : ''}.`, unavailable: 'Voice search is not available in this browser. Use the text bar.' }
  };
  const message = (lang, key, value) => typeof replies[lang][key] === 'function' ? replies[lang][key](value) : replies[lang][key];
  const show = text => { const box = document.getElementById('egonar-voice-answer'); if (box) box.textContent = text; };
  const localResults = (list, text, fields) => {
    const q = normalize(text);
    const budgetMatch = q.match(/(?:moins de|a moins de|budget|maximum|max|under|less than)\s*([0-9\s]+)/i) || q.match(/([0-9]{3,})\s*(?:fcfa|f|francs?)/i);
    const budget = budgetMatch ? Number(budgetMatch[1].replace(/\s/g, '')) : null;
    const words = q.split(/\s+/).filter(w => w.length > 2 && !['moins','under','less','than'].includes(w));
    return { budget, items: list.filter(item => (words.length === 0 || words.some(w => normalize(fields.map(k => item[k]).join(' ')).includes(w))) && (!budget || Number(item.price) <= budget)) };
  };
  function mount() {
    if (document.getElementById('egonar-voice-assistant')) return;
    const cfg = current();
    const host = document.querySelector(domain() === 'marketplace' ? '.smart' : domain() === 'food' ? '.food-search' : '.travel-search');
    const section = document.createElement('section');
    section.id = 'egonar-voice-assistant';
    section.className = `voice-assistant voice-${domain()}`;
    section.innerHTML = `<div class="voice-head"><div class="voice-brand"><span class="voice-ai-orb" aria-hidden="true"></span><div><strong>${cfg.label}</strong><small>${cfg.intro}</small></div></div><button type="button" class="voice-close" aria-label="Fermer">×</button></div><div class="voice-language-row"><button type="button" class="voice-lang-btn" data-lang="fr" aria-label="Français" title="Français">🇫🇷</button><button type="button" class="voice-lang-btn" data-lang="en" aria-label="English" title="English">🇬🇧</button></div><div class="voice-form"><span class="voice-search-icon" aria-hidden="true">⌕</span><input id="egonar-voice-input" type="search" placeholder="${cfg.placeholder}"><button id="egonar-mic" type="button" title="Parler" aria-label="Parler">🎙</button><button id="egonar-voice-send" type="button" aria-label="Lancer la recherche">↗</button></div><div class="voice-scan-line" aria-hidden="true"></div><div class="voice-hint">Recherche intelligente • Texte + voix</div><div id="egonar-voice-answer" class="voice-answer" aria-live="polite"></div>`;
    host ? host.replaceWith(section) : (document.querySelector('main') || document.body).appendChild(section);
    const saved = selectedLanguage();
    section.querySelectorAll('.voice-lang-btn').forEach(btn => { btn.classList.toggle('active', btn.dataset.lang === saved); btn.addEventListener('click', () => { localStorage.setItem('egonarVoiceLanguage', btn.dataset.lang); section.querySelectorAll('.voice-lang-btn').forEach(x => x.classList.toggle('active', x.dataset.lang === btn.dataset.lang)); show(message(btn.dataset.lang, 'ready')); }); });
    section.querySelector('.voice-close').addEventListener('click', () => section.remove());
    section.querySelector('#egonar-mic').addEventListener('click', listen);
    section.querySelector('#egonar-voice-send').addEventListener('click', () => analyze(section.querySelector('#egonar-voice-input').value));
    section.querySelector('#egonar-voice-input').addEventListener('keydown', e => { if (e.key === 'Enter') analyze(e.currentTarget.value); });
    show(message(saved, 'ready'));
  }
  function listen() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition; const lang = selectedLanguage();
    if (!Recognition) return show(message(lang, 'unavailable'));
    const recognition = new Recognition(); recognition.lang = languages[lang].code; recognition.interimResults = false; recognition.maxAlternatives = 1;
    show(message(lang, 'listening')); recognition.onresult = e => { const text = e.results?.[0]?.[0]?.transcript || ''; const input = document.getElementById('egonar-voice-input'); if (input) input.value = text; analyze(text); }; recognition.onerror = () => show(message(lang, 'unavailable')); try { recognition.start(); } catch (_) {}
  }
  async function analyze(text) {
    const value = String(text || '').trim(); if (!value) return show(message(selectedLanguage(), 'empty'));
    const lang = languageForReply(value); const area = domain(); show(message(lang, 'analyzing'));
    if (area === 'marketplace' && typeof window.smartSearch === 'function') { try { await window.smartSearch(value); } catch (_) {} const count = document.querySelectorAll('#products-list .product-card').length; const reply = message(lang, 'found', count); show(reply); speak(reply, lang); return; }
    if (area === 'food') { const result = localResults(Array.isArray(window.foodOffers) ? window.foodOffers : [], value, ['title','type','city','tags']); window.renderFoodResults?.(result.items, value, result.budget); const reply = message(lang, 'food', result.items.length); show(reply); speak(reply, lang); return; }
    if (area === 'travel') { const result = localResults(Array.isArray(window.travelOffers) ? window.travelOffers : [], value, ['title','type','destination','tags']); window.renderTravelResults?.(result.items, value, result.budget, ''); const reply = message(lang, 'travel', result.items.length); show(reply); speak(reply, lang); }
  }
  function injectStyles() {
    if (document.getElementById('egonar-voice-style')) return;
    const s = document.createElement('style'); s.id = 'egonar-voice-style';
    s.textContent = `
      .voice-assistant{position:relative;max-width:920px;margin:18px auto 55px;padding:18px 22px 20px;border-radius:28px;color:#eef8ff;background:radial-gradient(circle at 50% 0%,rgba(47,126,173,.20),transparent 42%),linear-gradient(135deg,#07121c,#0b1d2b 55%,#071119);border:1px solid rgba(150,214,255,.24);box-shadow:0 24px 70px rgba(4,21,34,.24),inset 0 1px 0 rgba(255,255,255,.08);overflow:hidden;isolation:isolate}
      .voice-assistant:before{content:"";position:absolute;inset:0;background:linear-gradient(120deg,transparent 0%,rgba(255,255,255,.04) 44%,transparent 64%);transform:translateX(-120%);animation:egonarAmbient 7s ease-in-out infinite;pointer-events:none}
      .voice-assistant:after{content:"";position:absolute;left:-12%;right:-12%;top:73%;height:1px;background:linear-gradient(90deg,transparent,rgba(111,211,255,.0),rgba(111,211,255,.58),rgba(255,255,255,.9),rgba(111,211,255,.58),rgba(111,211,255,0),transparent);filter:blur(.4px);opacity:.5;animation:egonarSweep 4.8s linear infinite;pointer-events:none}
      .voice-brand{display:flex;align-items:center;gap:11px}.voice-brand strong{display:block;font-size:16px;letter-spacing:.02em}.voice-brand small{display:block;margin-top:4px;color:#93adbd;font-size:11px}.voice-ai-orb{position:relative;width:12px;height:12px;border-radius:50%;background:#dff8ff;box-shadow:0 0 9px #dff8ff,0 0 22px rgba(77,200,255,.95);flex:0 0 auto;animation:egonarPulse 2s ease-in-out infinite}.voice-ai-orb:before,.voice-ai-orb:after{content:"";position:absolute;inset:-6px;border:1px solid rgba(132,218,255,.38);border-radius:50%;animation:egonarOrbit 2.6s linear infinite}.voice-ai-orb:after{inset:-11px;opacity:.24;animation-duration:4.2s}
      .voice-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;position:relative;z-index:2}.voice-close{border:0;background:transparent;color:#9db4c2;font-size:24px;cursor:pointer;padding:0 2px}.voice-language-row{position:absolute;right:54px;top:15px;display:flex;gap:5px;z-index:3}.voice-lang-btn{border:1px solid rgba(147,204,231,.16);background:rgba(255,255,255,.04);color:#fff;border-radius:99px;min-width:31px;padding:5px 7px;font-size:16px;line-height:1;cursor:pointer;transition:.2s}.voice-lang-btn:hover{background:rgba(255,255,255,.1)}.voice-lang-btn.active{border-color:rgba(142,221,255,.58);box-shadow:0 0 14px rgba(87,198,255,.18);background:rgba(117,205,255,.08)}
      .voice-form{position:relative;z-index:2;display:grid;grid-template-columns:38px 1fr 50px 44px;align-items:center;gap:0;height:58px;margin-top:20px;padding:4px 5px;border:1px solid rgba(165,224,255,.48);border-radius:999px;background:rgba(5,17,27,.78);box-shadow:0 0 0 1px rgba(255,255,255,.04),0 0 24px rgba(73,190,255,.13),inset 0 0 22px rgba(54,138,184,.08);overflow:hidden}.voice-form:before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(90deg,transparent 0%,rgba(137,224,255,.08) 20%,transparent 42%,rgba(255,255,255,.08) 55%,transparent 75%);animation:egonarInnerScan 3.8s linear infinite;pointer-events:none}.voice-search-icon{position:relative;z-index:1;text-align:center;color:#caefff;font-size:26px;line-height:1}.voice-form input{position:relative;z-index:1;width:100%;height:48px;border:0!important;outline:0!important;background:transparent!important;color:#eefaff!important;padding:0 12px!important;font-size:16px!important;font-weight:500}.voice-form input::placeholder{color:#84a1b1;opacity:1}.voice-form #egonar-mic,.voice-form #egonar-voice-send{position:relative;z-index:2;border:1px solid rgba(157,220,247,.18);width:40px;height:40px;padding:0;border-radius:50%;display:grid;place-items:center;cursor:pointer;font-weight:700}.voice-form #egonar-mic{background:rgba(255,255,255,.05);color:#dff7ff;font-size:18px}.voice-form #egonar-mic:hover{background:rgba(112,205,255,.1)}.voice-form #egonar-voice-send{background:linear-gradient(135deg,#d8f6ff,#75d8ff);color:#06131c;font-size:22px;box-shadow:0 0 18px rgba(91,205,255,.34)}.voice-hint{position:relative;z-index:2;text-align:center;color:#6f8b9a;font-size:10px;letter-spacing:.14em;text-transform:uppercase;margin-top:9px}.voice-scan-line{position:absolute;z-index:3;left:5%;right:5%;top:calc(18px + 58px + 20px + 4px);height:1px;pointer-events:none;overflow:hidden;opacity:.9}.voice-scan-line:before{content:"";position:absolute;left:-20%;width:22%;height:3px;top:-1px;background:linear-gradient(90deg,transparent,#fff,#72d9ff,transparent);filter:blur(.3px);box-shadow:0 0 12px #66d6ff,0 0 26px rgba(77,200,255,.72);animation:egonarScan 2.9s linear infinite}.voice-answer{position:relative;z-index:2;margin:10px auto 0;min-height:18px;max-width:760px;text-align:center;color:#c7dbe5;font-size:12px;line-height:1.5}
      .voice-food{background:radial-gradient(circle at 50% 0%,rgba(214,148,73,.18),transparent 42%),linear-gradient(135deg,#1b1510,#24180f 55%,#100d0a)}.voice-travel{background:radial-gradient(circle at 50% 0%,rgba(66,153,213,.19),transparent 42%),linear-gradient(135deg,#071522,#08253a 55%,#06111a)}
      @keyframes egonarPulse{0%,100%{transform:scale(.85);opacity:.82}50%{transform:scale(1.12);opacity:1}}@keyframes egonarOrbit{to{transform:rotate(360deg)}}@keyframes egonarScan{0%{transform:translateX(0)}100%{transform:translateX(620%)}}@keyframes egonarInnerScan{0%{transform:translateX(-80%)}50%{transform:translateX(60%)}100%{transform:translateX(180%)}}@keyframes egonarSweep{0%{transform:translateX(-20%);opacity:0}20%,80%{opacity:.5}100%{transform:translateX(20%);opacity:0}}@keyframes egonarAmbient{0%,100%{transform:translateX(-120%)}45%,55%{transform:translateX(120%)}}
      @media(max-width:600px){.voice-assistant{margin:12px auto 38px;padding:16px 13px 17px;border-radius:22px}.voice-brand small{max-width:230px}.voice-language-row{right:45px;top:13px}.voice-form{grid-template-columns:30px 1fr 42px 40px;height:54px;margin-top:16px}.voice-form input{font-size:14px!important}.voice-form #egonar-mic,.voice-form #egonar-voice-send{width:36px;height:36px}.voice-search-icon{font-size:22px}.voice-scan-line{top:calc(16px + 54px + 16px + 4px)}}
      @media(prefers-reduced-motion:reduce){.voice-assistant:before,.voice-assistant:after,.voice-ai-orb,.voice-ai-orb:before,.voice-ai-orb:after,.voice-form:before,.voice-scan-line:before{animation:none!important}}
    `;
    document.head.appendChild(s);
  }
  const connectHeaderMic = () => {
    const button = document.querySelector('#search-form button');
    if (!button || button.dataset.voiceBound === '1') return;
    button.dataset.voiceBound = '1';
    button.addEventListener('click', e => { e.preventDefault(); listen(); });
  };
  const boot = () => { injectStyles(); mount(); connectHeaderMic(); };
  document.addEventListener('DOMContentLoaded', boot); if (document.readyState !== 'loading') boot();
})();
