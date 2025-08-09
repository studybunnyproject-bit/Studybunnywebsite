const display = document.getElementById('display');

function appendNumber(number) {
  display.value += number;
}

function appendOperator(operator) {
  const lastChar = display.value.slice(-1);
  if ("+-*/".includes(lastChar)) {
    display.value = display.value.slice(0, -1) + operator;
  } else {
    display.value += operator;
  }
}

function clearDisplay() {
  display.value = '';
}

function deleteLast() {
  display.value = display.value.slice(0, -1);
}

function calculateResult() {
  try {
    const result = eval(display.value);
    display.value = result;
  } catch {
    display.value = 'Error';
  }
}

function appendPi() {
  display.value += Math.PI.toFixed(8); // 3.14159265
}

function squareRoot() {
  try {
    const value = eval(display.value);
    if (value < 0) {
      display.value = 'Error';
    } else {
      display.value = Math.sqrt(value);
    }
  } catch {
    display.value = 'Error';
  }
}