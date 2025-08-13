/**
 * Study Bunny Carrot Currency (CC) System
 * Centralized CC management across all components
 */

// ===================================
// CC Configuration and Rules
// ===================================
const CC_CONFIG = {
  // Earning rates (per achievement)
  earnings: {
    todoTasks: { threshold: 10, reward: 0.1 },      // 10 tasks = +0.1 CC
    noteWords: { threshold: 50, reward: 0.1 },      // 50 words = +0.1 CC
    pomodoroMinutes: { threshold: 10, reward: 0.1 }, // 10 minutes = +0.1 CC
    flashcardsCorrect: { threshold: 10, reward: 0.1 }, // 10 correct = +0.1 CC
    quizCorrect: { threshold: 10, reward: 0.1 }      // 10 correct = +0.1 CC
  },
  
  // Inactivity penalties
  penalties: {
    threeDays: { days: 3, penalty: 0.3 },  // Miss 3 days = -0.3 CC
    oneWeek: { days: 7, penalty: 0.7 }     // Miss 7 days = -0.7 CC
  },
  
  // Purchase options
  purchases: {
    small: { price: 0.99, cc: 100 },
    medium: { price: 9.99, cc: 1500 },
    large: { price: 19.99, cc: 4000 }
  },
  
  // Storage keys
  storage: {
    balance: 'studyBunnyCC',
    activities: 'studyBunnyCCActivities',
    lastActive: 'studyBunnyCCLastActive',
    achievements: 'studyBunnyCCAchievements'
  }
};

// ===================================
// Carrot Currency Manager
// ===================================
class CarrotCurrencyManager {
  constructor() {
    this.balance = 0;
    this.activities = {
      todoCompleted: 0,
      wordsWritten: 0,
      pomodoroMinutes: 0,
      flashcardsCorrect: 0,
      quizCorrect: 0
    };
    this.achievements = [];
    this.lastActive = null;
    this.initialized = false;
  }

  // ===================================
  // Initialization
  // ===================================
  init() {
    try {
      this.loadData();
      this.checkInactivityPenalties();
      this.updateDisplay();
      this.setupEventListeners();
      this.initialized = true;
      
      console.log('CC System initialized:', {
        balance: this.balance,
        activities: this.activities,
        lastActive: this.lastActive
      });
      
      return true;
    } catch (error) {
      console.error('Failed to initialize CC system:', error);
      return false;
    }
  }

  // ===================================
  // Data Management
  // ===================================
  loadData() {
    // Load balance
    this.balance = parseFloat(localStorage.getItem(CC_CONFIG.storage.balance)) || 0;
    
    // Load activities
    const savedActivities = localStorage.getItem(CC_CONFIG.storage.activities);
    if (savedActivities) {
      this.activities = { ...this.activities, ...JSON.parse(savedActivities) };
    }
    
    // Load last active date
    this.lastActive = localStorage.getItem(CC_CONFIG.storage.lastActive);
    
    // Load achievements
    const savedAchievements = localStorage.getItem(CC_CONFIG.storage.achievements);
    if (savedAchievements) {
      this.achievements = JSON.parse(savedAchievements);
    }
  }

  saveData() {
    try {
      localStorage.setItem(CC_CONFIG.storage.balance, this.balance.toString());
      localStorage.setItem(CC_CONFIG.storage.activities, JSON.stringify(this.activities));
      localStorage.setItem(CC_CONFIG.storage.lastActive, new Date().toISOString().split('T')[0]);
      localStorage.setItem(CC_CONFIG.storage.achievements, JSON.stringify(this.achievements));
      return true;
    } catch (error) {
      console.error('Failed to save CC data:', error);
      return false;
    }
  }

  // ===================================
  // Activity Tracking
  // ===================================
  trackActivity(activityType, amount = 1) {
    if (!this.initialized) {
      console.warn('CC System not initialized');
      return;
    }

    const oldValue = this.activities[activityType] || 0;
    this.activities[activityType] = oldValue + amount;
    
    // Check for achievements
    this.checkAchievements(activityType, oldValue);
    
    // Save and update
    this.saveData();
    this.updateDisplay();
    
    console.log(`CC Activity tracked: ${activityType} +${amount}`, this.activities);
  }

