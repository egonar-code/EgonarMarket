(() => {
  'use strict';
  const FALLBACKS = {
    MARKET: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
    SAVEURS: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80',
    EVASION: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80'
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
      const src = source || fallback({ universe });
      if (!source) img.src = src;
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