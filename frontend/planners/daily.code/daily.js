/**
 * Study Bunny Daily Planner
 * Modern ES6+ implementation with time blocks and task management
 */

// Configuration
const CONFIG = {
  storageKey: 'studyBunnyDailyPlanner',
  templates: {
    study: [
      { start: '07:00', end: '08:00', activity: 'Morning Routine & Breakfast', category: 'personal' },
      { start: '08:00', end: '10:00', activity: 'Deep Study Session 1', category: 'study' },
      { start: '10:00', end: '10:15', activity: 'Break', category: 'break' },
      { start: '10:15', end: '12:15', activity: 'Deep Study Session 2', category: 'study' },
      { start: '12:15', end: '13:15', activity: 'Lunch Break', category: 'meal' },
      { start: '13:15', end: '15:15', activity: 'Study Session 3', category: 'study' },
      { start: '15:15', end: '15:30', activity: 'Break', category: 'break' },
      { start: '15:30', end: '17:00', activity: 'Review & Practice', category: 'study' },
      { start: '17:00', end: '18:00', activity: 'Exercise', category: 'exercise' },
      { start: '18:00', end: '19:00', activity: 'Dinner', category: 'meal' },
      { start: '19:00', end: '20:30', activity: 'Light Study/Reading', category: 'study' },
      { start: '20:30', end: '22:00', activity: 'Personal Time', category: 'personal' }
    ],
    work: [
      { start: '07:00', end: '08:00', activity: 'Morning Routine', category: 'personal' },
      { start: '08:00', end: '09:00', activity: 'Planning & Email', category: 'work' },
      { start: '09:00', end: '11:00', activity: 'Deep Work Block 1', category: 'work' },
      { start: '11:00', end: '11:15', activity: 'Coffee Break', category: 'break' },
      { start: '11:15', end: '12:30', activity: 'Meetings & Collaboration', category: 'work' },
      { start: '12:30', end: '13:30', activity: 'Lunch Break', category: 'meal' },
      { start: '13:30', end: '15:30', activity: 'Deep Work Block 2', category: 'work' },
      { start: '15:30', end: '15:45', activity: 'Break', category: 'break' },
      { start: '15:45', end: '17:00', activity: 'Administrative Tasks', category: 'work' },
      { start: '17:00', end: '18:00', activity: 'Wrap-up & Planning', category: 'work' },
      { start: '18:00', end: '22:00', activity: 'Personal Time', category: 'personal' }
    ],
    balanced: [
      { start: '07:00', end: '08:00', activity: 'Morning Routine', category: 'personal' },
      { start: '08:00', end: '10:00', activity: 'Study/Work Session', category: 'study' },
      { start: '10:00', end: '10:15', activity: 'Break', category: 'break' },
      { start: '10:15', end: '12:00', activity: 'Work Tasks', category: 'work' },
      { start: '12:00', end: '13:00', activity: 'Lunch & Rest', category: 'meal' },
      { start: '13:00', end: '14:30', activity: 'Study Session', category: 'study' },
      { start: '14:30', end: '14:45', activity: 'Break', category: 'break' },
      { start: '14:45', end: '16:00', activity: 'Work/Projects', category: 'work' },
      { start: '16:00', end: '17:00', activity: 'Exercise/Walk', category: 'exercise' },
      { start: '17:00', end: '18:00', activity: 'Personal Tasks', category: 'personal' },
      { start: '18:00', end: '19:00', activity: 'Dinner', category: 'meal' },
      { start: '19:00', end: '22:00', activity: 'Free Time', category: 'personal' }
    ],
    exam: [
      { start: '06:30', end: '07:30', activity: 'Morning Routine', category: 'personal' },
      { start: '07:30', end: '09:30', activity: 'Subject 1 - Deep Study', category: 'study' },
      { start: '09:30', end: '09:45', activity: 'Break', category: 'break' },
      { start: '09:45', end: '11:45', activity: 'Subject 2 - Deep Study', category: 'study' },
      { start: '11:45', end: '12:00', activity: 'Break', category: 'break' },
      { start: '12:00', end: '13:00', activity: 'Practice Tests', category: 'study' },
      { start: '13:00', end: '14:00', activity: 'Lunch Break', category: 'meal' },
      { start: '14:00', end: '16:00', activity: 'Subject 3 - Study', category: 'study' },
      { start: '16:00', end: '16:15', activity: 'Break', category: 'break' },
      { start: '16:15', end: '17:45', activity: 'Review & Flashcards', category: 'study' },
      { start: '17:45', end: '18:30', activity: 'Quick Exercise', category: 'exercise' },
      { start: '18:30', end: '19:30', activity: 'Dinner', category: 'meal' },
      { start: '19:30', end: '21:00', activity: 'Light Review', category: 'study' },
      { start: '21:00', end: '22:00', activity: 'Relaxation', category: 'personal' }
    ]
  }
};

