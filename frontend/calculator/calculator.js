/**
 * Study Bunny Calculator JavaScript
 * Modern ES6+ implementation with safe math evaluation and accessibility
 */

// ===================================
// Configuration and Constants
// ===================================
const CONFIG = {
  maxDisplayLength: 15,
  decimalPlaces: 8,
  errorTimeout: 3000,
  animations: {
    button: 300,
    error: 500
  }
};

const OPERATORS = {
  '+': { precedence: 1, fn: (a, b) => a + b },
  '-': { precedence: 1, fn: (a, b) => a - b },
  '*': { precedence: 2, fn: (a, b) => a * b },
  '/': { precedence: 2, fn: (a, b) => a / b }
};

const FUNCTIONS = {
  'pi': () => Math.PI,
  'sqrt': (x) => {
    if (x < 0) throw new Error('Cannot calculate square root of negative number');
    return Math.sqrt(x);
  }
};

// ===================================
// Calculator State Management
// ===================================
const state = {
  display: '0',
  expression: '',
  lastResult: null,
  waitingForNewNumber: false,
  hasError: false,
  history: []
};

// ===================================
// Utility Functions
// ===================================
const Utils = {
  $: (selector) => document.querySelector(selector),
  $$: (selector) => document.querySelectorAll(selector),

  formatNumber: (num) => {
    if (!isFinite(num)) {
      throw new Error('Invalid number');
    }
    
    // Handle very large or very small numbers
    if (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-6 && num !== 0)) {
      return num.toExponential(6);
    }
    
    // Remove trailing zeros and format
    const formatted = parseFloat(num.toFixed(CONFIG.decimalPlaces)).toString();
    
    // Truncate if too long
    if (formatted.length > CONFIG.maxDisplayLength) {
      return num.toExponential(6);
    }
    
    return formatted;
  },

  isOperator: (char) => char in OPERATORS,

  isNumber: (str) => !isNaN(str) && !isNaN(parseFloat(str)),

  sanitizeInput: (input) => {
    // Remove any characters that aren't numbers, operators, or decimal points
    return input.replace(/[^0-9+\-*/.() ]/g, '');
  },

  animate: (element, className, duration = CONFIG.animations.button) => {
    element.classList.add(className);
    setTimeout(() => element.classList.remove(className), duration);
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
// Math Expression Evaluator
// ===================================
const MathEvaluator = {
  /**
   * Safely evaluate mathematical expressions without using eval()
   */
  evaluate: (expression) => {
    try {
      const tokens = MathEvaluator.tokenize(expression);
      const result = MathEvaluator.evaluateTokens(tokens);
      
      if (!isFinite(result)) {
        throw new Error('Result is infinity or NaN');
      }
      
      return result;
    } catch (error) {
      throw new Error(error.message || 'Invalid expression');
    }
  },

  tokenize: (expression) => {
    const tokens = [];
    let currentNumber = '';
    
    for (let i = 0; i < expression.length; i++) {
      const char = expression[i];
      
      if (char === ' ') continue;
      
      if (char >= '0' && char <= '9' || char === '.') {
        currentNumber += char;
      } else {
        if (currentNumber) {
          tokens.push(parseFloat(currentNumber));
          currentNumber = '';
        }
        
        if (Utils.isOperator(char)) {
          tokens.push(char);
        } else if (char === '(' || char === ')') {
          tokens.push(char);
        }
      }
    }
    
    if (currentNumber) {
      tokens.push(parseFloat(currentNumber));
    }
    
    return tokens;
  },

  evaluateTokens: (tokens) => {
    // Convert infix to postfix (Shunting Yard algorithm)
    const outputQueue = [];
    const operatorStack = [];
    
    for (const token of tokens) {
      if (typeof token === 'number') {
        outputQueue.push(token);
      } else if (Utils.isOperator(token)) {
        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1] !== '(' &&
          OPERATORS[operatorStack[operatorStack.length - 1]] &&
          OPERATORS[operatorStack[operatorStack.length - 1]].precedence >= OPERATORS[token].precedence
        ) {
          outputQueue.push(operatorStack.pop());
        }
        operatorStack.push(token);
      } else if (token === '(') {
        operatorStack.push(token);
      } else if (token === ')') {
        while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
          outputQueue.push(operatorStack.pop());
        }
        if (operatorStack.length === 0) {
          throw new Error('Mismatched parentheses');
        }
        operatorStack.pop(); // Remove the '('
      }
    }
    
    while (operatorStack.length > 0) {
      const op = operatorStack.pop();
      if (op === '(' || op === ')') {
        throw new Error('Mismatched parentheses');
      }
      outputQueue.push(op);
    }
    
    // Evaluate postfix expression
    const stack = [];
    
    for (const token of outputQueue) {
      if (typeof token === 'number') {
        stack.push(token);
      } else if (Utils.isOperator(token)) {
        if (stack.length < 2) {
          throw new Error('Invalid expression');
        }
        const b = stack.pop();
        const a = stack.pop();
        const result = OPERATORS[token].fn(a, b);
        
        if (token === '/' && b === 0) {
          throw new Error('Division by zero');
        }
        
        stack.push(result);
      }
    }
    
    if (stack.length !== 1) {
      throw new Error('Invalid expression');
    }
    
    return stack[0];
  }
};

