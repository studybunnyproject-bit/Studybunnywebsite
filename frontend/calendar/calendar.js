const calendarDays = document.getElementById('calendarDays');
const monthYear = document.getElementById('monthYear');
const timeNow = document.getElementById('timeNow');

let currentDate = new Date();

function renderCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const today = new Date();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  calendarDays.innerHTML = "";
  monthYear.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Empty days before the first day
  for (let i = 0; i < firstDay; i++) {
    calendarDays.innerHTML += `<div></div>`;
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const dayDate = new Date(year, month, i);
    const isToday = (
      dayDate.getDate() === today.getDate() &&
      dayDate.getMonth() === today.getMonth() &&
      dayDate.getFullYear() === today.getFullYear()
    );

    const dayDiv = document.createElement('div');
dayDiv.textContent = i;

// Add click to open event box
const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
dayDiv.addEventListener('click', () => handleDayClick(dateStr));

if (isToday) dayDiv.classList.add('today');
dayDiv.addEventListener('click', () => {
  const dateStr = `${year}-${month + 1}-${i}`;
  handleDayClick(dateStr);
});
calendarDays.appendChild(dayDiv);
  }
}

function updateTime() {
  const now = new Date();
  timeNow.textContent = "Current Time: " + now.toLocaleTimeString();
}

document.getElementById('prev').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar(currentDate);
});

document.getElementById('next').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar(currentDate);
});

renderCalendar(currentDate);
updateTime();
setInterval(updateTime, 1000); // Update clock every second

const facts = [
  "💡 The Eiffel Tower can grow more than 15 cm taller in the summer due to heat expansion.",
  "🧠 Your brain generates enough electricity to power a small light bulb.",
  "🌌 There are more stars in the universe than grains of sand on all Earth's beaches.",
  "🍌 Bananas are berries, but strawberries aren't.",
  "🐙 Octopuses have three hearts and nine brains.",
  "🔥 Venus is hotter than Mercury, even though Mercury is closer to the Sun.",
  "🕰 A day on Venus is longer than a year on Venus.",
  "💧 Water can boil and freeze at the same time — it's called the triple point.",
  "🍯 Honey never spoils. 3,000-year-old jars found in Egyptian tombs were still edible.",
  "🧬 You share 60% of your DNA with bananas.",
  "🚀 The first email was sent in 1971 — before the invention of the internet.",
  "📚 The longest word in English has 189,819 letters — it’s the name of a protein.",
  "🌍 Earth is the only planet not named after a god.",
  "🔬 Light from the Sun takes about 8 minutes to reach Earth.",
  "🦠 There are more bacteria in your mouth than people on Earth.",
  "💻 The first computer mouse was made of wood.",
  "🔋 The first battery was invented more than 2,000 years ago in ancient Iraq.",
  "🧊 Antarctica is the driest, windiest, and coldest continent.",
  "⚡ Lightning is hotter than the surface of the Sun.",
  "🎨 Humans can distinguish over 10 million different colors."
];

function getFactOfTheDay() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const factIndex = dayOfYear % facts.length;
  return facts[factIndex];
}

function showDailyFact() {
  document.getElementById('miniInfo').textContent = getFactOfTheDay();
}

showDailyFact();

let eventData = JSON.parse(localStorage.getItem('eventData')) || {};

function handleDayClick(dateStr) {
  document.getElementById('eventModal').style.display = 'flex';
  document.getElementById('eventDateTitle').textContent = `📅 Events for ${dateStr}`;
  const textarea = document.getElementById('eventText');
  textarea.value = eventData[dateStr] || '';
  textarea.dataset.date = dateStr;
}

function saveEvent() {
  const dateStr = document.getElementById('eventText').dataset.date;
  const text = document.getElementById('eventText').value.trim();
  if (text) {
    eventData[dateStr] = text;
  } else {
    delete eventData[dateStr];
  }
  localStorage.setItem('eventData', JSON.stringify(eventData));
  closeModal();
}

function closeModal() {
  document.getElementById('eventModal').style.display = 'none';
}