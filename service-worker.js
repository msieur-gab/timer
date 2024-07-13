importScripts('config.js');

const CACHE_VERSION = APP_CONFIG.version;
const CACHE_NAME = `timer-version-${CACHE_VERSION}`;

const urlsToCache = [
    './',
    'index.html',
    'style.css',
    'app.js',
    'timer-worker.js',
    'icon.png',
    'notification.mp3',
    'config.js'
];

self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching files');
                return Promise.all(
                    urlsToCache.map(url => {
                        return cache.add(url).catch(error => {
                            console.error(`Failed to cache ${url}: ${error}`);
                            // Continue avec les autres fichiers même si celui-ci échoue
                            return Promise.resolve();
                        });
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: All available files cached');
            })
    );
});

self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName.startsWith('timer-version-') && cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
    console.log('Service Worker: Fetching', event.request.url);
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    console.log('Service Worker: Found in cache', event.request.url);
                    return response;
                }
                console.log('Service Worker: Fetching from network', event.request.url);
                return fetch(event.request);
            })
    );
});
