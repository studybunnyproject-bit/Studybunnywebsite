const weekDaysContainer = document.getElementById("weekDays");

const today = new Date();
const startOfWeek = new Date(today);
startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday start

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

for (let i = 0; i < 7; i++) {
  const date = new Date(startOfWeek);
  date.setDate(startOfWeek.getDate() + i);

  const dayBox = document.createElement("div");
  dayBox.textContent = `${dayNames[i]}\n${date.getDate()}/${date.getMonth() + 1}`;

  dayBox.onclick = () => {
    const formatted = date.toISOString().split("T")[0];
    window.location.href = `../daily.code/daily.html?date=${formatted}`;
  };

  weekDaysContainer.appendChild(dayBox);
}

function addWeeklyTask() {
  const input = document.getElementById("weeklyTodoInput");
  const list = document.getElementById("weeklyTodoList");
  if (input.value.trim() !== "") {
    const li = document.createElement("li");
    li.textContent = input.value;
    li.onclick = () => li.remove();
    list.appendChild(li);
    input.value = "";
  }
}