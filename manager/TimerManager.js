import EventEmitter from '../core/EventEmitter.js';
import { TIMER_EVENTS } from '../core/config.js';

class TimerManager extends EventEmitter {
    constructor() {
        super();
        this.worker = new Worker('../workers/timer-worker.js');
        this.isRunning = false;
        this.initialDuration = 0;
        this.setupWorkerListeners();
    }

    setupWorkerListeners() {
        this.worker.onmessage = (e) => {
            if (e.data.timeLeft !== undefined) {
                this.emit(TIMER_EVENTS.TIME_UPDATE, e.data.timeLeft);
            } else if (e.data.command === 'finished') {
                this.emit(TIMER_EVENTS.TIMER_FINISHED);
            }
        };
    }

    start(duration) {
        this.initialDuration = duration;
        this.worker.postMessage({ command: 'start', duration });
        this.isRunning = true;
        this.emit(TIMER_EVENTS.TIMER_START, this.isRunning);
    }

    pause() {
        this.worker.postMessage({ command: 'pause' });
        this.isRunning = false;
        this.emit(TIMER_EVENTS.TIMER_PAUSE, this.isRunning);
    }

    reset() {
        this.worker.postMessage({ command: 'reset', duration: this.initialDuration });
        this.isRunning = false;
        this.emit(TIMER_EVENTS.TIMER_RESET, this.initialDuration);
    }

    addTime(seconds) {
        this.worker.postMessage({ command: 'addTime', seconds });
        this.emit(TIMER_EVENTS.ADD_TIME, seconds);
    }
}

export default TimerManager;
