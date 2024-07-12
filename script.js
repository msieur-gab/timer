// DOM Elements
const startButton = document.getElementById("startButton");
const addTimeButton = document.getElementById("addTimeButton");
const stopButton = document.getElementById("stopButton");
const steepingStyleToggle = document.getElementById("steepingStyleToggle");
const steepingStyleLabel = document.getElementById("steepingStyleLabel");
const timerDisplay = document.getElementById("timerDisplay");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const teaList = document.getElementById("teaList");
const searchInput = document.getElementById("searchInput");

// State Variables
let remainingTime, initialDuration, timerRunning = false, timerEndTime;
let steepingStyle = "gongfu";
let wakeLock = null;
let notificationGranted = false;

// Helper Functions
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

// Memoized getSelectedTea function
let selectedTeaCache = null;
function getSelectedTea() {
  if (selectedTeaCache) {
    return selectedTeaCache;
  }

  const selectedTeaElement = teaList.querySelector(".selected");
  if (selectedTeaElement) {
    const categoryIndex = selectedTeaElement.dataset.categoryIndex;
    const teaIndex = selectedTeaElement.dataset.index;
    selectedTeaCache = teaCategories[categoryIndex].teas[teaIndex];
    return selectedTeaCache;
  }
  return null;
}

function updateDisplayedTime() {
  const selectedTea = getSelectedTea();
  if (selectedTea) {
    const selectedDuration = selectedTea.durations[steepingStyle];
    remainingTime = selectedDuration;
    initialDuration = selectedDuration;
    updateTimerDisplay();
  }
}

function drawCircle(progress) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = canvas.width / 2 - 10;
  const startAngle = -0.5 * Math.PI;
  const endAngle = 2 * Math.PI * progress - 0.5 * Math.PI;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = "#f3f3f3";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#3498db";
  ctx.stroke();
}

function acquireWakeLock() {
  if ("wakeLock" in navigator && !wakeLock) {
    navigator.wakeLock
      .request("screen")
      .then((wl) => (wakeLock = wl))
      .catch((err) => console.error("Error acquiring Wake Lock:", err));
  }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock
      .release()
      .then(() => (wakeLock = null))
      .catch((err) => console.error("Error releasing Wake Lock:", err));
  }
}

// Timer Functions
function startTimer() {
  if (timerRunning) {
    stopTimer();
  }

  const selectedTea = getSelectedTea();
  if (selectedTea) {
    const selectedDuration = selectedTea.durations[steepingStyle];
    initialDuration = selectedDuration;
    remainingTime = selectedDuration;
    timerEndTime = Date.now() + selectedDuration * 1000;
    timerRunning = true;
    acquireWakeLock();
    updateTimer();
    requestNotificationPermission();
  }
}

function addTime() {
  if (timerRunning) {
    timerEndTime += 10000;
    remainingTime += 10;
    initialDuration += 10;
  }
}

function stopTimer() {
  timerRunning = false;
  timerDisplay.textContent = formatTime(0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  releaseWakeLock();
  closeNotification();
}

function updateTimer() {
  if (!timerRunning) return;

  const now = Date.now();
  remainingTime = Math.max(0, (timerEndTime - now) / 1000);

  if (remainingTime === 0) {
    stopTimer(); // Call stopTimer directly to handle timer end logic
    playSound('ring');
    showNotification("Tea is ready!");
  } else if (remainingTime <= 10 && remainingTime > 9.9) {
    playSound('beep');
  }

  updateTimerDisplay();
  drawCircle((initialDuration - remainingTime) / initialDuration);

  requestAnimationFrame(updateTimer);
}

// Notification Functions
function requestNotificationPermission() {
  if (Notification.permission !== 'granted') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        notificationGranted = true;
      } else {
        notificationGranted = false;
      }
    });
  } else {
    notificationGranted = true;
  }
}

function showNotification(message) {
  if (notificationGranted) {
    new Notification(message, {
      body: 'Your tea is ready!',
      icon: 'tea-icon.png'
    });
  }
}

function closeNotification() {
  // Close any existing notifications
  if (window.Notification && Notification.close) {
    Notification.close();
  }
}

function playSound(soundName) {
  const sounds = {
    beep: new Audio('bells-1-72261.mp3'),
    ring: new Audio('bells-1-72261.mp3'),
  };
  sounds[soundName].play();
}

