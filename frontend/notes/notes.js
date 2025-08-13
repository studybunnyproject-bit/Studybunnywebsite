/**
 * Study Bunny Notes - Modern JavaScript Implementation
 * Rich text editing with auto-save and organization
 */

// Configuration
const CONFIG = {
  storageKey: 'studyBunnyNotes',
  autoSaveInterval: 2000,
  maxNoteLength: 50000,
  searchDebounce: 300
};

// State
const state = {
  notes: [],
  currentNote: null,
  searchTerm: '',
  currentFilter: 'all',
  autoSaveTimer: null,
  isEditing: false
};

// Utilities
const Utils = {
  $: (selector) => document.querySelector(selector),
  $$: (selector) => document.querySelectorAll(selector),
  
  generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
  
  formatDate: (date) => new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', 
    hour: '2-digit', minute: '2-digit'
  }),
  
  stripHtml: (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  },
  
  truncate: (text, length = 100) => {
    return text.length > length ? text.substring(0, length) + '...' : text;
  },
  
  showNotification: (message, type = 'success') => {
    const container = Utils.$('#notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    container.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  },
  
  debounce: (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
};

// Storage
const Storage = {
  getNotes: () => {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.storageKey)) || [];
    } catch (error) {
      console.error('Error loading notes:', error);
      return [];
    }
  },
  
  saveNotes: (notes) => {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(notes));
      return true;
    } catch (error) {
      console.error('Error saving notes:', error);
      Utils.showNotification('Failed to save notes', 'error');
      return false;
    }
  }
};

