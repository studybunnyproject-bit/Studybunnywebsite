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
  currentOutfit: {
    shirts: null,
    pants: null,
    accessories: null
  },
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

    if (modalType === 'customization') {
      // Ensure outfit layers exist before initializing customization
      BunnyCustomization.createOutfitLayers();
      BunnyCustomization.updateAllOutfits();
      this.initCustomization();
    }
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
        this.updateColorSelection(color);
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
        const category = button.getAttribute('data-category');
        BunnyCustomization.selectOutfit(outfit, category);
        this.updateOutfitSelection(category, outfit);
      });
    });

    // Set initial selections based on current state
    this.updateColorSelection(state.selectedColor);
    this.updateAllOutfitSelections();
    this.showCategory('shirts');
  },

  updateColorSelection(selectedColor) {
    Utils.$$('.color-circle').forEach(btn => btn.setAttribute('aria-checked', 'false'));
    const selectedButton = Utils.$(`[data-color="${selectedColor}"]`);
    if (selectedButton) {
      selectedButton.setAttribute('aria-checked', 'true');
    }
  },

  updateOutfitSelection(category, selectedOutfit) {
    Utils.$$(`[data-category="${category}"]`).forEach(btn => btn.setAttribute('aria-selected', 'false'));
    const selectedButton = Utils.$(`[data-category="${category}"][data-outfit="${selectedOutfit || 'none'}"]`);
    if (selectedButton) {
      selectedButton.setAttribute('aria-selected', 'true');
    }
  },

  updateAllOutfitSelections() {
    Object.keys(state.currentOutfit).forEach(category => {
      this.updateOutfitSelection(category, state.currentOutfit[category]);
    });
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
    const savedOutfit = Storage.get('bunnyOutfit', {
      shirts: null,
      pants: null,
      accessories: null
    });
    
    state.selectedColor = savedColor;
    state.currentEmotion = savedEmotion;
    state.currentOutfit = savedOutfit;
    
    console.log('BunnyCustomization init - State:', {
      color: state.selectedColor,
      emotion: state.currentEmotion,
      outfit: state.currentOutfit
    });
    
    this.updateBunnyImage();
    
    // Wait a moment for DOM to be ready, then create layers
    setTimeout(() => {
      this.createOutfitLayers();
      this.updateAllOutfits();
    }, 100);
  },

  selectColor(color) {
    if (!color) return;
    state.selectedColor = color;
    Storage.set('bunnyColor', color);
    this.updateBunnyImage();
    Utils.notify(`Bunny color changed to ${color}!`, 'success');
  },

  selectOutfit(filename, category) {
    if (!category) return;
    
    // Handle "none" selection
    if (filename === 'none') {
      state.currentOutfit[category] = null;
    } else {
      state.currentOutfit[category] = filename;
    }
    
    // Save to localStorage
    Storage.set('bunnyOutfit', state.currentOutfit);
    
    // Update the specific outfit layer
    this.updateOutfitLayer(category, state.currentOutfit[category]);
    
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    Utils.notify(`${categoryName} updated!`, 'success');
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

  createOutfitLayers() {
    const bunnyWrapper = Utils.$('#bunnyWrapper');
    if (!bunnyWrapper) {
      console.log('Bunny wrapper not found!');
      return;
    }

    // Remove existing outfit layers
    Utils.$$('.outfit-layer').forEach(layer => layer.remove());

    // Create layers in correct order (pants first, accessories last)
    const categories = [
      { name: 'pants', zIndex: 1 },
      { name: 'shirts', zIndex: 2 },
      { name: 'accessories', zIndex: 3 }
    ];
    
    categories.forEach(category => {
      const layer = document.createElement('div');
      layer.className = `outfit-layer ${category.name}`;
      layer.setAttribute('data-category', category.name);
      layer.style.display = 'none'; // Start hidden
      // Don't set positioning inline - let CSS handle it
      // Only set the essentials that CSS doesn't cover
      layer.style.backgroundRepeat = 'no-repeat';
      layer.style.backgroundSize = 'contain';
      layer.style.backgroundPosition = 'center';
      layer.style.pointerEvents = 'none';
      
      bunnyWrapper.appendChild(layer);
      console.log(`Created layer for: ${category.name} - positioned by CSS`);
    });
    
    console.log('All outfit layers created successfully');
    console.log('Layer order in DOM:', Array.from(bunnyWrapper.children).map(child => child.className));
  },

  updateOutfitLayer(category, filename) {
    const layer = Utils.$(`.outfit-layer.${category}`);
    if (!layer) {
      console.log(`Layer not found for category: ${category}`);
      return;
    }

    if (filename && filename !== 'none') {
      const outfitPath = `bunny-outfits/${filename}`;
      layer.style.backgroundImage = `url('${outfitPath}')`;
      layer.style.display = 'block';
      console.log(`Applied outfit: ${outfitPath} to layer: ${category}`);
    } else {
      layer.style.backgroundImage = 'none';
      layer.style.display = 'none';
      console.log(`Removed outfit from layer: ${category}`);
    }
  },

  updateAllOutfits() {
    // Update all outfit layers
    Object.keys(state.currentOutfit).forEach(category => {
      this.updateOutfitLayer(category, state.currentOutfit[category]);
    });
  },

  // Method to get current outfit configuration
  getCurrentOutfit() {
    return {
      color: state.selectedColor,
      emotion: state.currentEmotion,
      outfit: { ...state.currentOutfit }
    };
  },

  // Method to apply a complete outfit configuration
  applyOutfitConfiguration(config) {
    if (config.color) this.selectColor(config.color);
    if (config.emotion) this.setEmotion(config.emotion);
    if (config.outfit) {
      Object.keys(config.outfit).forEach(category => {
        if (config.outfit[category]) {
          this.selectOutfit(config.outfit[category], category);
        }
      });
    }
  }
};

// ===================================
// Currency System (Integrated with CC System)
// ===================================
const CurrencySystem = {
  init() {
    // The new CC system will handle all currency logic
    // Just maintain compatibility for emotion updates
    this.updateEmotionBasedOnActivity();
    
    // Listen for CC updates to update bunny emotions
    document.addEventListener('ccUpdated', (e) => {
      this.updateEmotionBasedOnCC(e.detail.balance);
    });
  },

  updateEmotionBasedOnCC(ccBalance) {
    let newEmotion = CONFIG.defaultEmotion;

    // Emotion boosts from CC progress
    if (ccBalance >= 1.0) {
      newEmotion = 'excited';
    } else if (ccBalance >= 0.3) {
      newEmotion = 'happy';
    }

    BunnyCustomization.setEmotion(newEmotion);
  },

  updateEmotionBasedOnActivity() {
    // Get CC balance from the new system
    const ccBalance = window.StudyBunnyCC ? window.StudyBunnyCC.getBalance() : 0;
    this.updateEmotionBasedOnCC(ccBalance);
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