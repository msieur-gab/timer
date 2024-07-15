import notificationManager from './notifications.js';

const APP_VERSION = APP_CONFIG.version;

const timerWorker = new Worker('timer-worker.js');
let wakeLock = null;
const audio = new Audio('notification.mp3');
let isTimerRunning = false;
let initialDuration = 0;
let isEditing = false;

const timeLeftDisplay = document.getElementById('time-left');
const startPauseButton = document.getElementById('start-pause-button');
const addTenSecondsButton = document.getElementById('add-ten-seconds-button');
const resetButton = document.getElementById('reset-button');
const minutesInput = document.getElementById('minutes');
const secondsInput = document.getElementById('seconds');

async function startPauseTimer() {
    if (!isTimerRunning) {
        await startTimer();
    } else {
        pauseTimer();
    }
}

async function startTimer() {
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
    if (!isEditing) {
        minutesInput.value = String(Math.floor(timeLeft / 60)).padStart(2, '0');
        secondsInput.value = String(timeLeft % 60).padStart(2, '0');
    }
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
    await notificationManager.showNotification('Tea is ready!', {
        body: 'Your tea has finished steeping.',
        icon: 'icon.png',
        sound: 'notification.mp3'
    });
    isTimerRunning = false;
    updateButtonStates();
    timerWorker.postMessage({ command: 'stop' });
}

function playNotificationSound() {
    audio.play().catch(error => console.log('Error playing sound:', error));
}

function updateButtonStates() {
    startPauseButton.textContent = isTimerRunning ? "Pause" : "Start";
    addTenSecondsButton.disabled = !isTimerRunning;
    resetButton.disabled = !isTimerRunning && formatTime(initialDuration) === `${minutesInput.value}:${secondsInput.value}`;
    minutesInput.disabled = isTimerRunning;
    secondsInput.disabled = isTimerRunning;
}

function updateVersionDisplay() {
    const versionElement = document.getElementById('version-info');
    if (versionElement) {
        versionElement.textContent = APP_VERSION;
    } else {
        console.warn("Element 'version-info' not found in the DOM");
    }
}

function toggleEditMode() {
    isEditing = !isEditing;
    minutesInput.readOnly = !isEditing;
    secondsInput.readOnly = !isEditing;
    minutesInput.classList.toggle('editing', isEditing);
    secondsInput.classList.toggle('editing', isEditing);
    
    if (isEditing) {
        minutesInput.focus();
    } else {
        validateTimeInput(minutesInput);
        validateTimeInput(secondsInput);
        updateTimeLeftDisplay();
    }
}

function validateTimeInput(input) {
    let value = parseInt(input.value);
    const max = 59;
    if (isNaN(value) || value < 0) {
        value = 0;
    } else if (value > max) {
        value = max;
    }
    input.value = value.toString().padStart(2, '0');
}

function updateTimeLeftDisplay() {
    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;
    initialDuration = minutes * 60 + seconds;
}

window.addEventListener('load', async () => {
    updateVersionDisplay();
    updateButtonStates();
    
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('service-worker.js');
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        } catch (error) {
            console.error('ServiceWorker registration failed: ', error);
        }
    }

    await notificationManager.init();
});

startPauseButton.addEventListener('click', startPauseTimer);
addTenSecondsButton.addEventListener('click', addTenSeconds);
resetButton.addEventListener('click', resetTimer);
minutesInput.addEventListener('click', toggleEditMode);
secondsInput.addEventListener('click', toggleEditMode);
minutesInput.addEventListener('blur', () => {
    if (isEditing) toggleEditMode();
});
secondsInput.addEventListener('blur', () => {
    if (isEditing) toggleEditMode();
});
minutesInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') toggleEditMode();
});
secondsInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') toggleEditMode();
});
