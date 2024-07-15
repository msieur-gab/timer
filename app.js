const APP_CONFIG = window.APP_CONFIG;
import notificationManager from './notifications.js';

const APP_VERSION = APP_CONFIG.version;
const DEBUG = true; // Set this to false in production

const timerWorker = new Worker('timer-worker.js');
let wakeLock = null;
const audio = new Audio('notification.mp3');
let isTimerRunning = false;
let initialDuration = 0;
let lastEditedDuration = 0;
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

let startY, currentHeight, isDragging = false;
const SWIPE_THRESHOLD = 30;

function debugLog(...args) {
    if (DEBUG) {
        console.log(...args);
        const logElement = document.getElementById('debug-log');
        if (logElement) {
            logElement.style.display = 'block';
            logElement.innerHTML += args.join(' ') + '<br>';
        }
    }
}

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

    lastEditedDuration = initialDuration;

    try {
        wakeLock = await navigator.wakeLock.request('screen');
        timerWorker.postMessage({ command: 'start', duration: initialDuration });
        isTimerRunning = true;
        updateButtonStates();
    } catch (err) {
        debugLog(`Error: ${err.name}, ${err.message}`);
    }
}

function pauseTimer() {
    timerWorker.postMessage({ command: 'pause' });
    isTimerRunning = false;
    updateButtonStates();
}

function addTenSeconds() {
    if (isTimerRunning) {
        timerWorker.postMessage({ command: 'addTime', seconds: 10 });
    } else {
        const currentTime = parseInt(minutesInput.value) * 60 + parseInt(secondsInput.value);
        const newTime = currentTime + 10;
        updateTimerDisplay(newTime);
        lastEditedDuration = newTime;
    }
}

async function resetTimer() {
    await releaseWakeLock();
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
    if (timeLeftDisplay) {
        timeLeftDisplay.textContent = formatTime(timeLeft);
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function timerFinished() {
    await releaseWakeLock();
    playNotificationSound();
    try {
        debugLog('Attempting to show notification');
        const permission = await requestNotificationPermission();
        debugLog('Current permission:', permission);
        if (permission) {
            await notificationManager.showNotification('Tea is ready!', {
                body: 'Your tea has finished steeping.',
                icon: 'icon.png'
            });
            debugLog('Notification sent successfully');
        } else {
            debugLog('Notification permission not granted');
        }
    } catch (error) {
        debugLog('Error showing notification:', error);
    }
    isTimerRunning = false;
    updateButtonStates();
    timerWorker.postMessage({ command: 'stop' });
    updateTimerDisplay(lastEditedDuration);
}

function playNotificationSound() {
    audio.play().catch(error => debugLog('Error playing sound:', error));
}

function updateButtonStates() {
    if (startPauseButton) startPauseButton.textContent = isTimerRunning ? "Pause" : "Start";
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
        debugLog("Element 'version-info' not found in the DOM");
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

function setupInputListeners(input) {
    input.addEventListener('focus', (e) => {
        e.target.select();
    });
    input.addEventListener('blur', () => {
        validateTimeInput(input);
        updateTimeLeftDisplay();
    });
    input.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
}

function updateTimeLeftDisplay() {
    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;
    lastEditedDuration = minutes * 60 + seconds;
    initialDuration = lastEditedDuration;
    if (timeLeftDisplay) {
        timeLeftDisplay.textContent = formatTime(initialDuration);
    }
}

async function releaseWakeLock() {
    if (wakeLock) {
        try {
            await wakeLock.release();
            wakeLock = null;
            debugLog('Wake Lock released');
        } catch (err) {
            debugLog(`Error releasing wake lock: ${err.name}, ${err.message}`);
        }
    }
}

function handleTouchStart(e) {
    if (isEditing) return;
    startY = e.touches[0].clientY;
    currentHeight = parseInt(getComputedStyle(timerContainer).height, 10);
    isDragging = true;
}

function handleTouchMove(e) {
    if (!isDragging || isEditing) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;
    
    const newHeight = Math.max(50, Math.min(300, currentHeight - deltaY));
    timerContainer.style.height = `${newHeight}px`;
    
    if (Math.abs(deltaY) > 5) {
        e.preventDefault();
    }
}

function handleTouchEnd(e) {
    if (!isDragging || isEditing) return;
    isDragging = false;
    const endY = e.changedTouches[0].clientY;
    const deltaY = endY - startY;

    if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
        if (deltaY > 0) {
            timerContainer.style.height = '50px';
        } else {
            timerContainer.style.height = '300px';
        }
    } else {
        timerContainer.style.height = `${currentHeight}px`;
    }
}

function toggleTimerContainer(e) {
    if (isEditing) return;
    const currentHeight = parseInt(getComputedStyle(timerContainer).height, 10);
    timerContainer.style.height = currentHeight === 300 ? '50px' : '300px';
    e.stopPropagation();
}

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        debugLog('This browser does not support desktop notification');
        return false;
    }

    debugLog('Initial notification permission state:', Notification.permission);

    if (Notification.permission === 'granted') {
        debugLog('Permission already granted');
        return true;
    }

    if (Notification.permission !== 'denied') {
        try {
            const permission = await Notification.requestPermission();
            debugLog('New permission:', permission);
            return permission === 'granted';
        } catch (error) {
            debugLog('Error requesting notification permission:', error);
            return false;
        }
    }

    debugLog('Permission denied previously');
    return false;
}

window.addEventListener('load', async () => {
    updateVersionDisplay();
    updateButtonStates();
    
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('service-worker.js');
            debugLog('ServiceWorker registration successful with scope: ', registration.scope);
            
            if (navigator.serviceWorker.controller) {
                debugLog('Service Worker controller is active');
            } else {
                debugLog('Service Worker controller is not active yet');
            }
        } catch (error) {
            debugLog('ServiceWorker registration failed: ', error);
        }
    } else {
        debugLog('ServiceWorker is not supported');
    }

    await notificationManager.init();
    const notificationPermission = await requestNotificationPermission();
    debugLog('Notification permission:', notificationPermission);
});

document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden') {
        await releaseWakeLock();
    }
});

startPauseButton.addEventListener('click', startPauseTimer);
addTenSecondsButton.addEventListener('click', addTenSeconds);
resetButton.addEventListener('click', resetTimer);

setupInputListeners(minutesInput);
setupInputListeners(secondsInput);

timerContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
timerContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
timerContainer.addEventListener('touchend', handleTouchEnd);
timerHandle.addEventListener('click', toggleTimerContainer);

timerContent.addEventListener('click', (e) => e.stopPropagation());
