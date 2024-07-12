const timer1 = document.getElementById('timer1');
const timer2 = document.getElementById('timer2');
const timer3 = document.getElementById('timer3');
const status = document.getElementById('status');

// Request notification permission
function requestNotificationPermission() {
    return new Promise((resolve, reject) => {
        if (!('Notification' in window)) {
            reject('This browser does not support notifications.');
        } else {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notification permission granted.');
                    resolve(true);
                } else {
                    console.log('Notification permission denied.');
                    resolve(false);
                }
            });
        }
    });
}

// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
            return requestNotificationPermission();
        })
        .then(permissionGranted => {
            if (permissionGranted) {
                console.log('Notification permission granted.');
            } else {
                console.log('Notification permission denied.');
            }
        })
        .catch(error => {
            console.log('Error during setup:', error);
        });
}

// Function to start a timer
function startTimer(minutes) {
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            action: 'startTimer',
            duration: minutes * 60 // Convert to seconds
        });
        status.textContent = `${minutes} minute timer started`;
    } else {
        status.textContent = 'Service Worker not yet active. Please try again.';
    }
}

// Event listeners for buttons
timer1.addEventListener('click', () => startTimer(1));
timer2.addEventListener('click', () => startTimer(2));
timer3.addEventListener('click', () => startTimer(3));

// Listen for messages from the service worker
navigator.serviceWorker.addEventListener('message', event => {
    if (event.data.action === 'timerComplete') {
        status.textContent = 'Timer completed!';
        // You could play a sound here if desired
    }
});
