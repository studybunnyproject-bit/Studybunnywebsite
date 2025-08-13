/**
 * Study Bunny Water Tracker
 * Modern ES6+ implementation with goal setting and progress visualization
 */

// Configuration
const CONFIG = {
  storageKey: 'studyBunnyWaterTracker',
  defaultSettings: {
    dailyGoal: 2000,
    reminderInterval: 1,
    notifications: true,
    soundEffects: true
  },
  maxDailyIntake: 5000,
  reminderMessages: [
    'Time to hydrate! 💧',
    'Don\'t forget to drink water! 🥤',
    'Stay hydrated, stay focused! 💙',
    'Your body needs water! 🌊',
    'Hydration break time! ✨'
  ]
};

// State
const state = {
  todayIntake: 0,
  todayEntries: [],
  settings: { ...CONFIG.defaultSettings },
  history: [],
  reminderTimer: null,
  lastReminderTime: null
};

// Utilities
const Utils = {
  $: (selector) => document.querySelector(selector),
  $$: (selector) => document.querySelectorAll(selector),
  
  formatTime: (date) => new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  }),
  
  formatDate: (date) => new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
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
      new Notification('Study Bunny Water Tracker', { 
        body: message, 
        icon: '../cc.png',
        badge: '../cc.png'
      });
    }
  },
  
  playSound: (type = 'success') => {
    if (!state.settings.soundEffects) return;
    
    // Create simple audio feedback using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const frequencies = {
      success: 800,
      goal: 1000,
      reminder: 600
    };
    
    oscillator.frequency.setValueAtTime(frequencies[type] || 800, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
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
        history: data.history || [],
        todayData: data.todayData || { intake: 0, entries: [] }
      };
    } catch (error) {
      console.error('Error loading data:', error);
      return { 
        settings: CONFIG.defaultSettings, 
        history: [], 
        todayData: { intake: 0, entries: [] }
      };
    }
  },
  
  saveData: () => {
    try {
      const today = Utils.getDateKey();
      localStorage.setItem(CONFIG.storageKey, JSON.stringify({
        settings: state.settings,
        history: state.history,
        todayData: {
          date: today,
          intake: state.todayIntake,
          entries: state.todayEntries
        }
      }));
    } catch (error) {
      console.error('Error saving data:', error);
      Utils.showNotification('Failed to save data', 'error');
    }
  }
};

