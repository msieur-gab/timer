// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(registration => console.log('ServiceWorker registered'))
        .catch(error => console.log('ServiceWorker registration failed:', error));
}

// Web Worker for Timer
const timerWorker = new Worker('timer-worker.js');

let wakeLock = null;

async function startTimer(duration) {
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        timerWorker.postMessage({ command: 'start', duration: duration });
    } catch (err) {
        console.error(`${err.name}, ${err.message}`);
    }
}

timerWorker.onmessage = function(e) {
    if (e.data.timeLeft) {
        updateTimerDisplay(e.data.timeLeft);
    } else if (e.data.command === 'finished') {
        timerFinished();
    }
};

function updateTimerDisplay(timeLeft) {
    document.getElementById('time-left').textContent = formatTime(timeLeft);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function timerFinished() {
    if (wakeLock) wakeLock.release();
    showNotification();
}

function showNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Tea is ready!', {
            body: 'Your tea has finished steeping.',
            icon: '/icon.png'
        });
    }
}

// Event Listeners
document.getElementById('stop-button').addEventListener('click', () => {
    timerWorker.postMessage({ command: 'stop' });
    if (wakeLock) wakeLock.release();
});

// Initialize app
startTimer(180); // 3 minutes for example
