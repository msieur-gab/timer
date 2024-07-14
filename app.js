const APP_VERSION = APP_CONFIG.version;

const timerWorker = new Worker('timer-worker.js');
let wakeLock = null;
const audio = new Audio('notification.mp3');
let isTimerRunning = false;
let initialDuration = 0;

const timeLeftDisplay = document.getElementById('time-left');
const startPauseButton = document.getElementById('start-pause-button');
const addTenSecondsButton = document.getElementById('add-ten-seconds-button');
const resetButton = document.getElementById('reset-button');
const setMinutesInput = document.getElementById('set-minutes');
const setSecondsInput = document.getElementById('set-seconds');

async function checkNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }
    if (Notification.permission === 'granted') {
        return true;
    }
    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    return false;
}

async function startPauseTimer() {
    if (!isTimerRunning) {
        await startTimer();
    } else {
        pauseTimer();
    }
}

async function startTimer() {
    const minutes = parseInt(setMinutesInput.value);
    const seconds = parseInt(setSecondsInput.value);
    initialDuration = minutes * 60 + seconds;

    if (initialDuration <= 0) return;

    try {
        wakeLock = await navigator.wakeLock.request('screen');
        timerWorker.postMessage({ command: 'start', duration: initialDuration });
        isTimerRunning = true;
        updateButtonStates();
    } catch (err) {
        console.error(`${err.name}, ${err.message}`);
    }
}

function pauseTimer() {
    timerWorker.postMessage({ command: 'pause' });
    isTimerRunning = false;
    updateButtonStates();
}

function addTenSeconds() {
    timerWorker.postMessage({ command: 'addTime', seconds: 10 });
}

function resetTimer() {
    timerWorker.postMessage({ command: 'reset', duration: initialDuration });
    isTimerRunning = false;
    updateTimerDisplay(initialDuration);
    updateButtonStates();
}

timerWorker.onmessage = function(e) {
    if (e.data.timeLeft !== undefined) {
        updateTimerDisplay(e.data.timeLeft);
    } else if (e.data.command === 'finished') {
        timerFinished();
    }
};

function updateTimerDisplay(timeLeft) {
    timeLeftDisplay.textContent = formatTime(timeLeft);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function timerFinished() {
    if (wakeLock) {
        try {
            await wakeLock.release();
            console.log('Wake Lock released');
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    }
    playNotificationSound();
    await showNotification();
    isTimerRunning = false;
    updateButtonStates();
    timerWorker.postMessage({ command: 'stop' });
}

function playNotificationSound() {
    audio.play().catch(error => console.log('Error playing sound:', error));
}

async function showNotification() {
    const hasPermission = await checkNotificationPermission();
    if (hasPermission) {
        try {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SHOW_NOTIFICATION',
                    title: 'Tea is ready!',
                    options: {
                        body: 'Your tea has finished steeping.',
                        icon: 'icon.png'
                    }
                });
            } else {
                new Notification('Tea is ready!', {
                    body: 'Your tea has finished steeping.',
                    icon: 'icon.png'
                });
            }
        } catch (err) {
            console.error('Error showing notification:', err);
        }
    } else {
        console.log('Notification permission not granted');
    }
}

function updateButtonStates() {
    startPauseButton.textContent = isTimerRunning ? "Pause" : "Start";
    addTenSecondsButton.disabled = !isTimerRunning;
    resetButton.disabled = !isTimerRunning && timeLeftDisplay.textContent === formatTime(initialDuration);
    setMinutesInput.disabled = isTimerRunning;
    setSecondsInput.disabled = isTimerRunning;
}

function updateVersionDisplay() {
    const versionElement = document.getElementById('version-info');
    if (versionElement) {
        versionElement.textContent = APP_VERSION;
    } else {
        console.warn("Element 'version-info' not found in the DOM");
    }
}

window.addEventListener('load', () => {
    updateVersionDisplay();
    updateButtonStates();
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => console.log('ServiceWorker registration successful with scope: ', registration.scope))
            .catch(error => console.error('ServiceWorker registration failed: ', error));
    }
});

startPauseButton.addEventListener('click', startPauseTimer);
addTenSecondsButton.addEventListener('click', addTenSeconds);
resetButton.addEventListener('click', resetTimer);

checkNotificationPermission();
