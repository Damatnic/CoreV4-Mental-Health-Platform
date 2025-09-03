import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Brain,
  Heart,
  Moon,
  Sun,
  TrendingUp,
  Calendar,
  Award,
  Target,
  _BarChart3,
  _LineChart,
  _PieChart,
  _Clock,
  Zap,
  Droplets,
  Coffee,
  Apple,
  _ChevronRight,
  Plus,
  _Filter,
  Download,
  _Share2,
  Settings,
  _Bell,
  CheckCircle,
  Circle,
  AlertCircle,
  TrendingDown
} from 'lucide-react';
import { format as formatDate, startOfWeek, endOfWeek, eachDayOfInterval, isToday, _subDays } from 'date-fns';
import { _useWellnessStore } from '../../stores/wellnessStore';
import { secureStorage } from '../../services/security/SecureLocalStorage';

// Wellness metrics categories
const WELLNESS_CATEGORIES = {
  physical: {
    name: 'Physical Health',
    icon: Activity,
    color: 'from-green-400 to-emerald-500',
    metrics: ['exercise', 'sleep', 'nutrition', 'hydration']
  },
  mental: {
    name: 'Mental Wellness',
    icon: Brain,
    color: 'from-blue-400 to-indigo-500',
    metrics: ['mood', 'stress', 'focus', 'meditation']
  },
  emotional: {
    name: 'Emotional Balance',
    icon: Heart,
    color: 'from-pink-400 to-red-500',
    metrics: ['gratitude', 'social', 'self-care', 'journaling']
  },
  habits: {
    name: 'Healthy Habits',
    icon: Target,
    color: 'from-purple-400 to-violet-500',
    metrics: ['water', 'exercise', 'meditation', 'sleep', 'reading']
  }
};

// Daily habits to track
const DAILY_HABITS = [
  { id: 'water', name: 'Drink 8 glasses of water', icon: Droplets, category: 'physical' },
  { id: 'exercise', name: '30 minutes exercise', icon: Activity, category: 'physical' },
  { id: 'meditation', name: '10 minutes meditation', icon: Brain, category: 'mental' },
  { id: 'journal', name: 'Write in journal', icon: Sun, category: 'emotional' },
  { id: 'gratitude', name: 'Practice gratitude', icon: Heart, category: 'emotional' },
  { id: 'sleep', name: '8 hours sleep', icon: Moon, category: 'physical' },
  { id: 'healthy_meal', name: 'Eat healthy meals', icon: Apple, category: 'physical' },
  { id: 'no_caffeine', name: 'Limit caffeine', icon: Coffee, category: 'physical' },
  { id: 'social', name: 'Connect with others', icon: Heart, category: 'emotional' },
  { id: 'nature', name: 'Spend time in nature', icon: Sun, category: 'mental' }
];

// Exercise types
const EXERCISE_TYPES = {
  cardio: { name: 'Cardio', icon: Activity, calories: 10 },
  strength: { name: 'Strength Training', icon: Zap, calories: 8 },
  yoga: { name: 'Yoga', icon: Sun, calories: 4 },
  walking: { name: 'Walking', icon: Activity, calories: 5 },
  running: { name: 'Running', icon: Activity, calories: 12 },
  cycling: { name: 'Cycling', icon: Activity, calories: 8 },
  swimming: { name: 'Swimming', icon: Droplets, calories: 11 }
};

// Sleep quality levels
const SLEEP_QUALITY = {
  poor: { name: 'Poor', color: 'text-red-500', value: 1 },
  fair: { name: 'Fair', color: 'text-orange-500', value: 2 },
  good: { name: 'Good', color: 'text-yellow-500', value: 3 },
  great: { name: 'Great', color: 'text-green-500', value: 4 },
  excellent: { name: 'Excellent', color: 'text-blue-500', value: 5 }
};