// ===================================
// Display Management
// ===================================
const Display = {
  init: () => {
    Display.element = Utils.$('#display');
    Display.expressionElement = Utils.$('#expression');
    Display.errorElement = Utils.$('#errorMessage');
    Display.update();
  },

  update: () => {
    if (Display.element) {
      Display.element.value = state.display;
    }
    if (Display.expressionElement) {
      Display.expressionElement.textContent = state.expression;
    }
  },

  setValue: (value) => {
    state.display = value;
    Display.update();
  },

  setExpression: (expression) => {
    state.expression = expression;
    Display.update();
  },

  showError: (message) => {
    state.hasError = true;
    state.display = 'Error';
    
    if (Display.errorElement) {
      const errorText = Display.errorElement.querySelector('.error-text');
      if (errorText) {
        errorText.textContent = message;
      }
      Display.errorElement.removeAttribute('hidden');
      Utils.animate(Display.errorElement, 'shake', CONFIG.animations.error);
      
      setTimeout(() => {
        Display.hideError();
        Calculator.clear();
      }, CONFIG.errorTimeout);
    }
    
    Display.update();
  },

  hideError: () => {
    if (Display.errorElement) {
      Display.errorElement.setAttribute('hidden', '');
    }
  }
};

// ===================================
// Calculator Logic
// ===================================
const Calculator = {
  init: () => {
    Display.init();
    Calculator.setupEventListeners();
    console.log('Calculator initialized successfully!');
  },

  setupEventListeners: () => {
    // Button click events using event delegation
    const buttonsContainer = Utils.$('.buttons');
    if (buttonsContainer) {
      buttonsContainer.addEventListener('click', Calculator.handleButtonClick);
    }

    // Keyboard support
    document.addEventListener('keydown', Calculator.handleKeydown);

    // Focus management
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        Calculator.handleTabNavigation(e);
      }
    });
  },

  handleButtonClick: (e) => {
    const button = e.target.closest('.btn');
    if (!button) return;

    const action = button.getAttribute('data-action');
    const value = button.getAttribute('data-value');

    // Visual feedback
    Utils.animate(button, 'btn--animate');

    // Clear error state
    if (state.hasError) {
      Display.hideError();
      state.hasError = false;
    }

    switch (action) {
      case 'number':
        Calculator.inputNumber(value);
        break;
      case 'operator':
        Calculator.inputOperator(value);
        break;
      case 'calculate':
        Calculator.calculate();
        break;
      case 'clear':
        Calculator.clear();
        break;
      case 'delete':
        Calculator.deleteLast();
        break;
      case 'function':
        Calculator.inputFunction(value);
        break;
    }
  },

  handleKeydown: (e) => {
    // Prevent default for calculator keys
    const calculatorKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 
                           '+', '-', '*', '/', '=', 'Enter', 'Escape', 'Backspace', 
                           'Delete', '.', 'c', 'C'];
    
    if (calculatorKeys.includes(e.key)) {
      e.preventDefault();
    }

    if (state.hasError) {
      Display.hideError();
      state.hasError = false;
    }

    switch (e.key) {
      case '0': case '1': case '2': case '3': case '4':
      case '5': case '6': case '7': case '8': case '9':
      case '.':
        Calculator.inputNumber(e.key);
        break;
      case '+': case '-': case '*': case '/':
        Calculator.inputOperator(e.key);
        break;
      case '=':
      case 'Enter':
        Calculator.calculate();
        break;
      case 'Escape':
      case 'c':
      case 'C':
        Calculator.clear();
        break;
      case 'Backspace':
      case 'Delete':
        Calculator.deleteLast();
        break;
    }
  },

  handleTabNavigation: (e) => {
    const buttons = Utils.$$('.btn');
    const currentIndex = Array.from(buttons).findIndex(btn => btn === document.activeElement);
    
    if (currentIndex === -1) return;

    if (e.shiftKey) {
      // Tab backwards
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
      buttons[prevIndex].focus();
    } else {
      // Tab forwards
      const nextIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
      buttons[nextIndex].focus();
    }
    
    e.preventDefault();
  },

  inputNumber: (num) => {
    if (state.waitingForNewNumber) {
      state.display = num;
      state.waitingForNewNumber = false;
    } else {
      if (state.display === '0' && num !== '.') {
        state.display = num;
      } else {
        // Prevent multiple decimal points
        if (num === '.' && state.display.includes('.')) {
          return;
        }
        
        // Limit display length
        if (state.display.length >= CONFIG.maxDisplayLength) {
          return;
        }
        
        state.display += num;
      }
    }
    Display.update();
  },

  inputOperator: (operator) => {
    if (state.hasError) return;

    if (state.waitingForNewNumber) {
      // Replace the last operator
      state.expression = state.expression.slice(0, -1) + operator;
    } else {
      if (state.expression && !state.waitingForNewNumber) {
        // Calculate intermediate result
        try {
          const result = MathEvaluator.evaluate(state.expression + state.display);
          state.display = Utils.formatNumber(result);
          state.lastResult = result;
        } catch (error) {
          // Continue without intermediate calculation
        }
      }
      
      state.expression = state.expression + state.display + operator;
      state.waitingForNewNumber = true;
    }

    Display.update();
  },

  inputFunction: (func) => {
    try {
      let result;
      
      switch (func) {
        case 'pi':
          result = FUNCTIONS.pi();
          break;
        case 'sqrt':
          const currentValue = parseFloat(state.display);
          result = FUNCTIONS.sqrt(currentValue);
          break;
        default:
          throw new Error('Unknown function');
      }

      state.display = Utils.formatNumber(result);
      state.waitingForNewNumber = true;
      state.lastResult = result;
      
      // Add to history
      state.history.push(`${func}(${state.display}) = ${result}`);
      
    } catch (error) {
      Display.showError(error.message);
    }

    Display.update();
  },

  calculate: () => {
    if (state.hasError || !state.expression) return;

    try {
      const fullExpression = state.expression + state.display;
      const result = MathEvaluator.evaluate(fullExpression);
      
      // Add to history
      state.history.push(`${fullExpression} = ${result}`);
      
      // Update display
      state.display = Utils.formatNumber(result);
      state.expression = '';
      state.lastResult = result;
      state.waitingForNewNumber = true;
      
      Display.setExpression(`${fullExpression} =`);
      Display.setValue(state.display);
      
    } catch (error) {
      Display.showError(error.message);
    }
  },

  clear: () => {
    state.display = '0';
    state.expression = '';
    state.lastResult = null;
    state.waitingForNewNumber = false;
    state.hasError = false;
    
    Display.hideError();
    Display.setValue('0');
    Display.setExpression('');
  },

  deleteLast: () => {
    if (state.hasError) {
      Calculator.clear();
      return;
    }

    if (state.waitingForNewNumber) {
      // Remove last operator from expression
      state.expression = state.expression.slice(0, -1);
      state.waitingForNewNumber = false;
    } else {
      if (state.display.length > 1) {
        state.display = state.display.slice(0, -1);
      } else {
        state.display = '0';
      }
    }
    
    Display.update();
  }
};

// ===================================
// Application Initialization
// ===================================
const App = {
  init: () => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', Calculator.init);
    } else {
      Calculator.init();
    }
  }
};

// Start the application
App.init();

// Export for debugging (development only)
if (typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname.includes('127.0.0.1'))) {
  window.CalculatorDebug = {
    state,
    CONFIG,
    OPERATORS,
    FUNCTIONS,
    Utils,
    MathEvaluator,
    Display,
    Calculator
  };
}