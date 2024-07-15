import EventEmitter from '../core/EventEmitter.js';
import { UI_EVENTS } from '../core/config.js';
import { formatTime } from '../utils/timeFormatters.js';

class UIManager extends EventEmitter {
    constructor() {
        super();
        this.elements = {
            timeLeftDisplay: document.getElementById('time-left'),
            startPauseButton: document.getElementById('start-pause-button'),
            addTenSecondsButton: document.getElementById('add-ten-seconds-button'),
            resetButton: document.getElementById('reset-button'),
            minutesInput: document.getElementById('minutes'),
            secondsInput: document.getElementById('seconds'),
            timerContainer: document.querySelector('.interactive-timer'),
            timerHandle: document.querySelector('.timer-handle'),
            timerContent: document.querySelector('.timer-content'),
            versionInfo: document.getElementById('version-info')
        };
        this.isEditing = false;
    }

    init() {
        this.setupEventListeners();
        this.setupInputListeners();
        this.setupDragListeners();
    }

    setupEventListeners() {
        this.elements.startPauseButton.addEventListener('click', () => this.emit(UI_EVENTS.START_TIMER, this.getCurrentDuration()));
        this.elements.addTenSecondsButton.addEventListener('click', () => this.emit(UI_EVENTS.ADD_TIME, 10));
        this.elements.resetButton.addEventListener('click', () => this.emit(UI_EVENTS.RESET_TIMER));
    }

    setupInputListeners() {
        [this.elements.minutesInput, this.elements.secondsInput].forEach(input => {
            input.addEventListener('focus', this.handleInputFocus.bind(this));
            input.addEventListener('blur', this.handleInputBlur.bind(this));
            input.addEventListener('input', this.handleInput.bind(this));
        });
    }

    setupDragListeners() {
        let startY, currentHeight, isDragging = false;
        const SWIPE_THRESHOLD = 30;

        this.elements.timerContainer.addEventListener('touchstart', (e) => {
            if (this.isEditing) return;
            startY = e.touches[0].clientY;
            currentHeight = parseInt(getComputedStyle(this.elements.timerContainer).height, 10);
            isDragging = true;
        });

        this.elements.timerContainer.addEventListener('touchmove', (e) => {
            if (!isDragging || this.isEditing) return;
            const currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            const newHeight = Math.max(50, Math.min(300, currentHeight - deltaY));
            this.elements.timerContainer.style.height = `${newHeight}px`;
            if (Math.abs(deltaY) > 5) {
                e.preventDefault();
            }
        });

        this.elements.timerContainer.addEventListener('touchend', (e) => {
            if (!isDragging || this.isEditing) return;
            isDragging = false;
            const endY = e.changedTouches[0].clientY;
            const deltaY = endY - startY;

            if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
                this.elements.timerContainer.style.height = deltaY > 0 ? '50px' : '300px';
            } else {
                this.elements.timerContainer.style.height = `${currentHeight}px`;
            }
        });

        this.elements.timerHandle.addEventListener('click', (e) => {
            if (this.isEditing) return;
            const currentHeight = parseInt(getComputedStyle(this.elements.timerContainer).height, 10);
            this.elements.timerContainer.style.height = currentHeight === 300 ? '50px' : '300px';
            e.stopPropagation();
        });

        this.elements.timerContent.addEventListener('click', (e) => e.stopPropagation());
    }

    updateTimerDisplay(timeLeft) {
        if (!this.isEditing) {
            this.elements.minutesInput.value = String(Math.floor(timeLeft / 60)).padStart(2, '0');
            this.elements.secondsInput.value = String(timeLeft % 60).padStart(2, '0');
        }
        if (this.elements.timeLeftDisplay) {
            this.elements.timeLeftDisplay.textContent = formatTime(timeLeft);
        }
    }

    updateButtonStates(isRunning) {
        this.elements.startPauseButton.textContent = isRunning ? "Pause" : "Start";
        this.elements.resetButton.disabled = !isRunning && this.elements.timeLeftDisplay.textContent === formatTime(this.getCurrentDuration());
        this.elements.minutesInput.disabled = isRunning;
        this.elements.secondsInput.disabled = isRunning;
    }

    updateVersionDisplay(version) {
        if (this.elements.versionInfo) {
            this.elements.versionInfo.textContent = version;
        }
    }

    getCurrentDuration() {
        const minutes = parseInt(this.elements.minutesInput.value) || 0;
        const seconds = parseInt(this.elements.secondsInput.value) || 0;
        return minutes * 60 + seconds;
    }

    handleInputFocus(e) {
        e.target.select();
        this.isEditing = true;
    }

    handleInputBlur(e) {
        this.validateTimeInput(e.target);
        this.isEditing = false;
        this.updateTimerDisplay(this.getCurrentDuration());
    }

    handleInput(e) {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    }

    validateTimeInput(input) {
        let value = parseInt(input.value);
        const max = input.id === 'minutes' ? 99 : 59;
        if (isNaN(value) || value < 0) {
            value = 0;
        } else if (value > max) {
            value = max;
        }
        input.value = value.toString().padStart(2, '0');
    }

    async setAppBadge(count) {
        if ('setAppBadge' in navigator) {
            try {
                await navigator.setAppBadge(count);
            } catch (error) {
                console.error('Error setting app badge:', error);
            }
        }
    }
}

export default UIManager;
