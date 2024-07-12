// Tea and Sound Data (Constants)
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

// Sound data directly in JS
const sounds = {
  beep: new Audio('bells-1-72261.mp3'),
  ring: new Audio('bells-1-72261.mp3'),

};

const defaultSteepingStyle = "gongfu";

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
let steepingStyle = defaultSteepingStyle;
let wakeLock = null;

// Helper Functions
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function getSelectedTea() {
  const selectedTeaElement = teaList.querySelector(".selected");
  if (selectedTeaElement) {
    const categoryIndex = selectedTeaElement.dataset.categoryIndex;
    const teaIndex = selectedTeaElement.dataset.index;
    return teaCategories[categoryIndex].teas[teaIndex];
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



function updateTimer() {
  if (!timerRunning) return;

  const now = Date.now();
  remainingTime = Math.max(0, (timerEndTime - now) / 1000);

  if (remainingTime === 0) {
    stopTimer(); // Call stopTimer directly to handle timer end logic
    sounds.ring.play();
  } else if (remainingTime <= 10 && remainingTime > 9.9) {
    sounds.beep.play();
  }

  updateTimerDisplay();
  drawCircle((initialDuration - remainingTime) / initialDuration);

  requestAnimationFrame(updateTimer);
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
  teaCategories.forEach((category, index) => {
    const categoryButton = document.createElement('button');
    categoryButton.classList.add('collapsible');
    categoryButton.textContent = category.category;
    categoryButton.addEventListener('click', function() {
      this.classList.toggle('active');
      const content = this.nextElementSibling;
      if (content.style.display === "block") {
        content.style.display = "none";
      } else {
        content.style.display = "block";
      }
    });

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
}

// Function to get the selected tea
function getSelectedTea() {
  const selectedTeaElement = teaList.querySelector('.selected');
  if (selectedTeaElement) {
    const categoryIndex = selectedTeaElement.dataset.categoryIndex;
    const teaIndex = selectedTeaElement.dataset.index;
    return teaCategories[categoryIndex].teas[teaIndex];
  }
  return null;
}

// Function to filter the tea list based on search input
function filterTeaList() {
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
}

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  createTeaList();
  attachEventListeners();
});
