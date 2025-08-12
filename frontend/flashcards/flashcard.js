/**
 * Study Bunny Flashcards JavaScript
 * Modern ES6+ implementation with accessibility and data persistence
 */

// ===================================
// Configuration and Constants
// ===================================
const CONFIG = {
  maxQuestionLength: 200,
  maxAnswerLength: 200,
  maxFlashcards: 50,
  notificationTimeout: 3000,
  storageKey: 'studyBunnyFlashcards',
  statsStorageKey: 'studyBunnyStats'
};

// ===================================
// State Management
// ===================================
const state = {
  flashcards: [],
  currentMode: 'creator', // 'creator' or 'study'
  studySession: {
    currentIndex: 0,
    isFlipped: false,
    correctCount: 0,
    wrongCount: 0,
    totalCards: 0
  },
  deleteTarget: null
};

// ===================================
// Utility Functions
// ===================================
const Utils = {
  $: (selector) => document.querySelector(selector),
  $$: (selector) => document.querySelectorAll(selector),

  generateId: () => Math.random().toString(36).substr(2, 9),

  sanitizeInput: (text) => text.trim().replace(/\s+/g, ' '),

  validateText: (text, maxLength) => {
    if (!text || text.length === 0) {
      return { valid: false, error: 'This field is required' };
    }
    if (text.length > maxLength) {
      return { valid: false, error: `Maximum ${maxLength} characters allowed` };
    }
    return { valid: true, error: '' };
  },

  showNotification: (message, type = 'success') => {
    const container = Utils.$('#notificationContainer');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        if (container.contains(notification)) {
          container.removeChild(notification);
        }
      }, 300);
    }, CONFIG.notificationTimeout);
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
  getFlashcards: () => {
    try {
      const cards = localStorage.getItem(CONFIG.storageKey);
      return cards ? JSON.parse(cards) : [];
    } catch (error) {
      console.error('Error reading flashcards from storage:', error);
      return [];
    }
  },

  saveFlashcards: (flashcards) => {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(flashcards));
      return true;
    } catch (error) {
      console.error('Error saving flashcards to storage:', error);
      Utils.showNotification('Failed to save flashcards', 'error');
      return false;
    }
  },

  getStats: () => {
    try {
      const stats = localStorage.getItem(CONFIG.statsStorageKey);
      return stats ? JSON.parse(stats) : {
        totalStudySessions: 0,
        totalCardsStudied: 0,
        totalCorrect: 0,
        bestScore: 0
      };
    } catch (error) {
      console.error('Error reading stats from storage:', error);
      return { totalStudySessions: 0, totalCardsStudied: 0, totalCorrect: 0, bestScore: 0 };
    }
  },

  saveStats: (stats) => {
    try {
      localStorage.setItem(CONFIG.statsStorageKey, JSON.stringify(stats));
    } catch (error) {
      console.error('Error saving stats to storage:', error);
    }
  }
};

