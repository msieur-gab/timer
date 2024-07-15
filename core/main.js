import App from './core/App.js';
import TimerManager from './managers/TimerManager.js';
import UIManager from './managers/UIManager.js';
import NotificationManager from './managers/NotificationManager.js';
import WakeLockManager from './managers/WakeLockManager.js';

const app = new App({
    timerManager: new TimerManager(),
    uiManager: new UIManager(),
    notificationManager: new NotificationManager(),
    wakeLockManager: new WakeLockManager()
});

window.addEventListener('load', () => {
    app.init();
});
