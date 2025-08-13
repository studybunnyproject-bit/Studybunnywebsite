/**
 * Study Bunny Upgrade Page
 * Modern payment integration with enhanced UX
 */

// Configuration
const CONFIG = {
  flutterwavePublicKey: "FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxx-X", // Replace with actual test key
  plans: {
    monthly: {
      name: "Monthly Plan",
      amount: 4.99,
      currency: "USD",
      features: ["20 Flashcards", "20 Quiz Questions", "50 Todo Tasks", "1,000 Words in Notes"]
    },
    quarterly: {
      name: "Quarterly Plan", 
      amount: 9.99,
      currency: "USD",
      features: ["50 Flashcards", "50 Quiz Questions", "100 Todo Tasks", "1,500 Words in Notes"]
    },
    annual: {
      name: "Annual Plan",
      amount: 39.99,
      currency: "USD", 
      features: ["Unlimited Everything", "All Premium Features", "Priority Support"]
    }
  },
  storageKeys: {
    userPlan: 'studyBunnyUserPlan',
    lastPage: 'studyBunnyLastPage',
    userData: 'studyBunnyUserData'
  }
};

// State
const state = {
  selectedPlan: null,
  isProcessing: false,
  userEmail: null
};

// Utilities
const Utils = {
  $: (selector) => document.querySelector(selector),
  $$: (selector) => document.querySelectorAll(selector),
  
  generateTxRef: () => `sb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  
  formatCurrency: (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },
  
  showNotification: (message, type = 'success') => {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      color: white;
      font-weight: bold;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
      background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#ff9800'};
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  },
  
  setLoadingState: (isLoading) => {
    const buttons = Utils.$$('.cta-button');
    const container = Utils.$('.container');
    
    if (isLoading) {
      container.classList.add('loading');
      buttons.forEach(btn => {
        btn.disabled = true;
        btn.innerHTML = `
          <span style="animation: spin 1s linear infinite;">⏳</span>
          <span>Processing...</span>
        `;
      });
    } else {
      container.classList.remove('loading');
      buttons.forEach((btn, index) => {
        btn.disabled = false;
        const plans = ['monthly', 'quarterly', 'annual'];
        const icons = ['🚀', '🎯', '🏆'];
        const texts = ['Start Monthly Plan', 'Choose Quarterly', 'Go Annual & Save!'];
        btn.innerHTML = `
          <span class="cta-icon">${icons[index]}</span>
          <span>${texts[index]}</span>
        `;
      });
    }
  },
  
  showSuccessMessage: () => {
    const successMessage = Utils.$('#successMessage');
    successMessage.classList.add('show');
    
    setTimeout(() => {
      successMessage.classList.remove('show');
    }, 3000);
  },
  
  getUserData: () => {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.storageKeys.userData)) || {};
    } catch (error) {
      return {};
    }
  },
  
  saveUserData: (data) => {
    try {
      localStorage.setItem(CONFIG.storageKeys.userData, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  }
};

// Payment Management
const PaymentManager = {
  initializePayment: (planType, amount) => {
    if (!window.FlutterwaveCheckout) {
      Utils.showNotification('Payment system not available. Please refresh and try again.', 'error');
      return;
    }
    
    const plan = CONFIG.plans[planType];
    if (!plan) {
      Utils.showNotification('Invalid plan selected', 'error');
      return;
    }
    
    const userData = Utils.getUserData();
    
    const paymentData = {
      public_key: CONFIG.flutterwavePublicKey,
      tx_ref: Utils.generateTxRef(),
      amount: amount,
      currency: plan.currency,
      payment_options: "card,mobilemoney,ussd,bank_transfer",
      redirect_url: "",
      
      customer: {
        email: userData.email || "user@studybunny.com",
        phone_number: userData.phone || "000-000-0000",
        name: userData.name || "Study Bunny User",
      },
      
      callback: PaymentManager.handlePaymentCallback,
      onclose: PaymentManager.handlePaymentClose,
      
      customizations: {
        title: "Study Bunny Premium",
        description: `Upgrade to ${plan.name}`,
        logo: "https://via.placeholder.com/100x100/7850a0/ffffff?text=SB"
      },
      
      meta: {
        plan_type: planType,
        plan_name: plan.name,
        features: plan.features.join(', ')
      }
    };
    
    FlutterwaveCheckout(paymentData);
  },
  
  handlePaymentCallback: (response) => {
    console.log('Payment response:', response);
    
    if (response.status === "successful" || response.status === "completed") {
      PaymentManager.processSuccessfulPayment(response);
    } else {
      PaymentManager.processFailedPayment(response);
    }
  },
  
  handlePaymentClose: () => {
    Utils.setLoadingState(false);
    Utils.showNotification('Payment cancelled', 'warning');
  },
  
  processSuccessfulPayment: (response) => {
    const planType = response.meta?.plan_type || state.selectedPlan;
    const plan = CONFIG.plans[planType];
    
    // Save subscription data
    const subscriptionData = {
      plan: planType,
      planName: plan.name,
      amount: response.amount,
      currency: response.currency,
      transactionId: response.transaction_id,
      txRef: response.tx_ref,
      startDate: new Date().toISOString(),
      status: 'active',
      features: plan.features
    };
    
    // Calculate expiry date
    const expiryDate = new Date();
    switch (planType) {
      case 'monthly':
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        break;
      case 'quarterly':
        expiryDate.setMonth(expiryDate.getMonth() + 3);
        break;
      case 'annual':
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        break;
    }
    subscriptionData.expiryDate = expiryDate.toISOString();
    
    // Save to localStorage
    localStorage.setItem(CONFIG.storageKeys.userPlan, JSON.stringify(subscriptionData));
    
    // Update user data
    const userData = Utils.getUserData();
    userData.subscription = subscriptionData;
    userData.isPremium = true;
    Utils.saveUserData(userData);
    
    // Show success
    Utils.setLoadingState(false);
    Utils.showSuccessMessage();
    Utils.showNotification(`🎉 Welcome to ${plan.name}! Redirecting...`, 'success');
    
    // Analytics tracking (if available)
    if (typeof gtag !== 'undefined') {
      gtag('event', 'purchase', {
        transaction_id: response.transaction_id,
        value: response.amount,
        currency: response.currency,
        items: [{
          item_id: planType,
          item_name: plan.name,
          category: 'subscription',
          quantity: 1,
          price: response.amount
        }]
      });
    }
    
    // Redirect after delay
    setTimeout(() => {
      const lastPage = localStorage.getItem(CONFIG.storageKeys.lastPage) || "../mainpage.html";
      window.location.href = lastPage;
    }, 2000);
  },
  
  processFailedPayment: (response) => {
    console.error('Payment failed:', response);
    Utils.setLoadingState(false);
    
    let errorMessage = 'Payment was not successful. Please try again.';
    
    if (response.status === 'cancelled') {
      errorMessage = 'Payment was cancelled.';
    } else if (response.status === 'failed') {
      errorMessage = 'Payment failed. Please check your payment details and try again.';
    }
    
    Utils.showNotification(errorMessage, 'error');
  }
};

// Plan Selection
const PlanManager = {
  selectPlan: (planType, amount) => {
    if (state.isProcessing) {
      Utils.showNotification('Please wait for the current transaction to complete', 'warning');
      return;
    }
    
    state.selectedPlan = planType;
    state.isProcessing = true;
    
    Utils.setLoadingState(true);
    
    // Store the current page for return navigation
    localStorage.setItem(CONFIG.storageKeys.lastPage, document.referrer || "../mainpage.html");
    
    // Add slight delay for better UX
    setTimeout(() => {
      PaymentManager.initializePayment(planType, amount);
    }, 500);
  },
  
  highlightSelectedPlan: (planType) => {
    // Remove previous selections
    Utils.$$('.pricing-card').forEach(card => {
      card.classList.remove('selected');
    });
    
    // Add selection to current plan
    const planIndex = ['monthly', 'quarterly', 'annual'].indexOf(planType);
    if (planIndex >= 0) {
      Utils.$$('.pricing-card')[planIndex].classList.add('selected');
    }
  }
};

// Feature Comparison
const FeatureManager = {
  init: () => {
    FeatureManager.addFeatureComparison();
    FeatureManager.addPlanRecommendations();
  },
  
  addFeatureComparison: () => {
    // Add tooltips or expandable feature details
    Utils.$$('.feature-item').forEach(item => {
      item.addEventListener('click', () => {
        const featureText = item.querySelector('.feature-text').textContent;
        Utils.showNotification(`Feature: ${featureText}`, 'info');
      });
    });
  },
  
  addPlanRecommendations: () => {
    // Simple recommendation logic based on user behavior
    const userData = Utils.getUserData();
    
    if (userData.usageLevel === 'heavy') {
      // Highlight annual plan for heavy users
      const annualCard = Utils.$$('.pricing-card')[2];
      if (annualCard) {
        annualCard.style.borderColor = 'var(--success-color)';
      }
    }
  }
};

// Security Features
const SecurityManager = {
  validatePaymentEnvironment: () => {
    // Check if running on HTTPS in production
    if (location.hostname !== 'localhost' && location.protocol !== 'https:') {
      Utils.showNotification('Secure connection required for payments', 'error');
      return false;
    }
    
    // Check if Flutterwave is loaded
    if (!window.FlutterwaveCheckout) {
      Utils.showNotification('Payment system loading... Please wait.', 'warning');
      return false;
    }
    
    return true;
  },
  
  sanitizeUserInput: (input) => {
    return input.replace(/[<>]/g, '');
  }
};

// Analytics and Tracking
const AnalyticsManager = {
  trackPlanView: (planType) => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'view_item', {
        currency: 'USD',
        value: CONFIG.plans[planType].amount,
        items: [{
          item_id: planType,
          item_name: CONFIG.plans[planType].name,
          category: 'subscription'
        }]
      });
    }
  },
  
  trackUpgradeIntent: (planType) => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'begin_checkout', {
        currency: 'USD',
        value: CONFIG.plans[planType].amount,
        items: [{
          item_id: planType,
          item_name: CONFIG.plans[planType].name,
          category: 'subscription'
        }]
      });
    }
  }
};

// Global Functions (for HTML onclick handlers)
window.selectPlan = (planType, amount) => {
  if (!SecurityManager.validatePaymentEnvironment()) {
    return;
  }
  
  AnalyticsManager.trackUpgradeIntent(planType);
  PlanManager.selectPlan(planType, amount);
};

// Application Initialization
const UpgradeApp = {
  init: () => {
    try {
      // Check current subscription status
      UpgradeApp.checkCurrentSubscription();
      
      // Initialize features
      FeatureManager.init();
      
      // Add keyboard shortcuts
      UpgradeApp.setupKeyboardShortcuts();
      
      // Add CSS animations
      UpgradeApp.addCSSAnimations();
      
      console.log('Upgrade page initialized successfully!');
    } catch (error) {
      console.error('Failed to initialize upgrade page:', error);
      Utils.showNotification('Page failed to load properly. Please refresh.', 'error');
    }
  },
  
  checkCurrentSubscription: () => {
    try {
      const currentPlan = JSON.parse(localStorage.getItem(CONFIG.storageKeys.userPlan));
      
      if (currentPlan && currentPlan.status === 'active') {
        const expiryDate = new Date(currentPlan.expiryDate);
        const now = new Date();
        
        if (expiryDate > now) {
          // User already has active subscription
          const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
          Utils.showNotification(`You have an active ${currentPlan.planName} (${daysLeft} days left)`, 'info');
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  },
  
  setupKeyboardShortcuts: () => {
    document.addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      
      switch (e.key) {
        case '1':
          e.preventDefault();
          window.selectPlan('monthly', 4.99);
          break;
        case '2':
          e.preventDefault();
          window.selectPlan('quarterly', 9.99);
          break;
        case '3':
          e.preventDefault();
          window.selectPlan('annual', 39.99);
          break;
        case 'Escape':
          e.preventDefault();
          window.location.href = '../mainpage.html';
          break;
      }
    });
  },
  
  addCSSAnimations: () => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      
      .pricing-card.selected {
        transform: translateY(-8px) scale(1.02);
        border-color: var(--success-color) !important;
        box-shadow: 0 12px 40px var(--shadow-card) !important;
      }
    `;
    document.head.appendChild(style);
  }
};

// Start Application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', UpgradeApp.init);
} else {
  UpgradeApp.init();
}

// Debug export for development
if (window.location.hostname === 'localhost') {
  window.UpgradeDebug = {
    CONFIG,
    state,
    Utils,
    PaymentManager,
    PlanManager,
    FeatureManager,
    SecurityManager,
    AnalyticsManager
  };
}