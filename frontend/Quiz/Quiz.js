/**
 * Study Bunny Quiz Creator
 * Modern ES6+ implementation with enhanced question flow and results
 */

// Configuration
const CONFIG = {
  storageKey: 'studyBunnyQuizzes',
  resultsKey: 'studyBunnyQuizResults',
  planLimits: {
    free: 10,
    monthly: 20,
    quarterly: 50,
    annual: Infinity
  },
  grades: {
    A: { min: 90, color: '#4caf50' },
    B: { min: 80, color: '#8bc34a' },
    C: { min: 70, color: '#ff9800' },
    D: { min: 60, color: '#ff5722' },
    F: { min: 0, color: '#f44336' }
  }
};

// State
const state = {
  questions: [],
  currentQuestionIndex: 0,
  userAnswers: [],
  isQuizActive: false,
  timer: null,
  startTime: null,
  timePerQuestion: 30,
  randomizeQuestions: false,
  quizQuestions: [],
  currentSection: 'creation' // 'creation', 'quiz', 'results'
};

// Utilities
const Utils = {
  $: (selector) => document.querySelector(selector),
  $$: (selector) => document.querySelectorAll(selector),
  
  formatTime: (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },
  
  shuffleArray: (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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
  
  calculateGrade: (percentage) => {
    for (const [grade, config] of Object.entries(CONFIG.grades)) {
      if (percentage >= config.min) {
        return { letter: grade, color: config.color };
      }
    }
    return { letter: 'F', color: CONFIG.grades.F.color };
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
  saveQuestions: () => {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(state.questions));
    } catch (error) {
      console.error('Error saving questions:', error);
      Utils.showNotification('Failed to save questions', 'error');
    }
  },
  
  loadQuestions: () => {
    try {
      const saved = localStorage.getItem(CONFIG.storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading questions:', error);
      return [];
    }
  },
  
  saveQuizResult: (result) => {
    try {
      const results = Storage.loadQuizResults();
      results.unshift(result);
      // Keep only last 50 results
      if (results.length > 50) results.splice(50);
      localStorage.setItem(CONFIG.resultsKey, JSON.stringify(results));
    } catch (error) {
      console.error('Error saving result:', error);
    }
  },
  
  loadQuizResults: () => {
    try {
      const saved = localStorage.getItem(CONFIG.resultsKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading results:', error);
      return [];
    }
  }
};

// Question Management
const QuestionManager = {
  init: () => {
    state.questions = Storage.loadQuestions();
    QuestionManager.updateUI();
    QuestionManager.setupEventListeners();
  },
  
  setupEventListeners: () => {
    const form = Utils.$('#quizForm');
    const timeSlider = Utils.$('#timePerQuestion');
    const randomizeCheckbox = Utils.$('#randomizeQuestions');
    
    form.addEventListener('submit', QuestionManager.addQuestion);
    timeSlider.addEventListener('input', QuestionManager.updateTimeValue);
    randomizeCheckbox.addEventListener('change', (e) => {
      state.randomizeQuestions = e.target.checked;
    });
  },
  
  addQuestion: (e) => {
    e.preventDefault();
    
    const questionInput = Utils.$('#questionInput');
    const answerInput = Utils.$('#answerInput');
    const question = Utils.sanitizeInput(questionInput.value);
    const answer = Utils.sanitizeInput(answerInput.value);
    
    if (!question || !answer) {
      Utils.showNotification('Please fill in both question and answer', 'warning');
      return;
    }
    
    // Check plan limits
    const userPlan = Utils.getUserPlan();
    const limit = CONFIG.planLimits[userPlan] || CONFIG.planLimits.free;
    
    if (state.questions.length >= limit) {
      Utils.showNotification('Question limit reached for your plan', 'warning');
      window.location.href = '../upgrade-page/upgrade.html';
      return;
    }
    
    const newQuestion = {
      id: Date.now(),
      question: question,
      answer: answer,
      created: new Date().toISOString()
    };
    
    state.questions.push(newQuestion);
    Storage.saveQuestions();
    QuestionManager.updateUI();
    
    // Clear form
    questionInput.value = '';
    answerInput.value = '';
    questionInput.focus();
    
    Utils.showNotification('Question added successfully! 📝', 'success');
  },
  
  removeQuestion: (id) => {
    state.questions = state.questions.filter(q => q.id !== id);
    Storage.saveQuestions();
    QuestionManager.updateUI();
    Utils.showNotification('Question removed', 'info');
  },
  
  updateTimeValue: () => {
    const slider = Utils.$('#timePerQuestion');
    const valueSpan = Utils.$('#timeValue');
    state.timePerQuestion = parseInt(slider.value);
    valueSpan.textContent = `${state.timePerQuestion}s`;
  },
  
  updateUI: () => {
    const questionsList = Utils.$('#questionsList');
    const questionCount = Utils.$('#questionCount');
    const startBtn = Utils.$('#startQuizBtn');
    
    questionCount.textContent = `${state.questions.length} question${state.questions.length !== 1 ? 's' : ''}`;
    
    if (state.questions.length === 0) {
      questionsList.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📝</span>
          <p>No questions added yet. Create your first question above!</p>
        </div>
      `;
      startBtn.disabled = true;
    } else {
      questionsList.innerHTML = state.questions.map(q => `
        <div class="question-item" data-id="${q.id}">
          <div class="question-content">
            <div class="question-text">${q.question}</div>
            <div class="question-answer">Answer: ${q.answer}</div>
          </div>
          <div class="question-actions">
            <button type="button" class="action-btn" onclick="QuestionManager.removeQuestion(${q.id})" 
                    aria-label="Remove question">
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>
      `).join('');
      startBtn.disabled = false;
    }
  }
};

// Quiz Management
const QuizManager = {
  start: () => {
    if (state.questions.length === 0) {
      Utils.showNotification('Add some questions first!', 'warning');
      return;
    }
    
    // Prepare quiz
    state.quizQuestions = state.randomizeQuestions 
      ? Utils.shuffleArray(state.questions)
      : [...state.questions];
    
    state.currentQuestionIndex = 0;
    state.userAnswers = [];
    state.isQuizActive = true;
    state.startTime = Date.now();
    
    // Switch to quiz section
    QuizManager.showSection('quiz');
    QuizManager.showQuestion();
    QuizManager.startTimer();
    
    Utils.showNotification('Quiz started! Good luck! 🍀', 'success');
  },
  
  showSection: (section) => {
    const sections = ['creation', 'quiz', 'results'];
    sections.forEach(s => {
      const element = Utils.$(`#${s}Section`);
      if (element) {
        if (s === section) {
          element.removeAttribute('hidden');
        } else {
          element.setAttribute('hidden', '');
        }
      }
    });
    state.currentSection = section;
  },
  
  showQuestion: () => {
    const question = state.quizQuestions[state.currentQuestionIndex];
    
    // Update question text
    Utils.$('#questionText').textContent = question.question;
    
    // Update progress
    const progress = ((state.currentQuestionIndex + 1) / state.quizQuestions.length) * 100;
    Utils.$('#progressFill').style.width = `${progress}%`;
    Utils.$('#currentQuestion').textContent = state.currentQuestionIndex + 1;
    Utils.$('#totalQuestions').textContent = state.quizQuestions.length;
    
    // Clear answer input and focus
    const answerInput = Utils.$('#userAnswer');
    answerInput.value = '';
    answerInput.focus();
  },
  
  startTimer: () => {
    if (state.timer) clearInterval(state.timer);
    
    let timeLeft = state.timePerQuestion;
    const timerText = Utils.$('#timerText');
    const timerCircle = Utils.$('#timerCircle');
    const circumference = 2 * Math.PI * 35; // radius = 35
    
    timerCircle.style.strokeDasharray = circumference;
    
    const updateTimer = () => {
      timerText.textContent = timeLeft;
      
      const progress = (state.timePerQuestion - timeLeft) / state.timePerQuestion;
      const offset = circumference - (progress * circumference);
      timerCircle.style.strokeDashoffset = offset;
      
      // Add urgent class when time is running low
      const timerContainer = Utils.$('.timer-container');
      if (timeLeft <= 5) {
        timerContainer.classList.add('timer-urgent');
      } else {
        timerContainer.classList.remove('timer-urgent');
      }
      
      if (timeLeft <= 0) {
        QuizManager.submitAnswer(''); // Auto-submit empty answer
      } else {
        timeLeft--;
      }
    };
    
    updateTimer(); // Initial call
    state.timer = setInterval(updateTimer, 1000);
  },
  
  submitAnswer: (userAnswer = null) => {
    if (!state.isQuizActive) return;
    
    if (userAnswer === null) {
      userAnswer = Utils.sanitizeInput(Utils.$('#userAnswer').value);
    }
    
    const currentQuestion = state.quizQuestions[state.currentQuestionIndex];
    const isCorrect = userAnswer.toLowerCase() === currentQuestion.answer.toLowerCase();
    
    // Track CC for correct answers: 10 correct = 0.1 CC
    if (isCorrect) {
      if (window.StudyBunnyCC) {
        window.StudyBunnyCC.trackQuizCorrect(1);
      }
      console.log('💡 Quiz answer correct: +1 correct answer for CC tracking');
    }
    
    // Store answer
    state.userAnswers.push({
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      correctAnswer: currentQuestion.answer,
      userAnswer: userAnswer,
      isCorrect: isCorrect,
      timeSpent: state.timePerQuestion - parseInt(Utils.$('#timerText').textContent)
    });
    
    // Move to next question or end quiz
    state.currentQuestionIndex++;
    
    if (state.currentQuestionIndex < state.quizQuestions.length) {
      QuizManager.showQuestion();
      QuizManager.startTimer();
    } else {
      QuizManager.endQuiz();
    }
  },
  
  skipQuestion: () => {
    QuizManager.submitAnswer('');
  },
  
  endQuiz: () => {
    state.isQuizActive = false;
    if (state.timer) clearInterval(state.timer);
    
    const endTime = Date.now();
    const totalTime = Math.floor((endTime - state.startTime) / 1000);
    const correctAnswers = state.userAnswers.filter(a => a.isCorrect).length;
    const percentage = Math.round((correctAnswers / state.userAnswers.length) * 100);
    const grade = Utils.calculateGrade(percentage);
    
    // Save result
    const result = {
      id: Date.now(),
      date: new Date().toISOString(),
      totalQuestions: state.userAnswers.length,
      correctAnswers: correctAnswers,
      percentage: percentage,
      grade: grade.letter,
      totalTime: totalTime,
      answers: state.userAnswers
    };
    
    Storage.saveQuizResult(result);
    
    // Show results
    QuizManager.showResults(result);
    QuizManager.showSection('results');
    
    Utils.showNotification('Quiz completed! 🎉', 'success');
  },
  
  showResults: (result) => {
    // Update score display
    Utils.$('#scorePercentage').textContent = `${result.percentage}%`;
    Utils.$('#correctAnswers').textContent = result.correctAnswers;
    Utils.$('#incorrectAnswers').textContent = result.totalQuestions - result.correctAnswers;
    Utils.$('#totalTime').textContent = Utils.formatTime(result.totalTime);
    Utils.$('#finalGrade').textContent = result.grade;
    
    // Update grade color
    const gradeConfig = CONFIG.grades[result.grade];
    const scoreCircle = Utils.$('.score-circle');
    scoreCircle.style.background = `linear-gradient(135deg, ${gradeConfig.color}, ${gradeConfig.color}dd)`;
    
    // Show detailed results
    const resultsList = Utils.$('#resultsList');
    resultsList.innerHTML = result.answers.map((answer, index) => `
      <div class="result-item">
        <div class="result-icon ${answer.isCorrect ? 'correct' : 'incorrect'}">
          ${answer.isCorrect ? '✓' : '✗'}
        </div>
        <div class="result-content">
          <div class="result-question">${index + 1}. ${answer.question}</div>
          <div class="result-answer">
            Your answer: <span class="result-user-answer">${answer.userAnswer || '(no answer)'}</span>
            ${!answer.isCorrect ? `<br>Correct answer: <span class="result-correct-answer">${answer.correctAnswer}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  },
  
  retake: () => {
    if (confirm('Are you sure you want to retake the quiz? Your current results will be lost.')) {
      QuizManager.start();
    }
  },
  
  createNew: () => {
    if (confirm('Are you sure you want to create a new quiz? This will reset everything.')) {
      state.questions = [];
      state.userAnswers = [];
      Storage.saveQuestions();
      QuizManager.showSection('creation');
      QuestionManager.updateUI();
    }
  }
};

// Event Handlers
const EventHandlers = {
  init: () => {
    // Quiz form
    const answerForm = Utils.$('#answerForm');
    answerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      QuizManager.submitAnswer();
    });
    
    // Control buttons
    Utils.$('#startQuizBtn').addEventListener('click', QuizManager.start);
    Utils.$('#skipBtn').addEventListener('click', QuizManager.skipQuestion);
    Utils.$('#retakeBtn').addEventListener('click', QuizManager.retake);
    Utils.$('#createNewBtn').addEventListener('click', QuizManager.createNew);
    Utils.$('#saveResultsBtn').addEventListener('click', () => {
      Utils.showNotification('Results saved to your history! 💾', 'success');
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key) {
        case 'Enter':
          if (state.currentSection === 'quiz') {
            e.preventDefault();
            QuizManager.submitAnswer();
          }
          break;
        case ' ':
          if (state.currentSection === 'quiz') {
            e.preventDefault();
            QuizManager.skipQuestion();
          }
          break;
        case 'Escape':
          if (state.currentSection === 'quiz') {
            if (confirm('Are you sure you want to exit the quiz?')) {
              QuizManager.showSection('creation');
              state.isQuizActive = false;
              if (state.timer) clearInterval(state.timer);
            }
          }
          break;
      }
    });
  }
};

// Application Initialization
const QuizApp = {
  init: () => {
    try {
      QuestionManager.init();
      EventHandlers.init();
      
      // Initialize time slider
      QuestionManager.updateTimeValue();
      
      console.log('Quiz Creator initialized successfully!');
    } catch (error) {
      console.error('Failed to initialize Quiz Creator:', error);
      Utils.showNotification('Failed to initialize app. Please refresh.', 'error');
    }
  }
};

// Global functions for HTML event handlers
window.QuestionManager = QuestionManager;
window.QuizManager = QuizManager;

// Start Application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', QuizApp.init);
} else {
  QuizApp.init();
}

// Debug export
if (window.location.hostname === 'localhost') {
  window.QuizDebug = { 
    state, CONFIG, Utils, Storage, QuestionManager, QuizManager 
  };
}
