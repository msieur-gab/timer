let timer;
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
        case 'resume':
            resumeTimer();
            break;
        case 'reset':
            resetTimer();
            break;
    }
};

function startTimer(duration) {
    timeLeft = duration;
    isPaused = false;
    runTimer();
}

function runTimer() {
    timer = setInterval(() => {
        if (!isPaused) {
            timeLeft--;
            self.postMessage({ timeLeft: timeLeft });
            if (timeLeft <= 0) {
                clearInterval(timer);
                self.postMessage({ command: 'finished' });
            }
        }
    }, 1000);
}

function pauseTimer() {
    isPaused = true;
}

function resumeTimer() {
    isPaused = false;
}

function resetTimer() {
    clearInterval(timer);
    timeLeft = 0;
    isPaused = false;
    self.postMessage({ timeLeft: timeLeft });
}