interface WellnessData {
  date: Date;
  mood?: number;
  stress?: number;
  energy?: number;
  sleep?: {
    hours: number;
    quality: keyof typeof SLEEP_QUALITY;
  };
  exercise?: {
    type: keyof typeof EXERCISE_TYPES;
    duration: number;
    calories?: number;
  }[];
  water?: number;
  meals?: {
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    healthy: boolean;
    description?: string;
  }[];
  habits?: string[];
  notes?: string;
}

interface HabitStreak {
  habitId: string;
  current: number;
  longest: number;
  lastCompleted: string | null;
}

interface WellnessGoal {
  id: string;
  category: keyof typeof WELLNESS_CATEGORIES;
  title: string;
  description?: string;
  target: number;
  current: number;
  unit: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
  deadline?: Date;
}

export const WellnessDashboard: React.FC = () => {
  // Use Zustand store for state management
  const { moodEntries, wellnessMetrics, wellnessGoals, wellnessInsights, weeklyScore, _monthlyScore, addWellnessGoal, _updateGoalProgress, calculateWellnessScores, generateInsights, exportData } = _useWellnessStore();

  const [wellnessData, _setWellnessData] = useState<WellnessData[]>([]);
  const [todayData, _setTodayData] = useState<WellnessData>({
    date: new Date(),
    habits: []
  });
  const [selectedCategory, _setSelectedCategory] = useState<keyof typeof WELLNESS_CATEGORIES | 'all'>('all');
  const [habitStreaks, _setHabitStreaks] = useState<HabitStreak[]>([]);
  const [___showAddGoal, _setShowAddGoal] = useState(false);
  const [newGoal, _setNewGoal] = useState<Partial<WellnessGoal & { description?: string; frequency?: 'daily' | 'weekly' | 'monthly' }>>({});
  const [_selectedTimeRange, _setSelectedTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [showExportOptions, _setShowExportOptions] = useState(false);

  // Load saved data and calculate scores on mount
  useEffect(() => {
    calculateWellnessScores();
    generateInsights();
    
    // Load legacy localStorage data if exists
    const _savedData = secureStorage.getItem('wellnessData');
    const _savedStreaks = secureStorage.getItem('habitStreaks');
    const _savedToday = secureStorage.getItem('wellnessTodayData');
    
    if (_savedData) {
      setWellnessData(JSON.parse(_savedData).map((d: unknown) => ({
        ...d,
        date: new Date(d.date)
      })));
    }
    
    if (_savedStreaks) {
      setHabitStreaks(JSON.parse(_savedStreaks));
    }
    
    if (_savedToday) {
      const today = JSON.parse(_savedToday);
      if (new Date(today.date).toDateString() === new Date().toDateString()) {
        setTodayData({
          ...today,
          date: new Date(today.date)
        });
      }
    }
  }, [calculateWellnessScores, generateInsights]);

  // Save today&apos;s data
  useEffect(() => {
    secureStorage.setItem('wellnessTodayData', JSON.stringify(todayData));
  }, [todayData]);

  // Toggle habit completion
  const toggleHabit = (habitId: string) => {
    const updatedHabits = todayData.habits || [];
    const habitIndex = updatedHabits.indexOf(habitId);
    
    if (habitIndex > -1) {
      updatedHabits.splice(habitIndex, 1);
    } else {
      updatedHabits.push(habitId);
      updateHabitStreak(habitId);
    }
    
    setTodayData({
      ...todayData,
      habits: updatedHabits
    });
  };

  // Update habit streak
  const updateHabitStreak = (habitId: string) => {
    const today = new Date().toDateString();
    const existingStreak = habitStreaks.find(s => s.habitId === habitId);
    
    if (_existingStreak) {
      const yesterday = new Date(Date._now() - 86400000).toDateString();
      const newStreak = { ...existingStreak };
      
      if (existingStreak.lastCompleted === today) {
        // Already completed today
        return;
      } else if (existingStreak.lastCompleted === yesterday) {
        // Continuing streak
        newStreak.current += 1;
        newStreak.longest = Math.max(newStreak.current, newStreak.longest);
      } else {
        // Starting new streak
        newStreak.current = 1;
      }
      
      newStreak.lastCompleted = today;
      
      const _updatedStreaks = habitStreaks.map(s => 
        s.habitId === habitId ? newStreak : s
      );
      setHabitStreaks(_updatedStreaks);
      secureStorage.setItem('habitStreaks', JSON.stringify(_updatedStreaks));
    } else {
      // New streak
      const newStreak: HabitStreak = {
        habitId,
        current: 1,
        longest: 1,
        lastCompleted: today
      };
      const _updatedStreaks = [...habitStreaks, newStreak];
      setHabitStreaks(_updatedStreaks);
      secureStorage.setItem('habitStreaks', JSON.stringify(_updatedStreaks));
    }
  };

  // Add sleep data
  const __addSleepData = (hours: number, quality: keyof typeof SLEEP_QUALITY) => {
    setTodayData({
      ...todayData,
      sleep: { hours, quality }
    });
  };

  // Add exercise data
  const __addExercise = (type: keyof typeof EXERCISE_TYPES, duration: number) => {
    const calories = EXERCISE_TYPES[type].calories * duration;
    const exercises = todayData.exercise || [];
    exercises.push({ type, duration, calories });
    
    setTodayData({
      ...todayData,
      exercise: exercises
    });
  };

  // Add water intake
  const addWater = () => {
    setTodayData({
      ...todayData,
      water: (todayData.water || 0) + 1
    });
  };

  // Save day&apos;s data
  const __saveDayData = () => {
    const _updatedData = [...wellnessData, todayData];
    setWellnessData(_updatedData);
    secureStorage.setItem('wellnessData', JSON.stringify(_updatedData));
    
    // Reset today&apos;s data
    setTodayData({
      date: new Date(),
      habits: []
    });
    secureStorage.removeItem('wellnessTodayData');
  };

  // Add new goal using store
  const addGoal = () => {
    if (!newGoal.title || !newGoal.target || !newGoal.category) return;
    
    // Use the store&apos;s addWellnessGoal method
    addWellnessGoal({
      category: newGoal.category as 'physical' | 'mental' | 'emotional' | 'social' | 'spiritual',
      title: newGoal.title,
      description: newGoal.description || '',
      targetValue: newGoal.target,
      currentValue: 0,
      unit: newGoal.unit || '',
      frequency: newGoal.frequency || 'daily',
      startDate: new Date(),
      endDate: newGoal.deadline,
      milestones: [],
      reminders: [],
      insights: []
    });
    
    setNewGoal({});
    setShowAddGoal(false);
    generateInsights(); // Regenerate insights after adding goal
  };

  // Calculate wellness score using real data from store
  const calculateWellnessScore = () => {
    // If we have a weekly score from the store, use it
    if (weeklyScore > 0) {
      return weeklyScore;
    }
    
    // Otherwise calculate based on current day data
    let score = 0;
    let _factors = 0;
    
    // Habits score (30%)
    const completedHabits = (todayData.habits?.length || 0) / DAILY_HABITS.length;
    score += completedHabits * 30;
    factors++;
    
    // Mood score from recent entries (30%)
    const recentMoodEntries = moodEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      const today = new Date();
      return entryDate.toDateString() === today.toDateString();
    });
    
    if (recentMoodEntries.length > 0) {
      const avgMood = recentMoodEntries.reduce((sum, e) => sum + e.moodScore, 0) / recentMoodEntries.length;
      score += (avgMood / 10) * 30;
      _factors++;
    }
    
    // Sleep score (20%)
    if (todayData.sleep) {
      const sleepScore = (todayData.sleep.hours / 8) * 0.5 + 
                        (SLEEP_QUALITY[todayData.sleep.quality].value / 5) * 0.5;
      score += sleepScore * 20;
      _factors++;
    }
    
    // Exercise score (10%)
    if (todayData.exercise) {
      const exerciseMinutes = todayData.exercise.reduce((sum, e) => sum + e.duration, 0);
      const exerciseScore = Math.min(exerciseMinutes / 30, 1);
      score += exerciseScore * 10;
      _factors++;
    }
    
    // Hydration score (10%)
    const waterScore = Math.min((todayData.water || 0) / 8, 1);
    score += waterScore * 10;
    
    return Math.round(score);
  };

  // Get weekly stats
  const getWeeklyStats = () => {
    const _now = new Date();
    const weekStart = startOfWeek(_now);
    const weekEnd = endOfWeek(_now);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    return days.map(day => {
      const dayData = wellnessData.find(d => 
        d.date.toDateString() === day.toDateString()
      );
      
      return {
        date: day,
        isToday: isToday(_day),
        habits: dayData?.habits?.length || 0,
        exercise: dayData?.exercise?.reduce((sum, e) => sum + e.duration, 0) || 0,
        water: dayData?.water || 0,
        sleep: dayData?.sleep?.hours || 0
      };
    });
  };

  // Get achievement badges
  const getAchievements = () => {
    const achievements = [];
    
    // Check habit streaks
    habitStreaks.forEach(streak => {
      if (streak.current >= 7) {
        achievements.push({
          name: `${DAILY_HABITS.find(h => h.id === streak.habitId)?.name} - Week Streak`,
          icon: Zap,
          color: 'text-yellow-500'
        });
      }
      if (streak.current >= 30) {
        achievements.push({
          name: `${DAILY_HABITS.find(h => h.id === streak.habitId)?.name} - Month Streak`,
          icon: Award,
          color: 'text-purple-500'
        });
      }
    });
    
    // Check total days tracked
    if (wellnessData.length >= 7) {
      achievements.push({
        name: 'Week of Wellness',
        icon: Calendar,
        color: 'text-green-500'
      });
    }
    
    if (wellnessData.length >= 30) {
      achievements.push({
        name: 'Wellness Warrior',
        icon: Award,
        color: 'text-blue-500'
      });
    }
    
    return achievements;
  };

  // Export data using store&apos;s export function
  const handleExportData = (format: 'json' | 'csv') => {
    if (format === 'json') {
      // Use the store&apos;s export function
      const _dataStr = exportData();
      const dataUri = `data:application/json;charset=utf-8,${ encodeURIComponent(_dataStr)}`;
      const exportFileDefaultName = `wellness-data-${formatDate(new Date(), 'yyyy-MM-dd')}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } else if (format === 'csv') {
      // Create CSV content from store data
      let csvContent = 'Date,Mood Score,Stress Level,Sleep Hours,Exercise Minutes,Water Glasses,Wellness Score\n';
      
      // Combine mood entries and wellness metrics for CSV
      const today = new Date();
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        return date;
      });
      
      last30Days.forEach(date => {
        const dayMoodEntries = moodEntries.filter(e => 
          new Date(e.timestamp).toDateString() === date.toDateString()
        );
        const dayMetrics = wellnessMetrics.find(m => 
          new Date(m.date).toDateString() === date.toDateString()
        );
        
        const avgMood = dayMoodEntries.length > 0 
          ? dayMoodEntries.reduce((sum, e) => sum + e.moodScore, 0) / dayMoodEntries.length 
          : 0;
        const avgStress = dayMoodEntries.length > 0 
          ? dayMoodEntries.reduce((sum, e) => sum + (e.stressLevel || 0), 0) / dayMoodEntries.length 
          : 0;
        
        csvContent += `${formatDate(date, 'yyyy-MM-dd')},${avgMood.toFixed(1)},${avgStress.toFixed(1)},${dayMetrics?.sleepHours || 0},${dayMetrics?.exerciseMinutes || 0},${dayMetrics?.waterIntake || 0},${calculateWellnessScore()}\n`;
      });
      
      const _blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(_blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wellness-data-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
    }
  };

  return (
    <div className="wellness-dashboard-container max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Wellness Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Track your holistic health journey
            </p>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg relative"
            >
              <Download className="w-5 h-5" />
              
              {showExportOptions && (
                <div className="absolute right-0 top-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-10">
                  <button
                    onClick={() => handleExportData('json')}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    Export as JSON
                  </button>
                  <button
                    onClick={() => handleExportData('csv')}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    Export as CSV
                  </button>
                </div>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Wellness Score Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Today&apos;s Wellness Score</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold">{calculateWellnessScore()}</span>
              <span className="text-xl">/100</span>
            </div>
            <p className="mt-2 text-white/80">
              {calculateWellnessScore() >= 80 ? 'Excellent! Keep it up!' :
               calculateWellnessScore() >= 60 ? 'Good progress today!' :
               calculateWellnessScore() >= 40 ? 'Room for improvement' :
               'Start building healthy habits'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/80 mb-1">Streak Days</p>
            <p className="text-3xl font-bold">
              {Math.max(...habitStreaks.map(s => s.current), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            selectedCategory === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          All Categories
        </button>
        {Object.entries(_WELLNESS_CATEGORIES).map(([key, category]) => {
          const Icon = category.icon;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key as keyof typeof WELLNESS_CATEGORIES)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap ${
                selectedCategory === key
                  ? `bg-gradient-to-r ${  category.color  } text-white`
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {category.name}
            </button>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Habits Tracker */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Daily Habits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DAILY_HABITS
                .filter(habit => selectedCategory === 'all' || habit.category === selectedCategory)
                .map(habit => {
                  const Icon = habit.icon;
                  const isCompleted = todayData.habits?.includes(habit.id);
                  const streak = habitStreaks.find(s => s.habitId === habit.id);
                  
                  return (
                    <motion.div
                      key={habit.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleHabit(habit.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        isCompleted
                          ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                          : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400" />
                          )}
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            <span className={`font-medium ${
                              isCompleted
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {habit.name}
                            </span>
                          </div>
                        </div>
                        {streak && streak.current > 0 && (
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-orange-500" />
                            <span className="text-xs font-medium text-orange-500">
                              {streak.current}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Sleep Tracker */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Sleep Tracker
              </h4>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Hours"
                  min="0"
                  max="24"
                  step="0.5"
                  value={todayData.sleep?.hours || ''}
                  onChange={(e) => setTodayData({
                    ...todayData,
                    sleep: {
                      hours: parseFloat(e.target.value),
                      quality: todayData.sleep?.quality || 'good'
                    }
                  })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                />
                <select
                  value={todayData.sleep?.quality || 'good'}
                  onChange={(e) => setTodayData({
                    ...todayData,
                    sleep: {
                      hours: todayData.sleep?.hours || 0,
                      quality: e.target.value as keyof typeof SLEEP_QUALITY
                    }
                  })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  {Object.entries(_SLEEP_QUALITY).map(([key, quality]) => (
                    <option key={key} value={key}>{quality.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Water Intake */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Droplets className="w-4 h-4" />
                Water Intake
              </h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {todayData.water || 0}
                  </p>
                  <p className="text-sm text-gray-500">glasses</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={addWater}
                  className="p-3 bg-blue-500 text-white rounded-lg"
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Exercise Log */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Exercise
              </h4>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {todayData.exercise?.reduce((sum, e) => sum + e.duration, 0) || 0}
                </p>
                <p className="text-sm text-gray-500">minutes today</p>
              </div>
            </div>
          </div>

          {/* Weekly Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Weekly Overview
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {getWeeklyStats().map((day, idx) => (
                <div
                  key={idx}
                  className={`text-center p-3 rounded-lg ${
                    day.isToday
                      ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500'
                      : 'bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {formatDate(day.date, 'EEE')}
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 h-3 mx-0.5 rounded-full ${
                            i < day.habits / 2
                              ? 'bg-green-500'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      {day.exercise}m
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Goals */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Goals
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddGoal(true)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </div>
            
            <div className="space-y-3">
              {wellnessGoals.filter(g => g.status === 'active').slice(0, 5).map(goal => {
                const progress = goal.progress || 0;
                const categoryMap: Record<string, keyof typeof WELLNESS_CATEGORIES> = {
                  physical: 'physical',
                  mental: 'mental',
                  emotional: 'emotional',
                  social: 'habits',
                  spiritual: 'habits'
                };
                const category = categoryMap[goal.category] || 'habits';
                const Icon = WELLNESS_CATEGORIES[category].icon;
                
                return (
                  <div key={goal.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-start gap-2 mb-2">
                      <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {goal.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {goal.currentValue} / {goal.targetValue} {goal.unit}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    {goal.endDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {formatDate(new Date(goal.endDate), 'MMM d')}
                      </p>
                    )}
                  </div>
                );
              })}
              
              {wellnessGoals.filter(g => g.status === 'active').length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No active goals. Set your first wellness goal!
                </p>
              )}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Achievements
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {getAchievements().slice(0, 4).map((achievement, idx) => (
                <div
                  key={idx}
                  className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <Award className={`w-8 h-8 mx-auto mb-1 ${achievement.color}`} />
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {achievement.name}
                  </p>
                </div>
              ))}
            </div>
            {getAchievements().length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Keep tracking to earn achievements!
              </p>
            )}
          </div>

          {/* AI-Powered Insights */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              AI Insights
            </h3>
            <div className="space-y-3">
              {wellnessInsights.slice(0, 3).map((insight) => {
                const IconComponent = insight.type === 'trend' && insight.title.includes('Improvement') ? TrendingUp :
                                     insight.type === 'trend' && insight.title.includes('Decline') ? TrendingDown :
                                     insight.type === 'warning' ? AlertCircle :
                                     insight.type === 'achievement' ? Award :
                                     TrendingUp;
                const iconColor = insight.priority === 'high' ? 'text-red-500' :
                                 insight.priority === 'medium' ? 'text-yellow-500' :
                                 'text-green-500';
                
                return (
                  <div key={insight.id} className="flex items-start gap-2">
                    <IconComponent className={`w-4 h-4 ${iconColor} mt-0.5`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {insight.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                );
              })}
              
              {wellnessInsights.length === 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Track your mood and habits to get personalized insights
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Start by logging today&apos;s mood and completing daily habits
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {showAddGoal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddGoal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Add New Goal
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="goal-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    id="goal-category"
                    value={newGoal.category || ''}
                    onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as keyof typeof WELLNESS_CATEGORIES })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <option value="">Select category</option>
                    {Object.entries(_WELLNESS_CATEGORIES).map(([key, cat]) => (
                      <option key={key} value={key}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="goal-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Goal Title
                  </label>
                  <input
                    id="goal-title"
                    type="text"
                    placeholder="e.g., Meditate daily"
                    value={newGoal.title || ''}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="goal-target" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Target
                    </label>
                    <input
                      id="goal-target"
                      type="number"
                      placeholder="30"
                      value={newGoal.target || ''}
                      onChange={(e) => setNewGoal({ ...newGoal, target: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="goal-unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Unit
                    </label>
                    <input
                      id="goal-unit"
                      type="text"
                      placeholder="days"
                      value={newGoal.unit || ''}
                      onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="goal-deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deadline (optional)
                  </label>
                  <input
                    id="goal-deadline"
                    type="date"
                    value={newGoal.deadline ? formatDate(newGoal.deadline, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value ? new Date(e.target.value) : undefined })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={addGoal}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Add Goal
                </button>
                <button
                  onClick={() => {
                    setShowAddGoal(false);
                    setNewGoal({});
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};