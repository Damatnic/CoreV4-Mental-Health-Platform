import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  _TrendingUp,
  _Award,
  _Calendar,
  ChevronRight,
  Plus,
  _Edit2,
  Pause,
  Play,
  _X,
  CheckCircle,
  Flag,
  Star,
  _Zap,
  Trophy,
  Clock,
  _AlertCircle,
  Sparkles,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useActivityStore } from '../../../stores/activityStore';
import { _format, differenceInDays, _addDays } from 'date-fns';

interface GoalProgressDashboardProps {
  _onGoalClick?: (goal: unknown) => void;
  onAddGoal?: () => void;
  onViewDetails?: (goalId: string) => void;
}

export function GoalProgressDashboard({
  _onGoalClick,
  onAddGoal,
  onViewDetails
}: GoalProgressDashboardProps) {
  const {
    goals,
    updateGoalProgress,
    completeGoal,
    pauseGoal,
    abandonGoal,
    addMilestone,
    completeMilestone
  } = useActivityStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddMilestone, setShowAddMilestone] = useState<string | null>(null);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneTarget, setMilestoneTarget] = useState<number>(0);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);

  // Filter goals by category and status
  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const _pausedGoals = goals.filter(g => g.status === 'paused');

  const filteredGoals = selectedCategory === 'all' 
    ? activeGoals 
    : activeGoals.filter(g => g.category === selectedCategory);

  // Calculate overall progress
  const overallProgress = activeGoals.length > 0
    ? activeGoals.reduce((sum, goal) => sum + goal.progress, 0) / activeGoals.length
    : 0;

  // Get category stats
  const _categoryStats = {
    therapy: activeGoals.filter(g => g.category === 'therapy').length,
    wellness: activeGoals.filter(g => g.category === 'wellness').length,
    social: activeGoals.filter(g => g.category === 'social').length,
    professional: activeGoals.filter(g => g.category === 'professional').length,
    personal: activeGoals.filter(g => g.category === 'personal').length,
  };

  // Get goal color based on progress and deadline
  const getGoalColor = (goal: unknown) => {
    if (goal.status === 'completed') return 'bg-green-100 border-green-300';
    if (goal.status === 'paused') return 'bg-gray-100 border-gray-300';
    
    if (goal.targetDate) {
      const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());
      if (daysLeft < 7 && goal.progress < 80) return 'bg-red-100 border-red-300';
      if (daysLeft < 14 && goal.progress < 60) return 'bg-yellow-100 border-yellow-300';
    }
    
    if (goal.progress >= 75) return 'bg-green-100 border-green-300';
    if (goal.progress >= 50) return 'bg-blue-100 border-blue-300';
    if (goal.progress >= 25) return 'bg-yellow-100 border-yellow-300';
    return 'bg-gray-100 border-gray-300';
  };

  // Get progress bar color
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'from-green-500 to-green-600';
    if (progress >= 50) return 'from-blue-500 to-blue-600';
    if (progress >= 25) return 'from-yellow-500 to-yellow-600';
    return 'from-gray-400 to-gray-500';
  };

  // Get priority icon
  const getPriorityIcon = (_priority: string) => {
    switch (_priority) {
      case 'high': return <Flag className="h-3 w-3 text-red-500" />;
      case 'medium': return <Flag className="h-3 w-3 text-yellow-500" />;
      case 'low': return <Flag className="h-3 w-3 text-gray-400" />;
      default: return null;
    }
  };

  // Handle add milestone
  const handleAddMilestone = (goalId: string) => {
    if (milestoneTitle && milestoneTarget > 0) {
      addMilestone(goalId, {
        title: milestoneTitle,
        targetValue: milestoneTarget,
        completed: false
      });
      setShowAddMilestone(null);
      setMilestoneTitle('');
      setMilestoneTarget(0);
    }
  };

  // Calculate days until deadline
  const getDaysUntilDeadline = (targetDate: Date | undefined) => {
    if (!targetDate) return null;
    const days = differenceInDays(new Date(_targetDate), new Date());
    if (days < 0) return { text: 'Overdue', color: 'text-red-600' };
    if (days === 0) return { text: 'Due today', color: 'text-red-600' };
    if (days === 1) return { text: 'Due tomorrow', color: 'text-orange-600' };
    if (days <= 7) return { text: `${days} days left`, color: 'text-yellow-600' };
    return { text: `${days} days left`, color: 'text-gray-600' };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with Stats */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Target className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Goal Progress</h3>
              <p className="text-sm text-gray-600">
                {activeGoals.length} active, {completedGoals.length} completed
              </p>
            </div>
          </div>
          
          <button
            onClick={onAddGoal}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Add goal"
          >
            <Plus className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Overall Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-medium text-gray-900">{Math.round(overallProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className={`bg-gradient-to-r ${getProgressColor(overallProgress)} h-2 rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
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
            All ({activeGoals.length})
          </button>
          {Object.entries(_categoryStats).map(([category, count]) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(_category)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Goals List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredGoals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-3">No active goals in this category</p>
              <button
                onClick={onAddGoal}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Set your first goal
              </button>
            </motion.div>
          ) : (
            filteredGoals.map((goal) => {
              const isExpanded = expandedGoal === goal.id;
              const deadline = getDaysUntilDeadline(goal.targetDate);
              const isSmartGoal = goal.specific && goal.measurable && goal.achievable && goal.relevant && goal.timeBound;
              
              return (
                <motion.div
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`
                    p-4 rounded-lg border transition-all cursor-pointer
                    ${getGoalColor(_goal)}
                    ${isExpanded ? 'ring-2 ring-primary-500' : ''}
                  `}
                  onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                >
                  {/* Goal Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{goal.title}</h4>
                        {getPriorityIcon(goal._priority)}
                        {isSmartGoal && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            SMART
                          </span>
                        )}
                      </div>
                      
                      {goal.description && (
                        <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-3 mt-2 text-xs">
                        <span className="text-gray-500">
                          {goal.currentValue} / {goal.targetValue} {goal.unit}
                        </span>
                        
                        {deadline && (
                          <span className={`flex items-center ${deadline.color}`}>
                            <Clock className="h-3 w-3 mr-1" />
                            {deadline.text}
                          </span>
                        )}
                        
                        {goal.linkedActivities && goal.linkedActivities.length > 0 && (
                          <span className="text-gray-500">
                            {goal.linkedActivities.length} linked activities
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center space-x-1">
                      {goal.status === 'active' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              pauseGoal(goal.id);
                            }}
                            className="p-1 hover:bg-white/50 rounded transition-colors"
                            aria-label="Pause goal"
                          >
                            <Pause className="h-4 w-4 text-gray-600" />
                          </button>
                          
                          {goal.progress >= 100 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                completeGoal(goal.id);
                              }}
                              className="p-1 hover:bg-white/50 rounded transition-colors"
                              aria-label="Complete goal"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </button>
                          )}
                        </>
                      )}
                      
                      {goal.status === 'paused' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Resume goal
                          }}
                          className="p-1 hover:bg-white/50 rounded transition-colors"
                          aria-label="Resume goal"
                        >
                          <Play className="h-4 w-4 text-gray-600" />
                        </button>
                      )}
                      
                      <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">{Math.round(goal.progress)}%</span>
                    </div>
                    <div className="w-full bg-white/50 rounded-full h-3 relative">
                      <motion.div
                        className={`bg-gradient-to-r ${getProgressColor(goal.progress)} h-3 rounded-full relative`}
                        initial={{ width: 0 }}
                        animate={{ width: `${goal.progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      >
                        {goal.progress >= 100 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute right-1 top-1/2 -translate-y-1/2"
                          >
                            <Sparkles className="h-4 w-4 text-white" />
                          </motion.div>
                        )}
                      </motion.div>
                      
                      {/* Milestones on progress bar */}
                      {goal.milestones.map((milestone) => {
                        const position = (milestone.targetValue / goal.targetValue) * 100;
                        return (
                          <div
                            key={milestone.id}
                            className="absolute top-1/2 -translate-y-1/2"
                            style={{ left: `${position}%` }}
                          >
                            <div className={`w-2 h-2 rounded-full ${
                              milestone.completed ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t pt-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Milestones */}
                        {goal.milestones.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Milestones</h5>
                            <div className="space-y-1">
                              {goal.milestones.map((milestone) => (
                                <div
                                  key={milestone.id}
                                  className="flex items-center justify-between p-2 bg-white/50 rounded-lg"
                                >
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => !milestone.completed && completeMilestone(goal.id, milestone.id)}
                                      disabled={milestone.completed}
                                    >
                                      {milestone.completed ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <div className="w-4 h-4 border-2 border-gray-400 rounded-full" />
                                      )}
                                    </button>
                                    <span className={`text-sm ${milestone.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                      {milestone.title}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {milestone.targetValue} {goal.unit}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add Milestone */}
                        {showAddMilestone === goal.id ? (
                          <div className="p-3 bg-white/50 rounded-lg mb-3">
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={milestoneTitle}
                                onChange={(e) => setMilestoneTitle(e.target.value)}
                                placeholder="Milestone title"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                              <input
                                type="number"
                                value={milestoneTarget}
                                onChange={(e) => setMilestoneTarget(Number(e.target.value))}
                                placeholder={`Target value (${goal.unit})`}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setShowAddMilestone(null);
                                    setMilestoneTitle('');
                                    setMilestoneTarget(0);
                                  }}
                                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleAddMilestone(goal.id)}
                                  className="px-3 py-1 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowAddMilestone(goal.id)}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium mb-3"
                          >
                            + Add milestone
                          </button>
                        )}

                        {/* Update Progress */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              const newValue = Math.max(0, goal.currentValue - 1);
                              updateGoalProgress(goal.id, newValue);
                            }}
                            className="p-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                          >
                            <ArrowDown className="h-4 w-4 text-gray-600" />
                          </button>
                          
                          <div className="flex-1 text-center">
                            <input
                              type="number"
                              value={goal.currentValue}
                              onChange={(e) => updateGoalProgress(goal.id, Number(e.target.value))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                            />
                            <span className="text-sm text-gray-600 ml-1">{goal.unit}</span>
                          </div>
                          
                          <button
                            onClick={() => {
                              const newValue = Math.min(goal.targetValue, goal.currentValue + 1);
                              updateGoalProgress(goal.id, newValue);
                            }}
                            className="p-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                          >
                            <ArrowUp className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>

                        {/* Insights & Celebrations */}
                        {(goal.insights && goal.insights.length > 0) && (
                          <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                            <h5 className="text-xs font-medium text-blue-700 mb-1">Insights</h5>
                            {goal.insights.map((insight, index) => (
                              <p key={index} className="text-xs text-blue-600">{insight}</p>
                            ))}
                          </div>
                        )}
                        
                        {(goal.celebrations && goal.celebrations.length > 0) && (
                          <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                            <h5 className="text-xs font-medium text-yellow-700 mb-1">Celebrations</h5>
                            {goal.celebrations.map((celebration, index) => (
                              <p key={index} className="text-xs text-yellow-600 flex items-center">
                                <Star className="h-3 w-3 mr-1" />
                                {celebration}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-3 flex items-center justify-between">
                          <button
                            onClick={() => onViewDetails?.(goal.id)}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            View Details
                          </button>
                          
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to abandon this goal?')) {
                                abandonGoal(goal.id, 'User choice');
                              }
                            }}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Abandon Goal
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Completed Goals Summary */}
      {completedGoals.length > 0 && (
        <div className="border-t pt-3 mt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">
                {completedGoals.length} goals completed
              </span>
            </div>
            <button
              onClick={() => {/* Show completed goals */}}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}