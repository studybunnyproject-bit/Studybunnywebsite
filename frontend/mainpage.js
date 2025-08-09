// removed duplicate/unused functions referencing non-existent assets

// Toggle Vertical Menu
function toggleMenu() {
  const menu = document.getElementById("verticalMenu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}
document.getElementById("menuBtn").addEventListener("click", toggleMenu);

// Toggle Login Popup
function toggleLogin() {
  const login = document.getElementById("loginPopup");
  login.style.display = login.style.display === "block" ? "none" : "block";
}
function closeLogin() {
  document.getElementById("loginPopup").style.display = "none";
}

// Fake login demo
function fakeLogin() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  const msg = document.getElementById("loginMessage");

  if (user === "demo" && pass === "demo") {
    msg.textContent = "Login successful!";
    msg.style.color = "green";
    setTimeout(closeLogin, 1500);
  } else {
    msg.textContent = "Invalid credentials!";
    msg.style.color = "red";
  }
}

// Customize Panel Toggle
function toggleOutfitPanel() {
  const panel = document.getElementById("outfitPanel");
  panel.style.display = panel.style.display === "block" ? "none" : "block";
}
function closeOutfitPanel() {
  document.getElementById("outfitPanel").style.display = "none";
}

// Show Outfit Category
function showCategory(catId) {
  const categories = document.querySelectorAll(".category-panel");
  categories.forEach(cat => cat.style.display = "none");
  document.getElementById(catId).style.display = "block";
}

// Selecting an outfit (demo)
function selectOutfit(filename) {
  alert("You chose " + filename);
}

// Skin color changer (demo – no SVG now)
function changeSkinColor(color) {
  alert("Skin color picked: " + color);
}


// Redirect to CC info page
function openCCPage() {
  window.location.href = "cc-info.html";
}

// Connect click event
document.addEventListener("DOMContentLoaded", () => {
  const ccIcon = document.getElementById("cc-icon");
  if (ccIcon) {
    ccIcon.addEventListener("click", openCCPage);
  }
});




// ------------------------
// Bunny Customization
// ------------------------
let selectedColor = "white"; // default color
let currentEmotion = "neutral"; // default emotion

function updateBunnyImage() {
  const bunnyImage = document.getElementById("bunny-img");
  if (bunnyImage) {
    bunnyImage.src = `bunny-body/${selectedColor}_${currentEmotion}.png`;
  }
}

function selectBunnyColor(color) {
  selectedColor = color;
  updateBunnyImage();
}

function setEmotion(emotion) {
  currentEmotion = emotion;
  updateBunnyImage();
}

// ------------------------
// Carrot Currency System
// ------------------------
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

function earnCC(amount) {
  cc += amount;
  saveCC();
  updateCCDisplay();
  updateEmotionBasedOnActivity(); // trigger emotion check
}

function spendCC(amount) {
  if (cc >= amount) {
    cc -= amount;
    saveCC();
    updateCCDisplay();
    updateEmotionBasedOnActivity(); // trigger emotion check
    return true;
  }
  return false;
}

// ------------------------
// Inactivity & Emotion System
// ------------------------
function updateEmotionBasedOnActivity() {
  const lastDate = localStorage.getItem("lastActiveDate");
  const today = new Date().toDateString();
  const current = new Date(today);
  let newEmotion = "neutral";

  if (lastDate) {
    const last = new Date(lastDate);
    const diffDays = Math.floor((current - last) / (1000 * 60 * 60 * 24));

    if (diffDays >= 7) {
      newEmotion = "sad";
    } else if (diffDays >= 3) {
      newEmotion = "bored";
    } else {
      newEmotion = "neutral";
    }
  }

  // Emotion boosts from CC progress
  if (cc >= 1.0) {
    newEmotion = "excited";
  } else if (cc >= 0.3) {
    newEmotion = "happy";
  }

  setEmotion(newEmotion);
}

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

// ------------------------
// Start Up
// ------------------------
window.addEventListener("load", () => {
  loadCC();
  checkInactivity();
});

//outfit change


function selectOutfit(filename) {
  const outfitPath = "bunny-outfits/" + filename;
  const style = document.createElement("style");
  style.textContent = `
    #bunny-wrapper::after {
      background-image: url('${outfitPath}');
    }
  `;
  document.head.appendChild(style);
}