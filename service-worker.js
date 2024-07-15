importScripts('config.js');

const CACHE_VERSION = APP_CONFIG.version;
const CACHE_NAME = `timer-version-${CACHE_VERSION}`;

const urlsToCache = [
    './',
    'index.html',
    'style.css',
    'app.js',
    'notifications.js',
    'timer-worker.js',
    'icon.png',
    'config.js'
];

// Séparez le fichier audio des autres ressources
const audioToCache = 'notification.mp3';

self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching files');
                
                // Mise en cache des fichiers réguliers
                const regularCaching = cache.addAll(urlsToCache);
                
                // Mise en cache spéciale pour le fichier audio
                const audioCaching = fetch(audioToCache)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to fetch audio file');
                        }
                        return cache.put(audioToCache, response);
                    })
                    .catch(error => {
                        console.error('Failed to cache audio file:', error);
                    });

                return Promise.all([regularCaching, audioCaching]);
            })
            .then(() => {
                console.log('Service Worker: All files cached');
            })
            .catch(error => {
                console.error('Service Worker: Caching failed:', error);
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

self.addEventListener('message', event => {
    if (event.data.type === 'SHOW_NOTIFICATION') {
        self.registration.showNotification(event.data.title, event.data.options)
            .then(() => console.log('Notification shown successfully'))
            .catch(error => console.error('Error showing notification:', error));
    }
});
