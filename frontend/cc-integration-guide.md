# 🥕 Carrot Currency Integration Guide

This guide shows how to integrate CC tracking into each Study Bunny component.

## 🚀 Quick Setup

### 1. Add CC System to HTML
```html
<!-- Add before your component's JS file -->
<script src="../cc-system.js"></script>
<script src="your-component.js"></script>
```

### 2. Track Activities in JavaScript

```javascript
// Example: Todo List Component
function completeTask() {
    // Your existing task completion logic...
    
    // Track CC activity
    if (window.StudyBunnyCC) {
        window.StudyBunnyCC.trackTodoCompleted(1);
    }
}

// Example: Notes Component  
function saveNotes() {
    const wordCount = getWordCount(); // Your word counting function
    
    // Track CC for words written
    if (window.StudyBunnyCC && wordCount > 0) {
        window.StudyBunnyCC.trackWordsWritten(wordCount);
    }
}

// Example: Pomodoro Component
function onPomodoroComplete(minutes) {
    // Your pomodoro completion logic...
    
    // Track CC for focus time
    if (window.StudyBunnyCC) {
        window.StudyBunnyCC.trackPomodoroMinutes(minutes);
    }
}

// Example: Flashcards Component
function onFlashcardCorrect() {
    // Your flashcard logic...
    
    // Track CC for correct answers
    if (window.StudyBunnyCC) {
        window.StudyBunnyCC.trackFlashcardCorrect(1);
    }
}

// Example: Quiz Component
function onQuizAnswerCorrect() {
    // Your quiz logic...
    
    // Track CC for correct answers
    if (window.StudyBunnyCC) {
        window.StudyBunnyCC.trackQuizCorrect(1);
    }
}
```

## 🎯 CC Earning Rules

| Activity | Requirement | Reward |
|----------|-------------|---------|
| ✅ Todo Tasks | Complete 10 tasks | +0.1 CC |
| 📝 Notes | Write 50 words | +0.1 CC |
| ⏲️ Pomodoro | 10 minutes focus | +0.1 CC |
| 🃏 Flashcards | 10 correct answers | +0.1 CC |
| 🧠 Quizzes | 10 correct answers | +0.1 CC |

## ⚠️ Inactivity Penalties

- Miss 3 days: -0.3 CC
- Miss 7 days: -0.7 CC

## 💰 Purchase Options

- $0.99 = 100 CC
- $9.99 = 1,500 CC  
- $19.99 = 4,000 CC

## 🔧 Advanced Features

### Check Current Balance
```javascript
const balance = window.StudyBunnyCC.getBalance();
console.log(`Current CC: ${balance}`);
```

### Listen for CC Updates
```javascript
document.addEventListener('ccUpdated', (e) => {
    console.log('CC Balance:', e.detail.balance);
    console.log('Activities:', e.detail.activities);
});
```

### Custom CC Rewards
```javascript
// Give custom CC for special achievements
window.StudyBunnyCC.earnCC(0.5, 'Completed weekly goal!');
```

### Spend CC for Features
```javascript
// Spend CC for premium features or outfits
const success = window.StudyBunnyCC.spendCC(10, 'Premium bunny outfit');
if (success) {
    // Unlock the feature
    unlockPremiumOutfit();
}
```

## 🐰 Integration Examples by Component

### Todo List (`todolist.js`)
```javascript
// Track when tasks are completed
function markTaskComplete(taskId) {
    // Existing logic...
    tasks[taskId].completed = true;
    
    // Track CC
    window.StudyBunnyCC?.trackTodoCompleted(1);
    
    saveToStorage();
    updateDisplay();
}
```

### Notes (`notes.js`)  
```javascript
// Track words as user types
let lastWordCount = 0;

function onNotesChange() {
    const currentWordCount = countWords(notesContent);
    const newWords = currentWordCount - lastWordCount;
    
    if (newWords > 0) {
        window.StudyBunnyCC?.trackWordsWritten(newWords);
        lastWordCount = currentWordCount;
    }
}
```

### Pomodoro (`pomodoro.js`)
```javascript
// Track when pomodoro session completes
function onSessionComplete() {
    const sessionMinutes = getCurrentSessionMinutes();
    
    // Track CC
    window.StudyBunnyCC?.trackPomodoroMinutes(sessionMinutes);
    
    showCompletionMessage();
}
```

### Flashcards (`flashcard.js`)
```javascript
// Track correct answers
function checkAnswer(userAnswer, correctAnswer) {
    if (userAnswer === correctAnswer) {
        window.StudyBunnyCC?.trackFlashcardCorrect(1);
        showCorrectFeedback();
    } else {
        showIncorrectFeedback();
    }
}
```

### Quiz (`quiz.js`)
```javascript
// Track correct quiz answers
function submitAnswer(questionId, answer) {
    const isCorrect = checkAnswer(questionId, answer);
    
    if (isCorrect) {
        window.StudyBunnyCC?.trackQuizCorrect(1);
        score++;
    }
    
    moveToNextQuestion();
}
```

## 🔍 Debug and Testing

### Test CC System in Console
```javascript
// Test different activities
window.StudyBunnyCC.trackTodoCompleted(10); // Should earn 0.1 CC
window.StudyBunnyCC.trackWordsWritten(50);  // Should earn 0.1 CC
window.StudyBunnyCC.trackPomodoroMinutes(10); // Should earn 0.1 CC

// Check stats
console.log(window.StudyBunnyCC.getStats());

// Reset for testing
window.StudyBunnyCC.reset();
```

### View Debug Information
```javascript
// View detailed CC system state
console.log(window.CCDebug?.getStats());
```

This integration will make your Study Bunny app more engaging by rewarding users for productivity! 🥕✨
