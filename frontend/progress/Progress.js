/**
 * Study Bunny Progress Tracker
 * Modern ES6+ implementation with charts and analytics
 */

// Configuration
const CONFIG = {
  storageKey: 'studyBunnyProgress',
  goalsKey: 'studyBunnyGoals',
  achievementsKey: 'studyBunnyAchievements',
  defaultGoals: {
    studyTime: 2, // hours
    waterIntake: 8, // cups
    pomodoros: 8, // sessions
    weeklyDays: 5 // days per week
  },
  badges: [
    { id: 'first_day', name: 'First Day', description: 'Completed your first study session', icon: '🌟' },
    { id: 'week_streak', name: 'Week Warrior', description: '7 day study streak', icon: '🔥' },
    { id: 'goal_crusher', name: 'Goal Crusher', description: 'Achieved all daily goals', icon: '🎯' },
    { id: 'early_bird', name: 'Early Bird', description: 'Started studying before 8 AM', icon: '🐦' },
    { id: 'night_owl', name: 'Night Owl', description: 'Studied after 10 PM', icon: '🦉' },
    { id: 'hydration_hero', name: 'Hydration Hero', description: 'Drank 10+ cups of water', icon: '💧' },
    { id: 'pomodoro_master', name: 'Pomodoro Master', description: 'Completed 10+ pomodoros', icon: '🍅' },
    { id: 'quiz_champion', name: 'Quiz Champion', description: 'Scored 100% on a quiz', icon: '🏆' }
  ]
};

// State
const state = {
  todayData: {
    studyTime: 0, // minutes
    waterIntake: 0, // cups
    pomodoros: 0,
    quizScores: [],
    flashcardScores: [],
    moodEntries: [],
    lastUpdated: new Date().toISOString()
  },
  goals: { ...CONFIG.defaultGoals },
  achievements: [],
  currentRange: 7,
  historicalData: []
};

