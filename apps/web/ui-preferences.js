(() => {
  const apply = () => {
    const root = document.getElementById('egonar-voice-assistant');
    if (root) {
      const title = root.querySelector('.voice-head strong');
      if (title) {
        const page = document.body?.classList;
        title.textContent = page?.contains('food-page') ? '🤖 Cuisines AI' : page?.contains('travel-page') ? '🤖 Voyages AI' : '🤖 Egonar AI';
      }
      root.querySelectorAll('.voice-lang-btn b').forEach(b => b.remove());
      root.querySelectorAll('.voice-lang-btn').forEach(btn => {
        btn.setAttribute('aria-label', btn.dataset.lang === 'en' ? 'English' : 'Français');
        btn.title = btn.dataset.lang === 'en' ? 'English' : 'Français';
      });
    }
  };
  document.addEventListener('DOMContentLoaded', apply);
  if (document.readyState !== 'loading') apply();
  new MutationObserver(apply).observe(document.body, { childList: true, subtree: true });
})();
