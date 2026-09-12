(() => {
  function applyFlagsOnly() {
    document.querySelectorAll('.voice-lang-btn').forEach(btn => {
      const bold = btn.querySelector('b');
      if (bold) bold.remove();
      btn.setAttribute('aria-label', btn.dataset.lang === 'en' ? 'English' : 'Français');
      btn.title = btn.dataset.lang === 'en' ? 'English' : 'Français';
    });
  }

  function boot() {
    applyFlagsOnly();
    const style = document.createElement('style');
    style.id = 'egonar-language-flags-only';
    style.textContent = '.voice-lang-btn{min-width:44px;padding:8px 10px;font-size:20px;line-height:1}.voice-lang-btn b{display:none!important}';
    document.head.appendChild(style);
  }

  document.addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') boot();
})();
