(() => {
  'use strict';
  const FALLBACKS = {
    MARKET: '/images/product-cover.svg',
    SAVEURS: '/images/saveurs-cover.svg',
    EVASION: '/images/evasion-cover.svg'
  };
  const isExternalImage = src => /^https?:\/\//i.test(String(src || ''));
  function fallback(product = {}) {
    const universe = String(product.universe || '').toUpperCase();
    return FALLBACKS[universe] || FALLBACKS.MARKET;
  }
  function bind(root = document) {
    root.querySelectorAll?.('img').forEach(img => {
      if (img.dataset.egonarImageFallbackBound === '1') return;
      img.dataset.egonarImageFallbackBound = '1';
      const universe = img.dataset.universe || document.body.dataset.universe || 'MARKET';
      if (!img.getAttribute('src')) img.src = fallback({ universe });
      img.addEventListener('error', () => {
        img.onerror = null;
        img.src = fallback({ universe: img.dataset.universe || universe });
      }, { once: true });
    });
  }
  window.EgonarImage = { fallback, bind, isExternalImage };
  document.addEventListener('DOMContentLoaded', () => bind(document));
  new MutationObserver(() => bind(document)).observe(document.documentElement, { childList: true, subtree: true });
})();