// Water Tracking Management
const WaterTracker = {
  init: () => {
    WaterTracker.updateProgress();
    WaterTracker.updateStats();
    WaterTracker.updateActivity();
    WaterTracker.setupReminders();
  },
  
  addWater: (amount) => {
    if (amount <= 0 || amount > 2000) {
      Utils.showNotification('Please enter a valid amount (1-2000ml)', 'error');
      return;
    }
    
    if (state.todayIntake + amount > CONFIG.maxDailyIntake) {
      Utils.showNotification('That would exceed the safe daily limit!', 'warning');
      return;
    }
    
    const entry = {
      id: Date.now(),
      amount: amount,
      time: Date.now()
    };
    
    state.todayIntake += amount;
    state.todayEntries.push(entry);
    
    // Update history
    WaterTracker.updateDailyHistory();
    
    // Save data
    Storage.saveData();
    
    // Update UI
    WaterTracker.updateProgress();
    WaterTracker.updateStats();
    WaterTracker.updateActivity();
    
    // Play sound and show notification
    Utils.playSound('success');
    Utils.showNotification(`Added ${amount}ml! Great job! 💧`, 'success');
    
    // Check if goal reached
    if (state.todayIntake >= state.settings.dailyGoal && 
        state.todayIntake - amount < state.settings.dailyGoal) {
      WaterTracker.celebrateGoal();
    }
    
    // Reset reminder timer
    WaterTracker.setupReminders();
  },
  
  updateProgress: () => {
    const progressAmount = Utils.$('#progressAmount');
    const progressGoal = Utils.$('#progressGoal');
    const progressPercentage = Utils.$('#progressPercentage');
    const progressCircle = Utils.$('#progressCircle');
    
    const percentage = Math.min((state.todayIntake / state.settings.dailyGoal) * 100, 100);
    
    // Update text
    progressAmount.textContent = `${state.todayIntake} ml`;
    progressGoal.textContent = `of ${state.settings.dailyGoal} ml`;
    progressPercentage.textContent = `${Math.round(percentage)}%`;
    
    // Update progress circle
    const radius = 85;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    
    progressCircle.style.strokeDasharray = circumference;
    progressCircle.style.strokeDashoffset = offset;
    
    // Add animation class
    const progressCircleContainer = Utils.$('.progress-circle');
    progressCircleContainer.classList.add('filling');
    setTimeout(() => progressCircleContainer.classList.remove('filling'), 600);
  },
  
  updateStats: () => {
    const cupsToday = Utils.$('#cupsToday');
    const timeToGoal = Utils.$('#timeToGoal');
    const currentStreak = Utils.$('#currentStreak');
    
    // Cups today (assuming 250ml per cup)
    cupsToday.textContent = Math.floor(state.todayIntake / 250);
    
    // Time to goal estimation
    const remaining = state.settings.dailyGoal - state.todayIntake;
    if (remaining <= 0) {
      timeToGoal.textContent = 'Goal reached! 🎉';
    } else if (state.todayEntries.length < 2) {
      timeToGoal.textContent = '--';
    } else {
      // Simple estimation based on average intake rate
      const timeSpan = Date.now() - state.todayEntries[0].time;
      const averageRate = state.todayIntake / (timeSpan / (1000 * 60 * 60)); // ml per hour
      const hoursToGoal = remaining / averageRate;
      
      if (hoursToGoal < 1) {
        timeToGoal.textContent = `${Math.round(hoursToGoal * 60)}m`;
      } else if (hoursToGoal < 24) {
        timeToGoal.textContent = `${Math.round(hoursToGoal)}h`;
      } else {
        timeToGoal.textContent = '24h+';
      }
    }
    
    // Streak calculation
    currentStreak.textContent = WaterTracker.calculateStreak();
  },
  
  updateActivity: () => {
    const activityList = Utils.$('#activityList');
    
    if (state.todayEntries.length === 0) {
      activityList.innerHTML = '<div class="empty-activity">No water intake recorded today. Start hydrating! 💧</div>';
      return;
    }
    
    activityList.innerHTML = state.todayEntries
      .slice()
      .reverse()
      .slice(0, 10)
      .map(entry => `
        <div class="activity-item">
          <span class="activity-amount">+${entry.amount}ml</span>
          <span class="activity-time">${Utils.formatTime(entry.time)}</span>
        </div>
      `).join('');
  },
  
  updateDailyHistory: () => {
    const today = Utils.getDateKey();
    const existingIndex = state.history.findIndex(day => day.date === today);
    
    const dayData = {
      date: today,
      intake: state.todayIntake,
      goal: state.settings.dailyGoal,
      goalReached: state.todayIntake >= state.settings.dailyGoal,
      entries: state.todayEntries.length
    };
    
    if (existingIndex >= 0) {
      state.history[existingIndex] = dayData;
    } else {
      state.history.push(dayData);
    }
    
    // Keep only last 30 days
    if (state.history.length > 30) {
      state.history = state.history.slice(-30);
    }
    
    // Sort by date (newest first)
    state.history.sort((a, b) => new Date(b.date) - new Date(a.date));
  },
  
  calculateStreak: () => {
    if (state.history.length === 0) return 0;
    
    let streak = 0;
    const today = Utils.getDateKey();
    let checkDate = new Date(today);
    
    for (let i = 0; i < 30; i++) {
      const dateKey = Utils.getDateKey(checkDate);
      const dayData = state.history.find(day => day.date === dateKey);
      
      if (dayData && dayData.goalReached) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0 && dateKey === today && state.todayIntake >= state.settings.dailyGoal) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  },
  
  celebrateGoal: () => {
    Utils.playSound('goal');
    Utils.showNotification('🎉 Daily goal reached! Excellent hydration! 🎉', 'success');
    
    // Bonus CC reward for reaching daily hydration goal
    if (window.StudyBunnyCC) {
      window.StudyBunnyCC.earnCC(0.05, 'Daily hydration goal achieved!');
    }
    console.log('💧 Hydration goal reached: Bonus CC awarded!');
    
    // Add celebration animation
    const progressCircle = Utils.$('.progress-circle');
    progressCircle.classList.add('goal-reached');
    setTimeout(() => progressCircle.classList.remove('goal-reached'), 1000);
  },
  
  reset: () => {
    state.todayIntake = 0;
    state.todayEntries = [];
    
    Storage.saveData();
    
    WaterTracker.updateProgress();
    WaterTracker.updateStats();
    WaterTracker.updateActivity();
    
    Utils.showNotification('Today\'s progress reset', 'info');
  },
  
  setupReminders: () => {
    if (state.reminderTimer) {
      clearTimeout(state.reminderTimer);
    }
    
    if (state.settings.reminderInterval <= 0.5 || !state.settings.notifications) {
      return;
    }
    
    const intervalMs = state.settings.reminderInterval * 60 * 60 * 1000; // Convert hours to ms
    
    state.reminderTimer = setTimeout(() => {
      if (state.todayIntake < state.settings.dailyGoal) {
        const randomMessage = CONFIG.reminderMessages[
          Math.floor(Math.random() * CONFIG.reminderMessages.length)
        ];
        Utils.showNotification(randomMessage, 'info');
        Utils.playSound('reminder');
      }
      
      // Set up next reminder
      WaterTracker.setupReminders();
    }, intervalMs);
  }
};

