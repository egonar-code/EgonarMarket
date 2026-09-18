const CACHE_VERSION = 'egonar-images-v3';
const FALLBACK = '/images/egonar-fallback.svg';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || requestUrl.pathname !== '/__egonar-image') return;

  const target = requestUrl.searchParams.get('url');
  if (!target || !/^https?:\/\//i.test(target)) return;

  event.respondWith(
    fetch(target, { mode: 'no-cors', credentials: 'omit', cache: 'no-store' })
      .then(response => {
        if (response.type === 'opaque' || response.ok) return response;
        return fetch(FALLBACK);
      })
      .catch(() => fetch(FALLBACK))
  );
});
