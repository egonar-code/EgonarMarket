(() => {
  const domain = () => document.body?.classList.contains('food-page') ? 'food' : document.body?.classList.contains('travel-page') ? 'travel' : 'marketplace';
  const configs = {
    marketplace: { label: 'Egonar AI', placeholder: 'Que recherchez-vous ?', intro: 'Recherche intelligente' },
    food: { label: 'Saveurs AI', placeholder: 'Que voulez-vous manger ?', intro: 'Recherche intelligente Saveurs' },
    travel: { label: 'Évasion AI', placeholder: 'Quelle est votre prochaine évasion ?', intro: 'Recherche intelligente Évasion' }
  };
  const languages = { fr: 'fr-FR', en: 'en-US' };
  const selectedLanguage = () => localStorage.getItem('egonarVoiceLanguage') === 'en' ? 'en' : 'fr';
  const normalize = text => String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const detectLanguage = text => /\b(the|this|that|find|show|looking|look|need|want|buy|search|price|budget|under|less|than|hotel|restaurant|food|travel|product|gift|for|with|in|to|from|today|tomorrow|please|hello|help|cheap|best|available)\b/i.test(normalize(text)) ? 'en' : 'fr';
  const languageForReply = text => ['fr', 'en'].includes(localStorage.getItem('egonarVoiceLanguage')) ? localStorage.getItem('egonarVoiceLanguage') : detectLanguage(text);
  const replies = {
    fr: { ready: 'Egonar AI est prêt.', listening: 'Je vous écoute…', analyzing: 'Egonar AI analyse votre demande…', empty: 'Dites-moi ce que vous recherchez.', found: n => n ? `J’ai trouvé ${n} résultat${n > 1 ? 's' : ''}.` : 'Je n’ai pas trouvé de résultat exact.', unavailable: 'La recherche vocale n’est pas disponible sur ce navigateur.' },
    en: { ready: 'Egonar AI is ready.', listening: 'I’m listening…', analyzing: 'Egonar AI is analyzing your request…', empty: 'Tell me what you are looking for.', found: n => n ? `I found ${n} result${n > 1 ? 's' : ''}.` : 'I could not find an exact result.', unavailable: 'Voice search is not available in this browser.' }
  };
  const textFor = (lang, key, value) => typeof replies[lang][key] === 'function' ? replies[lang][key](value) : replies[lang][key];

  function speak(text, lang) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = languages[lang];
    u.rate = lang === 'fr' ? 0.96 : 0.98;
    u.pitch = 1.01;
    u.onstart = () => document.getElementById('egonar-floating-ai')?.classList.add('is-speaking');
    u.onend = u.onerror = () => document.getElementById('egonar-floating-ai')?.classList.remove('is-speaking');
    window.speechSynthesis.speak(u);
  }

  function mount() {
    if (document.getElementById('egonar-floating-ai')) return;
    document.getElementById('egonar-voice-assistant')?.remove();
    if (domain() === 'marketplace') document.querySelector('.smart')?.classList.add('egonar-smart-hidden');

    const cfg = configs[domain()];
    const root = document.createElement('div');
    root.id = 'egonar-floating-ai';
    root.innerHTML = `
      <button class="floating-robot" type="button" aria-label="Ouvrir ${cfg.label}" title="${cfg.label}">
        <span class="floating-robot-ring"></span><span class="floating-robot-img"></span><span class="floating-status"></span>
      </button>
      <section class="floating-panel" aria-hidden="true">
        <header class="floating-head">
          <div class="floating-brand"><span class="floating-orb"></span><div><strong>${cfg.label}</strong><small>${cfg.intro}</small></div></div>
          <div class="floating-actions"><button class="floating-lang active" data-lang="fr" type="button">🇫🇷</button><button class="floating-lang" data-lang="en" type="button">🇬🇧</button><button class="floating-close" type="button" aria-label="Fermer">×</button></div>
        </header>
        <div class="floating-form">
          <span class="floating-search-icon">⌕</span>
          <input id="floating-ai-input" type="search" placeholder="${cfg.placeholder}">
          <button id="floating-ai-mic" type="button" aria-label="Parler">🎙</button>
          <button id="floating-ai-send" type="button" aria-label="Rechercher">↗</button>
        </div>
        <div class="floating-hint">Texte + voix</div>
        <div id="floating-ai-answer" class="floating-answer" aria-live="polite"></div>
      </section>`;
    document.body.appendChild(root);

    const panel = root.querySelector('.floating-panel');
    const robot = root.querySelector('.floating-robot');
    const input = root.querySelector('#floating-ai-input');
    const answer = root.querySelector('#floating-ai-answer');
    const toggle = open => { root.classList.toggle('is-open', open); panel.setAttribute('aria-hidden', open ? 'false' : 'true'); if (open) window.setTimeout(() => input.focus(), 180); };

    robot.addEventListener('click', () => toggle(!root.classList.contains('is-open')));
    root.querySelector('.floating-close').addEventListener('click', () => toggle(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });

    root.querySelectorAll('.floating-lang').forEach(btn => btn.addEventListener('click', () => {
      localStorage.setItem('egonarVoiceLanguage', btn.dataset.lang);
      root.querySelectorAll('.floating-lang').forEach(x => x.classList.toggle('active', x.dataset.lang === btn.dataset.lang));
      answer.textContent = textFor(btn.dataset.lang, 'ready');
    }));

    const analyze = async text => {
      const value = String(text || '').trim();
      const lang = languageForReply(value);
      if (!value) { answer.textContent = textFor(lang, 'empty'); return; }
      root.classList.add('is-thinking');
      answer.textContent = textFor(lang, 'analyzing');
      if (domain() === 'marketplace' && typeof window.smartSearch === 'function') {
        try { await window.smartSearch(value); } catch (_) {}
        const count = document.querySelectorAll('#products-list .product-card').length;
        root.classList.remove('is-thinking'); answer.textContent = textFor(lang, 'found', count); speak(answer.textContent, lang); return;
      }
      root.classList.remove('is-thinking');
    };

    root.querySelector('#floating-ai-send').addEventListener('click', () => analyze(input.value));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') analyze(input.value); });
    root.querySelector('#floating-ai-mic').addEventListener('click', () => {
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const lang = selectedLanguage();
      if (!Recognition) { answer.textContent = textFor(lang, 'unavailable'); return; }
      const recognition = new Recognition();
      recognition.lang = languages[lang]; recognition.interimResults = false; recognition.maxAlternatives = 1;
      root.classList.add('is-listening'); answer.textContent = textFor(lang, 'listening');
      recognition.onresult = e => { input.value = e.results?.[0]?.[0]?.transcript || ''; root.classList.remove('is-listening'); analyze(input.value); };
      recognition.onerror = () => { root.classList.remove('is-listening'); answer.textContent = textFor(lang, 'unavailable'); };
      recognition.onend = () => root.classList.remove('is-listening');
      try { recognition.start(); } catch (_) {}
    });
    answer.textContent = textFor(selectedLanguage(), 'ready');
  }

  function styles() {
    if (document.getElementById('egonar-floating-ai-style')) return;
    const s = document.createElement('style'); s.id = 'egonar-floating-ai-style';
    s.textContent = `
      .egonar-smart-hidden{display:none!important}
      #egonar-floating-ai{position:fixed;right:24px;bottom:24px;width:78px;height:78px;z-index:10000;pointer-events:none}
      .floating-robot{position:absolute;right:0;bottom:0;width:74px;height:74px;border-radius:50%;border:1px solid rgba(112,222,255,.6);padding:5px;cursor:pointer;pointer-events:auto;background:radial-gradient(circle at 50% 32%,#173f56,#07131e 68%,#03080d);box-shadow:0 12px 32px rgba(0,0,0,.3),0 0 30px rgba(55,210,255,.24),inset 0 0 20px rgba(88,220,255,.1);transition:.25s}
      .floating-robot:hover{transform:translateY(-3px) scale(1.05);box-shadow:0 17px 38px rgba(0,0,0,.34),0 0 42px rgba(55,210,255,.38)}
      .floating-robot-ring{position:absolute;inset:-9px;border:1px solid rgba(88,216,255,.22);border-radius:50%;animation:floatRing 2.8s ease-in-out infinite}
      .floating-robot-img{position:absolute;inset:3px;background:url("egonar-robot.svg") center/contain no-repeat;filter:drop-shadow(0 4px 12px rgba(82,219,255,.3));animation:floatRobot 4s ease-in-out infinite}
      .floating-status{position:absolute;right:6px;bottom:6px;width:10px;height:10px;border-radius:50%;background:#7be9ff;box-shadow:0 0 0 3px rgba(4,16,24,.9),0 0 14px #7be9ff}
      .floating-panel{position:absolute;right:-2px;bottom:88px;width:min(430px,calc(100vw - 30px));padding:15px;border:1px solid rgba(124,220,255,.36);border-radius:23px;background:linear-gradient(145deg,rgba(4,15,24,.98),rgba(10,33,46,.98));box-shadow:0 26px 80px rgba(0,0,0,.4),0 0 34px rgba(44,186,240,.16),inset 0 1px 0 rgba(255,255,255,.06);backdrop-filter:blur(18px);opacity:0;transform:translateY(12px) scale(.95);transform-origin:bottom right;pointer-events:none;transition:.24s;overflow:hidden}
      #egonar-floating-ai.is-open .floating-panel{opacity:1;transform:none;pointer-events:auto}
      .floating-panel:before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(115deg,transparent 25%,rgba(126,224,255,.08) 50%,transparent 70%);animation:panelSweep 5s linear infinite;pointer-events:none}
      .floating-head{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.floating-brand{display:flex;gap:9px;align-items:center}.floating-brand strong{display:block;color:#effaff;font-size:14px}.floating-brand small{display:block;color:#8da9b8;font-size:10px;margin-top:3px}.floating-orb{width:9px;height:9px;border-radius:50%;background:#e2faff;box-shadow:0 0 9px #e2faff,0 0 18px #5ed7ff;animation:orbPulse 1.8s ease-in-out infinite}.floating-actions{display:flex;gap:4px}.floating-lang,.floating-close{border:1px solid rgba(151,216,240,.17);background:rgba(255,255,255,.04);color:#fff;border-radius:9px;min-width:30px;height:30px;padding:0 6px;cursor:pointer}.floating-lang.active{border-color:rgba(150,229,255,.6);background:rgba(94,203,255,.09);box-shadow:0 0 13px rgba(81,207,255,.18)}.floating-close{font-size:19px;color:#a1b8c5;border-radius:50%}
      .floating-form{position:relative;z-index:2;display:grid;grid-template-columns:28px 1fr 40px 40px;align-items:center;height:50px;margin-top:13px;padding:4px;border:1px solid rgba(165,224,255,.5);border-radius:999px;background:rgba(2,13,22,.84);box-shadow:0 0 24px rgba(73,190,255,.13),inset 0 0 20px rgba(54,138,184,.07);overflow:hidden}.floating-form:before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(90deg,transparent,rgba(137,224,255,.08),transparent);animation:innerScan 3.7s linear infinite}.floating-search-icon{position:relative;z-index:1;text-align:center;color:#c3efff;font-size:22px}.floating-form input{position:relative;z-index:1;width:100%;height:40px;border:0!important;outline:0!important;background:transparent!important;color:#effaff!important;padding:0 8px!important;font-size:14px!important}.floating-form input::placeholder{color:#7797a7}.floating-form button{position:relative;z-index:2;width:34px;height:34px;border-radius:50%;border:1px solid rgba(160,219,244,.16);display:grid;place-items:center;cursor:pointer}.floating-form #floating-ai-mic{background:rgba(255,255,255,.05);color:#e1f8ff;font-size:15px}.floating-form #floating-ai-send{background:linear-gradient(135deg,#d8f6ff,#73d6ff);color:#06131c;font-size:18px;box-shadow:0 0 15px rgba(91,205,255,.3)}.floating-hint{position:relative;z-index:2;text-align:center;color:#648291;text-transform:uppercase;letter-spacing:.13em;font-size:9px;margin-top:7px}.floating-answer{position:relative;z-index:2;min-height:16px;margin-top:7px;text-align:center;color:#c7dbe5;font-size:11px;line-height:1.45}
      #egonar-floating-ai.is-listening .floating-robot{box-shadow:0 0 0 5px rgba(90,214,255,.11),0 0 38px rgba(55,198,255,.5)}
      #egonar-floating-ai.is-thinking .floating-robot,#egonar-floating-ai.is-speaking .floating-robot{box-shadow:0 0 0 5px rgba(128,226,255,.13),0 0 42px rgba(74,211,255,.52)}
      @keyframes floatRobot{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-4px) rotate(1deg)}}
      @keyframes floatRing{0%,100%{transform:scale(.94);opacity:.25}50%{transform:scale(1.08);opacity:.72}}
      @keyframes panelSweep{from{transform:translateX(-70%)}to{transform:translateX(70%)}}
      @keyframes orbPulse{0%,100%{transform:scale(.88);opacity:.7}50%{transform:scale(1.12);opacity:1}}
      @keyframes innerScan{from{transform:translateX(-80%)}to{transform:translateX(80%)}}
      @media(max-width:600px){#egonar-floating-ai{right:13px;bottom:13px}.floating-robot{width:66px;height:66px}.floating-panel{right:-1px;bottom:80px;width:calc(100vw - 26px);border-radius:20px}}
      @media(prefers-reduced-motion:reduce){.floating-robot-img,.floating-robot-ring,.floating-panel:before,.floating-form:before,.floating-orb{animation:none!important}}
    `;
    document.head.appendChild(s);
  }

  const boot = () => { styles(); mount(); };
  document.addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') boot();
})();
