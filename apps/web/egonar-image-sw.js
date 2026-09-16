self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || requestUrl.pathname !== '/__egonar-image') return;
  const target = requestUrl.searchParams.get('url');
  if (!target) return;
  event.respondWith(
    fetch(target, { mode: 'cors', credentials: 'omit' })
      .then(response => response.ok ? response : fetch('/images/egonar-fallback.svg'))
      .catch(() => fetch('/images/egonar-fallback.svg'))
  );
});
