/**
 * Study Bunny Pomodoro Timer
 * Modern ES6+ implementation with progress visualization and statistics
 */

// Configuration
const CONFIG = {
  storageKey: 'studyBunnyPomodoro',
  defaultSettings: {
    focusTime: 25,
    shortBreak: 5,
    longBreak: 15,
    autoStart: false,
    notifications: true,
    volume: 50,
    currentSound: 'none'
  },
  sounds: {
    none: null,
    rain: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
    cafe: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
    forest: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
    waves: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
    fireplace: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
  }
};

// State
const state = {
  timeLeft: 25 * 60,
  totalTime: 25 * 60,
  isRunning: false,
  currentMode: 'focus', // 'focus', 'shortBreak', 'longBreak'
  currentSession: 1,
  completedSessions: 0,
  settings: { ...CONFIG.defaultSettings },
  stats: {
    todaySessions: 0,
    weekSessions: 0,
    totalSessions: 0,
    currentStreak: 0,
    recentSessions: []
  }
};

// Utilities
const Utils = {
  $: (selector) => document.querySelector(selector),
  $$: (selector) => document.querySelectorAll(selector),
  
  formatTime: (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },
  
  formatDate: (date) => new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }),
  
  getDateKey: (date = new Date()) => date.toISOString().split('T')[0],
  
  showNotification: (message, type = 'success') => {
    const container = Utils.$('#notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    container.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
    
    // Browser notification
    if (state.settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Study Bunny Pomodoro', { body: message, icon: '../cc.png' });
    }
  },
  
  requestNotificationPermission: () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
};

// Storage Management
const Storage = {
  getData: () => {
    try {
      const data = JSON.parse(localStorage.getItem(CONFIG.storageKey)) || {};
      return {
        settings: { ...CONFIG.defaultSettings, ...data.settings },
        stats: {
          todaySessions: 0,
          weekSessions: 0,
          totalSessions: 0,
          currentStreak: 0,
          recentSessions: [],
          ...data.stats
        }
      };
    } catch (error) {
      console.error('Error loading data:', error);
      return { settings: CONFIG.defaultSettings, stats: state.stats };
    }
  },
  
  saveData: () => {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify({
        settings: state.settings,
        stats: state.stats
      }));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }
};

