const CACHE_NAME = 'tallyhub-v1';
const ASSETS = [
  './agent.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js'
];

// Install: Cache the app shell
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

// Fetch: Serve from cache if offline
self.addEventListener('fetch', (e) => {
  // Don't cache Supabase API calls!
  if (e.request.url.includes('supabase.co')) return; 
  
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
