import { useState, _useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  _Calendar,
  CheckCircle2,
  Circle,
  _TrendingUp,
  _Award,
  Plus,
  Pause,
  _Play,
  RefreshCw,
  _Bell,
  ChevronRight,
  Star,
  Zap,
  Heart,
  Brain,
  Coffee,
  Moon,
  Sun,
  Droplets,
  Apple,
  Users,
  Book,
  Edit2,
  BarChart3,
  _Target
} from 'lucide-react';
import { useActivityStore } from '../../../stores/activityStore';
import { format, startOfWeek, addDays, isSameDay, isToday, _subDays } from 'date-fns';

interface HabitTrackerProps {
  _onHabitClick?: (habit: unknown) => void;
  onAddHabit?: () => void;
  onViewAnalytics?: (habitId: string) => void;
}

export function HabitTracker({
  _onHabitClick,
  onAddHabit,
  onViewAnalytics
}: HabitTrackerProps) {
  const { habits, completeHabit, resetHabitStreak, pauseHabit, _updateHabit, stackHabits } = useActivityStore();

  const [selectedCategory, _setSelectedCategory] = useState<string>('all');
  const [viewMode, _setViewMode] = useState<'grid' | 'list'>('grid');
  const [showStackingMode, _setShowStackingMode] = useState(false);
  const [selectedForStacking, _setSelectedForStacking] = useState<string[]>([]);
  const [_expandedHabit, _setExpandedHabit] = useState<string | null>(null);

  // Filter active habits
  const activeHabits = habits.filter(h => h.isActive);
  const pausedHabits = habits.filter(h => !h.isActive);

  const filteredHabits = selectedCategory === 'all'
    ? activeHabits
    : activeHabits.filter(h => h.category === selectedCategory);

  // Calculate overall stats
  const totalCompletions = activeHabits.reduce((sum, h) => sum + h.totalCompletions, 0);
  const currentStreaks = activeHabits.reduce((sum, h) => sum + h.currentStreak, 0);
  const longestStreak = Math.max(...activeHabits.map(h => h.longestStreak), 0);

  // Get category icon
  const getCategoryIcon = (_category: string) => {
    switch (_category) {
      case 'physical': return Coffee;
      case 'mental': return Brain;
      case 'emotional': return Heart;
      case 'social': return Users;
      case 'spiritual': return Star;
      default: return Circle;
    }
  };

  // Get habit icon based on name/description
  const getHabitIcon = (habit: unknown) => {
    const _name = habit.name.toLowerCase();
    if (name.includes('water') || name.includes('hydrat')) return Droplets;
    if (name.includes('sleep') || name.includes('bed')) return Moon;
    if (name.includes('wake') || name.includes('morning')) return Sun;
    if (name.includes('meditat')) return Brain;
    if (name.includes('exercise') || name.includes('workout')) return Zap;
    if (name.includes('read') || name.includes('journal')) return Book;
    if (name.includes('eat') || name.includes('meal')) return Apple;
    return getCategoryIcon(habit._category);
  };

  // Get streak fire color
  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-red-500';
    if (streak >= 14) return 'text-orange-500';
    if (streak >= 7) return 'text-yellow-500';
    if (streak >= 3) return 'text-blue-500';
    return 'text-gray-400';
  };

  // Check if habit was completed today
  const isCompletedToday = (habit: unknown) => {
    if (!habit.lastCompleted) return false;
    return isSameDay(new Date(habit.lastCompleted), new Date());
  };

  // Get habit completion history for the week
  const getWeekHistory = (habit: unknown) => {
    const weekStart = startOfWeek(new Date());
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const completed = habit.lastCompleted && 
        isSameDay(new Date(habit.lastCompleted), day);
      days.push({
        date: day,
        completed,
        isToday: isToday(_day)
      });
    }
    
    return days;
  };

  // Calculate habit effectiveness
  const getHabitEffectiveness = (habit: unknown) => {
    if (!habit.correlatedMoodImprovement) return null;
    const effectiveness = habit.correlatedMoodImprovement * 20; // Scale to 0-100
    return Math.min(100, Math.max(0, effectiveness));
  };

  // Handle habit stacking
  const handleStackHabits = () => {
    if (selectedForStacking.length >= 2) {
      stackHabits(_selectedForStacking);
      setSelectedForStacking([]);
      setShowStackingMode(false);
    }
  };

  // Toggle habit selection for stacking
  const toggleStackingSelection = (habitId: string) => {
    setSelectedForStacking(prev =>
      prev.includes(habitId)
        ? prev.filter(id => id !== habitId)
        : [...prev, habitId]
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with Stats */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Flame className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Habit Tracker</h3>
              <p className="text-sm text-gray-600">
                {activeHabits.length} active habits
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle view"
            >
              <BarChart3 className="h-5 w-5 text-gray-600" />
            </button>
            
            <button
              onClick={onAddHabit}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Add habit"
            >
              <Plus className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="p-2 bg-green-50 rounded-lg text-center">
            <div className="text-lg font-bold text-green-600">{totalCompletions}</div>
            <div className="text-xs text-green-700">Total Completions</div>
          </div>
          <div className="p-2 bg-orange-50 rounded-lg text-center">
            <div className="text-lg font-bold text-orange-600">{currentStreaks}</div>
            <div className="text-xs text-orange-700">Active Streaks</div>
          </div>
          <div className="p-2 bg-purple-50 rounded-lg text-center">
            <div className="text-lg font-bold text-purple-600">{longestStreak}</div>
            <div className="text-xs text-purple-700">Best Streak</div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({activeHabits.length})
          </button>
          {['physical', 'mental', 'emotional', 'social', 'spiritual'].map((_category) => {
            const count = activeHabits.filter(h => h._category === _category).length;
            const Icon = getCategoryIcon(_category);
            return (
              <button
                key={_category}
                onClick={() => setSelectedCategory(_category)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center space-x-1 ${
                  selectedCategory === _category
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{_category.charAt(0).toUpperCase() + _category.slice(1)} ({count})</span>
              </button>
            );
          })}
        </div>

        {/* Habit Stacking Mode */}
        {showStackingMode && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg mt-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-800">
                Select habits to stack together ({selectedForStacking.length} selected)
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setShowStackingMode(false);
                    setSelectedForStacking([]);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStackHabits}
                  disabled={selectedForStacking.length < 2}
                  className={`px-3 py-1 text-sm rounded-lg ${
                    selectedForStacking.length >= 2
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Stack Habits
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Habits Grid/List */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredHabits.map((habit) => {
                const Icon = getHabitIcon(_habit);
                const completed = isCompletedToday(_habit);
                const effectiveness = getHabitEffectiveness(_habit);
                const isSelected = selectedForStacking.includes(habit.id);
                
                return (
                  <motion.div
                    key={habit.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`
                      p-4 rounded-lg border transition-all cursor-pointer
                      ${completed ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}
                      ${showStackingMode && isSelected ? 'ring-2 ring-blue-500' : ''}
                      hover:shadow-md
                    `}
                    onClick={() => {
                      if (_showStackingMode) {
                        toggleStackingSelection(habit.id);
                      } else if (!completed) {
                        completeHabit(habit.id);
                      }
                    }}
                  >
                    {/* Habit Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          completed ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            completed ? 'text-green-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{habit.name}</h4>
                          {habit.description && (
                            <p className="text-xs text-gray-600 mt-0.5">{habit.description}</p>
                          )}
                        </div>
                      </div>
                      
                      {completed && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </div>

                    {/* Streak Info */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Flame className={`h-4 w-4 ${getStreakColor(habit.currentStreak)}`} />
                        <span className="text-sm font-medium text-gray-700">
                          {habit.currentStreak} day streak
                        </span>
                      </div>
                      
                      {habit.longestStreak > 0 && (
                        <span className="text-xs text-gray-500">
                          Best: {habit.longestStreak}
                        </span>
                      )}
                    </div>

                    {/* Week Overview */}
                    <div className="flex items-center justify-between mb-2">
                      {getWeekHistory(_habit).map((day, index) => (
                        <div
                          key={index}
                          className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-xs
                            ${day.isToday ? 'ring-2 ring-primary-500' : ''}
                            ${day.completed ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}
                          `}
                        >
                          {format(day.date, 'EEE').charAt(0)}
                        </div>
                      ))}
                    </div>

                    {/* _Target Frequency */}
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>
                        Target: {habit.targetCount}x {habit.targetFrequency}
                      </span>
                      <span>
                        Total: {habit.totalCompletions}
                      </span>
                    </div>

                    {/* Effectiveness Score */}
                    {effectiveness !== null && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Mood Impact</span>
                          <span className={`font-medium ${
                            effectiveness > 70 ? 'text-green-600' :
                            effectiveness > 40 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {effectiveness}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                          <div
                            className={`h-1 rounded-full ${
                              effectiveness > 70 ? 'bg-green-500' :
                              effectiveness > 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${effectiveness}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Stacked Habits */}
                    {habit.stackedWith && habit.stackedWith.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-gray-600">
                          Stacked with {habit.stackedWith.length} other habit{habit.stackedWith.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          // List View
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredHabits.map((habit) => {
                const Icon = getHabitIcon(_habit);
                const completed = isCompletedToday(_habit);
                const isExpanded = expandedHabit === habit.id;
                
                return (
                  <motion.div
                    key={habit.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`
                      p-3 rounded-lg border transition-all cursor-pointer
                      ${completed ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}
                      ${isExpanded ? 'ring-2 ring-primary-500' : ''}
                    `}
                    onClick={() => setExpandedHabit(isExpanded ? null : habit.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!completed) {
                              completeHabit(habit.id);
                            }
                          }}
                        >
                          {completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400 hover:text-primary-600" />
                          )}
                        </button>
                        
                        <Icon className="h-4 w-4 text-gray-500" />
                        
                        <div className="flex-1">
                          <h4 className={`font-medium ${completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {habit.name}
                          </h4>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Flame className={`h-4 w-4 ${getStreakColor(habit.currentStreak)}`} />
                          <span className="text-sm font-medium text-gray-700">
                            {habit.currentStreak}
                          </span>
                        </div>
                        
                        <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pt-3 border-t"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Week History */}
                          <div className="flex items-center justify-between mb-3">
                            {getWeekHistory(_habit).map((day, index) => (
                              <div key={index} className="text-center">
                                <div className="text-xs text-gray-500 mb-1">
                                  {format(day.date, 'EEE')}
                                </div>
                                <div
                                  className={`
                                    w-8 h-8 rounded-full flex items-center justify-center mx-auto
                                    ${day.isToday ? 'ring-2 ring-primary-500' : ''}
                                    ${day.completed ? 'bg-green-500' : 'bg-gray-100'}
                                  `}
                                >
                                  {day.completed && (
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">
                                {habit.currentStreak}
                              </div>
                              <div className="text-xs text-gray-600">Current</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">
                                {habit.longestStreak}
                              </div>
                              <div className="text-xs text-gray-600">Best</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">
                                {habit.totalCompletions}
                              </div>
                              <div className="text-xs text-gray-600">Total</div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => onViewAnalytics?.(habit.id)}
                              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                              View Analytics
                            </button>
                            
                            <div className="flex items-center space-x-2">
                              {habit.currentStreak > 0 && (
                                <button
                                  onClick={() => {
                                    if (window.confirm('Reset streak? This cannot be undone.')) {
                                      resetHabitStreak(habit.id);
                                    }
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  <RefreshCw className="h-4 w-4 text-gray-500" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => pauseHabit(habit.id)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Pause className="h-4 w-4 text-gray-500" />
                              </button>
                              
                              <button
                                onClick={() => {/* Edit habit */}}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Edit2 className="h-4 w-4 text-gray-500" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!showStackingMode && activeHabits.length >= 2 && (
        <div className="border-t pt-3 mt-3">
          <button
            onClick={() => setShowStackingMode(true)}
            className="w-full py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium"
          >
            Stack Habits Together
          </button>
        </div>
      )}

      {/* Paused Habits */}
      {pausedHabits.length > 0 && (
        <div className="border-t pt-3 mt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {pausedHabits.length} paused habit{pausedHabits.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => {/* Show paused habits */}}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View paused
            </button>
          </div>
        </div>
      )}
    </div>
  );
}