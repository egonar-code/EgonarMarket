(() => {
  // L'assistant unifié gère désormais lui-même la langue, la recherche texte,
  // la recherche vocale et la réponse vocale. Ce fichier reste un garde-fou
  // léger pour les pages mises en cache qui chargeraient encore l'ancien sélecteur.
  const langs = {
    auto: { label: 'Automatique' },
    fr: { label: 'Français' },
    wo: { label: 'Wolof' },
    en: { label: 'English' },
    ar: { label: 'العربية' }
  };

  function injectSelectorFallback() {
    const root = document.getElementById('egonar-voice-assistant');
    if (!root || root.querySelector('#egonar-voice-language')) return;
    const form = root.querySelector('.voice-form');
    if (!form) return;
    const wrap = document.createElement('div');
    wrap.className = 'voice-languages';
    const select = document.createElement('select');
    select.id = 'egonar-voice-language';
    Object.entries(langs).forEach(([key, item]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = item.label;
      select.appendChild(option);
    });
    select.value = localStorage.getItem('egonarVoiceLanguage') || 'auto';
    select.addEventListener('change', () => localStorage.setItem('egonarVoiceLanguage', select.value));
    wrap.appendChild(select);
    root.insertBefore(wrap, form);
  }

  function boot() {
    injectSelectorFallback();
    const observer = new MutationObserver(() => injectSelectorFallback());
    observer.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 5000);
  }

  document.addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') boot();
})();