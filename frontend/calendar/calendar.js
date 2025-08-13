/**
 * Study Bunny Calendar JavaScript
 * Modern ES6+ implementation with accessibility and data persistence
 */

// ===================================
// Configuration and Constants
// ===================================
const CONFIG = {
  monthNames: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayAbbreviations: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  maxEventLength: 500,
  messageTimeout: 3000,
  timeUpdateInterval: 1000,
  storageKey: 'studyBunnyCalendarEvents',
  factsStorageKey: 'studyBunnyFactsHistory'
};

const DAILY_FACTS = [
  "💡 The Eiffel Tower can grow more than 15 cm taller in the summer due to heat expansion.",
  "🧠 Your brain generates enough electricity to power a small light bulb.",
  "🌌 There are more stars in the universe than grains of sand on all Earth's beaches.",
  "🍌 Bananas are berries, but strawberries aren't.",
  "🐙 Octopuses have three hearts and nine brains.",
  "🔥 Venus is hotter than Mercury, even though Mercury is closer to the Sun.",
  "🕰 A day on Venus is longer than a year on Venus.",
  "💧 Water can boil and freeze at the same time — it's called the triple point.",
  "🍯 Honey never spoils. 3,000-year-old jars found in Egyptian tombs were still edible.",
  "🧬 You share 60% of your DNA with bananas.",
  "🚀 The first email was sent in 1971 — before the invention of the internet.",
  "📚 The longest word in English has 189,819 letters — it's the name of a protein.",
  "🌍 Earth is the only planet not named after a god.",
  "🔬 Light from the Sun takes about 8 minutes to reach Earth.",
  "🦠 There are more bacteria in your mouth than people on Earth.",
  "💻 The first computer mouse was made of wood.",
  "🔋 The first battery was invented more than 2,000 years ago in ancient Iraq.",
  "🧊 Antarctica is the driest, windiest, and coldest continent.",
  "⚡ Lightning is hotter than the surface of the Sun.",
  "🎨 Humans can distinguish over 10 million different colors."
];

// ===================================
// State Management
// ===================================
const state = {
  currentDate: new Date(),
  selectedDate: null,
  events: {},
  isModalOpen: false,
  timeInterval: null
};

