const moodImages = document.querySelectorAll('.mood-options img');
const selectedMoodText = document.getElementById('selectedMood');

// Get today's date as key
const today = new Date().toLocaleDateString();

// Load mood from localStorage (if already set)
const savedMood = localStorage.getItem(`mood-${today}`);
if (savedMood) {
  selectedMoodText.textContent = savedMood;
}

// Handle mood selection
moodImages.forEach(img => {
  img.addEventListener('click', () => {
    const mood = img.getAttribute('data-mood');
    selectedMoodText.textContent = mood;
    localStorage.setItem(`mood-${today}`, mood);
  });
});

const reasonTextarea = document.getElementById('moodReason');
const saveReasonBtn = document.getElementById('saveReason');
const savedReasonText = document.getElementById('savedReason');

// Load saved reason if exists
const savedReason = localStorage.getItem(`reason-${today}`);
if (savedReason) {
  savedReasonText.textContent = savedReason;
  reasonTextarea.value = savedReason;
}

// Save reason button
saveReasonBtn.addEventListener('click', () => {
  const reason = reasonTextarea.value.trim();
  if (reason !== "") {
    localStorage.setItem(`reason-${today}`, reason);
    savedReasonText.textContent = reason;
  }
});