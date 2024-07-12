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
        notifyTimerComplete();
    }, duration * 1000);
}

function notifyTimerComplete() {
    self.registration.getNotifications().then(notifications => {
        if (notifications.length === 0) {
            // Only show a notification if there isn't already one
            self.registration.showNotification('Tea Timer', {
                body: 'Your tea is ready!',
                icon: '/icon.png', // Make sure to have an icon file
                vibrate: [200, 100, 200]
            }).catch(error => console.log('Error showing notification:', error));
        }
    });

    // Notify all clients that the timer is complete
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({action: 'timerComplete'});
        });
    });
}