function updateTimerDisplay() {
  const minutes = Math.floor(remainingTime / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(remainingTime % 60)
    .toString()
    .padStart(2, "0");
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

// Menu Functions
function openMenu() {
  document.getElementById("offCanvasMenu").style.left = "0";
}

function closeMenu() {
  document.getElementById("offCanvasMenu").style.left = "-250px";
}

// Function to create the tea list
function createTeaList() {
  const teaCategories = [
    {
      category: "Green Tea",
      teas: [
        { name: "Sencha", durations: { gongfu: 30, western: 180 } },
        { name: "Matcha", durations: { gongfu: 20, western: 120 } },
      ],
    },
    {
      category: "Black Tea",
      teas: [
        { name: "Assam", durations: { gongfu: 40, western: 240 } },
        { name: "Darjeeling", durations: { gongfu: 30, western: 180 } },
      ],
    },
    {
      category: "Oolong Tea",
      teas: [
        { name: "Da Hong Pao", durations: { gongfu: 60, western: 300 } },
        { name: "Tie Guan Yin", durations: { gongfu: 50, western: 240 } },
      ],
    },
    {
      category: "Herbal Tea",
      teas: [
        { name: "Chamomile", durations: { gongfu: 360, western: 600 } },
        { name: "Peppermint", durations: { gongfu: 240, western: 480 } },
      ],
    },
  ];

  teaCategories.forEach((category, index) => {
    const categoryButton = document.createElement('button');
    categoryButton.classList.add('collapsible');
    categoryButton.textContent = category.category;
    categoryButton.addEventListener('click', toggleCategory);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('content');

    category.teas.forEach((tea, teaIndex) => {
      const teaItem = document.createElement('a');
      teaItem.textContent = tea.name;
      teaItem.classList.add('tea-item');
      teaItem.dataset.index = teaIndex;
      teaItem.dataset.categoryIndex = index;
      teaItem.href = "javascript:void(0)";
      teaItem.onclick = () => selectTea(index, teaIndex);
      contentDiv.appendChild(teaItem);
    });

    teaList.appendChild(categoryButton);
    teaList.appendChild(contentDiv);
  });
}

// Function to toggle category visibility
function toggleCategory() {
  this.classList.toggle('active');
  const content = this.nextElementSibling;
  if (content.style.display === "block") {
    content.style.display = "none";
  } else {
    content.style.display = "block";
  }
}

// Function to select a tea from the list
function selectTea(categoryIndex, teaIndex) {
  const previouslySelected = teaList.querySelector('.selected');
  if (previouslySelected) {
    previouslySelected.classList.remove('selected');
  }
  const selectedTea = teaList.querySelector(`[data-category-index="${categoryIndex}"][data-index="${teaIndex}"]`);
  selectedTea.classList.add('selected');
  closeMenu();
  stopTimer(); // Stop the timer when a new tea is selected
  updateDisplayedTime();
  selectedTeaCache = null; // Clear the memoized selectedTea

  // Update the timer with the new tea's steeping duration
  const selectedTeaObj = getSelectedTea();
  if (selectedTeaObj) {
    const selectedDuration = selectedTeaObj.durations[steepingStyle];
    remainingTime = selectedDuration;
    initialDuration = selectedDuration;
    updateTimerDisplay();
  } else {
    timerDisplay.textContent = formatTime(0);
  }
}

// Function to filter the tea list based on search input
let filterTimeoutId = null;
function filterTeaList() {
  if (filterTimeoutId !== null) {
    clearTimeout(filterTimeoutId);
  }

  filterTimeoutId = setTimeout(() => {
    const filter = searchInput.value.toLowerCase();
    const categoryButtons = teaList.querySelectorAll('.collapsible');
    const teaItems = teaList.querySelectorAll('.tea-item');

    categoryButtons.forEach(button => button.style.display = 'none');
    teaItems.forEach(item => {
      const text = item.textContent.toLowerCase();
      if (text.includes(filter)) {
        item.style.display = "";
        const content = item.parentElement;
        const categoryButton = content.previousElementSibling;
        categoryButton.style.display = "";
        content.style.display = "block";
      } else {
        item.style.display = "none";
      }
    });

    filterTimeoutId = null;
  }, 300);
}

// Event Listeners
function attachEventListeners() {
  document
    .getElementById("menuButton")
    .addEventListener("click", openMenu);
  startButton.addEventListener("click", startTimer);
  addTimeButton.addEventListener("click", addTime);
  stopButton.addEventListener("click", stopTimer);
  steepingStyleToggle.addEventListener("change", () => {
    steepingStyle = steepingStyleToggle.checked ? "western" : "gongfu";
    steepingStyleLabel.textContent = steepingStyleToggle.checked
      ? "Western"
      : "Gong Fu";
    if (timerRunning) {
      stopTimer();
    }
    updateDisplayedTime();
  });
  searchInput.addEventListener("input", filterTeaList);

  // Clean up event listeners on component unmount or page unload
  window.addEventListener("beforeunload", () => {
    document
      .getElementById("menuButton")
      .removeEventListener("click", openMenu);
    startButton.removeEventListener("click", startTimer);
    addTimeButton.removeEventListener("click", addTime);
    stopButton.removeEventListener("click", stopTimer);
    steepingStyleToggle.removeEventListener("change", () => {
      steepingStyle = steepingStyleToggle.checked ? "western" : "gongfu";
      steepingStyleLabel.textContent = steepingStyleToggle.checked
        ? "Western"
        : "Gong Fu";
    });
    searchInput.removeEventListener("input", filterTeaList);
    document.addEventListener('visibilitychange', handleVisibilityChange);
  });
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    // Resume the timer and sound
    if (timerRunning) {
      acquireWakeLock();
      updateTimer();
    }
  } else {
    // Pause the timer and sound
    if (timerRunning) {
      releaseWakeLock();
      updateTimer();
    }
  }
}

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  createTeaList();
  attachEventListeners();

  // Make the canvas responsive
  function resizeCanvas() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
});
