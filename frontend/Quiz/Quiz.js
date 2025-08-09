let quizzes = [];              // only for this session
let savedQuizzes = JSON.parse(localStorage.getItem("quizzes")) || []; // history
const plan = localStorage.getItem("plan") || "free"; // change for testing
const limits = {
  free: 10,
  monthly: 50,
  quarterly: 100,
  yearly: Infinity
};

const form = document.getElementById("quiz-form");
const startBtn = document.getElementById("start-quiz");
const inputSection = document.getElementById("input-section");
const quizSection = document.getElementById("quiz-section");
const resultSection = document.getElementById("result-section");
const quizQuestion = document.getElementById("quiz-question");
const userAnswer = document.getElementById("user-answer");
const submitBtn = document.getElementById("submit-answer");
const timerText = document.getElementById("time");

let current = 0;
let score = 0;
let timer;
let timeLeft = 30;
let customTime = 30;

// Save quiz
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = document.getElementById("question").value.trim();
  const a = document.getElementById("answer").value.trim();

  if (quizzes.length >= limits[plan]) {
    window.location.href = "../upgrade-page/upgrade.html";
    return;
  }

  quizzes.push({ question: q, answer: a });
  localStorage.setItem("quizzes", JSON.stringify(quizzes));

  document.getElementById("question").value = "";
  document.getElementById("answer").value = "";
  showAlert("Saved!");
});

// Start quiz
startBtn.addEventListener("click", () => {
  if (quizzes.length === 0) {
    showAlert("Add some questions first!");
    return;
  }

  inputSection.style.display = "none";
  quizSection.style.display = "block";
  current = 0;
  score = 0;
  customTime = parseInt(document.getElementById("custom-timer").value) || 30;
  timeLeft = customTime;
  startTimer();
  showQuestion();
});

// Show question
function showQuestion() {
  if (current < quizzes.length) {
    quizQuestion.textContent = quizzes[current].question;
    userAnswer.value = "";
  } else {
    endQuiz();
  }
}

// Submit answer
submitBtn.addEventListener("click", () => {
  const correct = quizzes[current].answer.toLowerCase();
  const user = userAnswer.value.trim().toLowerCase();
  if (user === correct) score++;
  current++;
  resetTimer();
  showQuestion();
});

// Timer logic
function startTimer() {
  timeLeft = customTime;
  timerText.textContent = timeLeft;
  timer = setInterval(() => {
    timeLeft--;
    timerText.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      current++;
      resetTimer();
      showQuestion();
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timer);
  startTimer();
}

// End quiz and show score
function endQuiz() {
  clearInterval(timer);
  quizSection.style.display = "none";
  resultSection.style.display = "block";

  const total = quizzes.length;
  const percent = Math.round((score / total) * 100);
  let grade = "F";
  if (percent >= 90) grade = "A";
  else if (percent >= 80) grade = "B";
  else if (percent >= 70) grade = "C";
  else if (percent >= 60) grade = "D";

  document.getElementById("score").textContent = `${score} / ${total}`;
  document.getElementById("percentage").textContent = percent;
  document.getElementById("grade").textContent = grade;
}

function showAlert(message) {
  document.getElementById("alert-message").textContent = message;
  
}