// Timer Management
const TimerManager = {
  interval: null,
  
  start: () => {
    if (state.isRunning) return;
    
    state.isRunning = true;
    document.body.classList.add('timer-running');
    
    TimerManager.interval = setInterval(() => {
      if (state.timeLeft > 0) {
        state.timeLeft--;
        TimerManager.updateDisplay();
        TimerManager.updateProgress();
      } else {
        TimerManager.complete();
      }
    }, 1000);
    
    TimerManager.updateButtons();
    Utils.showNotification('Timer started! Focus time! 🎯', 'success');
  },
  
  pause: () => {
    if (!state.isRunning) return;
    
    state.isRunning = false;
    document.body.classList.remove('timer-running');
    clearInterval(TimerManager.interval);
    
    TimerManager.updateButtons();
    Utils.showNotification('Timer paused', 'warning');
  },
  
  reset: () => {
    TimerManager.pause();
    TimerManager.setMode(state.currentMode, true);
    Utils.showNotification('Timer reset', 'info');
  },
  
  complete: () => {
    TimerManager.pause();
    
    // Update stats
    if (state.currentMode === 'focus') {
      state.completedSessions++;
      StatsManager.addSession();
      
      // Track CC: 10 minutes = 0.1 CC  
      const minutesCompleted = state.settings.focusTime;
      if (window.StudyBunnyCC) {
        window.StudyBunnyCC.trackPomodoroMinutes(minutesCompleted);
      }
      
      console.log(`🍅 Pomodoro completed: +${minutesCompleted} minutes`);
    }
    
    // Determine next mode
    let nextMode;
    if (state.currentMode === 'focus') {
      nextMode = (state.completedSessions % 4 === 0) ? 'longBreak' : 'shortBreak';
    } else {
      nextMode = 'focus';
      if (state.currentMode === 'shortBreak' || state.currentMode === 'longBreak') {
        state.currentSession++;
      }
    }
    
    // Show completion message
    const messages = {
      focus: 'Focus session complete! Time for a break! 🎉',
      shortBreak: 'Break over! Ready for another focus session? 💪',
      longBreak: 'Long break complete! Feeling refreshed? ✨'
    };
    Utils.showNotification(messages[state.currentMode], 'success');
    
    // Switch to next mode
    TimerManager.setMode(nextMode);
    
    // Auto-start if enabled
    if (state.settings.autoStart) {
      setTimeout(() => TimerManager.start(), 2000);
    }
  },
  
  setMode: (mode, force = false) => {
    if (state.isRunning && !force) return;
    
    state.currentMode = mode;
    
    const timeMap = {
      focus: state.settings.focusTime * 60,
      shortBreak: state.settings.shortBreak * 60,
      longBreak: state.settings.longBreak * 60
    };
    
    state.timeLeft = timeMap[mode];
    state.totalTime = timeMap[mode];
    
    TimerManager.updateDisplay();
    TimerManager.updateProgress();
    TimerManager.updateModeDisplay();
    
    // Update body class for styling
    document.body.className = document.body.className.replace(/timer-\w+/g, '');
    if (mode !== 'focus') {
      document.body.classList.add(`timer-${mode.replace('Break', '-break')}`);
    }
  },
  
  updateDisplay: () => {
    Utils.$('#timerDisplay').textContent = Utils.formatTime(state.timeLeft);
  },
  
  updateProgress: () => {
    const progress = 1 - (state.timeLeft / state.totalTime);
    const circle = Utils.$('#progressCircle');
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress * circumference);
    
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = offset;
  },
  
  updateModeDisplay: () => {
    const modeMap = {
      focus: 'Focus Time',
      shortBreak: 'Short Break',
      longBreak: 'Long Break'
    };
    
    Utils.$('#timerMode').textContent = modeMap[state.currentMode];
    Utils.$('#sessionCount').textContent = `Session ${state.currentSession}`;
  },
  
  updateButtons: () => {
    const startBtn = Utils.$('#startBtn');
    const pauseBtn = Utils.$('#pauseBtn');
    
    startBtn.disabled = state.isRunning;
    pauseBtn.disabled = !state.isRunning;
  }
};

// Settings Management
const SettingsManager = {
  init: () => {
    // Load settings into UI
    Utils.$('#focusTime').value = state.settings.focusTime;
    Utils.$('#shortBreak').value = state.settings.shortBreak;
    Utils.$('#longBreak').value = state.settings.longBreak;
    Utils.$('#autoStart').checked = state.settings.autoStart;
    Utils.$('#notifications').checked = state.settings.notifications;
    Utils.$('#volumeSlider').value = state.settings.volume;
    
    SettingsManager.updateValueDisplays();
    
    // Event listeners
    Utils.$$('.setting-slider').forEach(slider => {
      slider.addEventListener('input', SettingsManager.updateValueDisplays);
      slider.addEventListener('change', SettingsManager.saveSettings);
    });
    
    Utils.$$('.setting-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', SettingsManager.saveSettings);
    });
  },
  
  updateValueDisplays: () => {
    Utils.$('#focusTimeValue').textContent = Utils.$('#focusTime').value;
    Utils.$('#shortBreakValue').textContent = Utils.$('#shortBreak').value;
    Utils.$('#longBreakValue').textContent = Utils.$('#longBreak').value;
    Utils.$('#volumeValue').textContent = Utils.$('#volumeSlider').value + '%';
  },
  
  saveSettings: () => {
    state.settings.focusTime = parseInt(Utils.$('#focusTime').value);
    state.settings.shortBreak = parseInt(Utils.$('#shortBreak').value);
    state.settings.longBreak = parseInt(Utils.$('#longBreak').value);
    state.settings.autoStart = Utils.$('#autoStart').checked;
    state.settings.notifications = Utils.$('#notifications').checked;
    state.settings.volume = parseInt(Utils.$('#volumeSlider').value);
    
    Storage.saveData();
    
    // Update current timer if not running
    if (!state.isRunning) {
      TimerManager.setMode(state.currentMode, true);
    }
    
    // Update audio volume
    AudioManager.updateVolume();
    
    Utils.showNotification('Settings saved! ⚙️', 'success');
  }
};

