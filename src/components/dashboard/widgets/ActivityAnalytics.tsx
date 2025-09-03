import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  _Calendar,
  BarChart3,
  _PieChart,
  Clock,
  Zap,
  Heart,
  Brain,
  Users,
  X,
  Sun,
  Moon,
  Cloud,
  Award,
  AlertCircle,
  _Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  _Info
} from 'lucide-react';
import { useActivityStore } from '../../../stores/activityStore';
import { format, startOfWeek, _endOfWeek, eachDayOfInterval, subDays, addDays, isToday } from 'date-fns';

interface ActivityAnalyticsProps {
  _onExportData?: () => void;
  _onViewDetails?: (activityId: string) => void;
}

export function ActivityAnalytics({
  _onExportData,
  _onViewDetails
}: ActivityAnalyticsProps) {
  const { activityHistory, _activities, _goals, _habits, correlateActivitiesWithMood, _analyzeActivityEffectiveness, exportProgressReport } = useActivityStore();

  const [selectedPeriod, _setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showInsights, _setShowInsights] = useState(true);

  // Get date range based on selected period
  const getDateRange = () => {
    const end = currentDate;
    let start;
    
    switch (_selectedPeriod) {
      case 'week':
        start = startOfWeek(currentDate);
        break;
      case 'month':
        start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        break;
      case 'year':
        start = new Date(currentDate.getFullYear(), 0, 1);
        break;
      default:
        start = subDays(currentDate, 7);
    }
    
    return { start, end };
  };

  // Filter activities by date range and category
  const filteredActivities = useMemo(() => {
    const { start, end } = getDateRange();
    
    return activityHistory.filter(activity => {
      const activityDate = activity.completedAt ? new Date(activity.completedAt) : null;
      if (!activityDate) return false;
      
      const inDateRange = activityDate >= start && activityDate <= end;
      const inCategory = selectedCategory === 'all' || activity.category === selectedCategory;
      
      return inDateRange && inCategory;
    });
  }, [activityHistory, selectedPeriod, selectedCategory, currentDate]);

  // Calculate statistics
  const ___stats  = useMemo(() => {
    const completed = filteredActivities.filter(a => a.completed).length;
    const total = filteredActivities.length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    const moodImpacts = filteredActivities
      .filter(a => a.actualMoodImpact !== undefined)
      .map(a => a.actualMoodImpact!);
    
    const avgMoodImpact = moodImpacts.length > 0
      ? moodImpacts.reduce((sum, impact) => sum + impact, 0) / moodImpacts.length
      : 0;
    
    const totalTime = filteredActivities
      .filter(a => a.duration)
      .reduce((sum, a) => sum + (a.duration || 0), 0);
    
    // Category breakdown
    const categoryBreakdown = new Map<string, number>();
    filteredActivities.forEach(activity => {
      const count = categoryBreakdown.get(activity.category) || 0;
      categoryBreakdown.set(activity.category, count + 1);
    });
    
    // Time of day analysis
    const timeOfDayBreakdown = {
      morning: 0, // 6-12
      afternoon: 0, // 12-18
      evening: 0, // 18-24
      night: 0 // 0-6
    };
    
    filteredActivities.forEach(activity => {
      if (activity.scheduledTime) {
        const hour = new Date(activity.scheduledTime).getHours();
        if (hour >= 6 && hour < 12) timeOfDayBreakdown.morning++;
        else if (hour >= 12 && hour < 18) timeOfDayBreakdown.afternoon++;
        else if (hour >= 18 && hour < 24) timeOfDayBreakdown.evening++;
        else timeOfDayBreakdown.night++;
      }
    });
    
    // Energy level analysis
    const energyBreakdown = {
      low: filteredActivities.filter(a => a.energyLevel === 'low').length,
      medium: filteredActivities.filter(a => a.energyLevel === 'medium').length,
      high: filteredActivities.filter(a => a.energyLevel === 'high').length,
    };
    
    return {
      completed,
      total,
      completionRate,
      avgMoodImpact,
      totalTime,
      categoryBreakdown,
      timeOfDayBreakdown,
      energyBreakdown
    };
  }, [filteredActivities]);

  // Get mood correlations
  const moodCorrelations = useMemo(() => {
    return correlateActivitiesWithMood().slice(0, 5);
  }, [correlateActivitiesWithMood]);

  // Get daily activity data for chart
  const dailyData = useMemo(() => {
    const { start, end } = getDateRange();
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const dayActivities = filteredActivities.filter(activity => {
        if (!activity.completedAt) return false;
        const activityDate = new Date(activity.completedAt);
        return activityDate.toDateString() === day.toDateString();
      });
      
      const completed = dayActivities.filter(a => a.completed).length;
      const moodImpacts = dayActivities
        .filter(a => a.actualMoodImpact !== undefined)
        .map(a => a.actualMoodImpact!);
      
      const avgMood = moodImpacts.length > 0
        ? moodImpacts.reduce((sum, impact) => sum + impact, 0) / moodImpacts.length
        : 0;
      
      return {
        date: day,
        completed,
        avgMood,
        isToday: isToday(_day)
      };
    });
  }, [filteredActivities, selectedPeriod, currentDate]);

  // Get insights
  const insights = useMemo(() => {
    const insights = [];
    
    // Completion rate insight
    if (stats.completionRate >= 80) {
      insights.push({
        type: 'success',
        title: 'Excellent Completion Rate',
        message: `You're completing ${Math.round(stats.completionRate)}% of your activities!`,
        icon: Award
      });
    } else if (stats.completionRate < 50) {
      insights.push({
        type: 'warning',
        title: 'Low Completion Rate',
        message: 'Consider reducing _activities or adjusting your schedule',
        icon: AlertCircle
      });
    }
    
    // Mood impact insight
    if (stats.avgMoodImpact > 2) {
      insights.push({
        type: 'success',
        title: 'Positive Mood Impact',
        message: 'Your _activities are significantly improving your mood',
        icon: Heart
      });
    } else if (stats.avgMoodImpact < -1) {
      insights.push({
        type: 'warning',
        title: 'Negative Mood Trend',
        message: 'Some _activities may be affecting your mood negatively',
        icon: TrendingDown
      });
    }
    
    // Time of day insight
    const maxTimeOfDay = Object.entries(stats.timeOfDayBreakdown)
      .reduce((max, [time, count]) => count > max.count ? { time, count } : max, { time: '', count: 0 });
    
    if (maxTimeOfDay.count > 0) {
      insights.push({
        type: 'info',
        title: 'Peak Activity Time',
        message: `You're most active in the ${maxTimeOfDay.time}`,
        icon: Clock
      });
    }
    
    // Energy distribution insight
    if (stats.energyBreakdown.low > stats.energyBreakdown.high * 2) {
      insights.push({
        type: 'info',
        title: 'Low Energy Pattern',
        message: 'Most _activities are low energy - consider adding energizing _activities',
        icon: Zap
      });
    }
    
    return insights;
  }, [stats]);

  // Navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const days = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 365;
    setCurrentDate(prev => direction === 'prev' ? subDays(prev, days) : addDays(prev, days));
  };

  // Export data
  const handleExport = () => {
    const report = exportProgressReport();
    const _blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(_blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(_url);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Activity Analytics</h3>
              <p className="text-sm text-gray-600">
                {format(getDateRange().start, 'MMM d')} - {format(getDateRange().end, 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleExport}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Export data"
          >
            <Download className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Period Selection & Navigation */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex space-x-2">
            {(['week', 'month', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(_period)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateDate('prev')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateDate('next')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="p-2 bg-blue-50 rounded-lg text-center">
            <div className="text-lg font-bold text-blue-600">{stats.completed}</div>
            <div className="text-xs text-blue-700">Completed</div>
          </div>
          <div className="p-2 bg-green-50 rounded-lg text-center">
            <div className="text-lg font-bold text-green-600">
              {Math.round(stats.completionRate)}%
            </div>
            <div className="text-xs text-green-700">Success Rate</div>
          </div>
          <div className="p-2 bg-purple-50 rounded-lg text-center">
            <div className="text-lg font-bold text-purple-600">
              {stats.avgMoodImpact > 0 ? '+' : ''}{stats.avgMoodImpact.toFixed(1)}
            </div>
            <div className="text-xs text-purple-700">Avg Mood</div>
          </div>
          <div className="p-2 bg-orange-50 rounded-lg text-center">
            <div className="text-lg font-bold text-orange-600">
              {Math.round(stats.totalTime / 60)}h
            </div>
            <div className="text-xs text-orange-700">Total Time</div>
          </div>
        </div>

        {/* Category _Filter */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({stats.total})
          </button>
          {Array.from(stats.categoryBreakdown.entries()).map(([category, count]) => (
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

      {/* Charts Section */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Daily Activity Chart */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Daily Activity Pattern</h4>
          <div className="space-y-2">
            {dailyData.map((day, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-16 text-xs text-gray-600">
                  {format(day.date, 'EEE, MMM d')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
                      <motion.div
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-6 rounded-full flex items-center justify-end pr-2"
                        initial={{ width: 0 }}
                        animate={{ width: `${(day.completed / Math.max(...dailyData.map(d => d.completed), 1)) * 100}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                      >
                        <span className="text-xs text-white font-medium">{day.completed}</span>
                      </motion.div>
                    </div>
                    {day.avgMood !== 0 && (
                      <span className={`text-xs font-medium ${
                        day.avgMood > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {day.avgMood > 0 ? '+' : ''}{day.avgMood.toFixed(1)}
                      </span>
                    )}
                    {day.isToday && (
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Category Distribution</h4>
          <div className="space-y-2">
            {Array.from(stats.categoryBreakdown.entries()).map(([category, count]) => {
              const _percentage = (count / stats.total) * 100;
              const getCategoryIcon = () => {
                switch (_category) {
                  case 'therapy': return Brain;
                  case 'wellness': return Heart;
                  case 'social': return Users;
                  case 'professional': return Activity;
                  default: return Zap;
                }
              };
              const Icon = getCategoryIcon();
              
              return (
                <div key={category} className="flex items-center space-x-3">
                  <Icon className="h-4 w-4 text-gray-500" />
                  <div className="w-20 text-sm text-gray-600">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-full h-4 relative">
                      <motion.div
                        className={`h-4 rounded-full ${
                          category === 'therapy' ? 'bg-purple-500' :
                          category === 'wellness' ? 'bg-green-500' :
                          category === 'social' ? 'bg-blue-500' :
                          category === 'professional' ? 'bg-orange-500' :
                          'bg-gray-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${_percentage}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-700 font-medium">
                    {count} ({Math.round(_percentage)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time of Day Analysis */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Activity by Time of Day</h4>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(stats.timeOfDayBreakdown).map(([time, count]) => {
              const getTimeIcon = () => {
                switch (_time) {
                  case 'morning': return Sun;
                  case 'afternoon': return Sun;
                  case 'evening': return Cloud;
                  case 'night': return Moon;
                  default: return Clock;
                }
              };
              const Icon = getTimeIcon();
              const _percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              
              return (
                <div key={time} className="text-center p-2 bg-gray-50 rounded-lg">
                  <Icon className="h-6 w-6 text-gray-500 mx-auto mb-1" />
                  <div className="text-xs text-gray-600 mb-1">
                    {time.charAt(0).toUpperCase() + time.slice(1)}
                  </div>
                  <div className="text-lg font-bold text-gray-900">{count}</div>
                  <div className="text-xs text-gray-500">{Math.round(_percentage)}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Energy Level Distribution */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Energy Level Distribution</h4>
          <div className="space-y-2">
            {Object.entries(stats.energyBreakdown).map(([level, count]) => {
              const _percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              const getColor = () => {
                switch (_level) {
                  case 'low': return 'bg-blue-500';
                  case 'medium': return 'bg-yellow-500';
                  case 'high': return 'bg-red-500';
                  default: return 'bg-gray-500';
                }
              };
              
              return (
                <div key={level} className="flex items-center space-x-3">
                  <Zap className={`h-4 w-4 ${
                    level === 'low' ? 'text-blue-500' :
                    level === 'medium' ? 'text-yellow-500' :
                    'text-red-500'
                  }`} />
                  <div className="w-16 text-sm text-gray-600">
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-full h-4 relative">
                      <motion.div
                        className={`h-4 rounded-full ${getColor()}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${_percentage}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-700 font-medium">
                    {count} ({Math.round(_percentage)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mood Correlations */}
        {moodCorrelations.length > 0 && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Activities with Strongest Mood Impact</h4>
            <div className="space-y-2">
              {moodCorrelations.map((correlation, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{correlation.activity}</span>
                  <div className="flex items-center space-x-2">
                    {correlation.correlation > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      correlation.correlation > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {correlation.correlation > 0 ? '+' : ''}{correlation.correlation.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        {showInsights && insights.length > 0 && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Insights & Recommendations</h4>
              <button
                onClick={() => setShowInsights(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {insights.map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg flex items-start space-x-3 ${
                      insight.type === 'success' ? 'bg-green-50' :
                      insight.type === 'warning' ? 'bg-yellow-50' :
                      'bg-blue-50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mt-0.5 ${
                      insight.type === 'success' ? 'text-green-600' :
                      insight.type === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                    <div>
                      <h5 className={`font-medium text-sm ${
                        insight.type === 'success' ? 'text-green-800' :
                        insight.type === 'warning' ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>
                        {insight.title}
                      </h5>
                      <p className={`text-xs mt-0.5 ${
                        insight.type === 'success' ? 'text-green-700' :
                        insight.type === 'warning' ? 'text-yellow-700' :
                        'text-blue-700'
                      }`}>
                        {insight.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}