let intervalId;
let targetTime;
let timeLeft;
let isPaused = false;

self.onmessage = function(e) {
    switch (e.data.command) {
        case 'start':
            startTimer(e.data.duration);
            break;
        case 'pause':
            pauseTimer();
            break;
        case 'reset':
            resetTimer(e.data.duration);
            break;
        case 'addTime':
            addTime(e.data.seconds);
            break;
        case 'stop':
            stopTimer();
            break;
    }
};

function startTimer(duration) {
    timeLeft = duration;
    targetTime = Date.now() + duration * 1000;
    isPaused = false;
    runTimer();
}

function runTimer() {
    clearInterval(intervalId);
    intervalId = setInterval(() => {
        if (!isPaused) {
            const now = Date.now();
            timeLeft = Math.max(0, Math.round((targetTime - now) / 1000));
            self.postMessage({ timeLeft: timeLeft });

            if (timeLeft <= 0) {
                clearInterval(intervalId);
                self.postMessage({ command: 'finished' });
            }
        }
    }, 1000);
}

function pauseTimer() {
    isPaused = true;
    clearInterval(intervalId);
}

function resetTimer(duration) {
    clearInterval(intervalId);
    timeLeft = duration;
    targetTime = Date.now() + duration * 1000;
    isPaused = true;
    self.postMessage({ timeLeft: timeLeft });
}

function addTime(seconds) {
    timeLeft += seconds;
    targetTime += seconds * 1000;
    self.postMessage({ timeLeft: timeLeft });
}

function stopTimer() {
    clearInterval(intervalId);
    isPaused = true;
}