// Notes Manager
const NotesManager = {
  init: () => {
    state.notes = Storage.getNotes();
    NotesManager.renderNotesList();
    NotesManager.updateNotesCount();
    
    if (state.notes.length > 0) {
      NotesManager.loadNote(state.notes[0].id);
    } else {
      NotesManager.createNewNote();
    }
  },
  
  createNewNote: () => {
    const newNote = {
      id: Utils.generateId(),
      title: 'Untitled Note',
      content: '',
      tags: [],
      isFavorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    state.notes.unshift(newNote);
    Storage.saveNotes(state.notes);
    NotesManager.loadNote(newNote.id);
    NotesManager.renderNotesList();
    NotesManager.updateNotesCount();
    
    // Focus title input
    setTimeout(() => Utils.$('#noteTitle').focus(), 100);
    
    // Reset word count for CC tracking
    EditorManager.resetWordCount();
  },
  
  loadNote: (noteId) => {
    const note = state.notes.find(n => n.id === noteId);
    if (!note) return;
    
    state.currentNote = note;
    
    // Update UI
    Utils.$('#noteTitle').value = note.title;
    Utils.$('#noteEditor').innerHTML = note.content;
    Utils.$('#noteDate').textContent = Utils.formatDate(note.updatedAt);
    
    // Update favorite button
    const favoriteBtn = Utils.$('#favoriteBtn');
    favoriteBtn.className = `action-btn ${note.isFavorite ? 'active' : ''}`;
    favoriteBtn.querySelector('.btn-icon').textContent = note.isFavorite ? '★' : '☆';
    
    // Update tags
    TagsManager.renderTags(note.tags);
    
    // Update active note in list
    Utils.$$('.note-item').forEach(item => item.classList.remove('active'));
    const activeItem = Utils.$(`.note-item[data-id="${noteId}"]`);
    if (activeItem) activeItem.classList.add('active');
    
    EditorManager.updateStats();
    EditorManager.resetWordCount(); // Reset word count for CC tracking
  },
  
  saveCurrentNote: () => {
    if (!state.currentNote) return;
    
    const title = Utils.$('#noteTitle').value.trim() || 'Untitled Note';
    const content = Utils.$('#noteEditor').innerHTML;
    const tags = TagsManager.getCurrentTags();
    
    state.currentNote.title = title;
    state.currentNote.content = content;
    state.currentNote.tags = tags;
    state.currentNote.updatedAt = Date.now();
    
    Storage.saveNotes(state.notes);
    NotesManager.renderNotesList();
    NotesManager.updateAutoSaveStatus('saved');
    
    return true;
  },
  
  deleteNote: (noteId) => {
    const noteIndex = state.notes.findIndex(n => n.id === noteId);
    if (noteIndex === -1) return;
    
    state.notes.splice(noteIndex, 1);
    Storage.saveNotes(state.notes);
    
    if (state.currentNote && state.currentNote.id === noteId) {
      if (state.notes.length > 0) {
        NotesManager.loadNote(state.notes[0].id);
      } else {
        NotesManager.createNewNote();
      }
    }
    
    NotesManager.renderNotesList();
    NotesManager.updateNotesCount();
    Utils.showNotification('Note deleted', 'success');
  },
  
  toggleFavorite: () => {
    if (!state.currentNote) return;
    
    state.currentNote.isFavorite = !state.currentNote.isFavorite;
    Storage.saveNotes(state.notes);
    
    const favoriteBtn = Utils.$('#favoriteBtn');
    favoriteBtn.className = `action-btn ${state.currentNote.isFavorite ? 'active' : ''}`;
    favoriteBtn.querySelector('.btn-icon').textContent = state.currentNote.isFavorite ? '★' : '☆';
    
    NotesManager.renderNotesList();
    Utils.showNotification(
      state.currentNote.isFavorite ? 'Added to favorites' : 'Removed from favorites', 
      'success'
    );
  },
  
  renderNotesList: () => {
    const container = Utils.$('#notesList');
    const filteredNotes = NotesManager.getFilteredNotes();
    
    if (filteredNotes.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: var(--spacing-lg); color: var(--text-light);">
          <span style="font-size: 2rem; display: block; margin-bottom: var(--spacing-sm);">📝</span>
          <p>No notes found</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = filteredNotes.map(note => {
      const preview = Utils.stripHtml(note.content);
      return `
        <div class="note-item ${note.id === state.currentNote?.id ? 'active' : ''}" 
             data-id="${note.id}" 
             role="listitem">
          <div class="note-item-header">
            <h3 class="note-item-title">${note.title}</h3>
            ${note.isFavorite ? '<span class="note-item-favorite">★</span>' : ''}
          </div>
          <div class="note-item-preview">${Utils.truncate(preview, 80)}</div>
          <div class="note-item-meta">
            <span class="note-item-date">${Utils.formatDate(note.updatedAt)}</span>
            <div class="note-item-tags">
              ${note.tags.map(tag => `<span class="note-tag-item">${tag}</span>`).join('')}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },
  
  getFilteredNotes: () => {
    let filtered = [...state.notes];
    
    // Apply search filter
    if (state.searchTerm) {
      const term = state.searchTerm.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(term) ||
        Utils.stripHtml(note.content).toLowerCase().includes(term) ||
        note.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    // Apply category filter
    switch (state.currentFilter) {
      case 'recent':
        filtered = filtered.filter(note => 
          Date.now() - note.updatedAt < 7 * 24 * 60 * 60 * 1000
        );
        break;
      case 'favorites':
        filtered = filtered.filter(note => note.isFavorite);
        break;
    }
    
    return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  },
  
  updateNotesCount: () => {
    const count = NotesManager.getFilteredNotes().length;
    Utils.$('#notesCount').textContent = `${count} note${count !== 1 ? 's' : ''}`;
  },
  
  updateAutoSaveStatus: (status) => {
    const statusElement = Utils.$('#autoSaveStatus .status-text');
    const iconElement = Utils.$('#autoSaveStatus .status-icon');
    
    switch (status) {
      case 'saving':
        statusElement.textContent = 'Saving...';
        iconElement.textContent = '⏳';
        break;
      case 'saved':
        statusElement.textContent = 'Saved';
        iconElement.textContent = '✅';
        setTimeout(() => {
          statusElement.textContent = 'Ready to save';
          iconElement.textContent = '💾';
        }, 2000);
        break;
      case 'error':
        statusElement.textContent = 'Save failed';
        iconElement.textContent = '❌';
        break;
    }
  }
};

// Editor Manager
const EditorManager = {
  lastWordCount: 0, // Track previous word count for CC system
  
  init: () => {
    const editor = Utils.$('#noteEditor');
    
    // Setup toolbar
    Utils.$$('.toolbar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const command = btn.getAttribute('data-command');
        EditorManager.execCommand(command);
      });
    });
    
    // Setup auto-save
    editor.addEventListener('input', Utils.debounce(() => {
      if (state.currentNote) {
        NotesManager.updateAutoSaveStatus('saving');
        NotesManager.saveCurrentNote();
      }
      EditorManager.updateStats();
    }, CONFIG.autoSaveInterval));
    
    // Update stats on input
    editor.addEventListener('input', EditorManager.updateStats);
    
    // Setup keyboard shortcuts
    editor.addEventListener('keydown', EditorManager.handleKeyboard);
  },
  
  execCommand: (command, value = null) => {
    document.execCommand(command, false, value);
    Utils.$('#noteEditor').focus();
  },
  
  handleKeyboard: (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          EditorManager.execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          EditorManager.execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          EditorManager.execCommand('underline');
          break;
        case 's':
          e.preventDefault();
          NotesManager.saveCurrentNote();
          break;
      }
    }
  },
  
  updateStats: () => {
    const content = Utils.stripHtml(Utils.$('#noteEditor').innerHTML);
    const words = content.trim() ? content.split(/\s+/).length : 0;
    const chars = content.length;
    
    Utils.$('#wordCount').textContent = words;
    Utils.$('#charCount').textContent = chars;
    
    // Track words written for CC system
    if (words > EditorManager.lastWordCount) {
      const wordsWritten = words - EditorManager.lastWordCount;
      
      // Track CC: 50 words = 0.1 CC
      if (window.StudyBunnyCC) {
        window.StudyBunnyCC.trackWordsWritten(wordsWritten);
      }
      
      console.log(`📝 Words written: +${wordsWritten} (Total: ${words})`);
    }
    
    EditorManager.lastWordCount = words;
  },
  
  // Reset word count when loading a new note
  resetWordCount: () => {
    const content = Utils.stripHtml(Utils.$('#noteEditor').innerHTML);
    const words = content.trim() ? content.split(/\s+/).length : 0;
    EditorManager.lastWordCount = words;
  }
};

// Tags Manager
const TagsManager = {
  init: () => {
    const tagsInput = Utils.$('#noteTags');
    tagsInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        TagsManager.addTag(tagsInput.value.trim());
        tagsInput.value = '';
      }
    });
  },
  
  addTag: (tagName) => {
    if (!tagName || !state.currentNote) return;
    
    if (!state.currentNote.tags.includes(tagName)) {
      state.currentNote.tags.push(tagName);
      TagsManager.renderTags(state.currentNote.tags);
      NotesManager.saveCurrentNote();
    }
  },
  
  removeTag: (tagName) => {
    if (!state.currentNote) return;
    
    state.currentNote.tags = state.currentNote.tags.filter(tag => tag !== tagName);
    TagsManager.renderTags(state.currentNote.tags);
    NotesManager.saveCurrentNote();
  },
  
  renderTags: (tags) => {
    const container = Utils.$('#tagsContainer');
    const input = Utils.$('#noteTags');
    
    // Clear existing tags
    Utils.$$('.tag-item').forEach(tag => tag.remove());
    
    // Add tags
    tags.forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'tag-item';
      tagElement.innerHTML = `
        ${tag}
        <button type="button" class="tag-remove" onclick="TagsManager.removeTag('${tag}')" 
                aria-label="Remove ${tag} tag">×</button>
      `;
      container.insertBefore(tagElement, input);
    });
  },
  
  getCurrentTags: () => {
    return Array.from(Utils.$$('.tag-item')).map(tag => 
      tag.textContent.replace('×', '').trim()
    );
  }
};

// Search Manager
const SearchManager = {
  init: () => {
    const searchInput = Utils.$('#notesSearch');
    searchInput.addEventListener('input', Utils.debounce((e) => {
      state.searchTerm = e.target.value;
      NotesManager.renderNotesList();
      NotesManager.updateNotesCount();
    }, CONFIG.searchDebounce));
  }
};

// Filter Manager
const FilterManager = {
  init: () => {
    Utils.$$('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Utils.$$('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentFilter = btn.getAttribute('data-filter');
        NotesManager.renderNotesList();
        NotesManager.updateNotesCount();
      });
    });
  }
};

// Export Manager
const ExportManager = {
  copyAsText: () => {
    if (!state.currentNote) return;
    
    const content = Utils.stripHtml(state.currentNote.content);
    const text = `${state.currentNote.title}\n\n${content}`;
    
    navigator.clipboard.writeText(text).then(() => {
      Utils.showNotification('Note copied to clipboard', 'success');
    }).catch(() => {
      Utils.showNotification('Failed to copy note', 'error');
    });
  },
  
  exportAsFile: () => {
    if (!state.currentNote) return;
    
    const content = Utils.stripHtml(state.currentNote.content);
    const text = `${state.currentNote.title}\n\n${content}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.currentNote.title}.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
    Utils.showNotification('Note exported', 'success');
  }
};

// Modal Manager
const ModalManager = {
  init: () => {
    // Delete modal
    Utils.$('#deleteBtn').addEventListener('click', () => ModalManager.open('delete'));
    Utils.$('#closeDeleteModal').addEventListener('click', () => ModalManager.close('delete'));
    Utils.$('#cancelDeleteBtn').addEventListener('click', () => ModalManager.close('delete'));
    Utils.$('#confirmDeleteBtn').addEventListener('click', () => {
      if (state.currentNote) {
        NotesManager.deleteNote(state.currentNote.id);
        ModalManager.close('delete');
      }
    });
    
    // Share modal
    Utils.$('#shareBtn').addEventListener('click', () => ModalManager.open('share'));
    Utils.$('#closeShareModal').addEventListener('click', () => ModalManager.close('share'));
    Utils.$('#copyTextBtn').addEventListener('click', () => {
      ExportManager.copyAsText();
      ModalManager.close('share');
    });
    Utils.$('#exportBtn').addEventListener('click', () => {
      ExportManager.exportAsFile();
      ModalManager.close('share');
    });
    
    // Close on overlay click
    Utils.$$('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          const modalType = modal.id.replace('Modal', '');
          ModalManager.close(modalType);
        }
      });
    });
    
    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        Utils.$$('.modal-overlay.show').forEach(modal => {
          const modalType = modal.id.replace('Modal', '');
          ModalManager.close(modalType);
        });
      }
    });
  },
  
  open: (type) => {
    const modal = Utils.$(`#${type}Modal`);
    if (!modal) return;
    
    if (type === 'delete' && state.currentNote) {
      const preview = Utils.$('#deleteNotePreview');
      preview.innerHTML = `
        <strong>${state.currentNote.title}</strong><br>
        <small>${Utils.formatDate(state.currentNote.updatedAt)}</small>
      `;
    }
    
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  },
  
  close: (type) => {
    const modal = Utils.$(`#${type}Modal`);
    if (!modal) return;
    
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
};

