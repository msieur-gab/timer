import EventEmitter from './EventEmitter.js';
import { debugLog } from '../utils/debug.js';
import { APP_VERSION } from './config.js';

class App extends EventEmitter {
    constructor(managers) {
        super();
        this.managers = managers;
    }

    async init() {
        debugLog('Initializing app...');
        this.setupEventListeners();
        await this.managers.notificationManager.init();
        this.managers.uiManager.init();
        this.managers.uiManager.updateVersionDisplay(APP_VERSION);
        this.setupServiceWorker();
        debugLog('App initialized');
    }

    setupEventListeners() {
        this.managers.timerManager.on('timeUpdate', this.handleTimeUpdate.bind(this));
        this.managers.timerManager.on('timerFinished', this.handleTimerFinished.bind(this));
        this.managers.uiManager.on('startTimer', this.handleStartTimer.bind(this));
        this.managers.uiManager.on('pauseTimer', this.handlePauseTimer.bind(this));
        this.managers.uiManager.on('resetTimer', this.handleResetTimer.bind(this));
        this.managers.uiManager.on('addTime', this.handleAddTime.bind(this));

        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    handleTimeUpdate(timeLeft) {
        this.managers.uiManager.updateTimerDisplay(timeLeft);
    }

    async handleTimerFinished() {
        await this.managers.wakeLockManager.release();
        this.managers.notificationManager.showNotification('Tea Timer', 'Your tea is ready!');
        this.managers.uiManager.updateButtonStates(false);
        this.managers.uiManager.setAppBadge(1);
    }

    async handleStartTimer(duration) {
        await this.managers.wakeLockManager.acquire();
        this.managers.timerManager.start(duration);
        this.managers.uiManager.updateButtonStates(true);
    }

    handlePauseTimer() {
        this.managers.timerManager.pause();
        this.managers.uiManager.updateButtonStates(false);
    }

    async handleResetTimer() {
        await this.managers.wakeLockManager.release();
        this.managers.timerManager.reset();
        this.managers.uiManager.updateButtonStates(false);
    }

    handleAddTime(seconds) {
        this.managers.timerManager.addTime(seconds);
    }

    async handleVisibilityChange() {
        if (document.visibilityState === 'hidden') {
            await this.managers.wakeLockManager.release();
        }
    }

    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                debugLog('ServiceWorker registration successful with scope: ', registration.scope);
            } catch (error) {
                debugLog('ServiceWorker registration failed: ', error);
            }
        }
    }
}

export default App;
