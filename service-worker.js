importScripts('config.js');

const CACHE_VERSION = APP_CONFIG.version;
const CACHE_NAME = `timer-version-${CACHE_VERSION}`;

const urlsToCache = [
    './',
    'index.html',
    'style.css',
    'app.js',
    'config.js',
    'icon.png'
];

const audioToCache = 'notification.mp3';

self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching files');
                
                const regularCaching = cache.addAll(urlsToCache);
                
                const audioCaching = fetch(audioToCache, { mode: 'no-cors' })
                    .then(response => cache.put(audioToCache, response))
                    .catch(error => console.error('Failed to cache audio file:', error));

                return Promise.all([regularCaching, audioCaching]);
            })
            .then(() => console.log('Service Worker: All files cached'))
            .catch(error => console.error('Service Worker: Caching failed:', error))
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
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

self.addEventListener('sync', event => {
    if (event.tag === 'checkTimer') {
        event.waitUntil(checkTimerAndNotify());
    }
});

function checkTimerAndNotify() {
    return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
            const endTime = parseInt(localStorage.getItem('timerEndTime'));
            if (!endTime) {
                clearInterval(checkInterval);
                resolve();
                return;
            }

            const now = Date.now();
            if (now >= endTime) {
                clearInterval(checkInterval);
                self.registration.showNotification('Tea is ready!', {
                    body: 'Your tea has finished steeping.',
                    icon: '/icon.png'
                });
                localStorage.removeItem('timerEndTime');
                resolve();
            }
        }, 1000);
    });
}
