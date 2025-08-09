// Get all needed elements
const notesInput = document.getElementById('text');
const saveBtn = document.getElementById('sbtn');
const libraryBtn = document.getElementById('lbtn');
const notesToast = document.createElement('div');
notesToast.id = 'note-toast';
document.body.appendChild(notesToast);

// Create library modal
const notesModal = document.createElement('div');
notesModal.className = 'modal-overlay';
notesModal.style.display = 'none';
notesModal.innerHTML = `
  <div class="notes-grid-container">
    <button id="close-grid">&times;</button>
    <h2>Your Notes</h2>
    <div class="notes-grid"></div>
  </div>
`;
document.body.appendChild(notesModal);

// Create custom alert modal (for save confirmation)
const alertModal = document.createElement('div');
alertModal.className = 'modal-overlay';
alertModal.style.display = 'none';
alertModal.innerHTML = `
  <div class="alert-box">
    <p>Note saved!</p>
    <button id="alert-ok-btn">OK</button>
  </div>
`;
document.body.appendChild(alertModal);

// Show toast helper
const showToast = (message) => {
  notesToast.textContent = message;
  notesToast.classList.add('show');
  setTimeout(() => {
    notesToast.classList.remove('show');
  }, 2500);
};

// Save note function with 500 word limit and upgrade redirect
const saveNote = () => {
  const noteContent = notesInput.value.trim();
  if (!noteContent) {
    showToast('Cannot save an empty note!');
    return;
  }

  const wordCount = noteContent.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount > 500) {
    // Redirect to upgrade page if over limit
    window.location.href = "../upgrade-page/upgrade.html"; 
    return;
  }

  // Save note to localStorage
  const notes = JSON.parse(localStorage.getItem('notes')) || [];
  notes.push({
    content: noteContent,
    timestamp: new Date().toLocaleString()
  });
  localStorage.setItem('notes', JSON.stringify(notes));

  // Show save alert modal
  alertModal.style.display = 'flex';

  // Clear textarea
  notesInput.value = '';
};

// Render notes inside the library modal
const renderNotes = () => {
  const notesGrid = notesModal.querySelector('.notes-grid');
  notesGrid.innerHTML = '';
  const notes = JSON.parse(localStorage.getItem('notes')) || [];

  if (notes.length === 0) {
    notesGrid.innerHTML = '<p style="text-align:center; color:#784fa0;">You don\'t have any saved notes yet.</p>';
    return;
  }

  notes.forEach((note, index) => {
    const noteCard = document.createElement('div');
    noteCard.className = 'note-card';
    noteCard.innerHTML = `
      <div class="note-meta">${note.timestamp}</div>
      <div class="note-body">${note.content}</div>
      <button class="delete-note-btn" data-index="${index}">Delete</button>
    `;
    notesGrid.appendChild(noteCard);
  });
};

// Delete note without closing modal
const deleteNote = (index) => {
  const notes = JSON.parse(localStorage.getItem('notes')) || [];
  notes.splice(index, 1);
  localStorage.setItem('notes', JSON.stringify(notes));
  renderNotes();
  showToast('Note deleted!');
};

// Event listeners
saveBtn.addEventListener('click', saveNote);

libraryBtn.addEventListener('click', () => {
  renderNotes();
  notesModal.style.display = 'flex';
});

notesModal.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-note-btn')) {
    const idx = parseInt(e.target.dataset.index, 10);
    deleteNote(idx);
    e.stopPropagation(); // Prevent modal from closing on delete button click
  }
});

// Close modals handlers
notesModal.querySelector('#close-grid').addEventListener('click', () => {
  notesModal.style.display = 'none';
});
alertModal.querySelector('#alert-ok-btn').addEventListener('click', () => {
  alertModal.style.display = 'none';
});

// Toast CSS (optional, insert in your CSS file or here)
const toastStyle = document.createElement('style');
toastStyle.innerHTML = `
  #note-toast {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    background: #fc77d2;
    color: white;
    padding: 10px 20px;
    border-radius: 25px;
    font-weight: bold;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.1s ease;
    z-index: 9999;
    font-family: fantasy, sans-serif;
  }
  #note-toast.show {
    opacity: 1;
    pointer-events: auto;
  }

  /* Modal overlay styles */
  .modal-overlay {
    position: fixed;
    top:0; left:0; right:0; bottom:0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9998;
  }

  /* Notes library container */
  .notes-grid-container {
    background: white;
    border-radius: 15px;
    padding: 20px 25px;
    width: 90vw;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 0 15px rgba(120, 0, 160, 0.3);
  }

  #close-grid {
    float: right;
    background: transparent;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: #784fa0;
    font-weight: bold;
  }

  .notes-grid {
    margin-top: 40px;
  }

  .note-card {
    border: 2px solid #fc77d2;
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 15px;
    background: #f9e6ff;
    font-family: fantasy, sans-serif;
    color: #4b2c69;
  }

  .note-meta {
    font-size: 0.8em;
    margin-bottom: 8px;
    color: #783f9f;
    font-weight: bold;
  }

  .note-body {
    white-space: pre-wrap;
  }

  .delete-note-btn {
    margin-top: 10px;
    background: #d75aa3;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 6px 14px;
    font-weight: bold;
    cursor: pointer;
    font-family: fantasy, sans-serif;
  }

  .delete-note-btn:hover {
    background: #b0417f;
  }

  /* Custom alert box */
  .alert-box {
    background: white;
    padding: 25px 30px;
    border-radius: 12px;
    box-shadow: 0 0 25px rgba(160, 0, 140, 0.4);
    text-align: center;
    font-family: fantasy, sans-serif;
    color: #783f9f;
  }

  .alert-box p {
    font-size: 18px;
    margin-bottom: 20px;
    font-weight: bold;
  }

  .alert-box button {
    background: #fc77d2;
    border: none;
    padding: 10px 30px;
    border-radius: 12px;
    color: white;
    font-weight: bold;
    cursor: pointer;
  }

  .alert-box button:hover {
    background: #d75aa3;
  }
`;
document.head.appendChild(toastStyle);