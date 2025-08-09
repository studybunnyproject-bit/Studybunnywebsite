let totalMl = 0;
let cupSize = 0;

const cupSizeInput = document.getElementById('cupSize');
const progressText = document.getElementById('progress-text');
const cupDisplay = document.getElementById('cup-display');

cupSizeInput.addEventListener('change', () => {
  cupSize = parseInt(cupSizeInput.value) || 0;
});

function addCup() {
  if (!cupSize) {
    alert("Please enter your cup size first!");
    return;
  }

  totalMl += cupSize;
  updateProgress();
  showCup();
}

function resetTracker() {
  totalMl = 0;
  cupDisplay.innerHTML = '';
  updateProgress();
}

function updateProgress() {
  progressText.textContent = `Total: ${totalMl} ml`;
}

function showCup() {
  const cup = document.createElement('div');
  cup.classList.add('cup-icon');
  cupDisplay.appendChild(cup);
}