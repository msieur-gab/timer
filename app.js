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

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
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

function timerFinished() {
    if (wakeLock) {
        wakeLock.release().then(() => {
            console.log('Wake Lock released');
        });
    }
    playNotificationSound();
    showNotification();
    isTimerRunning = false;
    updateButtonStates();
    timerWorker.postMessage({ command: 'stop' });
}

function playNotificationSound() {
    audio.play().catch(error => console.log('Error playing sound:', error));
}

function showNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Tea is ready!', {
            body: 'Your tea has finished steeping.',
            icon: 'icon.png'
        });
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
});

startPauseButton.addEventListener('click', startPauseTimer);
addTenSecondsButton.addEventListener('click', addTenSeconds);
resetButton.addEventListener('click', resetTimer);

if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
}