// Utilities
const Utils = {
  $: (selector) => document.querySelector(selector),
  $$: (selector) => document.querySelectorAll(selector),
  
  formatTime: (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  },
  
  formatDate: (date) => new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
  }),
  
  getDateKey: (date = new Date()) => date.toISOString().split('T')[0],
  
  showNotification: (message, type = 'success') => {
    const container = Utils.$('#notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    container.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  },
  
  calculatePercentage: (current, goal) => {
    return goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  },
  
  getMoodScore: (mood) => {
    const moodMap = {
      'happy': 100, 'excited': 95, 'confident': 85,
      'bored': 50, 'tired': 40, 'stressed': 30, 'sad': 20, 'angry': 10
    };
    return moodMap[mood] || 50;
  },
  
  getMoodEmoji: (score) => {
    if (score >= 80) return '😊';
    if (score >= 60) return '🙂';
    if (score >= 40) return '😐';
    if (score >= 20) return '😕';
    return '😢';
  }
};

// Storage Management
const Storage = {
  saveProgress: () => {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify({
        todayData: state.todayData,
        historicalData: state.historicalData
      }));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  },
  
  loadProgress: () => {
    try {
      const saved = localStorage.getItem(CONFIG.storageKey);
      if (!saved) return;
      
      const data = JSON.parse(saved);
      const today = Utils.getDateKey();
      
      // Load historical data
      state.historicalData = data.historicalData || [];
      
      // Check if today's data exists and is from today
      if (data.todayData && data.todayData.lastUpdated) {
        const lastUpdated = Utils.getDateKey(new Date(data.todayData.lastUpdated));
        if (lastUpdated === today) {
          state.todayData = { ...state.todayData, ...data.todayData };
        } else {
          // Archive yesterday's data
          if (data.todayData.studyTime > 0 || data.todayData.waterIntake > 0 || data.todayData.pomodoros > 0) {
            state.historicalData.unshift({
              date: lastUpdated,
              ...data.todayData
            });
            
            // Keep only last 90 days
            if (state.historicalData.length > 90) {
              state.historicalData = state.historicalData.slice(0, 90);
            }
          }
          
          // Reset today's data
          state.todayData = {
            studyTime: 0,
            waterIntake: 0,
            pomodoros: 0,
            quizScores: [],
            flashcardScores: [],
            moodEntries: [],
            lastUpdated: new Date().toISOString()
          };
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  },
  
  saveGoals: () => {
    try {
      localStorage.setItem(CONFIG.goalsKey, JSON.stringify(state.goals));
    } catch (error) {
      console.error('Error saving goals:', error);
    }
  },
  
  loadGoals: () => {
    try {
      const saved = localStorage.getItem(CONFIG.goalsKey);
      if (saved) {
        state.goals = { ...CONFIG.defaultGoals, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  },
  
  saveAchievements: () => {
    try {
      localStorage.setItem(CONFIG.achievementsKey, JSON.stringify(state.achievements));
    } catch (error) {
      console.error('Error saving achievements:', error);
    }
  },
  
  loadAchievements: () => {
    try {
      const saved = localStorage.getItem(CONFIG.achievementsKey);
      if (saved) {
        state.achievements = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  }
};

// Data Integration - Get real data from other components
const DataIntegration = {
  updateFromOtherComponents: () => {
    // Get data from Pomodoro Timer
    try {
      const pomodoroData = JSON.parse(localStorage.getItem('studyBunnyPomodoro')) || {};
      if (pomodoroData.stats && pomodoroData.stats.todaySessions) {
        state.todayData.pomodoros = pomodoroData.stats.todaySessions;
        state.todayData.studyTime = pomodoroData.stats.todaySessions * 25; // 25 min per pomodoro
      }
    } catch (error) {
      console.error('Error reading pomodoro data:', error);
    }
    
    // Get data from Water Tracker
    try {
      const waterData = JSON.parse(localStorage.getItem('studyBunnyWaterTracker')) || {};
      if (waterData.todayData && waterData.todayData.intake) {
        state.todayData.waterIntake = Math.floor(waterData.todayData.intake / 250); // Convert ml to cups
      }
    } catch (error) {
      console.error('Error reading water data:', error);
    }
    
    // Get data from Mood Tracker
    try {
      const moodData = JSON.parse(localStorage.getItem('studyBunnyMoodHistory')) || [];
      const today = Utils.getDateKey();
      const todayMood = moodData.find(entry => entry.date === today);
      if (todayMood) {
        state.todayData.moodEntries = [todayMood.mood];
      }
    } catch (error) {
      console.error('Error reading mood data:', error);
    }
    
    // Get data from Quiz
    try {
      const quizResults = JSON.parse(localStorage.getItem('studyBunnyQuizResults')) || [];
      const today = Utils.getDateKey();
      const todayQuizzes = quizResults.filter(result => 
        Utils.getDateKey(new Date(result.date)) === today
      );
      state.todayData.quizScores = todayQuizzes.map(quiz => quiz.percentage);
    } catch (error) {
      console.error('Error reading quiz data:', error);
    }
    
    // Update last updated timestamp
    state.todayData.lastUpdated = new Date().toISOString();
  }
};

// Progress Management
const ProgressManager = {
  init: () => {
    Storage.loadProgress();
    Storage.loadGoals();
    Storage.loadAchievements();
    
    // Update with real data from other components
    DataIntegration.updateFromOtherComponents();
    
    ProgressManager.updateUI();
    ProgressManager.setupEventListeners();
    ProgressManager.checkAchievements();
    
    // Auto-update every 30 seconds
    setInterval(() => {
      DataIntegration.updateFromOtherComponents();
      ProgressManager.updateUI();
      ProgressManager.checkAchievements();
      Storage.saveProgress();
    }, 30000);
  },
  
  setupEventListeners: () => {
    // Range selector
    Utils.$$('.range-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Utils.$$('.range-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentRange = parseInt(btn.getAttribute('data-range'));
        ProgressManager.updateCharts();
      });
    });
    
    // Goals modal
    Utils.$('#editGoalsBtn').addEventListener('click', () => ModalManager.open('goals'));
    
    // Action buttons
    Utils.$('#exportDataBtn').addEventListener('click', ProgressManager.exportData);
    Utils.$('#resetDataBtn').addEventListener('click', ProgressManager.resetData);
    Utils.$('#shareProgressBtn').addEventListener('click', ProgressManager.shareProgress);
  },
  
  updateUI: () => {
    ProgressManager.updateOverviewCards();
    ProgressManager.updateCharts();
    ProgressManager.updateAchievements();
    ProgressManager.updateGoalsDisplay();
    Storage.saveProgress();
  },
  
  updateOverviewCards: () => {
    // Study Time
    const studyHours = state.todayData.studyTime / 60;
    const studyGoalHours = state.goals.studyTime;
    const studyPercentage = Utils.calculatePercentage(studyHours, studyGoalHours);
    
    Utils.$('#studyTime').textContent = Utils.formatTime(state.todayData.studyTime);
    Utils.$('#studyGoal').textContent = `${studyGoalHours}h`;
    Utils.$('#studyProgress').style.width = `${studyPercentage}%`;
    Utils.$('#studyPercentage').textContent = `${Math.round(studyPercentage)}%`;
    
    // Water Intake
    const waterPercentage = Utils.calculatePercentage(state.todayData.waterIntake, state.goals.waterIntake);
    Utils.$('#waterIntake').textContent = `${state.todayData.waterIntake} cups`;
    Utils.$('#waterGoal').textContent = `${state.goals.waterIntake} cups`;
    Utils.$('#waterProgress').style.width = `${waterPercentage}%`;
    Utils.$('#waterPercentage').textContent = `${Math.round(waterPercentage)}%`;
    
    // Pomodoros
    const pomodoroPercentage = Utils.calculatePercentage(state.todayData.pomodoros, state.goals.pomodoros);
    Utils.$('#pomodoroCount').textContent = state.todayData.pomodoros;
    Utils.$('#pomodoroGoal').textContent = state.goals.pomodoros;
    Utils.$('#pomodoroProgress').style.width = `${pomodoroPercentage}%`;
    Utils.$('#pomodoroPercentage').textContent = `${Math.round(pomodoroPercentage)}%`;
    
    // Mood
    if (state.todayData.moodEntries.length > 0) {
      const latestMood = state.todayData.moodEntries[state.todayData.moodEntries.length - 1];
      const moodScore = Utils.getMoodScore(latestMood);
      Utils.$('#moodScore').textContent = latestMood.charAt(0).toUpperCase() + latestMood.slice(1);
      Utils.$('#moodEmoji').textContent = Utils.getMoodEmoji(moodScore);
    } else {
      Utils.$('#moodScore').textContent = 'Not tracked';
      Utils.$('#moodEmoji').textContent = '😐';
    }
    
    // Add achievement animation if goals are met
    [
      { card: Utils.$('.metric-card.study'), percentage: studyPercentage },
      { card: Utils.$('.metric-card.water'), percentage: waterPercentage },
      { card: Utils.$('.metric-card.pomodoro'), percentage: pomodoroPercentage }
    ].forEach(({ card, percentage }) => {
      if (percentage >= 100) {
        card.classList.add('achieving');
      } else {
        card.classList.remove('achieving');
      }
    });
  },
  
  updateCharts: () => {
    // Get data for the selected range
    const rangeData = ProgressManager.getRangeData(state.currentRange);
    
    ProgressManager.updateStudyChart(rangeData);
    ProgressManager.updateActivityChart(rangeData);
    ProgressManager.updatePerformanceChart(rangeData);
    ProgressManager.updateGoalsChart();
  },
  
  getRangeData: (days) => {
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = Utils.getDateKey(date);
      
      if (i === 0) {
        // Today's data
        data.push({
          date: dateKey,
          ...state.todayData,
          displayDate: Utils.formatDate(date)
        });
      } else {
        // Historical data
        const historical = state.historicalData.find(h => h.date === dateKey);
        data.push({
          date: dateKey,
          studyTime: historical?.studyTime || 0,
          waterIntake: historical?.waterIntake || 0,
          pomodoros: historical?.pomodoros || 0,
          quizScores: historical?.quizScores || [],
          moodEntries: historical?.moodEntries || [],
          displayDate: Utils.formatDate(date)
        });
      }
    }
    
    return data;
  },
  
  updateStudyChart: (data) => {
    const canvas = Utils.$('#studyChart');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (data.length === 0) return;
    
    // Chart dimensions
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    // Find max value
    const maxStudyTime = Math.max(...data.map(d => d.studyTime), state.goals.studyTime * 60);
    const goalLine = (state.goals.studyTime * 60 / maxStudyTime) * chartHeight;
    
    // Draw goal line
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding, padding + chartHeight - goalLine);
    ctx.lineTo(padding + chartWidth, padding + chartHeight - goalLine);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw study time line
    ctx.strokeStyle = '#2196f3';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    data.forEach((day, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - (day.studyTime / maxStudyTime) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      // Draw point
      ctx.fillStyle = '#2196f3';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    ctx.stroke();
    
    // Draw labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // X-axis labels (every few days)
    const labelInterval = Math.max(1, Math.floor(data.length / 5));
    data.forEach((day, index) => {
      if (index % labelInterval === 0) {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        ctx.fillText(day.displayDate, x, canvas.height - 10);
      }
    });
  },
  
  updateActivityChart: (data) => {
    const canvas = Utils.$('#activityChart');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate totals
    const totalStudy = data.reduce((sum, d) => sum + d.studyTime, 0);
    const totalWater = data.reduce((sum, d) => sum + d.waterIntake, 0) * 10; // Scale for visibility
    const totalPomodoros = data.reduce((sum, d) => sum + d.pomodoros, 0) * 30; // Scale for visibility
    
    const total = totalStudy + totalWater + totalPomodoros;
    if (total === 0) return;
    
    // Draw pie chart
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    
    let currentAngle = -Math.PI / 2;
    
    const segments = [
      { value: totalStudy, color: '#2196f3', label: 'Study' },
      { value: totalWater, color: '#00bcd4', label: 'Water' },
      { value: totalPomodoros, color: '#ff5722', label: 'Pomodoros' }
    ];
    
    segments.forEach(segment => {
      const angle = (segment.value / total) * 2 * Math.PI;
      
      ctx.fillStyle = segment.color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
      ctx.closePath();
      ctx.fill();
      
      currentAngle += angle;
    });
  },
  
  updatePerformanceChart: (data) => {
    const canvas = Utils.$('#performanceChart');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate weekly performance (percentage of goals achieved)
    const weeklyData = [];
    for (let i = 0; i < data.length; i += 7) {
      const weekData = data.slice(i, i + 7);
      const avgStudy = weekData.reduce((sum, d) => sum + d.studyTime, 0) / (7 * 60);
      const avgWater = weekData.reduce((sum, d) => sum + d.waterIntake, 0) / 7;
      const avgPomodoros = weekData.reduce((sum, d) => sum + d.pomodoros, 0) / 7;
      
      const studyPerf = Utils.calculatePercentage(avgStudy, state.goals.studyTime);
      const waterPerf = Utils.calculatePercentage(avgWater, state.goals.waterIntake);
      const pomodoroPerf = Utils.calculatePercentage(avgPomodoros, state.goals.pomodoros);
      
      const overallPerf = (studyPerf + waterPerf + pomodoroPerf) / 3;
      weeklyData.push(overallPerf);
    }
    
    if (weeklyData.length === 0) return;
    
    // Draw bar chart
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    const barWidth = chartWidth / weeklyData.length - 10;
    
    weeklyData.forEach((performance, index) => {
      const barHeight = (performance / 100) * chartHeight;
      const x = padding + index * (barWidth + 10);
      const y = padding + chartHeight - barHeight;
      
      ctx.fillStyle = performance >= 80 ? '#4caf50' : performance >= 60 ? '#ff9800' : '#f44336';
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Draw percentage
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(performance)}%`, x + barWidth / 2, y - 5);
    });
  },
  
  updateGoalsChart: () => {
    const goalsGrid = Utils.$('#goalsGrid');
    
    const goals = [
      { name: 'Study Time', current: state.todayData.studyTime / 60, target: state.goals.studyTime, unit: 'h' },
      { name: 'Water Intake', current: state.todayData.waterIntake, target: state.goals.waterIntake, unit: 'cups' },
      { name: 'Pomodoros', current: state.todayData.pomodoros, target: state.goals.pomodoros, unit: '' },
      { name: 'Mood', current: state.todayData.moodEntries.length, target: 1, unit: 'entry' }
    ];
    
    goalsGrid.innerHTML = goals.map(goal => {
      const percentage = Utils.calculatePercentage(goal.current, goal.target);
      return `
        <div class="goal-progress-item">
          <div class="goal-name">${goal.name}</div>
          <div class="goal-progress-bar">
            <div class="goal-progress-fill" style="width: ${percentage}%"></div>
          </div>
          <div class="goal-percentage">${Math.round(percentage)}% (${goal.current.toFixed(1)}/${goal.target} ${goal.unit})</div>
        </div>
      `;
    }).join('');
  },
  
  updateAchievements: () => {
    // Calculate streaks and stats
    const streak = ProgressManager.calculateStreak();
    const goalsAchieved = ProgressManager.calculateGoalsAchieved();
    const totalSessions = state.historicalData.reduce((sum, d) => sum + d.pomodoros, 0) + state.todayData.pomodoros;
    const averageScore = ProgressManager.calculateAveragePerformance();
    
    Utils.$('#currentStreak').textContent = streak;
    Utils.$('#goalsAchieved').textContent = goalsAchieved;
    Utils.$('#totalSessions').textContent = totalSessions;
    Utils.$('#averageScore').textContent = `${Math.round(averageScore)}%`;
    
    // Update badges
    const badgesGrid = Utils.$('#badgesGrid');
    const recentBadges = state.achievements.slice(-6);
    
    badgesGrid.innerHTML = recentBadges.length > 0 
      ? recentBadges.map(achievementId => {
          const badge = CONFIG.badges.find(b => b.id === achievementId);
          return badge ? `
            <div class="badge-item">
              <div class="badge-icon">${badge.icon}</div>
              <div class="badge-name">${badge.name}</div>
              <div class="badge-description">${badge.description}</div>
            </div>
          ` : '';
        }).join('')
      : '<div style="text-align: center; color: var(--text-light); grid-column: 1 / -1;">No achievements yet. Keep studying to earn badges! 🎯</div>';
  },
  
  updateGoalsDisplay: () => {
    Utils.$('#displayStudyGoal').textContent = `${state.goals.studyTime} hours`;
    Utils.$('#displayWaterGoal').textContent = `${state.goals.waterIntake} cups`;
    Utils.$('#displayPomodoroGoal').textContent = `${state.goals.pomodoros} sessions`;
    Utils.$('#displayWeeklyGoal').textContent = `${state.goals.weeklyDays} days`;
  },
  
  calculateStreak: () => {
    let streak = 0;
    const today = new Date();
    
    // Check if today has any activity
    if (state.todayData.studyTime > 0 || state.todayData.pomodoros > 0) {
      streak = 1;
    }
    
    // Check historical data
    for (let i = 1; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateKey = Utils.getDateKey(checkDate);
      
      const dayData = state.historicalData.find(h => h.date === dateKey);
      if (dayData && (dayData.studyTime > 0 || dayData.pomodoros > 0)) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  },
  
  calculateGoalsAchieved: () => {
    return state.historicalData.filter(day => {
      const studyGoalMet = (day.studyTime / 60) >= state.goals.studyTime;
      const waterGoalMet = day.waterIntake >= state.goals.waterIntake;
      const pomodoroGoalMet = day.pomodoros >= state.goals.pomodoros;
      return studyGoalMet && waterGoalMet && pomodoroGoalMet;
    }).length;
  },
  
  calculateAveragePerformance: () => {
    const allData = [...state.historicalData, state.todayData];
    if (allData.length === 0) return 0;
    
    const performances = allData.map(day => {
      const studyPerf = Utils.calculatePercentage(day.studyTime / 60, state.goals.studyTime);
      const waterPerf = Utils.calculatePercentage(day.waterIntake, state.goals.waterIntake);
      const pomodoroPerf = Utils.calculatePercentage(day.pomodoros, state.goals.pomodoros);
      return (studyPerf + waterPerf + pomodoroPerf) / 3;
    });
    
    return performances.reduce((sum, perf) => sum + perf, 0) / performances.length;
  },
  
  checkAchievements: () => {
    const newAchievements = [];
    
    // First Day
    if (!state.achievements.includes('first_day') && 
        (state.todayData.studyTime > 0 || state.todayData.pomodoros > 0)) {
      newAchievements.push('first_day');
    }
    
    // Week Streak
    if (!state.achievements.includes('week_streak') && ProgressManager.calculateStreak() >= 7) {
      newAchievements.push('week_streak');
    }
    
    // Goal Crusher
    if (!state.achievements.includes('goal_crusher')) {
      const studyGoalMet = (state.todayData.studyTime / 60) >= state.goals.studyTime;
      const waterGoalMet = state.todayData.waterIntake >= state.goals.waterIntake;
      const pomodoroGoalMet = state.todayData.pomodoros >= state.goals.pomodoros;
      
      if (studyGoalMet && waterGoalMet && pomodoroGoalMet) {
        newAchievements.push('goal_crusher');
      }
    }
    
    // Hydration Hero
    if (!state.achievements.includes('hydration_hero') && state.todayData.waterIntake >= 10) {
      newAchievements.push('hydration_hero');
    }
    
    // Pomodoro Master
    if (!state.achievements.includes('pomodoro_master') && state.todayData.pomodoros >= 10) {
      newAchievements.push('pomodoro_master');
    }
    
    // Quiz Champion
    if (!state.achievements.includes('quiz_champion') && 
        state.todayData.quizScores.some(score => score === 100)) {
      newAchievements.push('quiz_champion');
    }
    
    // Add new achievements
    newAchievements.forEach(achievementId => {
      if (!state.achievements.includes(achievementId)) {
        state.achievements.push(achievementId);
        const badge = CONFIG.badges.find(b => b.id === achievementId);
        if (badge) {
          Utils.showNotification(`🎉 Achievement unlocked: ${badge.name}!`, 'success');
        }
      }
    });
    
    if (newAchievements.length > 0) {
      Storage.saveAchievements();
    }
  },
  
  exportData: () => {
    const exportData = {
      todayData: state.todayData,
      historicalData: state.historicalData,
      goals: state.goals,
      achievements: state.achievements,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-bunny-progress-${Utils.getDateKey()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    Utils.showNotification('Progress data exported! 📤', 'success');
  },
  
  resetData: () => {
    if (!confirm('Are you sure you want to reset all progress data? This action cannot be undone.')) {
      return;
    }
    
    // Reset state
    state.todayData = {
      studyTime: 0,
      waterIntake: 0,
      pomodoros: 0,
      quizScores: [],
      flashcardScores: [],
      moodEntries: [],
      lastUpdated: new Date().toISOString()
    };
    state.historicalData = [];
    state.achievements = [];
    
    // Clear storage
    localStorage.removeItem(CONFIG.storageKey);
    localStorage.removeItem(CONFIG.achievementsKey);
    
    // Update UI
    ProgressManager.updateUI();
    
    Utils.showNotification('Progress data reset', 'info');
  },
  
  shareProgress: () => {
    const todayProgress = [
      `Study Time: ${Utils.formatTime(state.todayData.studyTime)}`,
      `Water Intake: ${state.todayData.waterIntake} cups`,
      `Pomodoros: ${state.todayData.pomodoros}`,
      `Current Streak: ${ProgressManager.calculateStreak()} days`
    ].join('\n');
    
    const shareText = `🎓 My Study Bunny Progress Today:\n\n${todayProgress}\n\nStay motivated and keep learning! 📚✨`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Study Progress',
        text: shareText
      });
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        Utils.showNotification('Progress copied to clipboard! 📋', 'success');
      }).catch(() => {
        Utils.showNotification('Failed to copy progress', 'error');
      });
    }
  }
};

// Modal Management
const ModalManager = {
  init: () => {
    // Goals modal
    Utils.$('#closeGoalsModal').addEventListener('click', () => ModalManager.close('goals'));
    Utils.$('#cancelGoalsBtn').addEventListener('click', () => ModalManager.close('goals'));
    
    Utils.$('#goalsForm').addEventListener('submit', (e) => {
      e.preventDefault();
      
      state.goals.studyTime = parseFloat(Utils.$('#goalStudyTime').value);
      state.goals.waterIntake = parseInt(Utils.$('#goalWaterIntake').value);
      state.goals.pomodoros = parseInt(Utils.$('#goalPomodoros').value);
      state.goals.weeklyDays = parseInt(Utils.$('#goalWeeklyDays').value);
      
      Storage.saveGoals();
      ProgressManager.updateUI();
      ModalManager.close('goals');
      
      Utils.showNotification('Goals updated successfully! 🎯', 'success');
    });
    
    // Goal sliders
    Utils.$$('.form-slider').forEach(slider => {
      slider.addEventListener('input', ModalManager.updateSliderValues);
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
    
    if (type === 'goals') {
      // Load current goals into form
      Utils.$('#goalStudyTime').value = state.goals.studyTime;
      Utils.$('#goalWaterIntake').value = state.goals.waterIntake;
      Utils.$('#goalPomodoros').value = state.goals.pomodoros;
      Utils.$('#goalWeeklyDays').value = state.goals.weeklyDays;
      ModalManager.updateSliderValues();
    }
    
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  },
  
  close: (type) => {
    const modal = Utils.$(`#${type}Modal`);
    if (modal) {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  },
  
  updateSliderValues: () => {
    const studyTime = Utils.$('#goalStudyTime').value;
    const waterIntake = Utils.$('#goalWaterIntake').value;
    const pomodoros = Utils.$('#goalPomodoros').value;
    const weeklyDays = Utils.$('#goalWeeklyDays').value;
    
    Utils.$('#goalStudyTimeValue').textContent = `${studyTime} hour${studyTime !== '1' ? 's' : ''}`;
    Utils.$('#goalWaterIntakeValue').textContent = `${waterIntake} cup${waterIntake !== '1' ? 's' : ''}`;
    Utils.$('#goalPomodorosValue').textContent = `${pomodoros} session${pomodoros !== '1' ? 's' : ''}`;
    Utils.$('#goalWeeklyDaysValue').textContent = `${weeklyDays} day${weeklyDays !== '1' ? 's' : ''}`;
  }
};

// Application Initialization
const ProgressApp = {
  init: () => {
    try {
      ProgressManager.init();
      ModalManager.init();
      
      console.log('Progress Tracker initialized successfully!');
    } catch (error) {
      console.error('Failed to initialize Progress Tracker:', error);
      Utils.showNotification('Failed to initialize app. Please refresh.', 'error');
    }
  }
};

// Start Application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ProgressApp.init);
} else {
  ProgressApp.init();
}

// Debug export
if (window.location.hostname === 'localhost') {
  window.ProgressDebug = { 
    state, CONFIG, Utils, Storage, DataIntegration, ProgressManager, ModalManager 
  };
}