  checkAchievements(activityType, oldValue) {
    const activityMap = {
      todoCompleted: 'todoTasks',
      wordsWritten: 'noteWords', 
      pomodoroMinutes: 'pomodoroMinutes',
      flashcardsCorrect: 'flashcardsCorrect',
      quizCorrect: 'quizCorrect'
    };
    
    const configKey = activityMap[activityType];
    if (!configKey) return;
    
    const config = CC_CONFIG.earnings[configKey];
    const currentValue = this.activities[activityType];
    
    // Calculate how many thresholds were crossed
    const oldThresholds = Math.floor(oldValue / config.threshold);
    const newThresholds = Math.floor(currentValue / config.threshold);
    const thresholdsCrossed = newThresholds - oldThresholds;
    
    if (thresholdsCrossed > 0) {
      const ccEarned = thresholdsCrossed * config.reward;
      this.earnCC(ccEarned, this.getActivityDescription(configKey, thresholdsCrossed));
    }
  }

  getActivityDescription(configKey, count) {
    const descriptions = {
      todoTasks: `Completing ${count * 10} tasks`,
      noteWords: `Writing ${count * 50} words`,
      pomodoroMinutes: `${count * 10} minutes of focused work`,
      flashcardsCorrect: `${count * 10} correct flashcards`,
      quizCorrect: `${count * 10} correct quiz answers`
    };
    return descriptions[configKey] || 'productivity activity';
  }

