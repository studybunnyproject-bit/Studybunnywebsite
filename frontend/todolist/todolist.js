// Grab DOM elements
const taskInput = document.getElementById('task');
const taskList = document.getElementById('taskList');

let taskCount = 0;
const taskLimit = 19; // Free plan task limit

function addTask() {
  const taskText = taskInput.value.trim();
  if (taskText === '') return; // Don't add empty tasks

  if (taskCount >= taskLimit) {
    // Redirect user to upgrade page if they exceed free limit
    window.location.href = "../upgrade-page/upgrade.html";
    return;
  }

  // Create a new task div
  const taskDiv = document.createElement('div');
  taskDiv.className = 'task';

  // Create span for task text
  const taskContent = document.createElement('span');
  taskContent.textContent = taskText;
  
    // Create a container for the buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'task-buttons';

  // Create the "done" button
  const doneBtn = document.createElement('button');
  doneBtn.textContent = '×';
  doneBtn.className = 'done-btn';

  // Add event listener to the "done" button
  doneBtn.onclick = () => {
    taskDiv.classList.toggle('completed');
  };


  // Create delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '\u2212';
  deleteBtn.className = 'delete-btn';

  // Delete button event: remove task and update count
  deleteBtn.onclick = () => {
    taskDiv.remove();
    taskCount--;
  };

   // Append buttons to the button container
  buttonContainer.appendChild(doneBtn);
  buttonContainer.appendChild(deleteBtn);

  // Append text and button container to task div
  taskDiv.appendChild(taskContent);
  taskDiv.appendChild(buttonContainer);


  // Add task div to the list
  taskList.appendChild(taskDiv);

  // Increase task count and clear input
  taskCount++;
  taskInput.value = '';
}