// Settings Management
const SettingsManager = {
  init: () => {
    // Load settings into UI
    Utils.$('#dailyGoal').value = state.settings.dailyGoal;
    Utils.$('#reminderInterval').value = state.settings.reminderInterval;
    Utils.$('#notifications').checked = state.settings.notifications;
    Utils.$('#soundEffects').checked = state.settings.soundEffects;
    
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
    Utils.$('#dailyGoalValue').textContent = Utils.$('#dailyGoal').value + ' ml';
    
    const reminderValue = parseFloat(Utils.$('#reminderInterval').value);
    if (reminderValue === 0.5) {
      Utils.$('#reminderValue').textContent = 'Disabled';
    } else if (reminderValue === 1) {
      Utils.$('#reminderValue').textContent = '1 hour';
    } else {
      Utils.$('#reminderValue').textContent = reminderValue + ' hours';
    }
  },
  
  saveSettings: () => {
    state.settings.dailyGoal = parseInt(Utils.$('#dailyGoal').value);
    state.settings.reminderInterval = parseFloat(Utils.$('#reminderInterval').value);
    state.settings.notifications = Utils.$('#notifications').checked;
    state.settings.soundEffects = Utils.$('#soundEffects').checked;
    
    Storage.saveData();
    
    // Update UI
    WaterTracker.updateProgress();
    WaterTracker.updateStats();
    WaterTracker.setupReminders();
    
    Utils.showNotification('Settings saved! ⚙️', 'success');
  }
};

