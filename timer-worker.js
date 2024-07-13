let timerId;
let endTime;
let isPaused = false;

self.onmessage = function(e) {
    switch (e.data.command) {
        case 'start':
            endTime = e.data.endTime;
            startTimer();
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

function startTimer() {
    isPaused = false;
    runTimer();
}

function runTimer() {
    if (!isPaused) {
        const now = Date.now();
        const timeLeft = Math.max(0, Math.ceil((endTime - now) / 1000));
        
        self.postMessage({ timeLeft: timeLeft });

        if (timeLeft > 0) {
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

function resumeTimer() {
    isPaused = false;
    runTimer();
}

function resetTimer() {
    isPaused = true;
    clearTimeout(timerId);
    self.postMessage({ timeLeft: 0 });
}
