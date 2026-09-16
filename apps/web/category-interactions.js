(() => {
  'use strict';

  const normalize = value => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  function activateSearch(label) {
    const value = String(label || '').trim();
    if (!value) return;
    const input = document.getElementById('search');
    const form = document.getElementById('search-form');
    if (!input || !form) return;
    input.value = value;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    document.getElementById('produits')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function categoryContext(label) {
    const universe = String(document.body?.dataset?.universe || 'MARKET').toUpperCase();
    return window.EgonarCategoryRuntime?.resolve?.(universe, label) || null;
  }

  function enhance() {
    document.querySelectorAll('.egonar-category-item').forEach(item => {
      item.querySelectorAll('.egonar-category-subcats span').forEach(span => {
        if (span.dataset.egonarCategoryInteractive === '1') return;
        span.dataset.egonarCategoryInteractive = '1';
        span.setAttribute('role', 'button');
        span.setAttribute('tabindex', '0');
        span.classList.add('egonar-category-action');
        const label = span.textContent.trim();
        const context = categoryContext(label);
        if (context?.name) span.title = `Filtrer ${context.name} · ${label}`;
        span.addEventListener('click', () => activateSearch(label));
        span.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activateSearch(label);
          }
        });
      });

      const summary = item.querySelector('summary');
      if (summary && summary.dataset.egonarCategoryInteractive !== '1') {
        summary.dataset.egonarCategoryInteractive = '1';
        const label = summary.textContent.trim();
        summary.addEventListener('dblclick', () => activateSearch(label));
        summary.title = 'Double-cliquez pour filtrer cette catégorie';
      }
    });

    if (!document.getElementById('egonar-category-interactions-style')) {
      const style = document.createElement('style');
      style.id = 'egonar-category-interactions-style';
      style.textContent = '.egonar-category-action{cursor:pointer;transition:transform .15s ease,box-shadow .15s ease}.egonar-category-action:hover,.egonar-category-action:focus-visible{transform:translateY(-1px);box-shadow:0 3px 10px rgba(15,47,65,.10);outline:none}.egonar-category-action:focus-visible{outline:2px solid currentColor;outline-offset:2px}';
      document.head.appendChild(style);
    }
  }

  document.addEventListener('DOMContentLoaded', enhance);
  new MutationObserver(enhance).observe(document.documentElement, { childList: true, subtree: true });
  window.EgonarCategoryInteractions = { activateSearch, enhance, normalize };
})();
