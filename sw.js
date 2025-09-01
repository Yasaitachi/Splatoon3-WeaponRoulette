const CACHE_NAME = `spla-roulette-v${'1.2.0'}`; // script.jsのAPP_VERSIONと合わせる
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/Weapon-data.js',
  '/i18n.js',
  '/script.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-512x512.png'
];

// Service Workerのインストール
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// リクエストをキャッシュから返す
self.addEventListener('fetch', event => {
  // Firebaseなど外部へのリクエストはキャッシュしない
  if (event.request.url.startsWith('https://')) {
    return;
  }
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// 古いキャッシュの削除
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => {
        if (!cacheWhitelist.includes(cacheName)) {
          return caches.delete(cacheName);
        }
      })
    ))
  );
});