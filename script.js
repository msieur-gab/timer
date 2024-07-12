// Global variables for the DOM elements and state
let startButton, addTimeButton, stopButton, steepingStyleToggle, steepingStyleLabel, timerDisplay, canvas, ctx, teaList, searchInput;
let remainingTime, initialDuration, timerRunning = false, timerEndTime;
let steepingStyle = "gongfu"; // Default to Gong Fu style
// Keep Screen Awake
let wakeLock = null;

// Tea data directly in JS
const teaCategories = [
  {
    category: "Green Tea",
    teas: [
      { name: "Sencha", durations: { gongfu: 30, western: 180 } },
      { name: "Matcha", durations: { gongfu: 20, western: 120 } }
    ]
  },
  {
    category: "Black Tea",
    teas: [
      { name: "Assam", durations: { gongfu: 40, western: 240 } },
      { name: "Darjeeling", durations: { gongfu: 30, western: 180 } }
    ]
  },
  {
    category: "Oolong Tea",
    teas: [
      { name: "Da Hong Pao", durations: { gongfu: 60, western: 300 } },
      { name: "Tie Guan Yin", durations: { gongfu: 50, western: 240 } }
    ]
  },
  {
    category: "Herbal Tea",
    teas: [
      { name: "Chamomile", durations: { gongfu: 360, western: 600 } },
      { name: "Peppermint", durations: { gongfu: 240, western: 480 } }
    ]
  }
];

// Sound data directly in JS
const sounds = {
  beep: new Audio('https://assets.codepen.io/1243614/bells-1-72261.mp3'),
  ring: new Audio('https://assets.codepen.io/1243614/bell-meditation-75335.mp3'),
  dummy: new Audio('https://assets.codepen.io/1243614/birds-chirping-75156.mp3') // Dummy audio for keeping the screen awake
};

// Function to update the displayed timer value
function updateDisplayedTime() {
  const selectedTea = getSelectedTea();
  if (selectedTea) {
    const selectedDuration = selectedTea.durations[steepingStyle];
    remainingTime = selectedDuration;
    initialDuration = selectedDuration;
    updateTimerDisplay();
  }
}

// Function to start the timer
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
    sounds.dummy.loop = true;
    sounds.dummy.play();
    updateTimer();
// Acquire Wake Lock
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen')
        .then(wl => {
          wakeLock = wl;
          console.log('Wake Lock acquired:', wakeLock);
        })
        .catch(err => console.error('Error acquiring Wake Lock:', err));
    }
  }
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
  sounds.dummy.pause();
  sounds.dummy.currentTime = 0;
// Release Wake Lock after 5 seconds
  if (wakeLock) {
    setTimeout(() => {
      wakeLock.release();
      wakeLock = null; // Reset the variable
      console.log('Wake Lock released');
    }, 5000); // 5000 milliseconds = 5 seconds
  }
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
    sounds.dummy.pause();
    sounds.dummy.currentTime = 0;
  } else if (remainingTime <= 10 && remainingTime > 9.9) {
    sounds.beep.play();
  }

  updateTimerDisplay();
  drawCircle((initialDuration - remainingTime) / initialDuration);

  requestAnimationFrame(updateTimer);
}

// Function to open the menu
function openMenu() {
  document.getElementById("offCanvasMenu").style.left = "0";
}

// Function to close the menu
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
  document.getElementById('menuButton').addEventListener('click', openMenu);
  startButton.addEventListener('click', startTimer);
  addTimeButton.addEventListener('click', addTime);
  stopButton.addEventListener('click', stopTimer);
  steepingStyleToggle.addEventListener('change', () => {
    steepingStyle = steepingStyleToggle.checked ? "western" : "gongfu";
    steepingStyleLabel.textContent = steepingStyleToggle.checked ? "Western" : "Gong Fu";
    if (timerRunning) {
      stopTimer();
    }
    updateDisplayedTime();
  });
  searchInput.addEventListener('input', filterTeaList);
}

// Initialize
function initialize() {
  startButton = document.getElementById('startButton');
  addTimeButton = document.getElementById('addTimeButton');
  stopButton = document.getElementById('stopButton');
  steepingStyleToggle = document.getElementById('steepingStyleToggle');
  steepingStyleLabel = document.getElementById('steepingStyleLabel');
  timerDisplay = document.getElementById('timerDisplay');
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  teaList = document.getElementById('teaList');
  searchInput = document.getElementById('searchInput');

  createTeaList();
  attachEventListeners();
}

// Execute initialization when DOM is fully loaded
document.addEventListener("DOMContentLoaded", initialize);
