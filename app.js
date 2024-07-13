const APP_VERSION = APP_CONFIG.version;

// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(registration => console.log('ServiceWorker registered'))
        .catch(error => console.log('ServiceWorker registration failed:', error));
}

// Web Worker for Timer
const timerWorker = new Worker('timer-worker.js');

let wakeLock = null;
const audio = new Audio('notification.mp3');
let isTimerRunning = false;

// DOM Elements
const timeLeftDisplay = document.getElementById('time-left');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const resetButton = document.getElementById('reset-button');
const setMinutesInput = document.getElementById('set-minutes');
const setSecondsInput = document.getElementById('set-seconds');

async function startTimer() {
    const minutes = parseInt(setMinutesInput.value);
    const seconds = parseInt(setSecondsInput.value);
    const duration = minutes * 60 + seconds;

    if (duration <= 0) return;

    try {
        wakeLock = await navigator.wakeLock.request('screen');
        timerWorker.postMessage({ command: 'start', duration: duration });
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

function resumeTimer() {
    timerWorker.postMessage({ command: 'resume' });
    isTimerRunning = true;
    updateButtonStates();
}

function resetTimer() {
    timerWorker.postMessage({ command: 'reset' });
    isTimerRunning = false;
    updateTimerDisplay(0);
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
    if (wakeLock) wakeLock.release();
    playNotificationSound();
    showNotification();
    isTimerRunning = false;
    updateButtonStates();
}

function playNotificationSound() {
    audio.play().catch(error => console.log('Error playing sound:', error));
}

function showNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Tea is ready!', {
            body: 'Your tea has finished steeping.',
            icon: '/icon.png'
        });
    }
}

function updateButtonStates() {
    startButton.textContent = isTimerRunning ? "Resume" : "Start";
    startButton.disabled = isTimerRunning;
    pauseButton.disabled = !isTimerRunning;
    resetButton.disabled = !isTimerRunning && timeLeftDisplay.textContent === "00:00";
    setMinutesInput.disabled = isTimerRunning;
    setSecondsInput.disabled = isTimerRunning;
}

function updateVersionDisplay() {
    document.getElementById('version-info').textContent = APP_VERSION;
}


// Event Listeners
document.addEventListener('DOMContentLoaded', updateVersionDisplay);
startButton.addEventListener('click', () => isTimerRunning ? resumeTimer() : startTimer());
pauseButton.addEventListener('click', pauseTimer);
resetButton.addEventListener('click', resetTimer);

// Initialize button states
updateButtonStates();
