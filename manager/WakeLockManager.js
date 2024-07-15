import { debugLog } from '../utils/debug.js';

class WakeLockManager {
    constructor() {
        this.wakeLock = null;
    }

    async acquire() {
        if ('wakeLock' in navigator) {
            try {
                this.wakeLock = await navigator.wakeLock.request('screen');
                debugLog('Wake Lock is acquired');
                this.wakeLock.addEventListener('release', () => {
                    debugLog('Wake Lock was released');
                });
            } catch (err) {
                debugLog(`Error acquiring wake lock: ${err.name}, ${err.message}`);
            }
        } else {
            debugLog('Wake Lock API not supported');
        }
    }

    async release() {
        if (this.wakeLock) {
            try {
                await this.wakeLock.release();
                this.wakeLock = null;
                debugLog('Wake Lock released');
            } catch (err) {
                debugLog(`Error releasing wake lock: ${err.name}, ${err.message}`);
            }
        }
    }
}

export default WakeLockManager;
