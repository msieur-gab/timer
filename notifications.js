class NotificationManager {
    constructor() {
        this.hasPermission = false;
    }

    async init() {
        this.hasPermission = await this.checkPermission();
    }

    async checkPermission() {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
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
            console.log('Notification permission not granted');
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
            console.error('Error showing notification:', err);
        }
    }
}

const notificationManager = new NotificationManager();
export default notificationManager;
