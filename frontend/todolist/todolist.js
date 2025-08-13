/**
 * Study Bunny Todo List
 * Modern ES6+ implementation with drag & drop, categories, and due dates
 */

// Configuration
const CONFIG = {
  storageKey: 'studyBunnyTodos',
  planLimits: {
    free: 50,
    monthly: 100,
    quarterly: 200,
    annual: Infinity
  },
  categories: {
    general: { name: 'General', icon: '📋', color: '#9e9e9e' },
    study: { name: 'Study', icon: '📚', color: '#2196f3' },
    work: { name: 'Work', icon: '💼', color: '#607d8b' },
    personal: { name: 'Personal', icon: '👤', color: '#e91e63' },
    health: { name: 'Health', icon: '💪', color: '#4caf50' },
    shopping: { name: 'Shopping', icon: '🛒', color: '#ff9800' }
  },
  priorities: {
    low: { name: 'Low', icon: '🟢', color: '#4caf50' },
    medium: { name: 'Medium', icon: '🟡', color: '#ff9800' },
    high: { name: 'High', icon: '🔴', color: '#f44336' }
  }
};

// State
const state = {
  todos: [],
  currentFilter: 'all',
  currentSort: 'dateAdded',
  currentView: 'list',
  showAdvancedOptions: false,
  editingTodo: null,
  draggedTodo: null
};