// Audio Management
const AudioManager = {
  init: () => {
    const audioPlayer = Utils.$('#audioPlayer');
    audioPlayer.volume = state.settings.volume / 100;
    
    // Load current sound
    AudioManager.setSound(state.settings.currentSound);
    
    // Sound button events
    Utils.$$('.sound-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sound = btn.getAttribute('data-sound');
        AudioManager.setSound(sound);
      });
    });
    
    // Volume slider
    Utils.$('#volumeSlider').addEventListener('input', AudioManager.updateVolume);
  },
  
  setSound: (soundName) => {
    const audioPlayer = Utils.$('#audioPlayer');
    
    // Stop current sound
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    
    // Update active button
    Utils.$$('.sound-btn').forEach(btn => btn.classList.remove('active'));
    Utils.$(`.sound-btn[data-sound="${soundName}"]`).classList.add('active');
    
    // Set new sound
    state.settings.currentSound = soundName;
    
    if (soundName !== 'none' && CONFIG.sounds[soundName]) {
      audioPlayer.src = CONFIG.sounds[soundName];
      if (state.isRunning && state.currentMode === 'focus') {
        audioPlayer.play().catch(console.error);
      }
    }
    
    Storage.saveData();
  },
  
  updateVolume: () => {
    const volume = Utils.$('#volumeSlider').value / 100;
    Utils.$('#audioPlayer').volume = volume;
    state.settings.volume = parseInt(Utils.$('#volumeSlider').value);
  },
  
  playFocusSound: () => {
    const audioPlayer = Utils.$('#audioPlayer');
    if (state.settings.currentSound !== 'none' && audioPlayer.src) {
      audioPlayer.play().catch(console.error);
    }
  },
  
  stopFocusSound: () => {
    const audioPlayer = Utils.$('#audioPlayer');
    audioPlayer.pause();
  }
};

// Statistics Management
const StatsManager = {
  init: () => {
    StatsManager.updateDisplay();
  },
  
  addSession: () => {
    const now = Date.now();
    const today = Utils.getDateKey();
    
    // Add to recent sessions
    state.stats.recentSessions.unshift({
      date: now,
      duration: state.settings.focusTime,
      mode: 'focus'
    });
    
    // Keep only last 10 sessions
    if (state.stats.recentSessions.length > 10) {
      state.stats.recentSessions.pop();
    }
    
    // Update counters
    state.stats.totalSessions++;
    
    // Update today's count
    const todayStart = new Date(today).getTime();
    state.stats.todaySessions = state.stats.recentSessions.filter(
      session => session.date >= todayStart
    ).length;
    
    // Update week's count
    const weekStart = todayStart - (6 * 24 * 60 * 60 * 1000);
    state.stats.weekSessions = state.stats.recentSessions.filter(
      session => session.date >= weekStart
    ).length;
    
    // Update streak
    StatsManager.updateStreak();
    
    Storage.saveData();
  },
  
  updateStreak: () => {
    // Simple streak calculation based on recent activity
    let streak = 0;
    const today = Utils.getDateKey();
    let checkDate = new Date(today);
    
    for (let i = 0; i < 30; i++) {
      const dateKey = Utils.getDateKey(checkDate);
      const hasSession = state.stats.recentSessions.some(session => 
        Utils.getDateKey(new Date(session.date)) === dateKey
      );
      
      if (hasSession) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i > 0) {
        break;
      } else {
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }
    
    state.stats.currentStreak = streak;
  },
  
  updateDisplay: () => {
    Utils.$('#todaySessions').textContent = state.stats.todaySessions;
    Utils.$('#weekSessions').textContent = state.stats.weekSessions;
    Utils.$('#totalSessions').textContent = state.stats.totalSessions;
    Utils.$('#currentStreak').textContent = state.stats.currentStreak;
    
    const sessionsList = Utils.$('#sessionsList');
    if (state.stats.recentSessions.length === 0) {
      sessionsList.innerHTML = '<p style="text-align: center; color: var(--text-light);">No sessions yet. Start your first timer! 🚀</p>';
    } else {
      sessionsList.innerHTML = state.stats.recentSessions.map(session => `
        <div class="session-item">
          <span class="session-date">${Utils.formatDate(session.date)}</span>
          <span class="session-duration">${session.duration} min</span>
        </div>
      `).join('');
    }
  }
};