// State
const state = {
  currentDate: new Date(),
  timeBlocks: [],
  tasks: [],
  dailyGoal: '',
  dailyNotes: '',
  editingBlock: null,
  editingTask: null
};

// Utilities
const Utils = {
  $: (selector) => document.querySelector(selector),
  $$: (selector) => document.querySelectorAll(selector),
  
  formatDate: (date) => date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }),
  
  formatTime: (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  },
  
  getDateKey: (date = state.currentDate) => date.toISOString().split('T')[0],
  
  generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
  
  showNotification: (message, type = 'success') => {
    const container = Utils.$('#notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    container.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  },
  
  timeToMinutes: (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  },
  
  minutesToTime: (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
};

// URL Parameter Handling
const URLManager = {
  init: () => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    
    if (dateParam) {
      const paramDate = new Date(dateParam);
      if (!isNaN(paramDate.getTime())) {
        state.currentDate = paramDate;
      }
    }
    
    URLManager.updateURL();
  },
  
  updateURL: () => {
    const dateKey = Utils.getDateKey();
    const url = new URL(window.location);
    url.searchParams.set('date', dateKey);
    window.history.replaceState({}, '', url);
  }
};

// Storage Management
const Storage = {
  saveData: () => {
    try {
      const dateKey = Utils.getDateKey();
      const existingData = JSON.parse(localStorage.getItem(CONFIG.storageKey)) || {};
      
      existingData[dateKey] = {
        timeBlocks: state.timeBlocks,
        tasks: state.tasks,
        dailyGoal: state.dailyGoal,
        dailyNotes: state.dailyNotes,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(existingData));
    } catch (error) {
      console.error('Error saving daily planner data:', error);
    }
  },
  
  loadData: () => {
    try {
      const dateKey = Utils.getDateKey();
      const existingData = JSON.parse(localStorage.getItem(CONFIG.storageKey)) || {};
      const dayData = existingData[dateKey];
      
      if (dayData) {
        state.timeBlocks = dayData.timeBlocks || [];
        state.tasks = dayData.tasks || [];
        state.dailyGoal = dayData.dailyGoal || '';
        state.dailyNotes = dayData.dailyNotes || '';
      } else {
        // Reset for new day
        state.timeBlocks = [];
        state.tasks = [];
        state.dailyGoal = '';
        state.dailyNotes = '';
      }
    } catch (error) {
      console.error('Error loading daily planner data:', error);
    }
  }
};

// Daily Planner Management
const DailyPlannerManager = {
  init: () => {
    URLManager.init();
    Storage.loadData();
    DailyPlannerManager.updateUI();
    DailyPlannerManager.setupEventListeners();
    DailyPlannerManager.updateStats();
  },
  
  setupEventListeners: () => {
    // Date navigation
    Utils.$('#prevDay').addEventListener('click', () => DailyPlannerManager.changeDate(-1));
    Utils.$('#nextDay').addEventListener('click', () => DailyPlannerManager.changeDate(1));
    Utils.$('#todayBtn').addEventListener('click', () => DailyPlannerManager.goToToday());
    
    // Time blocks
    Utils.$('#addTimeBlockBtn').addEventListener('click', () => ModalManager.open('timeBlock'));
    Utils.$('#quickFillBtn').addEventListener('click', () => ModalManager.open('quickFill'));
    
    // Tasks
    Utils.$('#quickTaskForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const taskText = Utils.$('#taskInput').value.trim();
      if (taskText) {
        DailyPlannerManager.addTask(taskText);
        Utils.$('#taskInput').value = '';
      }
    });
    
    // Goals and notes
    Utils.$('#saveGoalBtn').addEventListener('click', DailyPlannerManager.saveGoal);
    Utils.$('#saveNotesBtn').addEventListener('click', DailyPlannerManager.saveNotes);
    
    // Character counters
    Utils.$('#dailyGoal').addEventListener('input', DailyPlannerManager.updateGoalCharCount);
    Utils.$('#dailyNotes').addEventListener('input', DailyPlannerManager.updateNotesCharCount);
    
    // Quick actions
    Utils.$('#startPomodoroBtn').addEventListener('click', () => window.open('../pomodoro/pomodoro.html', '_blank'));
    Utils.$('#openCalendarBtn').addEventListener('click', () => window.open('../calendar/calendar.html', '_blank'));
    Utils.$('#exportDayBtn').addEventListener('click', DailyPlannerManager.exportDay);
    Utils.$('#resetDayBtn').addEventListener('click', DailyPlannerManager.resetDay);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key) {
        case 'ArrowLeft':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            DailyPlannerManager.changeDate(-1);
          }
          break;
        case 'ArrowRight':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            DailyPlannerManager.changeDate(1);
          }
          break;
        case 't':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            DailyPlannerManager.goToToday();
          }
          break;
        case 'n':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            Utils.$('#taskInput').focus();
          }
          break;
      }
    });
  },
  
  updateUI: () => {
    DailyPlannerManager.updateDateDisplay();
    DailyPlannerManager.renderTimeBlocks();
    DailyPlannerManager.renderTasks();
    DailyPlannerManager.updateGoalAndNotes();
    DailyPlannerManager.updateStats();
  },
  
  updateDateDisplay: () => {
    const today = new Date();
    const isToday = Utils.getDateKey(today) === Utils.getDateKey();
    
    Utils.$('#selectedDate').textContent = isToday ? 'Today' : 'Selected Day';
    Utils.$('#currentDate').textContent = Utils.formatDate(state.currentDate);
  },
  
  changeDate: (days) => {
    Storage.saveData(); // Save current day before changing
    
    const newDate = new Date(state.currentDate);
    newDate.setDate(newDate.getDate() + days);
    state.currentDate = newDate;
    
    URLManager.updateURL();
    Storage.loadData();
    DailyPlannerManager.updateUI();
    
    Utils.showNotification(`Switched to ${Utils.formatDate(state.currentDate)}`, 'info');
  },
  
  goToToday: () => {
    Storage.saveData();
    state.currentDate = new Date();
    URLManager.updateURL();
    Storage.loadData();
    DailyPlannerManager.updateUI();
    Utils.showNotification('Switched to today', 'info');
  },
  
  // Time Blocks Management
  addTimeBlock: (blockData) => {
    const newBlock = {
      id: Utils.generateId(),
      startTime: blockData.startTime,
      endTime: blockData.endTime,
      activity: blockData.activity,
      category: blockData.category,
      notes: blockData.notes || '',
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    // Check for overlaps
    const hasOverlap = state.timeBlocks.some(block => {
      const newStart = Utils.timeToMinutes(newBlock.startTime);
      const newEnd = Utils.timeToMinutes(newBlock.endTime);
      const existingStart = Utils.timeToMinutes(block.startTime);
      const existingEnd = Utils.timeToMinutes(block.endTime);
      
      return (newStart < existingEnd && newEnd > existingStart);
    });
    
    if (hasOverlap) {
      Utils.showNotification('Time block overlaps with existing block', 'warning');
      return false;
    }
    
    state.timeBlocks.push(newBlock);
    state.timeBlocks.sort((a, b) => Utils.timeToMinutes(a.startTime) - Utils.timeToMinutes(b.startTime));
    
    Storage.saveData();
    DailyPlannerManager.renderTimeBlocks();
    DailyPlannerManager.updateStats();
    
    Utils.showNotification('Time block added successfully! ⏰', 'success');
    return true;
  },
  
  deleteTimeBlock: (id) => {
    if (!confirm('Are you sure you want to delete this time block?')) return;
    
    state.timeBlocks = state.timeBlocks.filter(block => block.id !== id);
    Storage.saveData();
    DailyPlannerManager.renderTimeBlocks();
    DailyPlannerManager.updateStats();
    
    Utils.showNotification('Time block deleted', 'info');
  },
  
  renderTimeBlocks: () => {
    const timeBlocksList = Utils.$('#timeBlocksList');
    const timeBlocksEmpty = Utils.$('#timeBlocksEmpty');
    
    if (state.timeBlocks.length === 0) {
      timeBlocksEmpty.style.display = 'flex';
      timeBlocksList.style.display = 'none';
    } else {
      timeBlocksEmpty.style.display = 'none';
      timeBlocksList.style.display = 'flex';
      
      timeBlocksList.innerHTML = state.timeBlocks.map(block => `
        <div class="time-block-item" data-id="${block.id}">
          <div class="time-block-time">
            <div class="time-start">${Utils.formatTime(block.startTime)}</div>
            <div class="time-separator">to</div>
            <div class="time-end">${Utils.formatTime(block.endTime)}</div>
          </div>
          
          <div class="time-block-content">
            <div class="time-block-activity">${block.activity}</div>
            <div class="time-block-category">${DailyPlannerManager.getCategoryIcon(block.category)} ${block.category}</div>
            ${block.notes ? `<div class="time-block-notes">${block.notes}</div>` : ''}
          </div>
          
          <div class="time-block-actions">
            <button type="button" class="block-action-btn edit" onclick="DailyPlannerManager.editTimeBlock('${block.id}')" 
                    aria-label="Edit time block">
              <span aria-hidden="true">✏️</span>
            </button>
            <button type="button" class="block-action-btn delete" onclick="DailyPlannerManager.deleteTimeBlock('${block.id}')" 
                    aria-label="Delete time block">
              <span aria-hidden="true">🗑️</span>
            </button>
          </div>
        </div>
      `).join('');
    }
  },
  
  getCategoryIcon: (category) => {
    const icons = {
      study: '📚', work: '💼', break: '☕', exercise: '💪',
      meal: '🍽️', personal: '👤', other: '📋'
    };
    return icons[category] || '📋';
  },
  
  // Tasks Management
  addTask: (taskText) => {
    const newTask = {
      id: Utils.generateId(),
      text: taskText,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    state.tasks.push(newTask);
    Storage.saveData();
    DailyPlannerManager.renderTasks();
    DailyPlannerManager.updateStats();
    
    Utils.showNotification('Task added! 📝', 'success');
  },
  
  toggleTask: (id) => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    
    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;
    
    Storage.saveData();
    DailyPlannerManager.renderTasks();
    DailyPlannerManager.updateStats();
    
    const message = task.completed ? 'Task completed! 🎉' : 'Task reopened';
    Utils.showNotification(message, 'success');
  },
  
  deleteTask: (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    state.tasks = state.tasks.filter(t => t.id !== id);
    Storage.saveData();
    DailyPlannerManager.renderTasks();
    DailyPlannerManager.updateStats();
    
    Utils.showNotification('Task deleted', 'info');
  },
  
  renderTasks: () => {
    const tasksList = Utils.$('#tasksList');
    const tasksEmpty = Utils.$('#tasksEmpty');
    
    if (state.tasks.length === 0) {
      tasksEmpty.style.display = 'flex';
      tasksList.style.display = 'none';
    } else {
      tasksEmpty.style.display = 'none';
      tasksList.style.display = 'flex';
      
      tasksList.innerHTML = state.tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
          <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="DailyPlannerManager.toggleTask('${task.id}')">
            ${task.completed ? '✓' : ''}
          </div>
          
          <div class="task-text">${task.text}</div>
          
          <div class="task-actions">
            <button type="button" class="task-action-btn delete" onclick="DailyPlannerManager.deleteTask('${task.id}')" 
                    aria-label="Delete task">
              <span aria-hidden="true">🗑️</span>
            </button>
          </div>
        </div>
      `).join('');
    }
  },
  
  // Goals and Notes
  saveGoal: () => {
    state.dailyGoal = Utils.$('#dailyGoal').value.trim();
    Storage.saveData();
    DailyPlannerManager.updateGoalStatus();
    Utils.showNotification('Goal saved! 🎯', 'success');
  },
  
  saveNotes: () => {
    state.dailyNotes = Utils.$('#dailyNotes').value.trim();
    Storage.saveData();
    Utils.showNotification('Notes saved! 📔', 'success');
  },
  
  updateGoalAndNotes: () => {
    Utils.$('#dailyGoal').value = state.dailyGoal;
    Utils.$('#dailyNotes').value = state.dailyNotes;
    DailyPlannerManager.updateGoalCharCount();
    DailyPlannerManager.updateNotesCharCount();
    DailyPlannerManager.updateGoalStatus();
  },
  
  updateGoalCharCount: () => {
    const textarea = Utils.$('#dailyGoal');
    const counter = Utils.$('#goalCharCount');
    counter.textContent = `${textarea.value.length}/300`;
  },
  
  updateNotesCharCount: () => {
    const textarea = Utils.$('#dailyNotes');
    const counter = Utils.$('#notesCharCount');
    counter.textContent = `${textarea.value.length}/1000`;
  },
  
  updateGoalStatus: () => {
    const statusValue = Utils.$('#goalStatusValue');
    if (state.dailyGoal.trim()) {
      statusValue.textContent = 'Set';
      statusValue.style.color = 'var(--success-color)';
    } else {
      statusValue.textContent = 'Not set';
      statusValue.style.color = 'var(--text-muted)';
    }
  },
  
  // Statistics
  updateStats: () => {
    const completedTasks = state.tasks.filter(t => t.completed).length;
    const totalTasks = state.tasks.length;
    const scheduledTime = DailyPlannerManager.calculateScheduledTime();
    
    Utils.$('#completedTasks').textContent = completedTasks;
    Utils.$('#totalTasks').textContent = totalTasks;
    Utils.$('#scheduledTime').textContent = `${Math.floor(scheduledTime / 60)}h${scheduledTime % 60 ? ` ${scheduledTime % 60}m` : ''}`;
  },
  
  calculateScheduledTime: () => {
    return state.timeBlocks.reduce((total, block) => {
      const start = Utils.timeToMinutes(block.startTime);
      const end = Utils.timeToMinutes(block.endTime);
      return total + (end - start);
    }, 0);
  },
  
  // Template Management
  applyTemplate: (templateName) => {
    const template = CONFIG.templates[templateName];
    if (!template) return;
    
    if (state.timeBlocks.length > 0) {
      if (!confirm('This will replace your current time blocks. Continue?')) {
        return;
      }
    }
    
    state.timeBlocks = template.map(block => ({
      id: Utils.generateId(),
      startTime: block.start,
      endTime: block.end,
      activity: block.activity,
      category: block.category,
      notes: '',
      completed: false,
      createdAt: new Date().toISOString()
    }));
    
    Storage.saveData();
    DailyPlannerManager.renderTimeBlocks();
    DailyPlannerManager.updateStats();
    
    Utils.showNotification(`${templateName.charAt(0).toUpperCase() + templateName.slice(1)} template applied! 📅`, 'success');
  },
  
  // Export and Reset
  exportDay: () => {
    const exportData = {
      date: Utils.getDateKey(),
      dateFormatted: Utils.formatDate(state.currentDate),
      timeBlocks: state.timeBlocks,
      tasks: state.tasks,
      dailyGoal: state.dailyGoal,
      dailyNotes: state.dailyNotes,
      stats: {
        totalTasks: state.tasks.length,
        completedTasks: state.tasks.filter(t => t.completed).length,
        scheduledTime: DailyPlannerManager.calculateScheduledTime()
      },
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-planner-${Utils.getDateKey()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    Utils.showNotification('Daily plan exported! 📤', 'success');
  },
  
  resetDay: () => {
    if (!confirm('Are you sure you want to reset all data for this day? This action cannot be undone.')) {
      return;
    }
    
    state.timeBlocks = [];
    state.tasks = [];
    state.dailyGoal = '';
    state.dailyNotes = '';
    
    Storage.saveData();
    DailyPlannerManager.updateUI();
    
    Utils.showNotification('Day reset successfully', 'info');
  }
};

// Modal Management
const ModalManager = {
  init: () => {
    // Time Block Modal
    Utils.$('#closeTimeBlockModal').addEventListener('click', () => ModalManager.close('timeBlock'));
    Utils.$('#cancelTimeBlock').addEventListener('click', () => ModalManager.close('timeBlock'));
    
    Utils.$('#timeBlockForm').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = {
        startTime: Utils.$('#blockStartTime').value,
        endTime: Utils.$('#blockEndTime').value,
        activity: Utils.$('#blockActivity').value.trim(),
        category: Utils.$('#blockCategory').value,
        notes: Utils.$('#blockNotes').value.trim()
      };
      
      if (!formData.startTime || !formData.endTime || !formData.activity) {
        Utils.showNotification('Please fill in all required fields', 'warning');
        return;
      }
      
      if (Utils.timeToMinutes(formData.startTime) >= Utils.timeToMinutes(formData.endTime)) {
        Utils.showNotification('End time must be after start time', 'warning');
        return;
      }
      
      if (DailyPlannerManager.addTimeBlock(formData)) {
        ModalManager.close('timeBlock');
        // Clear form
        Utils.$('#timeBlockForm').reset();
      }
    });
    
    // Quick Fill Modal
    Utils.$('#closeQuickFillModal').addEventListener('click', () => ModalManager.close('quickFill'));
    
    Utils.$$('.template-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const template = btn.getAttribute('data-template');
        DailyPlannerManager.applyTemplate(template);
        ModalManager.close('quickFill');
      });
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
      const firstInput = modal.querySelector('input, select, textarea');
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
const DailyPlannerApp = {
  init: () => {
    try {
      DailyPlannerManager.init();
      ModalManager.init();
      
      console.log('Daily Planner initialized successfully!');
    } catch (error) {
      console.error('Failed to initialize Daily Planner:', error);
      Utils.showNotification('Failed to initialize app. Please refresh.', 'error');
    }
  }
};

// Global functions for HTML event handlers
window.DailyPlannerManager = DailyPlannerManager;
window.ModalManager = ModalManager;

// Start Application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', DailyPlannerApp.init);
} else {
  DailyPlannerApp.init();
}

// Debug export
if (window.location.hostname === 'localhost') {
  window.DailyPlannerDebug = { 
    state, CONFIG, Utils, URLManager, Storage, DailyPlannerManager, ModalManager 
  };
}