// ===================================
// Flashcard Management
// ===================================
const FlashcardManager = {
  init: () => {
    state.flashcards = Storage.getFlashcards();
    FlashcardManager.renderList();
    FlashcardManager.updateCardCount();
  },

  add: (question, answer) => {
    const questionValidation = Utils.validateText(question, CONFIG.maxQuestionLength);
    const answerValidation = Utils.validateText(answer, CONFIG.maxAnswerLength);

    if (!questionValidation.valid) {
      FormHandler.showError('questionInput', questionValidation.error);
      return false;
    }

    if (!answerValidation.valid) {
      FormHandler.showError('answerInput', answerValidation.error);
      return false;
    }

    if (state.flashcards.length >= CONFIG.maxFlashcards) {
      Utils.showNotification(`Maximum ${CONFIG.maxFlashcards} flashcards allowed`, 'warning');
      return false;
    }

    const flashcard = {
      id: Utils.generateId(),
      question: Utils.sanitizeInput(question),
      answer: Utils.sanitizeInput(answer),
      createdAt: new Date().toISOString(),
      studyCount: 0,
      correctCount: 0
    };

    state.flashcards.push(flashcard);
    Storage.saveFlashcards(state.flashcards);
    FlashcardManager.renderList();
    FlashcardManager.updateCardCount();
    Utils.showNotification('Flashcard added successfully!', 'success');
    return true;
  },

  delete: (id) => {
    const index = state.flashcards.findIndex(card => card.id === id);
    if (index === -1) return false;

    state.flashcards.splice(index, 1);
    Storage.saveFlashcards(state.flashcards);
    FlashcardManager.renderList();
    FlashcardManager.updateCardCount();
    Utils.showNotification('Flashcard deleted', 'success');
    return true;
  },

  renderList: () => {
    const container = Utils.$('#flashcardList');
    if (!container) return;

    if (state.flashcards.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon" aria-hidden="true">📝</span>
          <p class="empty-text">No flashcards yet. Create your first one above!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = state.flashcards.map((card, index) => `
      <div class="flashcard-item" role="listitem">
        <div class="item-header">
          <span class="item-title">Flashcard ${index + 1}</span>
          <button 
            type="button" 
            class="delete-btn" 
            onclick="FlashcardManager.confirmDelete('${card.id}')"
            aria-label="Delete flashcard ${index + 1}"
          >
            ✕
          </button>
        </div>
        <div class="item-content">
          <div class="content-section">
            <div class="content-label">Question:</div>
            <div class="content-text">${card.question}</div>
          </div>
          <div class="content-section">
            <div class="content-label">Answer:</div>
            <div class="content-text">${card.answer}</div>
          </div>
        </div>
      </div>
    `).join('');
  },

  updateCardCount: () => {
    const countElement = Utils.$('#cardCount');
    if (countElement) {
      countElement.textContent = `(${state.flashcards.length})`;
    }
  },

  confirmDelete: (id) => {
    state.deleteTarget = id;
    Modal.open('delete');
  }
};

// ===================================
// Form Handling
// ===================================
const FormHandler = {
  init: () => {
    const form = Utils.$('#flashcardForm');
    const questionInput = Utils.$('#questionInput');
    const answerInput = Utils.$('#answerInput');

    if (form) {
      form.addEventListener('submit', FormHandler.handleSubmit);
    }

    if (questionInput) {
      questionInput.addEventListener('input', Utils.debounce(() => {
        FormHandler.clearError('questionInput');
      }, 300));
    }

    if (answerInput) {
      answerInput.addEventListener('input', Utils.debounce(() => {
        FormHandler.clearError('answerInput');
      }, 300));
    }
  },

  handleSubmit: (e) => {
    e.preventDefault();
    
    const questionInput = Utils.$('#questionInput');
    const answerInput = Utils.$('#answerInput');
    
    if (!questionInput || !answerInput) return;

    const question = questionInput.value;
    const answer = answerInput.value;

    FormHandler.clearAllErrors();

    if (FlashcardManager.add(question, answer)) {
      questionInput.value = '';
      answerInput.value = '';
      questionInput.focus();
    }
  },

  showError: (inputId, message) => {
    const input = Utils.$(`#${inputId}`);
    const errorElement = Utils.$(`#${inputId.replace('Input', 'Error')}`);
    
    if (input) input.classList.add('error');
    if (errorElement) errorElement.textContent = message;
  },

  clearError: (inputId) => {
    const input = Utils.$(`#${inputId}`);
    const errorElement = Utils.$(`#${inputId.replace('Input', 'Error')}`);
    
    if (input) input.classList.remove('error');
    if (errorElement) errorElement.textContent = '';
  },

  clearAllErrors: () => {
    FormHandler.clearError('questionInput');
    FormHandler.clearError('answerInput');
  }
};

// ===================================
// Study Mode Management
// ===================================
const StudyMode = {
  init: () => {
    const startBtn = Utils.$('#startStudyBtn');
    const exitBtn = Utils.$('#exitStudyBtn');
    const correctBtn = Utils.$('#correctBtn');
    const wrongBtn = Utils.$('#wrongBtn');
    const flashcard = Utils.$('#studyCard');

    if (startBtn) startBtn.addEventListener('click', StudyMode.start);
    if (exitBtn) exitBtn.addEventListener('click', StudyMode.exit);
    if (correctBtn) correctBtn.addEventListener('click', () => StudyMode.answer(true));
    if (wrongBtn) wrongBtn.addEventListener('click', () => StudyMode.answer(false));
    
    if (flashcard) {
      flashcard.addEventListener('click', StudyMode.flip);
      flashcard.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          StudyMode.flip();
        }
      });
    }

    // Global keyboard shortcuts for study mode
    document.addEventListener('keydown', StudyMode.handleKeydown);
  },

  start: () => {
    if (state.flashcards.length === 0) {
      Utils.showNotification('No flashcards to study', 'warning');
      return;
    }

    state.currentMode = 'study';
    state.studySession = {
      currentIndex: 0,
      isFlipped: false,
      correctCount: 0,
      wrongCount: 0,
      totalCards: state.flashcards.length
    };

    // Shuffle flashcards for variety
    state.flashcards = state.flashcards.sort(() => Math.random() - 0.5);

    StudyMode.showStudySection();
    StudyMode.renderCard();
    StudyMode.updateProgress();
  },

  exit: () => {
    state.currentMode = 'creator';
    StudyMode.showCreatorSection();
  },

  showStudySection: () => {
    const creatorSection = Utils.$('#creatorSection');
    const studySection = Utils.$('#studySection');
    
    if (creatorSection) creatorSection.style.display = 'none';
    if (studySection) {
      studySection.removeAttribute('hidden');
      studySection.style.display = 'block';
    }
  },

  showCreatorSection: () => {
    const creatorSection = Utils.$('#creatorSection');
    const studySection = Utils.$('#studySection');
    
    if (studySection) {
      studySection.setAttribute('hidden', '');
      studySection.style.display = 'none';
    }
    if (creatorSection) creatorSection.style.display = 'block';
  },

  renderCard: () => {
    const card = state.flashcards[state.studySession.currentIndex];
    if (!card) return;

    const questionText = Utils.$('#questionText');
    const answerText = Utils.$('#answerText');
    const flashcard = Utils.$('#studyCard');

    if (questionText) questionText.textContent = card.question;
    if (answerText) answerText.textContent = card.answer;
    
    // Reset card to front side
    state.studySession.isFlipped = false;
    if (flashcard) flashcard.classList.remove('flipped');

    // Update study count
    card.studyCount = (card.studyCount || 0) + 1;
  },

  flip: () => {
    const flashcard = Utils.$('#studyCard');
    if (!flashcard) return;

    state.studySession.isFlipped = !state.studySession.isFlipped;
    flashcard.classList.toggle('flipped');
  },

  answer: (isCorrect) => {
    if (!state.studySession.isFlipped) {
      Utils.showNotification('Please flip the card to see the answer first', 'warning');
      return;
    }

    const card = state.flashcards[state.studySession.currentIndex];
    
    if (isCorrect) {
      state.studySession.correctCount++;
      card.correctCount = (card.correctCount || 0) + 1;
    } else {
      state.studySession.wrongCount++;
    }

    StudyMode.nextCard();
  },

  nextCard: () => {
    state.studySession.currentIndex++;
    
    if (state.studySession.currentIndex >= state.studySession.totalCards) {
      StudyMode.showResults();
    } else {
      StudyMode.renderCard();
      StudyMode.updateProgress();
    }

    // Save updated flashcard stats
    Storage.saveFlashcards(state.flashcards);
  },

  updateProgress: () => {
    const progressText = Utils.$('#progressText');
    const progressFill = Utils.$('#progressFill');
    const progressBar = Utils.$('.progress-bar');

    const current = state.studySession.currentIndex + 1;
    const total = state.studySession.totalCards;
    const percentage = (current / total) * 100;

    if (progressText) {
      progressText.textContent = `Card ${current} of ${total}`;
    }

    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }

    if (progressBar) {
      progressBar.setAttribute('aria-valuenow', percentage);
    }
  },

  showResults: () => {
    const { correctCount, wrongCount, totalCards } = state.studySession;
    const percentage = Math.round((correctCount / totalCards) * 100);
    
    let grade = 'F';
    let gradeClass = 'grade-f';
    
    if (percentage >= 90) { grade = 'A'; gradeClass = 'grade-a'; }
    else if (percentage >= 80) { grade = 'B'; gradeClass = 'grade-b'; }
    else if (percentage >= 70) { grade = 'C'; gradeClass = 'grade-c'; }
    else if (percentage >= 60) { grade = 'D'; gradeClass = 'grade-d'; }

    const scoreDisplay = Utils.$('#scoreDisplay');
    if (scoreDisplay) {
      scoreDisplay.innerHTML = `
        <h2 class="score-title">Study Session Complete! 🎉</h2>
        <div class="score-stats">
          <div class="score-stat">
            <span class="stat-value">${correctCount}</span>
            <div class="stat-label">Correct</div>
          </div>
          <div class="score-stat">
            <span class="stat-value">${wrongCount}</span>
            <div class="stat-label">Wrong</div>
          </div>
          <div class="score-stat">
            <span class="stat-value">${percentage}%</span>
            <div class="stat-label">Score</div>
          </div>
        </div>
        <div class="grade-display ${gradeClass}">
          Grade: ${grade}
        </div>
        <button type="button" class="btn btn--primary" onclick="StudyMode.restart()">
          Study Again
        </button>
      `;
      scoreDisplay.removeAttribute('hidden');
    }

    // Update and save stats
    StudyMode.updateStats(percentage);
    Utils.showNotification(`Study session complete! You scored ${percentage}%`, 'success');
  },

  updateStats: (percentage) => {
    const stats = Storage.getStats();
    stats.totalStudySessions++;
    stats.totalCardsStudied += state.studySession.totalCards;
    stats.totalCorrect += state.studySession.correctCount;
    stats.bestScore = Math.max(stats.bestScore, percentage);
    Storage.saveStats(stats);
  },

  restart: () => {
    const scoreDisplay = Utils.$('#scoreDisplay');
    if (scoreDisplay) {
      scoreDisplay.setAttribute('hidden', '');
    }
    StudyMode.start();
  },

  handleKeydown: (e) => {
    if (state.currentMode !== 'study') return;

    switch (e.key) {
      case 'Escape':
        StudyMode.exit();
        break;
      case ' ':
      case 'Enter':
        if (e.target.id !== 'studyCard') {
          e.preventDefault();
          StudyMode.flip();
        }
        break;
      case '1':
        if (state.studySession.isFlipped) {
          e.preventDefault();
          StudyMode.answer(true);
        }
        break;
      case '2':
        if (state.studySession.isFlipped) {
          e.preventDefault();
          StudyMode.answer(false);
        }
        break;
    }
  }
};