// Utilities
const Utils = {
  $: (selector) => document.querySelector(selector),
  $$: (selector) => document.querySelectorAll(selector),
  
  generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
  
  formatDate: (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  },
  
  isOverdue: (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date().setHours(0, 0, 0, 0);
  },
  
  isDueSoon: (dueDate) => {
    if (!dueDate) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    return new Date(dueDate) <= tomorrow && !Utils.isOverdue(dueDate);
  },
  
  sanitizeInput: (text) => text.trim().replace(/\s+/g, ' '),
  
  showNotification: (message, type = 'success') => {
    const container = Utils.$('#notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    container.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  },
  
  getUserPlan: () => {
    try {
      const planData = JSON.parse(localStorage.getItem('studyBunnyUserPlan'));
      return planData?.plan || 'free';
    } catch {
      return 'free';
    }
  }
};

// Storage Management
const Storage = {
  saveTodos: () => {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(state.todos));
    } catch (error) {
      console.error('Error saving todos:', error);
      Utils.showNotification('Failed to save tasks', 'error');
    }
  },
  
  loadTodos: () => {
    try {
      const saved = localStorage.getItem(CONFIG.storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading todos:', error);
      return [];
    }
  }
};

// Todo Management
const TodoManager = {
  init: () => {
    state.todos = Storage.loadTodos();
    TodoManager.updateUI();
    TodoManager.setupEventListeners();
  },
  
  setupEventListeners: () => {
    const taskForm = Utils.$('#taskForm');
    const showOptionsBtn = Utils.$('#showOptionsBtn');
    const toggleOptionsBtn = Utils.$('#toggleOptionsBtn');
    
    taskForm.addEventListener('submit', TodoManager.addTodo);
    showOptionsBtn.addEventListener('click', () => TodoManager.toggleAdvancedOptions(true));
    toggleOptionsBtn.addEventListener('click', () => TodoManager.toggleAdvancedOptions(false));
    
    // Filter buttons
    Utils.$$('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Utils.$$('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentFilter = btn.getAttribute('data-filter');
        TodoManager.updateUI();
      });
    });
    
    // Action buttons
    Utils.$('#sortBtn').addEventListener('click', () => ModalManager.open('sort'));
    Utils.$('#clearCompletedBtn').addEventListener('click', TodoManager.clearCompleted);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key) {
        case 'n':
          e.preventDefault();
          Utils.$('#taskInput').focus();
          break;
        case 'Escape':
          TodoManager.toggleAdvancedOptions(false);
          break;
      }
    });
  },
  
  addTodo: (e) => {
    e.preventDefault();
    
    const taskInput = Utils.$('#taskInput');
    const categorySelect = Utils.$('#categorySelect');
    const prioritySelect = Utils.$('#prioritySelect');
    const dueDateInput = Utils.$('#dueDateInput');
    
    const text = Utils.sanitizeInput(taskInput.value);
    if (!text) {
      Utils.showNotification('Please enter a task description', 'warning');
      return;
    }
    
    // Check plan limits
    const userPlan = Utils.getUserPlan();
    const limit = CONFIG.planLimits[userPlan] || CONFIG.planLimits.free;
    
    if (state.todos.length >= limit) {
      Utils.showNotification('Task limit reached for your plan', 'warning');
      window.location.href = '../upgrade-page/upgrade.html';
      return;
    }
    
    const newTodo = {
      id: Utils.generateId(),
      text: text,
      completed: false,
      category: categorySelect.value,
      priority: prioritySelect.value,
      dueDate: dueDateInput.value || null,
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    
    state.todos.unshift(newTodo);
    Storage.saveTodos();
    TodoManager.updateUI();
    
    // Clear form
    taskInput.value = '';
    dueDateInput.value = '';
    taskInput.focus();
    
    // Add animation class
    const taskElement = Utils.$(`.task-item[data-id="${newTodo.id}"]`);
    if (taskElement) {
      taskElement.classList.add('added');
      setTimeout(() => taskElement.classList.remove('added'), 600);
    }
    
    Utils.showNotification('Task added successfully! ✅', 'success');
  },
  
  toggleTodo: (id) => {
    const todo = state.todos.find(t => t.id === id);
    if (!todo) return;
    
    const wasCompleted = todo.completed;
    todo.completed = !todo.completed;
    todo.completedAt = todo.completed ? new Date().toISOString() : null;
    
    // Track CC for newly completed tasks: 10 tasks = 0.1 CC
    if (!wasCompleted && todo.completed) {
      if (window.StudyBunnyCC) {
        window.StudyBunnyCC.trackTodoCompleted(1);
      }
      console.log('✅ Task completed: +1 task for CC tracking');
    }
    
    Storage.saveTodos();
    TodoManager.updateUI();
    
    const message = todo.completed ? 'Task completed! 🎉' : 'Task reopened';
    Utils.showNotification(message, 'success');
  },
  
  editTodo: (id) => {
    const todo = state.todos.find(t => t.id === id);
    if (!todo) return;
    
    state.editingTodo = todo;
    
    // Populate edit form
    Utils.$('#editTaskText').value = todo.text;
    Utils.$('#editCategory').value = todo.category;
    Utils.$('#editPriority').value = todo.priority;
    Utils.$('#editDueDate').value = todo.dueDate || '';
    
    ModalManager.open('edit');
  },
  
  updateTodo: (updatedData) => {
    const todo = state.todos.find(t => t.id === state.editingTodo.id);
    if (!todo) return;
    
    Object.assign(todo, updatedData);
    Storage.saveTodos();
    TodoManager.updateUI();
    
    state.editingTodo = null;
    Utils.showNotification('Task updated successfully! 📝', 'success');
  },
  
  deleteTodo: (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    state.todos = state.todos.filter(t => t.id !== id);
    Storage.saveTodos();
    TodoManager.updateUI();
    
    Utils.showNotification('Task deleted', 'info');
  },
  
  clearCompleted: () => {
    const completedCount = state.todos.filter(t => t.completed).length;
    if (completedCount === 0) {
      Utils.showNotification('No completed tasks to clear', 'info');
    return;
  }

    if (!confirm(`Delete ${completedCount} completed task${completedCount !== 1 ? 's' : ''}?`)) return;
    
    state.todos = state.todos.filter(t => !t.completed);
    Storage.saveTodos();
    TodoManager.updateUI();
    
    Utils.showNotification(`${completedCount} completed task${completedCount !== 1 ? 's' : ''} cleared`, 'success');
  },
  
  toggleAdvancedOptions: (show) => {
    const advancedOptions = Utils.$('#advancedOptions');
    const showOptionsBtn = Utils.$('#showOptionsBtn');
    
    state.showAdvancedOptions = show;
    
    if (show) {
      advancedOptions.style.display = 'flex';
      showOptionsBtn.style.display = 'none';
    } else {
      advancedOptions.style.display = 'none';
      showOptionsBtn.style.display = 'flex';
    }
  },
  
  getFilteredTodos: () => {
    let filtered = [...state.todos];
    
    // Apply filter
    switch (state.currentFilter) {
      case 'pending':
        filtered = filtered.filter(t => !t.completed);
        break;
      case 'completed':
        filtered = filtered.filter(t => t.completed);
        break;
      case 'overdue':
        filtered = filtered.filter(t => !t.completed && Utils.isOverdue(t.dueDate));
        break;
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      switch (state.currentSort) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        
        case 'alphabetical':
          return a.text.localeCompare(b.text);
        
        case 'category':
          return a.category.localeCompare(b.category);
        
        case 'dateAdded':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    
    return filtered;
  },
  
  updateUI: () => {
    TodoManager.updateStats();
    TodoManager.renderTodos();
  },
  
  updateStats: () => {
    const total = state.todos.length;
    const completed = state.todos.filter(t => t.completed).length;
    const pending = total - completed;
    
    Utils.$('#totalTasks').textContent = total;
    Utils.$('#completedTasks').textContent = completed;
    Utils.$('#pendingTasks').textContent = pending;
  },
  
  renderTodos: () => {
    const tasksContainer = Utils.$('#tasksContainer');
    const tasksList = Utils.$('#tasksList');
    const emptyState = Utils.$('#emptyState');
    
    const filteredTodos = TodoManager.getFilteredTodos();
    
    if (filteredTodos.length === 0) {
      emptyState.style.display = 'flex';
      tasksList.style.display = 'none';
    } else {
      emptyState.style.display = 'none';
      tasksList.style.display = 'flex';
      
      tasksList.innerHTML = filteredTodos.map(todo => TodoManager.renderTodoItem(todo)).join('');
      
      // Setup drag and drop
      TodoManager.setupDragAndDrop();
    }
  },
  
  renderTodoItem: (todo) => {
    const category = CONFIG.categories[todo.category];
    const priority = CONFIG.priorities[todo.priority];
    
    let dueDateHtml = '';
    if (todo.dueDate) {
      const isOverdue = Utils.isOverdue(todo.dueDate);
      const isDueSoon = Utils.isDueSoon(todo.dueDate);
      const dateClass = isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : '';
      dueDateHtml = `<span class="task-due-date ${dateClass}">Due: ${Utils.formatDate(todo.dueDate)}</span>`;
    }
    
    return `
      <div class="task-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}" draggable="true">
        <div class="task-checkbox ${todo.completed ? 'checked' : ''}" onclick="TodoManager.toggleTodo('${todo.id}')">
          ${todo.completed ? '✓' : ''}
        </div>
        
        <div class="task-content">
          <div class="task-text">${todo.text}</div>
          <div class="task-meta">
            <span class="task-category ${todo.category}">${category.icon} ${category.name}</span>
            <span class="task-priority ${todo.priority}">${priority.icon} ${priority.name}</span>
            ${dueDateHtml}
          </div>
        </div>
        
        <div class="task-actions">
          <button type="button" class="task-action-btn edit" onclick="TodoManager.editTodo('${todo.id}')" 
                  aria-label="Edit task">
            <span aria-hidden="true">✏️</span>
          </button>
          <button type="button" class="task-action-btn delete" onclick="TodoManager.deleteTodo('${todo.id}')" 
                  aria-label="Delete task">
            <span aria-hidden="true">🗑️</span>
          </button>
        </div>
      </div>
    `;
  },
  
  setupDragAndDrop: () => {
    const taskItems = Utils.$$('.task-item');
    
    taskItems.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        state.draggedTodo = e.target.getAttribute('data-id');
        e.target.classList.add('dragging');
      });
      
      item.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
        Utils.$$('.drop-target').forEach(t => t.classList.remove('drop-target'));
        state.draggedTodo = null;
      });
      
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (state.draggedTodo && e.target.getAttribute('data-id') !== state.draggedTodo) {
          e.target.classList.add('drop-target');
        }
      });
      
      item.addEventListener('dragleave', (e) => {
        e.target.classList.remove('drop-target');
      });
      
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetId = e.target.getAttribute('data-id');
        
        if (state.draggedTodo && targetId && state.draggedTodo !== targetId) {
          TodoManager.reorderTodos(state.draggedTodo, targetId);
        }
        
        e.target.classList.remove('drop-target');
      });
    });
  },
  
  reorderTodos: (draggedId, targetId) => {
    const draggedIndex = state.todos.findIndex(t => t.id === draggedId);
    const targetIndex = state.todos.findIndex(t => t.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const draggedTodo = state.todos.splice(draggedIndex, 1)[0];
    state.todos.splice(targetIndex, 0, draggedTodo);
    
    Storage.saveTodos();
    TodoManager.updateUI();
    
    Utils.showNotification('Tasks reordered', 'info');
  },
  
  sortTodos: (sortType) => {
    state.currentSort = sortType;
    TodoManager.updateUI();
    Utils.showNotification(`Sorted by ${sortType}`, 'info');
  },
  
  changeView: (viewType) => {
    state.currentView = viewType;
    
    const tasksSection = Utils.$('#tasksSection');
    const categoriesSection = Utils.$('#categoriesSection');
    
    if (viewType === 'category') {
      tasksSection.style.display = 'none';
      categoriesSection.style.display = 'block';
      TodoManager.renderCategoryView();
    } else {
      tasksSection.style.display = 'block';
      categoriesSection.style.display = 'none';
      TodoManager.renderTodos();
    }
    
    Utils.showNotification(`Switched to ${viewType} view`, 'info');
  },
  
  renderCategoryView: () => {
    const categoriesContainer = Utils.$('#categoriesContainer');
    const categorizedTodos = {};
    
    // Group todos by category
    TodoManager.getFilteredTodos().forEach(todo => {
      if (!categorizedTodos[todo.category]) {
        categorizedTodos[todo.category] = [];
      }
      categorizedTodos[todo.category].push(todo);
    });
    
    categoriesContainer.innerHTML = Object.entries(categorizedTodos).map(([categoryKey, todos]) => {
      const category = CONFIG.categories[categoryKey];
      return `
        <div class="category-group">
          <h3 class="category-title">
            <span class="category-icon">${category.icon}</span>
            <span class="category-name">${category.name}</span>
            <span class="category-count">(${todos.length})</span>
          </h3>
          <div class="category-tasks">
            ${todos.map(todo => TodoManager.renderTodoItem(todo)).join('')}
          </div>
        </div>
      `;
    }).join('');
  }
};

