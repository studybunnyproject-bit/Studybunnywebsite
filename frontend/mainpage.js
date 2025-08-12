/**
 * Study Bunny Main Page JavaScript
 * Modern ES6+ implementation with proper error handling and accessibility
 */

// ===================================
// Configuration and State Management
// ===================================
const CONFIG = {
  defaultColor: 'white',
  defaultEmotion: 'neutral',
  inactivityThresholds: { warning: 3, penalty: 7 },
  ccRates: { inactivity: { warning: -0.3, penalty: -0.7 }, emotions: { excited: 1.0, happy: 0.3 } }
};

const state = {
  selectedColor: CONFIG.defaultColor,
  currentEmotion: CONFIG.defaultEmotion,
  cc: 0,
  isMenuOpen: false,
  activeModal: null
};

// ===================================
// Utility Functions
// ===================================
const Utils = {
  $: (selector) => document.querySelector(selector),
  $$: (selector) => document.querySelectorAll(selector),
  notify: (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
      color: white; padding: 12px 20px; border-radius: 8px;
      animation: slideInRight 0.3s ease-out;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }
};

// ===================================
// Storage Management
// ===================================
const Storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Storage error: ${key}`, error);
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Storage error: ${key}`, error);
      return false;
    }
  }
};

// ===================================
// Navigation Management (Working Version from Debug)
// ===================================
const Navigation = {
  init() {
    const menuBtn = document.getElementById('menuBtn');
    const verticalMenu = document.getElementById('verticalMenu');
    
    if (!menuBtn || !verticalMenu) {
      console.error('Menu elements not found!');
      return;
    }

    console.log('Menu elements found, setting up navigation...');

    // Simple menu toggle (from working debug version)
    menuBtn.addEventListener('click', function() {
      state.isMenuOpen = !state.isMenuOpen;
      
      if (state.isMenuOpen) {
        verticalMenu.classList.add('show');
        menuBtn.setAttribute('aria-expanded', 'true');
        console.log('Menu opened');
      } else {
        verticalMenu.classList.remove('show');
        menuBtn.setAttribute('aria-expanded', 'false');
        console.log('Menu closed');
      }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (state.isMenuOpen && !menuBtn.contains(e.target) && !verticalMenu.contains(e.target)) {
        state.isMenuOpen = false;
        verticalMenu.classList.remove('show');
        menuBtn.setAttribute('aria-expanded', 'false');
        console.log('Menu closed (clicked outside)');
      }
    });
    
    console.log('Navigation initialized successfully!');
  }
};

// ===================================
// Modal Management
// ===================================
const Modal = {
  init() {
    const customizeBtn = Utils.$('#customizeBtn');
    const loginBtn = Utils.$('#loginBtn');
    const closeCustomizeBtn = Utils.$('#closeCustomizeBtn');
    const closeLoginBtn = Utils.$('#closeLoginBtn');

    if (customizeBtn) customizeBtn.addEventListener('click', () => this.open('customization'));
    if (loginBtn) loginBtn.addEventListener('click', () => this.open('login'));
    if (closeCustomizeBtn) closeCustomizeBtn.addEventListener('click', () => this.close('customization'));
    if (closeLoginBtn) closeLoginBtn.addEventListener('click', () => this.close('login'));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.activeModal) this.close(state.activeModal);
    });
    document.addEventListener('click', (e) => {
      if (state.activeModal && e.target.classList.contains('modal-overlay')) {
        this.close(state.activeModal);
      }
    });
  },

  open(modalType) {
    const modal = Utils.$(`#${modalType}Modal`);
    if (!modal) return;

    state.activeModal = modalType;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');

    if (modalType === 'customization') this.initCustomization();
    if (modalType === 'login') this.initLogin();
  },

  close(modalType) {
    const modal = Utils.$(`#${modalType}Modal`);
    if (!modal) return;

    state.activeModal = null;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  },

  initCustomization() {
    // Color selection
    Utils.$$('.color-circle').forEach(button => {
      button.addEventListener('click', () => {
        const color = button.getAttribute('data-color');
        BunnyCustomization.selectColor(color);
        Utils.$$('.color-circle').forEach(btn => btn.setAttribute('aria-checked', 'false'));
        button.setAttribute('aria-checked', 'true');
      });
    });

    // Category tabs
    Utils.$$('.category-buttons button').forEach(button => {
      button.addEventListener('click', () => {
        const category = button.getAttribute('data-category');
        this.showCategory(category);
        Utils.$$('.category-buttons button').forEach(btn => btn.setAttribute('aria-selected', 'false'));
        button.setAttribute('aria-selected', 'true');
      });
    });

    // Outfit selection
    Utils.$$('.outfit-option').forEach(button => {
      button.addEventListener('click', () => {
        const outfit = button.getAttribute('data-outfit');
        BunnyCustomization.selectOutfit(outfit);
      });
    });

    this.showCategory('shirts');
  },

  showCategory(categoryId) {
    Utils.$$('.category-panel').forEach(panel => {
      panel.classList.remove('active');
      panel.setAttribute('hidden', '');
    });

    const activePanel = Utils.$(`#${categoryId}Panel`);
    if (activePanel) {
      activePanel.classList.add('active');
      activePanel.removeAttribute('hidden');
    }
  },

  initLogin() {
    const form = Utils.$('#loginForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      Authentication.handleLogin();
    });
  }
};