// ===================================
// Utility Functions
// ===================================
const Utils = {
  $: (selector) => document.querySelector(selector),
  $$: (selector) => document.querySelectorAll(selector),

  formatDate: (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  parseDate: (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  },

  formatTime: (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  },

  formatDateForDisplay: (dateString) => {
    const date = Utils.parseDate(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  isSameDay: (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  },

  isWeekend: (date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  },

  showMessage: (message, type = 'success') => {
    const container = Utils.$('#messageContainer');
    if (!container) return;

    const messageElement = document.createElement('div');
    messageElement.className = `message message--${type}`;
    messageElement.textContent = message;

    container.appendChild(messageElement);

    setTimeout(() => {
      messageElement.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        if (container.contains(messageElement)) {
          container.removeChild(messageElement);
        }
      }, 300);
    }, CONFIG.messageTimeout);
  },

  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

// ===================================
// Storage Management
// ===================================
const Storage = {
  getEvents: () => {
    try {
      const events = localStorage.getItem(CONFIG.storageKey);
      return events ? JSON.parse(events) : {};
    } catch (error) {
      console.error('Error reading events from storage:', error);
      return {};
    }
  },

  saveEvents: (events) => {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(events));
      return true;
    } catch (error) {
      console.error('Error saving events to storage:', error);
      Utils.showMessage('Failed to save event', 'error');
      return false;
    }
  },

  getFactsHistory: () => {
    try {
      const history = localStorage.getItem(CONFIG.factsStorageKey);
      return history ? JSON.parse(history) : {};
    } catch (error) {
      console.error('Error reading facts history:', error);
      return {};
    }
  },

  saveFactsHistory: (history) => {
    try {
      localStorage.setItem(CONFIG.factsStorageKey, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving facts history:', error);
    }
  }
};

// ===================================
// Calendar Rendering
// ===================================
const CalendarRenderer = {
  init: () => {
    CalendarRenderer.monthYearElement = Utils.$('#monthYear');
    CalendarRenderer.calendarDaysElement = Utils.$('#calendarDays');
    CalendarRenderer.render();
  },

  render: () => {
    if (!CalendarRenderer.monthYearElement || !CalendarRenderer.calendarDaysElement) return;

    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    const today = new Date();

    // Update month/year display
    const monthName = CONFIG.monthNames[month];
    CalendarRenderer.monthYearElement.textContent = `${monthName} ${year}`;

    // Calculate calendar layout
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Clear calendar
    CalendarRenderer.calendarDaysElement.innerHTML = '';

    // Add previous month's trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(year, month - 1, day);
      CalendarRenderer.createDayCell(date, true);
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      CalendarRenderer.createDayCell(date, false);
    }

    // Add next month's leading days to complete the grid
    const totalCells = CalendarRenderer.calendarDaysElement.children.length;
    const remainingCells = 42 - totalCells; // 6 rows × 7 days
    
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      CalendarRenderer.createDayCell(date, true);
    }
  },

  createDayCell: (date, isOtherMonth) => {
    const dayCell = document.createElement('div');
    const dateString = Utils.formatDate(date);
    const today = new Date();
    const isToday = Utils.isSameDay(date, today);
    const isWeekend = Utils.isWeekend(date);
    const hasEvent = state.events[dateString];

    // Set up basic properties
    dayCell.className = 'day-cell';
    dayCell.textContent = date.getDate();
    dayCell.setAttribute('role', 'gridcell');
    dayCell.setAttribute('tabindex', isOtherMonth ? '-1' : '0');
    dayCell.setAttribute('data-date', dateString);

    // Add appropriate classes
    if (isOtherMonth) dayCell.classList.add('day-cell--other-month');
    if (isToday) dayCell.classList.add('day-cell--today');
    if (isWeekend) dayCell.classList.add('day-cell--weekend');
    if (hasEvent) dayCell.classList.add('day-cell--has-event');

    // Set accessibility attributes
    const dateLabel = Utils.formatDateForDisplay(dateString);
    dayCell.setAttribute('aria-label', 
      `${dateLabel}${hasEvent ? ', has event' : ''}${isToday ? ', today' : ''}`
    );

    // Add event listeners
    dayCell.addEventListener('click', () => {
      if (!isOtherMonth) {
        CalendarEventHandler.handleDayClick(dateString);
      }
    });

    dayCell.addEventListener('keydown', (e) => {
      CalendarEventHandler.handleDayKeydown(e, dateString);
    });

    CalendarRenderer.calendarDaysElement.appendChild(dayCell);
  },

  navigateMonth: (direction) => {
    const newDate = new Date(state.currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    state.currentDate = newDate;
    CalendarRenderer.render();
    
    // Announce navigation for screen readers
    const monthName = CONFIG.monthNames[newDate.getMonth()];
    const year = newDate.getFullYear();
    Utils.showMessage(`Navigated to ${monthName} ${year}`, 'success');
  }
};

