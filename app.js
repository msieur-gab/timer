const SW_VERSION = '1.0.1';
let swRegistration;

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js', { updateViaCache: 'none' })
            .then(registration => {
                console.log('Service Worker registered');
                swRegistration = registration;
                checkForSwUpdate(registration);
            })
            .catch(error => console.log('Service Worker registration error:', error));
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
    if (swRegistration && swRegistration.active) {
        swRegistration.active.postMessage({
            action: 'startTimer',
            duration: minutes * 60 * 1000
        });
        localStorage.setItem('timerEndTime', Date.now() + minutes * 60 * 1000);
    } else {
        console.error('Service Worker not active');
    }
}

document.getElementById('startTimer').addEventListener('click', () => {
    const minutes = document.getElementById('minutes').value;
    if (minutes > 0) {
        if (Notification.permission === 'granted') {
            startTimer(minutes);
        } else {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    startTimer(minutes);
                }
            });
        }
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
