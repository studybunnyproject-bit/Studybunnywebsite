let cc = 0;
let tasksCompleted = 0;  // Track completed tasks in this session

// Load CC from localStorage
function loadCC() {
  cc = parseFloat(localStorage.getItem("cc")) || 0;
  updateCCDisplay();
}

// Save CC to localStorage
function saveCC() {
  localStorage.setItem("cc", cc.toFixed(2));
}

// Update CC amount in UI
function updateCCDisplay() {
  const ccDisplay = document.getElementById("cc-amount");
  if (ccDisplay) {
    ccDisplay.textContent = cc.toFixed(2);
  }
}

// Earn CC points and show alert
function earnCC(amount) {
  cc += amount;
  saveCC();
  updateCCDisplay();
  updateEmotionBasedOnActivity();
  showAlert(`You earned ${amount.toFixed(2)} CC!`);
}

// Deduct CC points if spending (returns true if success)
function spendCC(amount) {
  if (cc >= amount) {
    cc -= amount;
    saveCC();
    updateCCDisplay();
    updateEmotionBasedOnActivity();
    return true;
  }
  return false;
}

// Check inactivity and apply penalties
function checkInactivity() {
  const lastDate = localStorage.getItem("lastActiveDate");
  const today = new Date().toDateString();

  if (lastDate) {
    const last = new Date(lastDate);
    const current = new Date(today);
    const diffDays = Math.floor((current - last) / (1000 * 60 * 60 * 24));

    if (diffDays >= 7) {
      cc = Math.max(cc - 0.7, 0);
    } else if (diffDays >= 3) {
      cc = Math.max(cc - 0.3, 0);
    }
    saveCC();
    updateCCDisplay();
  }
  localStorage.setItem("lastActiveDate", today);
  updateEmotionBasedOnActivity();
}

// Update bunny emotion based on CC and inactivity
function updateEmotionBasedOnActivity() {
  const lastDate = localStorage.getItem("lastActiveDate");
  const today = new Date().toDateString();
  let newEmotion = "neutral";

  if (lastDate) {
    const last = new Date(lastDate);
    const current = new Date(today);
    const diffDays = Math.floor((current - last) / (1000 * 60 * 60 * 24));

    if (diffDays >= 7) {
      newEmotion = "sad";
    } else if (diffDays >= 3) {
      newEmotion = "bored";
    } else {
      newEmotion = "neutral";
    }
  }

  // Boost emotions by CC amount
  if (cc >= 1.0) {
    newEmotion = "excited";
  } else if (cc >= 0.3) {
    newEmotion = "happy";
  }

  setEmotion(newEmotion);
}

// Call this whenever a task is marked complete
function onTaskComplete() {
  tasksCompleted++;
  if (tasksCompleted % 10 === 0) { // Every 10 tasks completed
    earnCC(0.1);
  }
}

// Call once on page load to initialize
window.addEventListener("load", () => {
  loadCC();
  checkInactivity();
});