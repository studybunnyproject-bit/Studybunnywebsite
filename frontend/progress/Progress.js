  // Simulated data (you can replace with real updates from other pages)
const today = new Date().toLocaleDateString();
let data = JSON.parse(localStorage.getItem("progressData")) || {};

if (!data[today]) {
  data[today] = {
    studyHours: 2,
    water: 6, // cups
    pomodoros: 4,
    quizScore: 85,
    flashcardScore: 90,
    mood: "🙂 Happy"
  };
  localStorage.setItem("progressData", JSON.stringify(data));
}

// Max values for 100% scale
const max = {
  study: 6,
  water: 8,
  pomodoro: 8,
  quiz: 100,
  flashcard: 100,
  mood: 100 // Mood as neutral at 50%, happy at 100%, sad at 0%
};

// Convert mood emoji to value
function moodToValue(mood) {
  if (mood.includes("😊") || mood.includes("😄")) return 100;
  if (mood.includes("🙂")) return 50;
  if (mood.includes("😞") || mood.includes("😢")) return 0;
  return 50;
}

function renderCircle(id, label, value, maxValue) {
  const percent = Math.min((value / maxValue) * 100, 100);
  const strokeDashoffset = 314 - (314 * percent) / 100;

  const container = document.querySelector(`.circle[data-id="${id}"]`);
  container.innerHTML = `
    <svg>
      <circle class="bg" cx="60" cy="60" r="50"/>
      <circle class="fg" cx="60" cy="60" r="50" style="stroke-dashoffset: ${strokeDashoffset}"/>
    </svg>
    <div class="circle-label">
      <h3>${label}</h3>
      <p>${Math.round(percent)}%</p>
    </div>
  `;
}

// Render all progress circles
renderCircle("study", "Study", data[today].studyHours, max.study);
renderCircle("water", "Water", data[today].water, max.water);
renderCircle("pomodoro", "Pomodoro", data[today].pomodoros, max.pomodoro);
renderCircle("quiz", "Quiz", data[today].quizScore, max.quiz);
renderCircle("flashcard", "Flashcards", data[today].flashcardScore, max.flashcard);
renderCircle("mood", "Mood", moodToValue(data[today].mood), max.mood);

// Summary
function showSummary(range) {
  const keys = Object.keys(data);
  const summary = {
    studyHours: 0,
    water: 0,
    pomodoros: 0,
    quizScore: 0,
    flashcardScore: 0
  };
  const now = new Date();
  let count = 0;

  keys.forEach(dateStr => {
    const date = new Date(dateStr);
    const diff = (now - date) / (1000 * 60 * 60 * 24);
    if ((range === "week" && diff <= 7) || (range === "month" && diff <= 30)) {
      summary.studyHours += data[dateStr].studyHours;
      summary.water += data[dateStr].water;
      summary.pomodoros += data[dateStr].pomodoros;
      summary.quizScore += data[dateStr].quizScore;
      summary.flashcardScore += data[dateStr].flashcardScore;
      count++;
    }
  });

  const box = document.getElementById(`${range}-summary`);
  box.innerHTML = `
    <strong>Study Hours:</strong> ${summary.studyHours}<br>
    <strong>Water:</strong> ${summary.water} cups<br>
    <strong>Pomodoros:</strong> ${summary.pomodoros}<br>
    <strong>Quiz Avg:</strong> ${(summary.quizScore / count).toFixed(1)}%<br>
    <strong>Flashcard Avg:</strong> ${(summary.flashcardScore / count).toFixed(1)}%
  `;
  box.style.display = "block";

  checkImprovement();
}

// Improvement logic
function checkImprovement() {
  const keys = Object.keys(data);
  const now = new Date();
  let count = 0;
  let totalStudy = 0;
  let totalQuiz = 0;
  let totalFlash = 0;

  keys.forEach(dateStr => {
    const date = new Date(dateStr);
    const diff = (now - date) / (1000 * 60 * 60 * 24);
    if (diff <= 7 && dateStr !== today) {
      totalStudy += data[dateStr].studyHours;
      totalQuiz += data[dateStr].quizScore;
      totalFlash += data[dateStr].flashcardScore;
      count++;
    }
  });

  const avgStudy = totalStudy / count;
  const avgQuiz = totalQuiz / count;
  const avgFlash = totalFlash / count;

  const improved =
    data[today].studyHours > avgStudy ||
    data[today].quizScore > avgQuiz ||
    data[today].flashcardScore > avgFlash;

  document.getElementById("improvement-result").innerText = improved
    ? "🎉 Yes! You're improving!"
    : "Keep going! You’ll get there!";
}