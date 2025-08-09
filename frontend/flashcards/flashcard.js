let flashcards = [];
let currentCard = 0;
let correctCount = 0;
let isFront = true;

function showAlert(message) {
  const alertBox = document.getElementById('customAlert');
  alertBox.innerText = message;
  alertBox.style.display = 'block';

  setTimeout(() => {
    alertBox.style.display = 'none';
  }, 3000);
}

function addFlashcard() {
  const question = document.getElementById('questionInput').value.trim();
  const answer = document.getElementById('answerInput').value.trim();

  if (!question || !answer) {
    showAlert("Please fill both fields.");
    return;
  }

  if (flashcards.length >= 10) {
    window.location.href = "../upgrade-page/upgrade.html";
    return;
  }

  flashcards.push({ question, answer });
  document.getElementById('questionInput').value = '';
  document.getElementById('answerInput').value = '';
  updateFlashcardList();
}

function updateFlashcardList() {
  const list = document.getElementById('flashcardList');
  list.innerHTML = flashcards.map((card, index) => `<div class="flashcard-label">Flashcard ${index + 1}</div>`).join('');
}

function startStudy() {
  if (flashcards.length === 0) {
    showAlert("No flashcards to study.");
    return;
  }

  document.querySelector('.container').style.display = 'none';
  document.getElementById('studyContainer').style.display = 'block';
  currentCard = 0;
  correctCount = 0;
  isFront = true;
  document.getElementById('studyCard').classList.remove('flipped');
  renderStudyCard();
}

function renderStudyCard() {
  const card = flashcards[currentCard];
  document.getElementById('progress').innerText = `Card ${currentCard + 1} of ${flashcards.length}`;
  document.getElementById('cardFront').innerText = card.question;
  document.getElementById('cardBack').innerText = card.answer;
  document.getElementById('score').innerHTML = '';
  isFront = true;
  document.getElementById('studyCard').classList.remove('flipped');
}

function flipCard() {
  const cardElement = document.getElementById('studyCard');
  isFront = !isFront;
  cardElement.classList.toggle('flipped');
}

function markCorrect() {
  correctCount++;
  nextCard();
}

function markWrong() {
  nextCard();
}

function nextCard() {
  currentCard++;
  if (currentCard < flashcards.length) {
    renderStudyCard();
  } else {
    showFinalScore();
  }
}

function showFinalScore() {
  const percent = Math.round((correctCount / flashcards.length) * 100);
  let grade = '';

  if (percent >= 90) grade = 'A';
  else if (percent >= 80) grade = 'B';
  else if (percent >= 70) grade = 'C';
  else if (percent >= 60) grade = 'D';
  else grade = 'F';

  document.getElementById('score').innerHTML = `
    <div>✔ ${correctCount} / ${flashcards.length}</div>
    <div>${percent}%</div>
    <div>Grade: ${grade}</div>
  `;
}