  // ===================================
  // CC Operations
  // ===================================
  earnCC(amount, reason = '') {
    if (amount <= 0) return false;
    
    this.balance += amount;
    this.saveData();
    this.updateDisplay();
    
    // Show notification
    this.showNotification(`+${amount.toFixed(2)} CC earned! ${reason}`, 'success');
    
    // Add to achievements log
    this.achievements.unshift({
      type: 'earned',
      amount: amount,
      reason: reason,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 achievements
    if (this.achievements.length > 50) {
      this.achievements = this.achievements.slice(0, 50);
    }
    
    console.log(`CC Earned: +${amount} (${reason}). New balance: ${this.balance}`);
    return true;
  }

  spendCC(amount, reason = '') {
    if (amount <= 0) return false;
    if (this.balance < amount) {
      this.showNotification('Insufficient CC! 🥕', 'error');
      return false;
    }
    
    this.balance -= amount;
    this.saveData();
    this.updateDisplay();
    
    // Show notification
    this.showNotification(`-${amount.toFixed(2)} CC spent on ${reason}`, 'info');
    
    // Add to achievements log
    this.achievements.unshift({
      type: 'spent',
      amount: amount,
      reason: reason,
      timestamp: new Date().toISOString()
    });
    
    console.log(`CC Spent: -${amount} (${reason}). New balance: ${this.balance}`);
    return true;
  }

  purchaseCC(packageType) {
    const package = CC_CONFIG.purchases[packageType];
    if (!package) return false;
    
    // In a real app, this would integrate with payment processing
    const confirmed = confirm(`Purchase ${package.cc} CC for $${package.price}?`);
    if (!confirmed) return false;
    
    this.balance += package.cc;
    this.saveData();
    this.updateDisplay();
    
    this.showNotification(`Purchased ${package.cc} CC! Thank you for supporting Study Bunny! 🥕`, 'success');
    
    // Add to achievements log
    this.achievements.unshift({
      type: 'purchased',
      amount: package.cc,
      reason: `$${package.price} purchase`,
      timestamp: new Date().toISOString()
    });
    
    return true;
  }

  // ===================================
  // Inactivity Management
  // ===================================
  checkInactivityPenalties() {
    if (!this.lastActive) {
      // First time user, set today as last active
      this.lastActive = new Date().toISOString().split('T')[0];
      this.saveData();
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (this.lastActive === today) return; // Already active today
    
    const daysDiff = this.getDaysDifference(this.lastActive, today);
    
    if (daysDiff >= CC_CONFIG.penalties.oneWeek.days) {
      const penalty = CC_CONFIG.penalties.oneWeek.penalty;
      this.balance = Math.max(0, this.balance - penalty);
      this.showNotification(`Lost ${penalty} CC for being inactive for ${daysDiff} days! 😢`, 'error');
      
      this.achievements.unshift({
        type: 'penalty',
        amount: penalty,
        reason: `${daysDiff} days inactive`,
        timestamp: new Date().toISOString()
      });
    } else if (daysDiff >= CC_CONFIG.penalties.threeDays.days) {
      const penalty = CC_CONFIG.penalties.threeDays.penalty;
      this.balance = Math.max(0, this.balance - penalty);
      this.showNotification(`Lost ${penalty} CC for being inactive for ${daysDiff} days! 😕`, 'warning');
      
      this.achievements.unshift({
        type: 'penalty',
        amount: penalty,
        reason: `${daysDiff} days inactive`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Update last active to today
    this.lastActive = today;
    this.saveData();
  }

  getDaysDifference(date1Str, date2Str) {
    const date1 = new Date(date1Str);
    const date2 = new Date(date2Str);
    const diffTime = Math.abs(date2 - date1);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // ===================================
  // UI Management
  // ===================================
  updateDisplay() {
    // Update main CC display
    const ccDisplay = document.getElementById('ccAmount');
    if (ccDisplay) {
      ccDisplay.textContent = this.balance.toFixed(2);
    }
    
    // Update any other CC displays in modals or other components
    const ccDisplays = document.querySelectorAll('.cc-balance');
    ccDisplays.forEach(display => {
      display.textContent = this.balance.toFixed(2);
    });
    
    // Dispatch custom event for other components
    document.dispatchEvent(new CustomEvent('ccUpdated', {
      detail: { balance: this.balance, activities: this.activities }
    }));
  }

  setupEventListeners() {
    // Listen for CC widget clicks
    const ccWidget = document.getElementById('ccWidget');
    if (ccWidget) {
      ccWidget.addEventListener('click', () => {
        window.location.href = 'cc-info.html';
      });
    }
    
    // Listen for purchase buttons (if any)
    const purchaseButtons = document.querySelectorAll('[data-cc-purchase]');
    purchaseButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const packageType = e.target.getAttribute('data-cc-purchase');
        this.purchaseCC(packageType);
      });
    });
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `cc-notification cc-notification--${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#2196f3'};
      color: white; padding: 12px 20px; border-radius: 8px;
      font-family: 'Comic Sans MS', fantasy, sans-serif;
      font-weight: bold; font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideInRight 0.3s ease-out;
      max-width: 300px; word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
  }

  // ===================================
  // Debug and Utility Methods
  // ===================================
  getStats() {
    return {
      balance: this.balance,
      activities: this.activities,
      achievements: this.achievements.slice(0, 10), // Last 10
      lastActive: this.lastActive
    };
  }

  reset() {
    if (!confirm('Are you sure you want to reset all CC data? This cannot be undone!')) {
      return false;
    }
    
    this.balance = 0;
    this.activities = {
      todoCompleted: 0,
      wordsWritten: 0,
      pomodoroMinutes: 0,
      flashcardsCorrect: 0,
      quizCorrect: 0
    };
    this.achievements = [];
    this.lastActive = new Date().toISOString().split('T')[0];
    
    this.saveData();
    this.updateDisplay();
    this.showNotification('CC system reset!', 'info');
    
    return true;
  }
}

// ===================================
// Global CC Manager Instance
// ===================================
const CCManager = new CarrotCurrencyManager();

// ===================================
// Public API for Other Components
// ===================================
window.StudyBunnyCC = {
  // Track activities
  trackTodoCompleted: (count = 1) => CCManager.trackActivity('todoCompleted', count),
  trackWordsWritten: (count = 1) => CCManager.trackActivity('wordsWritten', count),
  trackPomodoroMinutes: (count = 1) => CCManager.trackActivity('pomodoroMinutes', count),
  trackFlashcardCorrect: (count = 1) => CCManager.trackActivity('flashcardsCorrect', count),
  trackQuizCorrect: (count = 1) => CCManager.trackActivity('quizCorrect', count),
  
  // CC operations
  earnCC: (amount, reason) => CCManager.earnCC(amount, reason),
  spendCC: (amount, reason) => CCManager.spendCC(amount, reason),
  getBalance: () => CCManager.balance,
  getStats: () => CCManager.getStats(),
  
  // Purchases
  purchaseCC: (packageType) => CCManager.purchaseCC(packageType),
  
  // Utility
  init: () => CCManager.init(),
  reset: () => CCManager.reset()
};

// ===================================
// Auto-initialize when DOM is ready
// ===================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => CCManager.init());
} else {
  CCManager.init();
}

// ===================================
// Debug Export (Development only)
// ===================================
if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1'))) {
  window.CCDebug = CCManager;
}
