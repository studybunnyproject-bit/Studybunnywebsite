document.addEventListener("DOMContentLoaded", () => {
  // --- Timer Logic ---
  const timerDisplay = document.getElementById('timer-display');
  const timeContainer = document.getElementById('time-container');
  const startBtn = document.getElementById('stb');
  const stopBtn = document.getElementById('spb');
  const resetBtn = document.getElementById('rtb');
  const upgradeMessage = document.getElementById('upgrade-message');

  let timeInSeconds = 25 * 60;
  let timerInterval;
  let isRunning = false;
  let freeSessionsUsed = 0;
  let isSubscribed = false;

  function updateDisplay() {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function startTimer() {
    if (!isRunning) {
      isRunning = true;
      timerInterval = setInterval(() => {
        if (timeInSeconds > 0) {
          timeInSeconds--;
          updateDisplay();
        } else {
          clearInterval(timerInterval);
          isRunning = false;
          freeSessionsUsed++;
          checkFreeUse();
        }
      }, 1000);
    }
  }

  function stopTimer() {
    if (isRunning) {
      clearInterval(timerInterval);
      isRunning = false;
    }
  }

  function resetTimer() {
    stopTimer();
    timeInSeconds = 25 * 60;
    updateDisplay();
  }

  timeContainer.addEventListener('click', () => {
    if (!isSubscribed) {
      window.location.href = '../upgrade-page/upgrade.html';
    } else {
      showCustomAlert("You can now customize your timer!");
    }
  });

  startBtn.addEventListener('click', startTimer);
  stopBtn.addEventListener('click', stopTimer);
  resetBtn.addEventListener('click', resetTimer);
  updateDisplay();

  // --- Upgrade Pop-up Logic ---
  function checkFreeUse() {
    if (freeSessionsUsed >= 1) {
      startBtn.style.display = 'none';
      stopBtn.style.display = 'none';
      resetBtn.style.display = 'none';
      upgradeMessage.style.display = 'block';
    } else {
      showCustomAlert("Pomodoro session complete! Take a break.");
      resetTimer();
    }
  }

  // --- Music Player Logic ---
  const audioPlayer = document.getElementById('audio-player');
  const soundButtons = document.querySelectorAll('.sound-button');
  const playlistModal = document.getElementById('playlist-modal');
  const showSoundsBtn = document.getElementById('show-sounds-btn');
  const closePlaylistBtn = document.getElementById('close-playlist');

  const soundLibrary = {
    rain: 'sounds/rain.mp3',
    cafe: 'sounds/cafe.mp3',
    forest: 'sounds/forest.mp3',
    waves: 'sounds/waves.mp3',
    stream: 'sounds/stream.mp3'
  };

  showSoundsBtn.addEventListener('click', () => {
    playlistModal.style.display = 'block';
  });

  closePlaylistBtn.addEventListener('click', () => {
    playlistModal.style.display = 'none';
  });

  soundButtons.forEach(button => {
    button.addEventListener('click', () => {
      const soundName = button.getAttribute('data-sound');
      const isLocked = button.classList.contains('locked-sound');

      if (isLocked && !isSubscribed) {
        showCustomAlert("🔒 This sound is only available to subscribers.<br><a href='../upgrade-page/upgrade.html' style='color: rgb(252, 119, 210); text-decoration: underline;'>Upgrade here</a>");
        return;
      }

      audioPlayer.pause();
      audioPlayer.currentTime = 0;
      audioPlayer.src = soundLibrary[soundName];
      audioPlayer.play().catch(error => {
        console.error(`Error playing sound: ${soundName}`, error);
        alert(`Error playing "${soundName}". Please check the file path.`);
      });
    });
  });

  // --- Custom Alert ---
  function showCustomAlert(message) {
    const alertBox = document.getElementById('custom-alert');
    const overlay = document.getElementById('custom-alert-overlay');
    document.getElementById('custom-alert-text').innerHTML = message;
    alertBox.style.display = 'block';
    overlay.style.display = 'block';
  }

  window.closeCustomAlert = function () {
    document.getElementById('custom-alert').style.display = 'none';
    document.getElementById('custom-alert-overlay').style.display = 'none';
  };
});