// ===================================
// Event Handling
// ===================================
const CalendarEventHandler = {
  init: () => {
    const prevButton = Utils.$('#prevMonth');
    const nextButton = Utils.$('#nextMonth');
    const closeModalButton = Utils.$('#closeEventModal');
    const eventForm = Utils.$('#eventForm');
    const deleteEventButton = Utils.$('#deleteEvent');
    const eventTextArea = Utils.$('#eventText');

    if (prevButton) {
      prevButton.addEventListener('click', () => CalendarRenderer.navigateMonth(-1));
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => CalendarRenderer.navigateMonth(1));
    }

    if (closeModalButton) {
      closeModalButton.addEventListener('click', Modal.close);
    }

    if (eventForm) {
      eventForm.addEventListener('submit', CalendarEventHandler.handleEventSubmit);
    }

    if (deleteEventButton) {
      deleteEventButton.addEventListener('click', CalendarEventHandler.handleEventDelete);
    }

    if (eventTextArea) {
      eventTextArea.addEventListener('input', CalendarEventHandler.updateCharacterCount);
    }

    // Global keyboard shortcuts
    document.addEventListener('keydown', CalendarEventHandler.handleGlobalKeydown);

    // Modal overlay click to close
    const modalOverlay = Utils.$('#eventModal');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          Modal.close();
        }
      });
    }
  },

  handleDayClick: (dateString) => {
    state.selectedDate = dateString;
    Modal.open(dateString);
  },

  handleDayKeydown: (e, dateString) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        CalendarEventHandler.handleDayClick(dateString);
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown':
        e.preventDefault();
        CalendarEventHandler.handleArrowKeyNavigation(e, dateString);
        break;
    }
  },

  handleArrowKeyNavigation: (e, currentDateString) => {
    const currentDate = Utils.parseDate(currentDateString);
    let newDate = new Date(currentDate);

    switch (e.key) {
      case 'ArrowLeft':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'ArrowRight':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'ArrowUp':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'ArrowDown':
        newDate.setDate(newDate.getDate() + 7);
        break;
    }

    // Check if we need to navigate to a different month
    if (newDate.getMonth() !== currentDate.getMonth()) {
      state.currentDate = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      CalendarRenderer.render();
    }

    // Focus the new date cell
    const newDateString = Utils.formatDate(newDate);
    const newCell = Utils.$(`[data-date="${newDateString}"]`);
    if (newCell && !newCell.classList.contains('day-cell--other-month')) {
      newCell.focus();
    }
  },

  handleGlobalKeydown: (e) => {
    // Modal shortcuts
    if (state.isModalOpen && e.key === 'Escape') {
      Modal.close();
      return;
    }

    // Calendar navigation shortcuts
    if (!state.isModalOpen) {
      switch (e.key) {
        case 'Home':
          e.preventDefault();
          CalendarEventHandler.goToToday();
          break;
        case 'PageUp':
          e.preventDefault();
          CalendarRenderer.navigateMonth(-1);
          break;
        case 'PageDown':
          e.preventDefault();
          CalendarRenderer.navigateMonth(1);
          break;
      }
    }
  },

  handleEventSubmit: (e) => {
    e.preventDefault();
    
    const eventText = Utils.$('#eventText').value.trim();
    const dateString = state.selectedDate;

    if (!dateString) return;

    if (eventText.length > CONFIG.maxEventLength) {
      Utils.showMessage(`Event text is too long. Maximum ${CONFIG.maxEventLength} characters allowed.`, 'error');
      return;
    }

    if (eventText) {
      state.events[dateString] = eventText;
      Utils.showMessage('Event saved successfully!', 'success');
    } else {
      delete state.events[dateString];
      Utils.showMessage('Event removed!', 'success');
    }

    Storage.saveEvents(state.events);
    CalendarRenderer.render();
    Modal.close();
  },

  handleEventDelete: () => {
    const dateString = state.selectedDate;
    if (!dateString) return;

    delete state.events[dateString];
    Storage.saveEvents(state.events);
    Utils.showMessage('Event deleted!', 'success');
    CalendarRenderer.render();
    Modal.close();
  },

  updateCharacterCount: () => {
    const eventText = Utils.$('#eventText');
    const charCount = Utils.$('#charCount');
    
    if (eventText && charCount) {
      const currentLength = eventText.value.length;
      charCount.textContent = currentLength;
      
      if (currentLength > CONFIG.maxEventLength) {
        charCount.style.color = 'var(--error-color)';
      } else if (currentLength > CONFIG.maxEventLength * 0.8) {
        charCount.style.color = 'var(--warning-color)';
      } else {
        charCount.style.color = 'var(--text-muted)';
      }
    }
  },

  goToToday: () => {
    state.currentDate = new Date();
    CalendarRenderer.render();
    
    // Focus today's cell
    const todayString = Utils.formatDate(new Date());
    const todayCell = Utils.$(`[data-date="${todayString}"]`);
    if (todayCell) {
      todayCell.focus();
    }
    
    Utils.showMessage('Navigated to today', 'success');
  }
};

