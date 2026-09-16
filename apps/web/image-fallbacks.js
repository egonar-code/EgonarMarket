(() => {
  'use strict';
  const FALLBACKS = {
    MARKET: '/assets/egonar-market-fallback.svg',
    SAVEURS: '/assets/egonar-saveurs-fallback.svg',
    EVASION: '/assets/egonar-evasion-fallback.svg'
  };
  function fallback(product = {}) {
    const universe = String(product.universe || '').toUpperCase();
    return FALLBACKS[universe] || FALLBACKS.MARKET;
  }
  function bind(root = document) {
    root.querySelectorAll?.('img').forEach(img => {
      if (img.dataset.egonarImageFallbackBound === '1') return;
      img.dataset.egonarImageFallbackBound = '1';
      const source = img.getAttribute('src') || '';
      const universe = img.dataset.universe || document.body.dataset.universe || 'MARKET';
      if (!source) img.src = fallback({ universe });
      img.addEventListener('error', () => {
        img.onerror = null;
        const next = fallback({ universe: img.dataset.universe || universe });
        if (img.src !== next) img.src = next;
        else img.replaceWith(Object.assign(document.createElement('div'), { className: 'image-placeholder', textContent: 'EgonarMarket' }));
      }, { once: true });
    });
  }
  window.EgonarImage = { fallback, bind };
  document.addEventListener('DOMContentLoaded', () => bind(document));
  new MutationObserver(() => bind(document)).observe(document.documentElement, { childList: true, subtree: true });
})();