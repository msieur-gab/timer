// Importons la configuration
importScripts('config.js');

const CACHE_VERSION = APP_CONFIG.version;
const CACHE_NAME = `timer-version-${CACHE_VERSION}`;

const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/timer-worker.js',
    '/icon.png',
    '/notification.mp3',
    '/config.js'
];



self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
