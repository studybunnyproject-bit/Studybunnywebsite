/**
 * Study Bunny Planners Hub
 * Modern ES6+ implementation with unified navigation and quick actions
 */

// Configuration
const CONFIG = {
  storageKey: 'studyBunnyPlannerHub',
  timeFormat: {
    locale: 'en-US',
    options: {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }
  },
  dateFormat: {
    locale: 'en-US',
    options: {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  }
};

// State
const state = {
  currentTime: new Date(),
  quickTasks: [],
  dailyGoal: '',
  stats: {
    tasksCompleted: 0,
    studyTime: 0,
    goalsProgress: 0,
    currentStreak: 0
  }
};

// Utilities
const Utils = {
  $: (selector) => document.querySelector(selector),
  $$: (selector) => document.querySelectorAll(selector),
  
  formatTime: (date) => date.toLocaleTimeString(CONFIG.timeFormat.locale, CONFIG.timeFormat.options),
  
  formatDate: (date) => date.toLocaleDateString(CONFIG.dateFormat.locale, CONFIG.dateFormat.options),
  
  showNotification: (message, type = 'success') => {
    const container = Utils.$('#notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    container.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  },
  
  generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
  
  getDateKey: (date = new Date()) => date.toISOString().split('T')[0]
};

// Storage Management
const Storage = {
  saveData: () => {
    try {
      const data = {
        quickTasks: state.quickTasks,
        dailyGoal: state.dailyGoal,
        stats: state.stats,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving planner data:', error);
    }
  },
  
  loadData: () => {
    try {
      const saved = localStorage.getItem(CONFIG.storageKey);
      if (!saved) return;
      
      const data = JSON.parse(saved);
      state.quickTasks = data.quickTasks || [];
      state.dailyGoal = data.dailyGoal || '';
      state.stats = { ...state.stats, ...data.stats };
    } catch (error) {
      console.error('Error loading planner data:', error);
    }
  }
};

// Time and Clock Management
const TimeManager = {
  init: () => {
    TimeManager.updateTime();
    TimeManager.updateAnalogClock();
    
    // Update every second
    setInterval(() => {
      TimeManager.updateTime();
      TimeManager.updateAnalogClock();
    }, 1000);
  },
  
  updateTime: () => {
    state.currentTime = new Date();
    
    const timeElement = Utils.$('#currentTime');
    const dateElement = Utils.$('#currentDate');
    const timezoneElement = Utils.$('#timezone');
    
    if (timeElement) {
      timeElement.textContent = Utils.formatTime(state.currentTime);
    }
    
    if (dateElement) {
      dateElement.textContent = Utils.formatDate(state.currentTime);
    }
    
    if (timezoneElement) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      timezoneElement.textContent = timezone || 'Local Time';
    }
  },
  
  updateAnalogClock: () => {
    const now = state.currentTime;
    const seconds = now.getSeconds();
    const minutes = now.getMinutes();
    const hours = now.getHours();
    
    // Calculate angles
    const secondAngle = seconds * 6; // 360/60 = 6 degrees per second
    const minuteAngle = minutes * 6 + seconds * 0.1; // 6 degrees per minute + smooth second transition
    const hourAngle = (hours % 12) * 30 + minutes * 0.5; // 30 degrees per hour + smooth minute transition
    
    // Apply rotations
    const hourHand = Utils.$('#hourHand');
    const minuteHand = Utils.$('#minuteHand');
    const secondHand = Utils.$('#secondHand');
    
    if (hourHand) hourHand.style.transform = `rotate(${hourAngle}deg)`;
    if (minuteHand) minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
    if (secondHand) secondHand.style.transform = `rotate(${secondAngle}deg)`;
  }
};

// Stats Management
const StatsManager = {
  init: () => {
    StatsManager.loadFromOtherComponents();
    StatsManager.updateStatsDisplay();
    
    // Update stats every 30 seconds
    setInterval(() => {
      StatsManager.loadFromOtherComponents();
      StatsManager.updateStatsDisplay();
    }, 30000);
  },
  
  loadFromOtherComponents: () => {
    try {
      // Load from Todo List
      const todoData = JSON.parse(localStorage.getItem('studyBunnyTodos')) || [];
      const today = Utils.getDateKey();
      const todayTodos = todoData.filter(todo => {
        const todoDate = Utils.getDateKey(new Date(todo.createdAt));
        return todoDate === today && todo.completed;
      });
      state.stats.tasksCompleted = todayTodos.length;
      
      // Load from Progress Tracker
      const progressData = JSON.parse(localStorage.getItem('studyBunnyProgress')) || {};
      if (progressData.todayData) {
        state.stats.studyTime = Math.floor((progressData.todayData.studyTime || 0) / 60); // Convert to hours
        
        // Calculate goals progress (average of main goals)
        const studyGoal = 2; // hours
        const waterGoal = 8; // cups
        const pomodoroGoal = 8; // sessions
        
        const studyProgress = Math.min((progressData.todayData.studyTime / 60) / studyGoal * 100, 100);
        const waterProgress = Math.min((progressData.todayData.waterIntake || 0) / waterGoal * 100, 100);
        const pomodoroProgress = Math.min((progressData.todayData.pomodoros || 0) / pomodoroGoal * 100, 100);
        
        state.stats.goalsProgress = Math.round((studyProgress + waterProgress + pomodoroProgress) / 3);
      }
      
      // Calculate streak (simplified)
      const historicalData = progressData.historicalData || [];
      let streak = 0;
      if (progressData.todayData && 
          (progressData.todayData.studyTime > 0 || progressData.todayData.pomodoros > 0)) {
        streak = 1;
        
        // Check previous days
        for (let i = 1; i < 30; i++) {
          const checkDate = new Date();
          checkDate.setDate(checkDate.getDate() - i);
          const dateKey = Utils.getDateKey(checkDate);
          
          const dayData = historicalData.find(h => h.date === dateKey);
          if (dayData && (dayData.studyTime > 0 || dayData.pomodoros > 0)) {
            streak++;
          } else {
            break;
          }
        }
      }
      
      state.stats.currentStreak = streak;
      
    } catch (error) {
      console.error('Error loading stats from other components:', error);
    }
  },
  
  updateStatsDisplay: () => {
    Utils.$('#tasksCompleted').textContent = state.stats.tasksCompleted;
    Utils.$('#studyTime').textContent = `${state.stats.studyTime}h`;
    Utils.$('#goalsProgress').textContent = `${state.stats.goalsProgress}%`;
    Utils.$('#currentStreak').textContent = state.stats.currentStreak;
  }
};

// Quick Actions Management
const QuickActionsManager = {
  init: () => {
    QuickActionsManager.setupEventListeners();
    QuickActionsManager.loadTodaysSummary();
  },
  
  setupEventListeners: () => {
    Utils.$('#addQuickTask').addEventListener('click', () => ModalManager.open('quickTask'));
    Utils.$('#setDailyGoal').addEventListener('click', QuickActionsManager.setDailyGoal);
    Utils.$('#viewProgress').addEventListener('click', () => window.location.href = '../progress/progress.html');
    Utils.$('#exportPlans').addEventListener('click', QuickActionsManager.exportPlans);
  },
  
  addQuickTask: (taskData) => {
    const newTask = {
      id: Utils.generateId(),
      title: taskData.title,
      time: taskData.time,
      priority: taskData.priority,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    state.quickTasks.push(newTask);
    Storage.saveData();
    QuickActionsManager.loadTodaysSummary();
    
    Utils.showNotification('Quick task added! 📝', 'success');
  },
  
  setDailyGoal: () => {
    const goal = prompt('What\'s your main goal for today?', state.dailyGoal);
    if (goal !== null) {
      state.dailyGoal = goal.trim();
      Storage.saveData();
      QuickActionsManager.loadTodaysSummary();
      
      if (goal.trim()) {
        Utils.showNotification('Daily goal set! 🎯', 'success');
      } else {
        Utils.showNotification('Daily goal cleared', 'info');
      }
    }
  },
  
  loadTodaysSummary: () => {
    // Update upcoming tasks
    const upcomingTasksContainer = Utils.$('#upcomingTasks');
    const pendingTasks = state.quickTasks.filter(task => !task.completed);
    
    if (pendingTasks.length === 0) {
      upcomingTasksContainer.innerHTML = '<div class="empty-state">No tasks scheduled for today</div>';
    } else {
      upcomingTasksContainer.innerHTML = pendingTasks.slice(0, 3).map(task => `
        <div class="task-preview-item">
          <span class="task-time">${task.time || 'No time'}</span>
          <span class="task-title">${task.title}</span>
          <span class="task-priority priority-${task.priority}">${task.priority}</span>
        </div>
      `).join('');
    }
    
    // Update today's goal
    const todaysGoalContainer = Utils.$('#todaysGoal');
    if (state.dailyGoal) {
      todaysGoalContainer.innerHTML = `<div class="goal-text">${state.dailyGoal}</div>`;
    } else {
      todaysGoalContainer.innerHTML = '<div class="empty-state">No goal set for today</div>';
    }
  },
  
  exportPlans: () => {
    try {
      const exportData = {
        plannerData: {
          quickTasks: state.quickTasks,
          dailyGoal: state.dailyGoal,
          stats: state.stats
        },
        dailyPlanner: JSON.parse(localStorage.getItem('studyBunnyDailyPlanner') || '{}'),
        weeklyPlanner: JSON.parse(localStorage.getItem('studyBunnyWeeklyPlanner') || '{}'),
        monthlyPlanner: JSON.parse(localStorage.getItem('studyBunnyMonthlyPlanner') || '{}'),
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `study-bunny-planners-${Utils.getDateKey()}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      Utils.showNotification('Planner data exported! 📤', 'success');
    } catch (error) {
      console.error('Export error:', error);
      Utils.showNotification('Failed to export data', 'error');
    }
  }
};

// Modal Management
const ModalManager = {
  init: () => {
    // Quick Task Modal
    Utils.$('#closeQuickTaskModal').addEventListener('click', () => ModalManager.close('quickTask'));
    Utils.$('#cancelQuickTask').addEventListener('click', () => ModalManager.close('quickTask'));
    
    Utils.$('#quickTaskForm').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      const taskData = {
        title: Utils.$('#taskTitle').value.trim(),
        time: Utils.$('#taskTime').value,
        priority: Utils.$('#taskPriority').value
      };
      
      if (!taskData.title) {
        Utils.showNotification('Please enter a task title', 'warning');
        return;
      }
      
      QuickActionsManager.addQuickTask(taskData);
      ModalManager.close('quickTask');
      
      // Clear form
      Utils.$('#taskTitle').value = '';
      Utils.$('#taskTime').value = '';
      Utils.$('#taskPriority').value = 'medium';
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
      
      // Focus first input
      const firstInput = modal.querySelector('input, textarea');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
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

// Application Initialization
const PlannerApp = {
  init: () => {
    try {
      Storage.loadData();
      TimeManager.init();
      StatsManager.init();
      QuickActionsManager.init();
      ModalManager.init();
      
      // Set up CSS for dynamic styles
      PlannerApp.setupDynamicStyles();
      
      console.log('Planner Hub initialized successfully!');
    } catch (error) {
      console.error('Failed to initialize Planner Hub:', error);
      Utils.showNotification('Failed to initialize app. Please refresh.', 'error');
    }
  },
  
  setupDynamicStyles: () => {
    // Add dynamic styles for task preview items
    const style = document.createElement('style');
    style.textContent = `
      .task-preview-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm);
        background: var(--background-light);
        border-radius: var(--border-radius-md);
        margin-bottom: var(--spacing-sm);
        font-size: var(--font-size-sm);
      }
      
      .task-time {
        color: var(--text-light);
        font-family: var(--font-family-mono);
        font-weight: var(--font-weight-bold);
        min-width: 60px;
      }
      
      .task-title {
        flex: 1;
        color: var(--text-dark);
        font-weight: var(--font-weight-medium);
      }
      
      .task-priority {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--border-radius-sm);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-bold);
        text-transform: uppercase;
      }
      
      .priority-high { background: #f44336; color: white; }
      .priority-medium { background: #ff9800; color: white; }
      .priority-low { background: #4caf50; color: white; }
      
      .goal-text {
        color: var(--text-dark);
        font-weight: var(--font-weight-medium);
        font-style: italic;
        padding: var(--spacing-md);
        background: var(--background-light);
        border-radius: var(--border-radius-md);
        border-left: 4px solid var(--primary-purple);
      }
    `;
    document.head.appendChild(style);
  }
};

// Start Application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', PlannerApp.init);
} else {
  PlannerApp.init();
}

// Debug export
if (window.location.hostname === 'localhost') {
  window.PlannerDebug = { 
    state, CONFIG, Utils, Storage, TimeManager, StatsManager, QuickActionsManager, ModalManager 
  };
}