// ===================================
// Modal Management
// ===================================
const Modal = {
  init: () => {
    const closeDeleteBtn = Utils.$('#closeDeleteModal');
    const confirmDeleteBtn = Utils.$('#confirmDeleteBtn');
    const cancelDeleteBtn = Utils.$('#cancelDeleteBtn');
    const deleteModal = Utils.$('#deleteModal');

    if (closeDeleteBtn) closeDeleteBtn.addEventListener('click', () => Modal.close('delete'));
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', Modal.confirmDelete);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', () => Modal.close('delete'));

    if (deleteModal) {
      deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
          Modal.close('delete');
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        Modal.close('delete');
      }
    });
  },

  open: (modalType) => {
    const modal = Utils.$(`#${modalType}Modal`);
    if (!modal) return;

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  },

  close: (modalType) => {
    const modal = Utils.$(`#${modalType}Modal`);
    if (!modal) return;

    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    state.deleteTarget = null;
  },

  confirmDelete: () => {
    if (state.deleteTarget) {
      FlashcardManager.delete(state.deleteTarget);
      Modal.close('delete');
    }
  }
};

// ===================================
// Application Initialization
// ===================================
const FlashcardApp = {
  init: () => {
    try {
      FlashcardManager.init();
      FormHandler.init();
      StudyMode.init();
      Modal.init();

      console.log('Study Bunny Flashcards initialized successfully!');
    } catch (error) {
      console.error('Failed to initialize flashcard app:', error);
      Utils.showNotification('Failed to initialize app. Please refresh the page.', 'error');
    }
  }
};

// ===================================
// Application Startup
// ===================================
const App = {
  init: () => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', FlashcardApp.init);
    } else {
      FlashcardApp.init();
    }
  }
};

// Start the application
App.init();

// Export for debugging (development only)
if (typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname.includes('127.0.0.1'))) {
  window.FlashcardDebug = {
    state,
    CONFIG,
    Utils,
    Storage,
    FlashcardManager,
    FormHandler,
    StudyMode,
    Modal
  };
}