// Modal Management
const ModalManager = {
  init: () => {
    // Sort modal
    Utils.$('#closeSortModal').addEventListener('click', () => ModalManager.close('sort'));
    Utils.$$('.sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sortType = btn.getAttribute('data-sort');
        TodoManager.sortTodos(sortType);
        ModalManager.close('sort');
      });
    });
    
    // View buttons
    Utils.$('#listViewBtn').addEventListener('click', () => {
      TodoManager.changeView('list');
      ModalManager.close('sort');
    });
    Utils.$('#categoryViewBtn').addEventListener('click', () => {
      TodoManager.changeView('category');
      ModalManager.close('sort');
    });
    
    // Edit modal
    Utils.$('#closeEditModal').addEventListener('click', () => ModalManager.close('edit'));
    Utils.$('#cancelEditBtn').addEventListener('click', () => ModalManager.close('edit'));
    Utils.$('#editForm').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const updatedData = {
        text: Utils.sanitizeInput(Utils.$('#editTaskText').value),
        category: Utils.$('#editCategory').value,
        priority: Utils.$('#editPriority').value,
        dueDate: Utils.$('#editDueDate').value || null
      };
      
      TodoManager.updateTodo(updatedData);
      ModalManager.close('edit');
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

// Application Initialization
const TodoApp = {
  init: () => {
    try {
      TodoManager.init();
      ModalManager.init();
      
      // Set minimum date to today for due date inputs
      const today = new Date().toISOString().split('T')[0];
      Utils.$('#dueDateInput').setAttribute('min', today);
      Utils.$('#editDueDate').setAttribute('min', today);
      
      console.log('Todo List initialized successfully!');
    } catch (error) {
      console.error('Failed to initialize Todo List:', error);
      Utils.showNotification('Failed to initialize app. Please refresh.', 'error');
    }
  }
};

// Global functions for HTML event handlers
window.TodoManager = TodoManager;
window.ModalManager = ModalManager;

// Start Application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', TodoApp.init);
} else {
  TodoApp.init();
}

// Debug export
if (window.location.hostname === 'localhost') {
  window.TodoDebug = { 
    state, CONFIG, Utils, Storage, TodoManager, ModalManager 
  };
}
