// Get date from URL (if any)
const params = new URLSearchParams(window.location.search);
const dateParam = params.get("date");

// Use passed date, or default to today
const currentDate = dateParam ? new Date(dateParam) : new Date();

// Show selected date
document.getElementById("selectedDate").textContent =
  `Selected: ${currentDate.toDateString()}`;
document.getElementById("currentDate").textContent =
  currentDate.toDateString();

// Function to generate time blocks
function generateTimeBlocks() {
  const timeBlocks = document.getElementById("timeBlocks");
  timeBlocks.innerHTML = "";

  for (let hour = 5; hour <= 23; hour++) {
    const block = document.createElement("div");

    const label = document.createElement("span");
    label.textContent = `${hour}:00`;

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Write here...";

    block.appendChild(label);
    block.appendChild(input);
    timeBlocks.appendChild(block);
  }
}

generateTimeBlocks();

// To-do list function
function addTask() {
  const input = document.getElementById("todoInput");
  const list = document.getElementById("todoList");

  if (input.value.trim() !== "") {
    const li = document.createElement("li");
    li.textContent = input.value;
    li.onclick = () => li.remove();
    list.appendChild(li);
    input.value = "";
  }
}