// ===================================
// Authentication System
// ===================================
const Authentication = {
  handleLogin() {
    const username = Utils.$('#username').value;
    const password = Utils.$('#password').value;
    const messageElement = Utils.$('#loginMessage');

    if (username === 'demo' && password === 'demo') {
      messageElement.textContent = 'Login successful!';
      messageElement.className = 'form-message success';
      BunnyCustomization.setEmotion('happy');
      setTimeout(() => {
        Modal.close('login');
        Utils.$('#loginForm').reset();
      }, 1500);
    } else {
      messageElement.textContent = 'Invalid credentials. Try demo/demo';
      messageElement.className = 'form-message error';
      BunnyCustomization.setEmotion('sad');
    }
  }
};

// ===================================
// Bunny Customization System
// ===================================
const BunnyCustomization = {
  init() {
    const savedColor = Storage.get('bunnyColor', CONFIG.defaultColor);
    const savedEmotion = Storage.get('bunnyEmotion', CONFIG.defaultEmotion);
    
    state.selectedColor = savedColor;
    state.currentEmotion = savedEmotion;
    this.updateBunnyImage();
  },

  selectColor(color) {
    if (!color) return;
    state.selectedColor = color;
    Storage.set('bunnyColor', color);
    this.updateBunnyImage();
    Utils.notify(`Bunny color changed to ${color}!`, 'success');
  },

  selectOutfit(filename) {
    if (!filename) return;
    Storage.set('bunnyOutfit', filename);
    this.updateOutfit(filename);
    Utils.notify('Outfit updated!', 'success');
  },

  setEmotion(emotion) {
    if (!emotion || emotion === state.currentEmotion) return;
    state.currentEmotion = emotion;
    Storage.set('bunnyEmotion', emotion);
    this.updateBunnyImage();
  },

  updateBunnyImage() {
    const bunnyImage = Utils.$('#bunnyImg');
    if (!bunnyImage) return;

    const imagePath = `bunny-body/${state.selectedColor}_${state.currentEmotion}.png`;
    bunnyImage.src = imagePath;
    bunnyImage.alt = `${state.selectedColor} bunny feeling ${state.currentEmotion}`;
  },

  updateOutfit(filename) {
    const outfitPath = `bunny-outfits/${filename}`;
    
    // Remove existing outfit styles
    const existingStyles = Utils.$$('style[data-outfit]');
    existingStyles.forEach(style => style.remove());
    
    // Apply new outfit
    const style = document.createElement('style');
    style.setAttribute('data-outfit', filename);
    style.textContent = `
      .bunny-wrapper::after {
        background-image: url('${outfitPath}');
      }
    `;
    document.head.appendChild(style);
  }
};

