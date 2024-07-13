const SW_VERSION = '1.0.2';
let swRegistration;

function log(message) {
    console.log(message);
    const logContainer = document.getElementById('logContainer');
    const logElement = document.createElement('div');
    logElement.textContent = message;
    logContainer.appendChild(logElement);
    logContainer.scrollTop = logContainer.scrollHeight;
}

document.getElementById('toggleLogs').addEventListener('click', () => {
    const logContainer = document.getElementById('logContainer');
    logContainer.style.display = logContainer.style.display === 'none' ? 'block' : 'none';
});

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js', { updateViaCache: 'none' })
            .then(registration => {
                log('Service Worker registered');
                swRegistration = registration;
                checkForSwUpdate(registration);
            })
            .catch(error => log('Service Worker registration error: ' + error));
    }
}

function checkForSwUpdate(registration) {
    registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdatePrompt();
            }
        });
    });
}

function showUpdatePrompt() {
    document.getElementById('updatePrompt').classList.remove('hidden');
}

document.getElementById('updateNow').addEventListener('click', () => {
    document.getElementById('updatePrompt').classList.add('hidden');
    window.location.reload();
});

document.getElementById('updateLater').addEventListener('click', () => {
    document.getElementById('updatePrompt').classList.add('hidden');
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
        registration.update();
    });
}

registerServiceWorker();

function startTimer(minutes) {
    log('startTimer called with minutes: ' + minutes);
    if (swRegistration && swRegistration.active) {
        log('Service Worker is active, sending message');
        swRegistration.active.postMessage({
            action: 'startTimer',
            duration: minutes * 60 * 1000
        });
        localStorage.setItem('timerEndTime', Date.now() + minutes * 60 * 1000);
    } else {
        log('Service Worker not active');
    }
}

document.getElementById('startTimer').addEventListener('click', async () => {
    log('Start button clicked');
    const minutes = document.getElementById('minutes').value;
    log('Minutes: ' + minutes);
    if (minutes > 0) {
        log('Minutes > 0, checking notification permission');
        if (Notification.permission !== 'granted') {
            log('Requesting notification permission');
            const permission = await Notification.requestPermission();
            log('Notification permission response: ' + permission);
        }
        if (Notification.permission === 'granted') {
            log('Notification permission granted, starting timer');
            startTimer(minutes);
        } else {
            log('Permission denied');
        }
    } else {
        log('Invalid minutes value');
    }
});

document.getElementById('stopTimer').addEventListener('click', () => {
    if (swRegistration && swRegistration.active) {
        swRegistration.active.postMessage({action: 'stopTimer'});
        localStorage.removeItem('timerEndTime');
    }
});

document.getElementById('updateApp').addEventListener('click', () => {
    if (swRegistration) {
        swRegistration.update().then(() => {
            console.log('Service Worker update checked');
            window.location.reload();
        });
    }
});

function playNotificationSound() {
    document.getElementById('notificationSound').play();
}

navigator.serviceWorker.addEventListener('message', event => {
    if (event.data.action === 'updateTimer') {
        document.getElementById('timer').textContent = event.data.time;
    } else if (event.data.action === 'timerEnded') {
        playNotificationSound();
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
    }
});

window.addEventListener('load', () => {
log('Page loaded');
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            log('Service Worker ready state: ' + (registration.active ? 'active' : 'not active'));
        });
    }
    const savedEndTime = localStorage.getItem('timerEndTime');
    if (savedEndTime) {
        const remainingTime = parseInt(savedEndTime) - Date.now();
        if (remainingTime > 0) {
            startTimer(Math.floor(remainingTime / 60000));
        } else {
            localStorage.removeItem('timerEndTime');
        }
    }
    document.getElementById('versionInfo').textContent = `v${SW_VERSION}`;
});
