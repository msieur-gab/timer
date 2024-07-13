let timerId;
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
    isPaused = false;
    runTimer();
}

function runTimer() {
    if (!isPaused) {
        self.postMessage({ timeLeft: timeLeft });
        if (timeLeft > 0) {
            timeLeft--;
            timerId = setTimeout(runTimer, 1000);
        } else {
            self.postMessage({ command: 'finished' });
        }
    }
}

function pauseTimer() {
    isPaused = true;
    clearTimeout(timerId);
}

function resetTimer(duration) {
    clearTimeout(timerId);
    timeLeft = duration;
    isPaused = true;
    self.postMessage({ timeLeft: timeLeft });
}

function addTime(seconds) {
    timeLeft += seconds;
    self.postMessage({ timeLeft: timeLeft });
}

function stopTimer() {
    clearTimeout(timerId);
    isPaused = true;
}
