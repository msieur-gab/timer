import { DEBUG } from '../core/config.js';

export function debugLog(...args) {
    if (DEBUG) {
        console.log(...args);
        const logElement = document.getElementById('debug-log');
        if (logElement) {
            logElement.style.display = 'block';
            logElement.innerHTML += args.join(' ') + '<br>';
        }
    }
}
