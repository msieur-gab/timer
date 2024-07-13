let timer;

self.onmessage = function(e) {
    if (e.data.command === 'start') {
        startTimer(e.data.duration);
    } else if (e.data.command === 'stop') {
        stopTimer();
    }
};

function startTimer(duration) {
    let timeLeft = duration;
    timer = setInterval(() => {
        timeLeft--;
        self.postMessage({ timeLeft: timeLeft });
        if (timeLeft <= 0) {
            clearInterval(timer);
            self.postMessage({ command: 'finished' });
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timer);
}
