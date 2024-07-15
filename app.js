import notificationManager from './notifications.js';

import { APP_CONFIG } from './config.js';
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
const timerContainer = document.querySelector('.interactive-timer');
const timerHandle = document.querySelector('.timer-handle');
const timerContent = document.querySelector('.timer-content');

let isDragging = false;
let startY;
let startHeight;
let lastTouchY;

async function startPauseTimer() {
    if (!isTimerRunning) {
        await startTimer();
    } else {
        pauseTimer();
    }
}

async function startTimer() {
    const minutes = parseInt(minutesInput.value);
    const seconds = parseInt(secondsInput.value);
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
    if (!isEditing) {
        minutesInput.value = String(Math.floor(timeLeft / 60)).padStart(2, '0');
        secondsInput.value = String(timeLeft % 60).padStart(2, '0');
    }
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
    if (startPauseButton) startPauseButton.textContent = isTimerRunning ? "Pause" : "Start";
    if (addTenSecondsButton) addTenSecondsButton.disabled = !isTimerRunning;
    if (resetButton && timeLeftDisplay) {
        resetButton.disabled = !isTimerRunning && timeLeftDisplay.textContent === formatTime(initialDuration);
    }
    if (minutesInput) minutesInput.disabled = isTimerRunning;
    if (secondsInput) secondsInput.disabled = isTimerRunning;
}

function updateVersionDisplay() {
    const versionElement = document.getElementById('version-info');
    if (versionElement) {
        versionElement.textContent = APP_VERSION;
    } else {
        console.warn("Element 'version-info' not found in the DOM");
    }
}

function toggleEditMode(input) {
    isEditing = !isEditing;
    minutesInput.readOnly = !isEditing;
    secondsInput.readOnly = !isEditing;
    minutesInput.classList.toggle('editing', isEditing);
    secondsInput.classList.toggle('editing', isEditing);
    
    if (isEditing) {
        input.focus();
        input.select();
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
    timeLeftDisplay.textContent = formatTime(initialDuration);
}

function handleTouchStart(e) {
    if (isEditing) return;
    startY = e.touches[0].clientY;
    lastTouchY = startY;
    startHeight = parseInt(getComputedStyle(timerContainer).height, 10);
    isDragging = true;
}

function handleTouchMove(e) {
    if (!isDragging || isEditing) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - lastTouchY;
    lastTouchY = currentY;
    
    const newHeight = Math.max(50, Math.min(300, startHeight + (startY - currentY)));
    timerContainer.style.height = `${newHeight}px`;
    
    if (Math.abs(currentY - startY) > 5) {
        e.preventDefault(); // Prevent default pull-to-refresh behavior
    }
}

function handleTouchEnd() {
    if (!isDragging || isEditing) return;
    isDragging = false;
    const currentHeight = parseInt(getComputedStyle(timerContainer).height, 10);
    timerContainer.style.height = currentHeight < 150 ? '50px' : '300px';
}

function toggleTimerContainer() {
    if (isEditing) return;
    const currentHeight = parseInt(getComputedStyle(timerContainer).height, 10);
    timerContainer.style.height = currentHeight === 300 ? '50px' : '300px';
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

function setupInputListeners(input) {
    input.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleEditMode(input);
    });
    input.addEventListener('blur', () => {
        if (isEditing) toggleEditMode(input);
    });
    input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') toggleEditMode(input);
    });
}

setupInputListeners(minutesInput);
setupInputListeners(secondsInput);

// Drawer event listeners
timerContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
timerContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
timerContainer.addEventListener('touchend', handleTouchEnd);
timerHandle.addEventListener('click', toggleTimerContainer);

// Prevent drawer from closing when interacting with content
timerContent.addEventListener('click', (e) => e.stopPropagation());
