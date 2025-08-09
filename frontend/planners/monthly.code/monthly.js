const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");
let currentDate = new Date();

function renderCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  calendar.innerHTML = "";
  monthYear.textContent = date.toLocaleString("default", { month: "long", year: "numeric" });

  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div");
    calendar.appendChild(emptyCell);
  }

  for (let d = 1; d <= totalDays; d++) {
    const dayCell = document.createElement("div");
    const dayNum = document.createElement("span");
    dayNum.textContent = d;
    dayCell.appendChild(dayNum);
    dayCell.onclick = () => {
  const selectedDate = new Date(year, month, d);
  const formatted = selectedDate.toISOString().split('T')[0]; // Example: '2025-08-04'
  window.location.href = `../daily.code/daily.html?date=${formatted}`;
};
calendar.appendChild(dayCell);
  }
}

prevMonth.onclick = () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar(currentDate);
};

nextMonth.onclick = () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar(currentDate);
};

function addMonthlyTask() {
  const input = document.getElementById("monthlyTodoInput");
  const list = document.getElementById("monthlyTodoList");
  if (input.value.trim() !== "") {
    const li = document.createElement("li");
    li.textContent = input.value;
    li.onclick = () => li.remove();
    list.appendChild(li);
    input.value = "";
  }
}

renderCalendar(currentDate);