(() => {
  const langs = {
    auto: { label: 'Automatique', code: null },
    fr: { label: 'Français', code: 'fr-FR' },
    wo: { label: 'Wolof', code: 'wo-SN' },
    en: { label: 'English', code: 'en-US' },
    ar: { label: 'العربية', code: 'ar-SA' }
  };

  const page = document.body?.classList.contains('food-page') ? 'Food' : document.body?.classList.contains('travel-page') ? 'Travel' : 'EgonarMarket';

  function getLang() {
    const saved = localStorage.getItem('egonarVoiceLanguage') || 'auto';
    return langs[saved] ? saved : 'auto';
  }

  function code() {
    const selected = langs[getLang()];
    if (selected.code) return selected.code;
    const browser = String(navigator.language || 'fr-FR').toLowerCase();
    if (browser.startsWith('wo')) return 'wo-SN';
    if (browser.startsWith('en')) return 'en-US';
    if (browser.startsWith('ar')) return 'ar-SA';
    return 'fr-FR';
  }

  function panel() { return document.getElementById('egonar-voice-assistant'); }

  function injectSelector() {
    const root = panel();
    if (!root || root.querySelector('#egonar-voice-language')) return !!root;
    const head = root.querySelector('.voice-head');
    const form = root.querySelector('.voice-form');
    if (!form) return !!root;
    const wrap = document.createElement('div');
    wrap.className = 'voice-languages';
    wrap.innerHTML = '<label for="egonar-voice-language">🌐 Langue</label>';
    const select = document.createElement('select');
    select.id = 'egonar-voice-language';
    Object.entries(langs).forEach(([key, item]) => {
      const option = document.createElement('option'); option.value = key; option.textContent = item.label; select.appendChild(option);
    });
    select.value = getLang();
    select.addEventListener('change', () => localStorage.setItem('egonarVoiceLanguage', select.value));
    wrap.appendChild(select);
    root.insertBefore(wrap, form);
    if (head) head.querySelector('strong')?.insertAdjacentText('afterbegin', '🌍 ');
    return true;
  }

  function multilingualListen() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const answer = document.getElementById('egonar-voice-answer');
    const input = document.getElementById('egonar-voice-input');
    if (!Recognition) { if (answer) answer.textContent = 'La recherche vocale n’est pas disponible sur ce navigateur.'; return; }
    const lang = code();
    if (answer) answer.textContent = `🎙️ Je vous écoute en ${langs[getLang()].label}…`;
    const recognition = new Recognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = event => {
      const text = event.results?.[0]?.[0]?.transcript || '';
      if (input) input.value = text;
      document.getElementById('egonar-voice-send')?.click();
    };
    recognition.onerror = () => {
      if (answer) answer.textContent = `Je n’ai pas pu reconnaître cette langue dans ce navigateur. Vous pouvez choisir Français, English ou العربية.`;
    };
    try { recognition.start(); } catch (_) {}
  }

  function wire() {
    const root = panel();
    if (!root) return false;
    injectSelector();
    const mic = root.querySelector('#egonar-mic');
    if (!mic || mic.dataset.multiWired) return true;
    mic.dataset.multiWired = '1';
    mic.addEventListener('click', e => { e.stopImmediatePropagation(); multilingualListen(); }, true);
    return true;
  }

  function observe() {
    if (wire()) return;
    const observer = new MutationObserver(() => { if (wire()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener('DOMContentLoaded', observe);
  if (document.readyState !== 'loading') observe();
})();
