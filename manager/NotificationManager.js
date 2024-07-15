import { debugLog } from '../utils/debug.js';

class NotificationManager {
    constructor() {
        this.hasPermission = false;
    }

    async init() {
        this.hasPermission = await this.checkPermission();
    }

    async checkPermission() {
        if (!('Notification' in window)) {
            debugLog('This browser does not support notifications');
            return false;
        }
        if (Notification.permission === 'granted') {
            return true;
        }
        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }

    async showNotification(title, options) {
        if (!this.hasPermission) {
            debugLog('Notification permission not granted');
            return;
        }

        try {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SHOW_NOTIFICATION',
                    title,
                    options
                });
            } else {
                new Notification(title, options);
            }
        } catch (err) {
            debugLog('Error showing notification:', err);
        }
    }

    async scheduleNotification() {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            const registration = await navigator.serviceWorker.ready;
            try {
                await registration.sync.register('notify-sync');
                debugLog('Background sync registered');
            } catch (err) {
                debugLog('Error registering background sync:', err);
            }
        }
    }
}

export default NotificationManager;
