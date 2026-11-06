const CACHE_NAME = 'tallyhub-v3';            // bump on every deploy
const ASSETS = [
  './agent.html',
  './index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.0',
  'https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET') return;

  // Supabase: only public candidate photos may be cached. API, auth and private storage never.
  const isSupabase = url.hostname.endsWith('supabase.co');
  const isPublicPhoto = url.pathname.includes('/storage/v1/object/public/');
  if (isSupabase && !isPublicPhoto) return;

  // Page loads: network first, fall back to the cached page
  if (req.mode === 'navigate') {
    const key = url.pathname.endsWith('index.html') ? './index.html' : './agent.html';
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(key, copy));
          }
          return res;
        })
        .catch(() => caches.match(key))
    );
    return;
  }

  // Everything else (fonts, scripts, photos): stale-while-revalidate
  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req)
        .then((res) => {
          if (res.ok || res.type === 'opaque') {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || net;
    })
  );
});
