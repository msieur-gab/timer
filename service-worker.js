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
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({action: 'timerComplete'});
        });
    });

    // Check notification permission before showing notification
    self.registration.pushManager.getSubscription()
        .then(subscription => {
            if (subscription) {
                // Permission was granted, show notification
                return self.registration.showNotification('Tea Timer', {
                    body: 'Your tea is ready!',
                    icon: '/icon.png', // Make sure to have an icon file
                    vibrate: [200, 100, 200]
                });
            } else {
                console.log('No push subscription, cannot show notification');
            }
        })
        .catch(error => console.log('Error checking push subscription:', error));
}
