// Global variables for the DOM elements and state
let teaSelect, startButton, addTimeButton, stopButton, steepingStyleToggle, steepingStyleLabel, timerDisplay, canvas, ctx;
let remainingTime, initialDuration, timerRunning = false, timerEndTime;
let steepingStyle = "gongfu"; // Default to Gong Fu style
let wakeLock = null;

// Tea data directly in JS
const teas = [
  { name: "Green Tea", durations: { gongfu: 30, western: 180 } },
  { name: "Black Tea", durations: { gongfu: 40, western: 240 } },
  { name: "Oolong Tea", durations: { gongfu: 60, western: 300 } },
  { name: "Herbal Tea", durations: { gongfu: 360, western: 600 } }
];

// Sound data directly in JS
const sounds = {
  beep: new Audio('bells-1-72261.mp3'),
  ring: new Audio('bell-meditation-75335.mp3')
};

// Function to update the displayed timer value
function updateDisplayedTime() {
  const selectedTea = teas[teaSelect.value];
  const selectedDuration = selectedTea.durations[steepingStyle];
  remainingTime = selectedDuration;
  initialDuration = selectedDuration;
  updateTimerDisplay();
}

// Function to start the timer
function startTimer() {
  if (timerRunning) {
    stopTimer();
  }

  const selectedTea = teas[teaSelect.value];
  const selectedDuration = selectedTea.durations[steepingStyle];
  
  initialDuration = selectedDuration;
  remainingTime = selectedDuration;
  timerEndTime = Date.now() + selectedDuration * 1000;
  timerRunning = true;
  updateTimer();
  requestWakeLock();
}

// Function to add 10 seconds to the timer
function addTime() {
  if (timerRunning) {
    timerEndTime += 10000;
    remainingTime += 10;
    initialDuration += 10;
  }
}

// Function to stop and clear the timer
function stopTimer() {
  timerRunning = false;
  timerDisplay.textContent = "00:00";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  releaseWakeLock();
}

// Function to update the timer display
function updateTimerDisplay() {
  const minutes = Math.floor(remainingTime / 60).toString().padStart(2, '0');
  const seconds = Math.floor(remainingTime % 60).toString().padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

// Function to draw the circular timer
function drawCircle(progress) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = canvas.width / 2 - 10;
  const startAngle = -0.5 * Math.PI;
  const endAngle = (2 * Math.PI * progress) - 0.5 * Math.PI;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the background circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = '#f3f3f3';
  ctx.fill();

  // Draw the progress arc with rounded edges
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);
  ctx.lineWidth = 10;
  ctx.lineCap = 'round'; // Set line cap to round for rounded edges
  ctx.strokeStyle = '#3498db';
  ctx.stroke();
}

// Function to update the timer
function updateTimer() {
  if (!timerRunning) return;

  const now = Date.now();
  remainingTime = Math.max(0, (timerEndTime - now) / 1000);

  if (remainingTime === 0) {
    timerRunning = false;
    sounds.ring.play();
    showNotification("Tea Timer", "Your tea is ready!");
    releaseWakeLock();
  } else if (remainingTime <= 10 && remainingTime > 9.9) {
    sounds.beep.play();
  }

  updateTimerDisplay();
  drawCircle((initialDuration - remainingTime) / initialDuration);

  requestAnimationFrame(updateTimer);
}

// Event Listeners
function attachEventListeners() {
  teaSelect.addEventListener('change', () => {
    if (timerRunning) {
      stopTimer();
    }
    updateDisplayedTime();
  });

  steepingStyleToggle.addEventListener('change', () => {
    steepingStyle = steepingStyleToggle.checked ? "western" : "gongfu";
    steepingStyleLabel.textContent = steepingStyleToggle.checked ? "Western" : "Gong Fu";
    if (timerRunning) {
      stopTimer();
    }
    updateDisplayedTime();
  });

  startButton.addEventListener('click', startTimer);
  addTimeButton.addEventListener('click', addTime);
  stopButton.addEventListener('click', stopTimer);
}

// Initialize
function initialize() {
  teaSelect = document.getElementById('teaSelect');
  startButton = document.getElementById('startButton');
  addTimeButton = document.getElementById('addTimeButton');
  stopButton = document.getElementById('stopButton');
  steepingStyleToggle = document.getElementById('steepingStyleToggle');
  steepingStyleLabel = document.getElementById('steepingStyleLabel');
  timerDisplay = document.getElementById('timerDisplay');
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  // Populate the select dropdown with tea data
  teas.forEach((tea, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = tea.name;
    teaSelect.appendChild(option);
  });

  updateDisplayedTime();
  attachEventListeners();

  // Request notification permission
  if ("Notification" in window) {
    Notification.requestPermission();
  }
}

// Execute initialization when DOM is fully loaded
document.addEventListener("DOMContentLoaded", initialize);

// Screen Wake Lock functions
async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake Lock is active');
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  }
}

function releaseWakeLock() {
  if (wakeLock != null) {
    wakeLock.release()
      .then(() => {
        wakeLock = null;
        console.log('Wake Lock is released');
      });
  }
}

// Page Visibility API
document.addEventListener("visibilitychange", function() {
  if (document.hidden && timerRunning) {
    showNotification("Tea Timer", "Your tea timer is still running!");
  }
});

// Notification function
function showNotification(title, body) {
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(title, { body: body });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(function (permission) {
        if (permission === "granted") {
          new Notification(title, { body: body });
        }
      });
    }
  }
}