// ===================================
// Modal Management
// ===================================
const Modal = {
  open: (dateString) => {
    const modal = Utils.$('#eventModal');
    const selectedDateElement = Utils.$('#selectedDate');
    const eventTextArea = Utils.$('#eventText');
    const deleteButton = Utils.$('#deleteEvent');

    if (!modal || !selectedDateElement || !eventTextArea) return;

    // Set modal content
    selectedDateElement.textContent = Utils.formatDateForDisplay(dateString);
    eventTextArea.value = state.events[dateString] || '';
    
    // Show/hide delete button based on whether event exists
    if (deleteButton) {
      deleteButton.style.display = state.events[dateString] ? 'inline-flex' : 'none';
    }

    // Update character count
    CalendarEventHandler.updateCharacterCount();

    // Show modal
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    state.isModalOpen = true;

    // Focus the textarea
    setTimeout(() => {
      eventTextArea.focus();
    }, 100);
  },

  close: () => {
    const modal = Utils.$('#eventModal');
    if (!modal) return;

    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    state.isModalOpen = false;
    state.selectedDate = null;

    // Return focus to the previously focused day cell
    const lastFocusedCell = document.activeElement;
    if (lastFocusedCell && lastFocusedCell.classList.contains('day-cell')) {
      lastFocusedCell.focus();
    }
  }
};

// ===================================
// Time Display Management
// ===================================
const TimeDisplay = {
  init: () => {
    TimeDisplay.element = Utils.$('#currentTime');
    TimeDisplay.update();
    
    // Update time every second
    state.timeInterval = setInterval(TimeDisplay.update, CONFIG.timeUpdateInterval);
  },

  update: () => {
    if (!TimeDisplay.element) return;

    const now = new Date();
    const timeString = Utils.formatTime(now);
    const isoString = now.toISOString();

    TimeDisplay.element.textContent = `Current Time: ${timeString}`;
    TimeDisplay.element.setAttribute('datetime', isoString);
  },

  destroy: () => {
    if (state.timeInterval) {
      clearInterval(state.timeInterval);
      state.timeInterval = null;
    }
  }
};

// ===================================
// Daily Facts Management
// ===================================
const FactsManager = {
  init: () => {
    FactsManager.element = Utils.$('#dailyFact .facts-text');
    FactsManager.showDailyFact();
  },

  getDayOfYear: (date = new Date()) => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  },

  getFactOfTheDay: (date = new Date()) => {
    const dayOfYear = FactsManager.getDayOfYear(date);
    const factIndex = dayOfYear % DAILY_FACTS.length;
    return DAILY_FACTS[factIndex];
  },

  showDailyFact: () => {
    if (!FactsManager.element) return;

    const today = new Date();
    const todayString = Utils.formatDate(today);
    const factsHistory = Storage.getFactsHistory();

    // Check if we've already shown a fact today
    if (factsHistory[todayString]) {
      FactsManager.element.textContent = factsHistory[todayString];
    } else {
      const fact = FactsManager.getFactOfTheDay(today);
      FactsManager.element.textContent = fact;
      
      // Save to history
      factsHistory[todayString] = fact;
      Storage.saveFactsHistory(factsHistory);
    }

    // Add animation
    FactsManager.element.classList.add('fade-in');
  }
};

// ===================================
// Application Initialization
// ===================================
const Calendar = {
  init: () => {
    try {
      // Load events from storage
      state.events = Storage.getEvents();

      // Initialize components
      CalendarRenderer.init();
      CalendarEventHandler.init();
      TimeDisplay.init();
      FactsManager.init();

      // Set up cleanup on page unload
      window.addEventListener('beforeunload', () => {
        TimeDisplay.destroy();
      });

      console.log('Study Bunny Calendar initialized successfully!');
    } catch (error) {
      console.error('Failed to initialize calendar:', error);
      Utils.showMessage('Failed to initialize calendar. Please refresh the page.', 'error');
    }
  }
};

// ===================================
// Application Startup
// ===================================
const App = {
  init: () => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', Calendar.init);
    } else {
      Calendar.init();
    }
  }
};

// Start the application
App.init();

// Export for debugging (development only)
if (typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname.includes('127.0.0.1'))) {
  window.CalendarDebug = {
    state,
    CONFIG,
    DAILY_FACTS,
    Utils,
    Storage,
    CalendarRenderer,
    CalendarEventHandler,
    Modal,
    TimeDisplay,
    FactsManager
  };
}