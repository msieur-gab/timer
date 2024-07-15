import App from '/core/App.js';
import TimerManager from '/manager/TimerManager.js';
import UIManager from '/manager/UIManager.js';
import NotificationManager from '/manager/NotificationManager.js';
import WakeLockManager from '/manager/WakeLockManager.js';

const app = new App({
    timerManager: new TimerManager(),
    uiManager: new UIManager(),
    notificationManager: new NotificationManager(),
    wakeLockManager: new WakeLockManager()
});

window.addEventListener('load', () => {
    app.init();
});
