let timerInterval;
let endTime;

self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('message', event => {
    console.log('Message received in SW:', event.data);
    if (event.data.action === 'startTimer') {
        startTimer(event.data.duration);
    } else if (event.data.action === 'stopTimer') {
        stopTimer();
    }
});

function startTimer(duration) {
    stopTimer();
    endTime = Date.now() + duration;
    timerInterval = setInterval(() => {
        const remainingTime = Math.max(0, endTime - Date.now());
        if (remainingTime === 0) {
            stopTimer();
            notifyTimerEnded();
        } else {
            updateTimer(remainingTime);
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({action: 'updateTimer', time: '00:00:00'});
        });
    });
}

function notifyTimerEnded() {
    self.registration.showNotification('Timer Ended!', {
        body: 'Time is up.',
        icon: 'icon.png',
        vibrate: [200, 100, 200],
        requireInteraction: true
    });

    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({action: 'timerEnded'});
        });
    });
}

function updateTimer(remainingTime) {
    const seconds = Math.floor((remainingTime / 1000) % 60);
    const minutes = Math.floor((remainingTime / (1000 * 60)) % 60);
    const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);
    
    const timeString = [hours, minutes, seconds]
        .map(unit => unit.toString().padStart(2, '0'))
        .join(':');

    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({action: 'updateTimer', time: timeString});
        });
    });
}
