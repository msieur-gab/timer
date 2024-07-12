self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('message', event => {
    if (event.data.action === 'startTimer') {
        startTimer(event.data.duration);
    }
});

function startTimer(duration) {
    console.log(`Starting ${duration} second timer`);
    setTimeout(() => {
        console.log('Timer complete');
        self.registration.showNotification('Tea Timer', {
            body: 'Your tea is ready!',
            icon: '/icon.png', // Make sure to have an icon file
            vibrate: [200, 100, 200]
        });

        // Notify all clients that the timer is complete
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({action: 'timerComplete'});
            });
        });
    }, duration * 1000);
}
