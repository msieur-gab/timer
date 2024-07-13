if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(registration => console.log('Service Worker enregistré'))
        .catch(error => console.log('Erreur d'enregistrement du Service Worker:', error));
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
    navigator.serviceWorker.controller.postMessage({action: 'stopTimer'});
    localStorage.removeItem('timerEndTime');
});

function startTimer(minutes) {
    navigator.serviceWorker.controller.postMessage({
        action: 'startTimer',
        duration: minutes * 60 * 1000
    });
    localStorage.setItem('timerEndTime', Date.now() + minutes * 60 * 1000);
}

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
});
