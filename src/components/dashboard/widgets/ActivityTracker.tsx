import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Activity as ActivityIcon,
  Zap,
  Heart,
  Brain,
  Users,
  Target,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Plus,
  _Edit2,
  _X,
  Star,
  Award
} from 'lucide-react';
import { useActivityStore } from '../../../stores/activityStore';
import { format, _isToday, isPast, _isFuture, _differenceInMinutes, addDays } from 'date-fns';

interface ActivityTrackerProps {
  onActivityClick?: (activity: unknown) => void;
  onAddActivity?: () => void;
  energyLevel?: 'low' | 'medium' | 'high';
  currentMood?: number;
}

export function ActivityTracker({ 
  onActivityClick, 
  onAddActivity,
  energyLevel = 'medium',
  currentMood = 5 
}: ActivityTrackerProps) {
  const { activities, _dailySchedule, completeActivity, rescheduleActivity, getActivityRecommendations, suggestReschedule, adaptScheduleForBadDay, generateDailySchedule } = useActivityStore();

  const [selectedDate, _setSelectedDate] = useState(new Date());
  const [showRecommendations, _setShowRecommendations] = useState(false);
  const [__editingActivity, setEditingActivity] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState('');
  const [moodImpact, setMoodImpact] = useState<number>(0);
  const [adaptedForLowEnergy, setAdaptedForLowEnergy] = useState(false);

  // Generate daily schedule on mount and date change
  useEffect(() => {
    generateDailySchedule(_selectedDate);
  }, [selectedDate, generateDailySchedule]);

  // Get today's activities
  const todayActivities = activities.filter(activity => {
    if (!activity.scheduledTime) return false;
    const activityDate = new Date(activity.scheduledTime);
    return activityDate.toDateString() === selectedDate.toDateString();
  }).sort((a, b) => {
    if (!a.scheduledTime || !b.scheduledTime) return 0;
    return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
  });

  // Get recommended activities based on energy and mood
  const recommendations = getActivityRecommendations(energyLevel, currentMood);
  const rescheduleSuggestions = suggestReschedule(energyLevel);

  // Calculate completion stats
  const completedCount = todayActivities.filter(a => a.completed).length;
  const totalCount = todayActivities.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Get activity icon based on category
  const getActivityIcon = (_category: string) => {
    switch (_category) {
      case 'therapy': return Brain;
      case 'wellness': return Heart;
      case 'social': return Users;
      case 'professional': return Target;
      case 'self-care': return ActivityIcon;
      default: return Circle;
    }
  };

  // Get energy indicator color
  const getEnergyColor = (_level: string) => {
    switch (_level) {
      case 'low': return 'text-blue-500 bg-blue-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'high': return 'text-red-500 bg-red-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  // Get mood impact color
  const getMoodImpactColor = (impact: number) => {
    if (impact > 2) return 'text-green-600';
    if (impact > 0) return 'text-green-500';
    if (impact < -2) return 'text-red-600';
    if (impact < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  // Handle activity completion
  const handleCompleteActivity = (activityId: string) => {
    completeActivity(activityId, moodImpact || undefined, completionNote || undefined);
    setEditingActivity(null);
    setCompletionNote('');
    setMoodImpact(0);
  };

  // Handle reschedule
  const handleReschedule = (activityId: string, newDate: Date) => {
    rescheduleActivity(activityId, newDate);
  };

  // Handle adapt for low energy
  const handleAdaptForLowEnergy = () => {
    adaptScheduleForBadDay();
    setAdaptedForLowEnergy(true);
    setTimeout(() => setAdaptedForLowEnergy(false), 3000);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with Stats */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <ActivityIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Today's Activities</h3>
              <p className="text-sm text-gray-600">
                {completedCount} of {totalCount} completed
              </p>
            </div>
          </div>
          
          <button
            onClick={onAddActivity}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Add activity"
          >
            <Plus className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <motion.div
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Energy Level Indicator */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Energy Level:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEnergyColor(energyLevel)}`}>
              {energyLevel.charAt(0).toUpperCase() + energyLevel.slice(1)}
            </span>
          </div>
          
          {energyLevel === 'low' && !adaptedForLowEnergy && (
            <button
              onClick={handleAdaptForLowEnergy}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Adapt for low energy
            </button>
          )}
          
          {adaptedForLowEnergy && (
            <span className="text-xs text-green-600 font-medium">
              Schedule adapted ✓
            </span>
          )}
        </div>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        <AnimatePresence mode="popLayout">
          {todayActivities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-3">No activities scheduled for today</p>
              <button
                onClick={onAddActivity}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Add your first activity
              </button>
            </motion.div>
          ) : (
            todayActivities.map((activity) => {
              const Icon = getActivityIcon(activity._category);
              const isPastDue = activity.scheduledTime && isPast(new Date(activity.scheduledTime)) && !activity.completed;
              const isEditing = editingActivity === activity.id;
              
              return (
                <motion.div
                  key={activity.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`
                    p-3 rounded-lg border transition-all cursor-pointer
                    ${activity.completed 
                      ? 'bg-green-50 border-green-200' 
                      : isPastDue
                      ? 'bg-red-50 border-red-200'
                      : 'bg-white border-gray-200 hover:border-primary-300'
                    }
                    ${isEditing ? 'ring-2 ring-primary-500' : ''}
                  `}
                  onClick={() => !isEditing && onActivityClick?.(activity)}
                >
                  <div className="flex items-start space-x-3">
                    {/* Completion Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!activity.completed) {
                          setEditingActivity(activity.id);
                        }
                      }}
                      className="mt-0.5"
                    >
                      {activity.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400 hover:text-primary-600" />
                      )}
                    </button>

                    {/* Activity Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4 text-gray-500" />
                            <h4 className={`font-medium ${activity.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {activity.title}
                            </h4>
                            {activity.therapyHomework && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                Therapy
                              </span>
                            )}
                          </div>
                          
                          {activity.description && (
                            <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                          )}
                          
                          <div className="flex items-center space-x-3 mt-2 text-xs">
                            {activity.scheduledTime && (
                              <span className="flex items-center text-gray-500">
                                <Clock className="h-3 w-3 mr-1" />
                                {format(new Date(activity.scheduledTime), 'h:mm a')}
                              </span>
                            )}
                            
                            {activity.duration && (
                              <span className="text-gray-500">
                                {activity.duration} min
                              </span>
                            )}
                            
                            {activity.energyLevel && (
                              <span className={`px-2 py-0.5 rounded-full text-xs ${getEnergyColor(activity.energyLevel)}`}>
                                {activity.energyLevel} energy
                              </span>
                            )}
                            
                            {activity.moodImpact && (
                              <span className={`flex items-center ${getMoodImpactColor(activity.moodImpact)}`}>
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {activity.moodImpact > 0 ? '+' : ''}{activity.moodImpact}
                              </span>
                            )}
                          </div>

                          {/* Actual mood impact if completed */}
                          {activity.completed && activity.actualMoodImpact !== undefined && (
                            <div className="mt-2 flex items-center space-x-1 text-xs">
                              <span className="text-gray-500">Mood impact:</span>
                              <span className={`font-medium ${getMoodImpactColor(activity.actualMoodImpact)}`}>
                                {activity.actualMoodImpact > 0 ? '+' : ''}{activity.actualMoodImpact}
                              </span>
                              {activity.actualMoodImpact > activity.moodImpact! && (
                                <Star className="h-3 w-3 text-yellow-500" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {!activity.completed && isPastDue && (
                          <div className="flex items-center space-x-1">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReschedule(activity.id, addDays(new Date(), 1));
                              }}
                              className="text-xs text-red-600 hover:text-red-700 font-medium"
                            >
                              Reschedule
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Completion Form */}
                      {isEditing && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 p-3 bg-gray-50 rounded-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="space-y-3">
                            <div>
                              <label htmlFor="input_f82cs5rn4" className="text-sm font-medium text-gray-700">
                                How did this activity affect your mood?
                              </label>
                              <div className="flex items-center space-x-2 mt-1">
                                {[-3, -2, -1, 0, 1, 2, 3].map((impact) => (
                                  <button
                                    key={impact}
                                    onClick={() => setMoodImpact(_impact)}
                                    className={`
                                      px-3 py-1 rounded-lg text-sm font-medium transition-colors
                                      ${moodImpact === impact 
                                        ? impact > 0 
                                          ? 'bg-green-500 text-white' 
                                          : impact < 0
                                          ? 'bg-red-500 text-white'
                                          : 'bg-gray-500 text-white'
                                        : 'bg-white border border-gray-300 hover:border-gray-400'
                                      }
                                    `}
                                  >
                                    {impact > 0 ? '+' : ''}{impact}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label htmlFor="input_ta4ro3h5v" className="text-sm font-medium text-gray-700">
                                Notes (_optional)
                              </label>
                              <textarea
                                value={completionNote}
                                onChange={(e) => setCompletionNote(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                                rows={2}
                                placeholder="How did it go? Any observations?"
                              />
                            </div>

                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setEditingActivity(null);
                                  setCompletionNote('');
                                  setMoodImpact(0);
                                }}
                                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleCompleteActivity(activity.id)}
                                className="px-3 py-1 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600"
                              >
                                Complete
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Recommendations Section */}
      {(recommendations.length > 0 || rescheduleSuggestions.length > 0) && (
        <div className="border-t pt-3">
          <button
            onClick={() => setShowRecommendations(!showRecommendations)}
            className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <span className="flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span>Suggestions for you</span>
            </span>
            <ChevronRight className={`h-4 w-4 transition-transform ${showRecommendations ? 'rotate-90' : ''}`} />
          </button>

          <AnimatePresence>
            {showRecommendations && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2"
              >
                {rescheduleSuggestions.length > 0 && (
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800 mb-1">
                      These activities don't match your current energy _level:
                    </p>
                    {rescheduleSuggestions.slice(0, 2).map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between text-xs mt-1">
                        <span className="text-yellow-700">{activity.title}</span>
                        <button
                          onClick={() => handleReschedule(activity.id, addDays(new Date(), 1))}
                          className="text-yellow-600 hover:text-yellow-700 font-medium"
                        >
                          Postpone
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {recommendations.length > 0 && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-800 mb-1">
                      Recommended activities for your energy _level:
                    </p>
                    {recommendations.slice(0, 3).map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between text-xs mt-1">
                        <span className="text-green-700">{activity.title}</span>
                        <span className="text-green-600">
                          {activity.moodImpact && activity.moodImpact > 0 ? '+' : ''}{activity.moodImpact} mood
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}