// Event Handlers
const EventHandlers = {
  init: () => {
    // New note button
    Utils.$('#newNoteBtn').addEventListener('click', NotesManager.createNewNote);
    
    // Save button
    Utils.$('#saveBtn').addEventListener('click', NotesManager.saveCurrentNote);
    
    // Favorite button
    Utils.$('#favoriteBtn').addEventListener('click', NotesManager.toggleFavorite);
    
    // Title input
    Utils.$('#noteTitle').addEventListener('input', Utils.debounce(() => {
      if (state.currentNote) {
        NotesManager.saveCurrentNote();
      }
    }, CONFIG.autoSaveInterval));
    
    // Notes list clicks
    Utils.$('#notesList').addEventListener('click', (e) => {
      const noteItem = e.target.closest('.note-item');
      if (noteItem) {
        const noteId = noteItem.getAttribute('data-id');
        NotesManager.loadNote(noteId);
      }
    });
  }
};

// Application Initialization
const NotesApp = {
  init: () => {
    try {
      NotesManager.init();
      EditorManager.init();
      TagsManager.init();
      SearchManager.init();
      FilterManager.init();
      ModalManager.init();
      EventHandlers.init();
      
      console.log('Study Bunny Notes initialized successfully!');
    } catch (error) {
      console.error('Failed to initialize notes app:', error);
      Utils.showNotification('Failed to initialize app. Please refresh.', 'error');
    }
  }
};

// Start Application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', NotesApp.init);
} else {
  NotesApp.init();
}

// Debug export
if (window.location.hostname === 'localhost') {
  window.NotesDebug = { 
    state, CONFIG, Utils, Storage, NotesManager, EditorManager, 
    TagsManager, SearchManager, FilterManager, ExportManager, ModalManager 
  };
}