// ===================================
// Currency System
// ===================================
const CurrencySystem = {
  init() {
    this.loadCC();
    this.checkInactivity();
    this.setupCCWidget();
  },

  loadCC() {
    state.cc = Storage.get('cc', 0);
    this.updateCCDisplay();
  },

  saveCC() {
    Storage.set('cc', state.cc);
  },

  updateCCDisplay() {
    const ccDisplay = Utils.$('#ccAmount');
    if (ccDisplay) {
      ccDisplay.textContent = state.cc.toFixed(2);
    }
  },

  earnCC(amount, reason = '') {
    if (amount <= 0) return;
    state.cc += amount;
    this.saveCC();
    this.updateCCDisplay();
    this.updateEmotionBasedOnActivity();
    if (reason) Utils.notify(`+${amount.toFixed(2)} CC earned! ${reason}`, 'success');
  },

  spendCC(amount, reason = '') {
    if (amount <= 0 || state.cc < amount) {
      Utils.notify('Insufficient CC!', 'error');
      return false;
    }
    state.cc -= amount;
    this.saveCC();
    this.updateCCDisplay();
    if (reason) Utils.notify(`-${amount.toFixed(2)} CC spent on ${reason}`, 'info');
    return true;
  },

  updateEmotionBasedOnActivity() {
    const lastDate = Storage.get('lastActiveDate');
    const today = new Date().toDateString();
    let newEmotion = CONFIG.defaultEmotion;

    if (lastDate) {
      const daysDiff = this.getDaysDifference(lastDate, today);
      if (daysDiff >= CONFIG.inactivityThresholds.penalty) {
        newEmotion = 'sad';
      } else if (daysDiff >= CONFIG.inactivityThresholds.warning) {
        newEmotion = 'bored';
      }
    }

    // Emotion boosts from CC progress
    if (state.cc >= CONFIG.ccRates.emotions.excited) {
      newEmotion = 'excited';
    } else if (state.cc >= CONFIG.ccRates.emotions.happy) {
      newEmotion = 'happy';
    }

    BunnyCustomization.setEmotion(newEmotion);
  },

  checkInactivity() {
    const lastDate = Storage.get('lastActiveDate');
    const today = new Date().toDateString();

    if (lastDate && lastDate !== today) {
      const daysDiff = this.getDaysDifference(lastDate, today);
      
      if (daysDiff >= CONFIG.inactivityThresholds.penalty) {
        const penalty = Math.abs(CONFIG.ccRates.inactivity.penalty);
        state.cc = Math.max(state.cc - penalty, 0);
        Utils.notify(`Lost ${penalty} CC due to inactivity!`, 'error');
      } else if (daysDiff >= CONFIG.inactivityThresholds.warning) {
        const penalty = Math.abs(CONFIG.ccRates.inactivity.warning);
        state.cc = Math.max(state.cc - penalty, 0);
      }

      this.saveCC();
      this.updateCCDisplay();
    }

    Storage.set('lastActiveDate', today);
    this.updateEmotionBasedOnActivity();
  },

  getDaysDifference(date1Str, date2Str) {
    const date1 = new Date(date1Str);
    const date2 = new Date(date2Str);
    const diffTime = Math.abs(date2 - date1);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  },

  setupCCWidget() {
    const ccWidget = Utils.$('#ccWidget');
    if (ccWidget) {
      ccWidget.addEventListener('click', () => {
        window.location.href = 'cc-info.html';
      });
    }
  }
};

// ===================================
// Application Initialization
// ===================================
const App = {
  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
    } else {
      this.initializeComponents();
    }
  },

  initializeComponents() {
    try {
      Navigation.init();
      Modal.init();
      BunnyCustomization.init();
      CurrencySystem.init();
      
      console.log('Study Bunny App initialized successfully!');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      Utils.notify('Failed to initialize app. Please refresh the page.', 'error');
    }
  }
};

// Start the Application
App.init();

// Export for debugging (development only)
if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1'))) {
  window.StudyBunnyDebug = { state, Utils, Storage, Navigation, Modal, BunnyCustomization, Authentication, CurrencySystem };
}