// Modal Management
const ModalManager = {
  init: () => {
    // Settings modal
    Utils.$('#settingsBtn').addEventListener('click', () => ModalManager.open('settings'));
    Utils.$('#closeSettings').addEventListener('click', () => ModalManager.close('settings'));
    
    // Sounds modal
    Utils.$('#soundsBtn').addEventListener('click', () => ModalManager.open('sounds'));
    Utils.$('#closeSounds').addEventListener('click', () => ModalManager.close('sounds'));
    
    // Stats modal
    Utils.$('#statsBtn').addEventListener('click', () => {
      StatsManager.updateDisplay();
      ModalManager.open('stats');
    });
    Utils.$('#closeStats').addEventListener('click', () => ModalManager.close('stats'));
    
    // Close on overlay click
    Utils.$$('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          const modalType = modal.id.replace('Modal', '');
          ModalManager.close(modalType);
        }
      });
    });
    
    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        Utils.$$('.modal-overlay.show').forEach(modal => {
          const modalType = modal.id.replace('Modal', '');
          ModalManager.close(modalType);
        });
      }
    });
  },
  
  open: (type) => {
    const modal = Utils.$(`#${type}Modal`);
    if (modal) {
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  },
  
  close: (type) => {
    const modal = Utils.$(`#${type}Modal`);
    if (modal) {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }
};

// Event Handlers
const EventHandlers = {
  init: () => {
    // Timer controls
    Utils.$('#startBtn').addEventListener('click', TimerManager.start);
    Utils.$('#pauseBtn').addEventListener('click', TimerManager.pause);
    Utils.$('#resetBtn').addEventListener('click', TimerManager.reset);
    
    // Preset buttons
    Utils.$$('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.isRunning) return;
        
        const duration = parseInt(btn.getAttribute('data-duration'));
        state.settings.focusTime = duration;
        TimerManager.setMode('focus', true);
        
        // Update active preset
        Utils.$$('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        Utils.showNotification(`Timer set to ${duration} minutes`, 'info');
      });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          state.isRunning ? TimerManager.pause() : TimerManager.start();
          break;
        case 'r':
          e.preventDefault();
          TimerManager.reset();
          break;
        case 's':
          e.preventDefault();
          ModalManager.open('settings');
          break;
      }
    });
  }
};

// Application Initialization
const PomodoroApp = {
  init: () => {
    try {
      // Load data
      const data = Storage.getData();
      state.settings = data.settings;
      state.stats = data.stats;
      
      // Initialize components
      TimerManager.setMode('focus');
      TimerManager.updateButtons();
      SettingsManager.init();
      AudioManager.init();
      StatsManager.init();
      ModalManager.init();
      EventHandlers.init();
      
      // Request notification permission
      Utils.requestNotificationPermission();
      
      console.log('Pomodoro Timer initialized successfully!');
    } catch (error) {
      console.error('Failed to initialize Pomodoro app:', error);
      Utils.showNotification('Failed to initialize app. Please refresh.', 'error');
    }
  }
};

// Start Application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', PomodoroApp.init);
} else {
  PomodoroApp.init();
}

// Debug export
if (window.location.hostname === 'localhost') {
  window.PomodoroDebug = { 
    state, CONFIG, Utils, Storage, TimerManager, 
    SettingsManager, AudioManager, StatsManager, ModalManager 
  };
}
