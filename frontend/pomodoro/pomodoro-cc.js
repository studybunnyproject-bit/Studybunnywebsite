// Load and save CC helpers
let cc = 0;

function loadCC() {
  cc = parseFloat(localStorage.getItem("cc")) || 0;
  updateCCDisplay();
}

function saveCC() {
  localStorage.setItem("cc", cc.toFixed(2));
}

function updateCCDisplay() {
  const ccDisplay = document.getElementById("cc-amount");
  if (ccDisplay) {
    ccDisplay.textContent = cc.toFixed(2);
  }
}

function earnCC(points) {
  cc += points / 100; // 1 point = 0.01 CC
  saveCC();
  updateCCDisplay();
}

// Inactivity check — optional here if you want to keep it centralized
function checkInactivity() {
  // Implement inactivity logic if needed
}

// Initialize CC display on page load
window.addEventListener("load", () => {
  loadCC();
  // checkInactivity(); // uncomment if implemented
});

// ---- POMODORO SPECIFIC ----

// Suppose you have a function called when a Pomodoro completes:
function onPomodoroComplete() {
  // Earn 10 points (0.1 CC) when pomodoro completes
  earnCC(10);
  alert("Pomodoro complete! You earned 0.1 CC 🥕");
}

// For example, bind this function to your timer completion event:
// document.getElementById('pomodoroCompleteBtn').addEventListener('click', onPomodoroComplete);