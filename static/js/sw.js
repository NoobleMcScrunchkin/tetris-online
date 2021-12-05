var cacheName = 'tetris-v1';
var appShellFiles = [
    '../',
    '../index',
    '../leaderboard/40lines',
    '../leaderboard/zen',
    '../40lines',
    '../zen',
    '../vs',
    '../profile',
    '../css/master.css',
    '../img/GitHub-Mark-Light-120px-plus.png',
    '../img/bg.png',
    '../img/icons/favicon.ico',
    '../img/icons/android-chrome-192x192.png',
    '../img/icons/android-chrome-512x512.png',
    '../img/icons/favicon-16x16.png',
    '../img/icons/favicon-32x32.png',
    '../img/users/default.webp',
    '../js/bootstrap.min.js',
    '../css/bootstrap.css',
    '../other/manifest.json',
    '../app.js',
    '../socket.io/socket.io.js',
];

self.addEventListener('install', (e) => {
    console.log('[Service Worker] Install');
    e.waitUntil(
        caches.open(cacheName).then((cache) => {
            console.log('[Service Worker] Caching all: app shell and content');
            return cache.addAll(appShellFiles);
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith((async () => {
        try {
            const preloadResponse = await e.preloadResponse;
            if (preloadResponse) {
                return preloadResponse;
            }

            const networkResponse = await fetch(e.request);
            return networkResponse;
        } catch (error) {
            console.log('Fetch failed; returning offline page instead.', error);

            const cache = await caches.open(cacheName);
            const cachedResponse = await cache.match(e.request);
            return cachedResponse;
        }
    })());
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (cacheName.indexOf(key) === -1) {
                    return caches.delete(key);
                }
            }));
        })
    );
});