const SW_VERSION = '1.0.5';
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

function startTimer(registration, minutes) { 
  if (registration.active) {
    registration.active.postMessage({
      action: 'startTimer',
      duration: minutes * 60 * 1000
    });
    localStorage.setItem('timerEndTime', Date.now() + minutes * 60 * 1000);
  }
}
document.getElementById('startTimer').addEventListener('click', () => {
  const minutes = parseInt(document.getElementById('minutes').value, 10); 

  if (!isNaN(minutes) && minutes > 0) {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    navigator.serviceWorker.ready.then(registration => {
      startTimer(registration, minutes); 
    });
  }
});

document.getElementById('stopTimer').addEventListener('click', () => {
    log('Stop button clicked');
    if (swRegistration && swRegistration.active) {
        log('Sending stop message to Service Worker');
        swRegistration.active.postMessage({action: 'stopTimer'});
        localStorage.removeItem('timerEndTime');
    } else {
        log('Service Worker not active, cannot stop timer');
    }
});

document.getElementById('updateApp').addEventListener('click', () => {
    log('Check for updates clicked');
    if (swRegistration) {
        swRegistration.update().then(() => {
            log('Service Worker update checked');
            window.location.reload();
        });
    } else {
        log('Service Worker not registered, cannot check for updates');
    }
});

function playNotificationSound() {
    document.getElementById('notificationSound').play();
}

navigator.serviceWorker.addEventListener('message', event => {
    log('Message received from Service Worker: ' + JSON.stringify(event.data));
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
            log('Resuming timer from saved state');
            startTimer(Math.ceil(remainingTime / 60000));
        } else {
            log('Saved timer already expired, removing from storage');
            localStorage.removeItem('timerEndTime');
        }
    }
    document.getElementById('versionInfo').textContent = `v${SW_VERSION}`;
});
