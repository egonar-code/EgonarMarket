(() => {
  'use strict';
  const FALLBACKS = {
    MARKET: '/images/egonar-fallback.svg',
    SAVEURS: '/images/egonar-fallback.svg',
    EVASION: '/images/egonar-fallback.svg'
  };
  const PROXY_PREFIX = '/__egonar-image?url=';
  const WORKER_URL = '/egonar-image-sw.js?v=5';
  const isExternalImage = src => /^https?:\/\//i.test(String(src || ''));
  const proxied = src => isExternalImage(src) ? `${PROXY_PREFIX}${encodeURIComponent(src)}` : src;
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
      if (source && isExternalImage(source)) img.setAttribute('src', proxied(source));
      else if (!source) img.src = fallback({ universe });
      img.addEventListener('error', () => {
        img.onerror = null;
        img.src = fallback({ universe: img.dataset.universe || universe });
      }, { once: true });
    });
  }
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register(WORKER_URL, { scope: '/' }).then(registration => {
      registration.update().catch(() => {});
      if (!navigator.serviceWorker.controller) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!sessionStorage.getItem('egonar-image-sw-reloaded-v5')) {
            sessionStorage.setItem('egonar-image-sw-reloaded-v5', '1');
            window.location.reload();
          }
        }, { once: true });
      }
    }).catch(() => {});
  }
  window.EgonarImage = { fallback, bind, proxied, isExternalImage };
  document.addEventListener('DOMContentLoaded', () => { registerServiceWorker(); bind(document); });
  new MutationObserver(() => bind(document)).observe(document.documentElement, { childList: true, subtree: true });
})();
