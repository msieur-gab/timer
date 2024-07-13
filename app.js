const APP_VERSION = APP_CONFIG.version;

const timerWorker = new Worker('timer-worker.js');
let wakeLock = null;
const audio = new Audio('notification.mp3');
let isTimerRunning = false;

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

    const endTime = Date.now() + duration * 1000;
    localStorage.setItem('timerEndTime', endTime.toString());

    try {
        wakeLock = await navigator.wakeLock.request('screen');
        isTimerRunning = true;
        updateButtonStates();

        // Enregistrer la tâche de synchronisation en arrière-plan
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register('checkTimer');
        }

        timerWorker.postMessage({ command: 'start', endTime: endTime });
    } catch (err) {
        console.error(`${err.name}, ${err.message}`);
    }
}

timerWorker.onmessage = function(e) {
    if (e.data.timeLeft !== undefined) {
        updateTimerDisplay(e.data.timeLeft);
    } else if (e.data.command === 'finished') {
        timerFinished();
    }
};

function pauseTimer() {
    isTimerRunning = false;
    timerWorker.postMessage({ command: 'pause' });
    updateButtonStates();
}

function resumeTimer() {
    isTimerRunning = true;
    timerWorker.postMessage({ command: 'resume' });
    updateButtonStates();
}

function resetTimer() {
    isTimerRunning = false;
    timerWorker.postMessage({ command: 'reset' });
    localStorage.removeItem('timerEndTime');
    updateTimerDisplay(0);
    updateButtonStates();
}

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
    localStorage.removeItem('timerEndTime');
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
    const versionElement = document.getElementById('version-info');
    if (versionElement) {
        versionElement.textContent = APP_VERSION;
    } else {
        console.warn("Element 'version-info' not found in the DOM");
    }
}

function checkTimerOnLoad() {
    const endTime = parseInt(localStorage.getItem('timerEndTime'));
    if (endTime) {
        const now = Date.now();
        if (now < endTime) {
            isTimerRunning = true;
            timerWorker.postMessage({ command: 'start', endTime: endTime });
            updateButtonStates();
        } else {
            timerFinished();
        }
    }
}

window.addEventListener('load', () => {
    updateVersionDisplay();
    updateButtonStates();
    checkTimerOnLoad();
});

startButton.addEventListener('click', () => isTimerRunning ? resumeTimer() : startTimer());
pauseButton.addEventListener('click', pauseTimer);
resetButton.addEventListener('click', resetTimer);

// Vérifier le timer quand l'onglet reprend le focus
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        checkTimerOnLoad();
    }
});

// Demander la permission pour les notifications si ce n'est pas déjà fait
if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
}