// History Management
const HistoryManager = {
  updateDisplay: () => {
    // Update stats
    const weeklyData = state.history.slice(0, 7);
    const weeklyAverage = weeklyData.length > 0 
      ? Math.round(weeklyData.reduce((sum, day) => sum + day.intake, 0) / weeklyData.length)
      : 0;
    
    const bestDay = state.history.length > 0 
      ? Math.max(...state.history.map(day => day.intake))
      : 0;
    
    const totalDays = state.history.length;
    const goalsAchieved = state.history.filter(day => day.goalReached).length;
    
    Utils.$('#weeklyAverage').textContent = weeklyAverage + ' ml';
    Utils.$('#bestDay').textContent = bestDay + ' ml';
    Utils.$('#totalDays').textContent = totalDays;
    Utils.$('#goalsAchieved').textContent = goalsAchieved;
    
    // Update timeline
    const timelineList = Utils.$('#timelineList');
    if (state.history.length === 0) {
      timelineList.innerHTML = '<p style="text-align: center; color: var(--text-light);">No history yet. Start tracking today! 📊</p>';
    } else {
      timelineList.innerHTML = state.history.slice(0, 10).map(day => `
        <div class="timeline-item">
          <div>
            <div class="timeline-date">${Utils.formatDate(new Date(day.date))}</div>
            ${day.goalReached ? '<div class="timeline-goal">Goal reached! ✅</div>' : ''}
          </div>
          <div class="timeline-amount">${day.intake} ml</div>
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
    
    // History modal
    Utils.$('#historyBtn').addEventListener('click', () => {
      HistoryManager.updateDisplay();
      ModalManager.open('history');
    });
    Utils.$('#closeHistory').addEventListener('click', () => ModalManager.close('history'));
    
    // Reset modal
    Utils.$('#resetBtn').addEventListener('click', () => ModalManager.open('reset'));
    Utils.$('#closeReset').addEventListener('click', () => ModalManager.close('reset'));
    Utils.$('#cancelReset').addEventListener('click', () => ModalManager.close('reset'));
    Utils.$('#confirmReset').addEventListener('click', () => {
      WaterTracker.reset();
      ModalManager.close('reset');
    });
    
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
    // Quick add buttons
    Utils.$$('.quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const amount = parseInt(btn.getAttribute('data-amount'));
        WaterTracker.addWater(amount);
      });
    });
    
    // Custom amount
    const customInput = Utils.$('#customAmount');
    const addCustomBtn = Utils.$('#addCustomBtn');
    
    addCustomBtn.addEventListener('click', () => {
      const amount = parseInt(customInput.value);
      if (amount) {
        WaterTracker.addWater(amount);
        customInput.value = '';
      }
    });
    
    customInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        addCustomBtn.click();
      }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      
      switch (e.key) {
        case '1':
          WaterTracker.addWater(250);
          break;
        case '2':
          WaterTracker.addWater(350);
          break;
        case '3':
          WaterTracker.addWater(500);
          break;
        case '4':
          WaterTracker.addWater(1000);
          break;
        case 's':
          e.preventDefault();
          ModalManager.open('settings');
          break;
        case 'h':
          e.preventDefault();
          HistoryManager.updateDisplay();
          ModalManager.open('history');
          break;
      }
    });
  }
};

// Application Initialization
const WaterApp = {
  init: () => {
    try {
      // Load data
      const data = Storage.getData();
      state.settings = data.settings;
      state.history = data.history;
      
      // Load today's data if it's the same day
      const today = Utils.getDateKey();
      if (data.todayData.date === today) {
        state.todayIntake = data.todayData.intake;
        state.todayEntries = data.todayData.entries;
      }
      
      // Initialize components
      WaterTracker.init();
      SettingsManager.init();
      ModalManager.init();
      EventHandlers.init();
      
      // Request notification permission
      Utils.requestNotificationPermission();
      
      console.log('Water Tracker initialized successfully!');
    } catch (error) {
      console.error('Failed to initialize Water Tracker:', error);
      Utils.showNotification('Failed to initialize app. Please refresh.', 'error');
    }
  }
};

// Start Application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', WaterApp.init);
} else {
  WaterApp.init();
}

// Debug export
if (window.location.hostname === 'localhost') {
  window.WaterDebug = { 
    state, CONFIG, Utils, Storage, WaterTracker, 
    SettingsManager, HistoryManager, ModalManager 
  };
}
