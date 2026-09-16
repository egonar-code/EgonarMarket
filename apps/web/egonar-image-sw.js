self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || requestUrl.pathname !== '/__egonar-image') return;

  const target = requestUrl.searchParams.get('url');
  if (!target || !/^https?:\/\//i.test(target)) return;

  event.respondWith(
    fetch(target, { mode: 'no-cors', credentials: 'omit', cache: 'no-store' })
      .then(response => {
        // An opaque response is still valid for an <img> request.
        if (response.type === 'opaque' || response.ok) return response;
        return fetch('/images/egonar-fallback.svg');
      })
      .catch(() => fetch('/images/egonar-fallback.svg'))
  );
});
