import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Battery,
  Brain,
  Heart,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Zap,
  Cloud,
  Sun,
  Moon,
  Coffee,
  Target,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { format, addMinutes, isSameDay, isToday, isTomorrow } from 'date-fns';
import { useActivityStore } from '../../../stores/activityStore';
import { useWellnessStore } from '../../../stores/wellnessStore';

interface TimeSlot {
  time: string;
  activity?: {
    id: string;
    title: string;
    category: string;
    duration: number;
    energyLevel: 'low' | 'medium' | 'high';
    flexibility: 'fixed' | 'flexible' | 'optional';
    moodImpact?: number;
  };
}

const ENERGY_ICONS = {
  low: Battery,
  medium: Zap,
  high: Sparkles
};

const ENERGY_COLORS = {
  low: 'text-blue-500',
  medium: 'text-yellow-500',
  high: 'text-red-500'
};

const CATEGORY_COLORS = {
  therapy: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
  wellness: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
  social: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  professional: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
  personal: 'bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300',
  'self-care': 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
};

export const DailyActivityPlanner: React.FC = () => {
  const { activities, dailySchedule, addActivity, updateActivity, deleteActivity, completeActivity, rescheduleActivity, getActivityRecommendations, suggestReschedule, adaptScheduleForBadDay, generateDailySchedule } = useActivityStore();
  
  const { moodEntries } = useWellnessStore();
  
  const [selectedDate, _setSelectedDate] = useState(new Date());
  const [currentEnergyLevel, _setCurrentEnergyLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [currentMood, _setCurrentMood] = useState(5);
  const [_showAddActivity, _setShowAddActivity] = useState(false);
  const [_editingActivity, _setEditingActivity] = useState<string | null>(null);
  const [showRecommendations, _setShowRecommendations] = useState(false);
  const [___adaptiveMode, _setAdaptiveMode] = useState(false);
  const [timeSlots, _setTimeSlots] = useState<TimeSlot[]>([]);
  
  // Initialize time slots for the day
  const initializeTimeSlots = () => {
    const slots: TimeSlot[] = [];
    const startHour = 6; // 6 AM
    const endHour = 22; // 10 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const _time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({ time: _time });
      }
    }
    
    // Map activities to time slots
    const dayActivities = activities.filter(activity =>
      activity.scheduledTime && isSameDay(new Date(activity.scheduledTime), selectedDate)
    );
    
    dayActivities.forEach(activity => {
      if (activity.scheduledTime) {
        const _time = format(new Date(activity.scheduledTime), 'HH:mm');
        const slotIndex = slots.findIndex(slot => slot.time === _time);
        if (slotIndex !== -1 && slots[slotIndex]) {
          slots[slotIndex]!.activity = {
            id: activity.id,
            title: activity.title,
            category: activity.category,
            duration: activity.duration || 30,
            energyLevel: activity.energyLevel || 'medium',
            flexibility: activity.flexibility || 'flexible',
            moodImpact: activity.moodImpact
          };
        }
      }
    });
    
    _setTimeSlots(slots);
  };
  
  // Initialize time slots and load schedule
  useEffect(() => {
    generateDailySchedule(selectedDate);
    initializeTimeSlots();
    
    // Get current mood from recent entries
    const todayMood = moodEntries.find(entry =>
      isSameDay(new Date(entry.timestamp), new Date())
    );
    if (todayMood) {
      _setCurrentMood(todayMood.moodScore);
      // Determine energy level based on mood
      if (todayMood.moodScore <= 3) _setCurrentEnergyLevel('low');
      else if (todayMood.moodScore <= 7) _setCurrentEnergyLevel('medium');
      else _setCurrentEnergyLevel('high');
    }
  }, [selectedDate, moodEntries, generateDailySchedule]);
  
  // Handle bad mental health day adaptation
  const handleBadDayAdaptation = () => {
    _setAdaptiveMode(true);
    adaptScheduleForBadDay();
    
    // Show supportive message
    setTimeout(() => {
      _setAdaptiveMode(false);
    }, 3000);
  };
  
  // Get activity recommendations
  const recommendations = getActivityRecommendations(currentEnergyLevel, currentMood);
  const rescheduleingSuggestions = suggestReschedule(currentEnergyLevel);
  
  // Quick add activity
  const quickAddActivity = (slot: TimeSlot) => {
    const timeParts = slot.time.split(':').map(Number);
    const hours = timeParts[0] ?? 9;
    const minutes = timeParts[1] ?? 0;
    const scheduledTime = new Date(selectedDate);
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    addActivity({
      title: 'New Activity',
      category: 'personal',
      type: 'task',
      scheduledTime,
      duration: 30,
      energyLevel: currentEnergyLevel,
      completed: false,
      flexibility: 'flexible'
    });
    
    initializeTimeSlots();
  };
  
  // Complete activity
  const handleCompleteActivity = (_activityId: string, moodImpact?: number) => {
    completeActivity(_activityId, moodImpact);
    initializeTimeSlots();
  };
  
  // Delete activity
  const handleDeleteActivity = (_activityId: string) => {
    deleteActivity(_activityId);
    initializeTimeSlots();
  };
  
  // Reschedule activity
  const __handleReschedule = (_activityId: string, newTime: string) => {
    const timeParts = newTime.split(':').map(Number);
    const hours = timeParts[0] ?? 9;
    const minutes = timeParts[1] ?? 0;
    const newScheduledTime = new Date(selectedDate);
    newScheduledTime.setHours(hours, minutes, 0, 0);
    
    rescheduleActivity(_activityId, newScheduledTime);
    initializeTimeSlots();
  };
  
  // Get time period of day
  const getTimePeriod = (time: string) => {
    const hourStr = time.split(':')[0];
    const hour = hourStr ? parseInt(hourStr) : 9;
    if (hour < 6) return { name: 'Early Morning', icon: Moon, color: 'from-indigo-500 to-purple-500' };
    if (hour < 12) return { name: 'Morning', icon: Sun, color: 'from-yellow-400 to-orange-400' };
    if (hour < 14) return { name: 'Noon', icon: Sun, color: 'from-orange-400 to-red-400' };
    if (hour < 18) return { name: 'Afternoon', icon: Coffee, color: 'from-blue-400 to-cyan-400' };
    if (hour < 21) return { name: 'Evening', icon: Cloud, color: 'from-purple-400 to-pink-400' };
    return { name: 'Night', icon: Moon, color: 'from-indigo-600 to-purple-600' };
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Daily Activity Planner
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Smart scheduling based on your energy and mood
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Energy Level Selector */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(['low', 'medium', 'high'] as const).map(level => {
              const Icon = ENERGY_ICONS[level];
              return (
                <button
                  key={level}
                  onClick={() => _setCurrentEnergyLevel(level)}
                  className={`p-2 rounded transition-all ${
                    currentEnergyLevel === level
                      ? 'bg-white dark:bg-gray-600 shadow-sm'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title={`Energy: ${level}`}
                >
                  <Icon className={`w-4 h-4 ${ENERGY_COLORS[level]}`} />
                </button>
              );
            })}
          </div>
          
          {/* Bad Day Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBadDayAdaptation}
            className="p-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
            title="Adapt for difficult day"
          >
            <Heart className="w-4 h-4" />
          </motion.button>
          
          {/* Recommendations Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => _setShowRecommendations(!showRecommendations)}
            className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
          >
            <Brain className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
      
      {/* Adaptive Mode Message */}
      <AnimatePresence>
        {___adaptiveMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <p className="text-purple-700 dark:text-purple-300">
                Schedule adapted for a difficult day. Optional activities moved to tomorrow. Take care of yourself!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Recommendations Panel */}
      <AnimatePresence>
        {showRecommendations && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Recommendations for Your Current State
            </h4>
            
            {/* Activity Recommendations */}
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Based on your {currentEnergyLevel} energy and mood score of {currentMood}:
              </p>
              {recommendations.slice(0, 3).map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded"
                >
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">{activity.title}</span>
                    <span className={`text-xs px-2 py-1 rounded ${CATEGORY_COLORS[activity.category as keyof typeof CATEGORY_COLORS] || 'bg-gray-100 text-gray-700'}`}>
                      {activity.category}
                    </span>
                  </div>
                  {activity.moodImpact && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600 dark:text-green-400">
                        +{activity.moodImpact} mood
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Rescheduling Suggestions */}
            {rescheduleingSuggestions.length > 0 && (
              <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
                <p className="text-sm text-orange-600 dark:text-orange-400 mb-2">
                  These activities might be challenging with your current energy:
                </p>
                {rescheduleingSuggestions.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/10 rounded mb-1"
                  >
                    <span className="text-sm">{activity.title}</span>
                    <button
                      onClick={() => {
                        const tomorrow = new Date(selectedDate);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        rescheduleActivity(activity.id, tomorrow);
                      }}
                      className="text-xs px-2 py-1 bg-orange-200 dark:bg-orange-800 rounded hover:bg-orange-300 dark:hover:bg-orange-700"
                    >
                      Move to tomorrow
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Schedule Grid */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
        {timeSlots.map((slot, index) => {
          const period = getTimePeriod(slot.time);
          const showPeriodHeader = index === 0 || getTimePeriod(timeSlots[index - 1]?.time || '09:00').name !== period.name;
          
          return (
            <React.Fragment key={slot.time}>
              {showPeriodHeader && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r ${period.color} text-white`}>
                  <period.icon className="w-4 h-4" />
                  <span className="font-semibold text-sm">{period.name}</span>
                </div>
              )}
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                  slot.activity
                    ? 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {/* Time */}
                <div className="w-16 text-sm font-medium text-gray-600 dark:text-gray-400">
                  {slot.time}
                </div>
                
                {/* Activity or Empty Slot */}
                {slot.activity ? (
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Completion Status */}
                        <button
                          onClick={() => handleCompleteActivity(slot.activity!.id)}
                          className="text-gray-400 hover:text-green-500 transition-colors"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        
                        {/* Activity Details */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {slot.activity.title}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${CATEGORY_COLORS[slot.activity.category as keyof typeof CATEGORY_COLORS] || 'bg-gray-100 text-gray-700'}`}>
                              {slot.activity.category}
                            </span>
                            {slot.activity.flexibility === 'fixed' && (
                              <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded">
                                Fixed
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {slot.activity.duration} min
                            </span>
                            <span className={`text-xs flex items-center gap-1 ${ENERGY_COLORS[slot.activity.energyLevel]}`}>
                              {(() => {
                                const Icon = ENERGY_ICONS[slot.activity.energyLevel];
                                return Icon ? <Icon className="w-3 h-3" /> : null;
                              })()}
                              {slot.activity.energyLevel} energy
                            </span>
                            {slot.activity.moodImpact && (
                              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                +{slot.activity.moodImpact} mood
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => _setEditingActivity(slot.activity!.id)}
                          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(slot.activity!.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => quickAddActivity(slot)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Add activity</span>
                  </button>
                )}
              </motion.div>
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Footer Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {activities.filter(a => a.scheduledTime && isSameDay(new Date(a.scheduledTime), selectedDate)).length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Activities</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {activities.filter(a => a.completed && a.scheduledTime && isSameDay(new Date(a.scheduledTime), selectedDate)).length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(
                activities
                  .filter(a => a.scheduledTime && isSameDay(new Date(a.scheduledTime), selectedDate))
                  .reduce((sum, a) => sum + (a.duration || 0), 0) / 60
              )}h
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Scheduled</p>
          </div>
        </div>
      </div>
    </div>
  );
};