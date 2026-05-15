const CACHE_VERSION = 'v1';
const SHELL_CACHE = `homedock-shell-${CACHE_VERSION}`;
const API_CACHE = `homedock-api-${CACHE_VERSION}`;

const SHELL_ASSETS = ['/', '/index.html'];
const API_HOSTS = [
  'api.open-meteo.com',
  'api.rss2json.com',
  'api.allorigins.win',
  'api.codetabs.com',
  'thingproxy.freeboard.io',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              (key.startsWith('homedock-shell-') && key !== SHELL_CACHE) ||
              (key.startsWith('homedock-api-') && key !== API_CACHE)
          )
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  const isSameOrigin = url.origin === self.location.origin;
  const isApiHost = API_HOSTS.some((host) => url.hostname.includes(host));
  const isShellRequest = isSameOrigin && (url.pathname === '/' || url.pathname.endsWith('.html'));
  const isStaticAsset =
    isSameOrigin &&
    (/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2?)$/i.test(url.pathname) ||
      url.pathname.startsWith('/assets/'));

  if (!isShellRequest && !isStaticAsset && !isApiHost) return;

  if (isApiHost) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => cached);

          return cached || network;
        })
      )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);
    })
  );
});
