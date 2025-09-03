/**
 * Therapeutic Progress Tracker Component
 * Tracks and visualizes mental health progress with evidence-based metrics
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Activity, Brain, Heart, Target,
  Calendar, Clock, Award, ChevronRight, Filter, Download,
  AlertCircle, CheckCircle, Info, BarChart3, LineChart,
  Zap, Moon, Sun, Cloud, CloudRain, User, MessageSquare
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, 
         subDays, differenceInDays, isToday } from 'date-fns';
import { secureStorage } from '../../services/security/SecureLocalStorage';
import { detectCrisisLevel } from '../../utils/crisis';

interface TherapeuticMetric {
  id: string;
  name: string;
  category: 'mood' | 'anxiety' | 'depression' | 'stress' | 'coping' | 'social' | 'physical';
  value: number; // 0-10 scale
  timestamp: Date;
  notes?: string;
  triggers?: string[];
  copingUsed?: string[];
}

interface TherapySession {
  id: string;
  date: Date;
  therapistId?: string;
  duration: number; // minutes
  mood: {
    before: number;
    after: number;
  };
  topics: string[];
  breakthroughs?: string[];
  homework?: string[];
  nextSteps?: string[];
}

interface ProgressInsight {
  id: string;
  type: 'improvement' | 'concern' | 'milestone' | 'pattern';
  category: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'alert';
  data?: any;
  timestamp: Date;
}

interface WeeklyReport {
  weekStart: Date;
  weekEnd: Date;
  averageMood: number;
  moodTrend: 'improving' | 'stable' | 'declining';
  anxietyLevel: number;
  stressLevel: number;
  copingEffectiveness: number;
  sessionsCompleted: number;
  goalsProgress: number;
  insights: ProgressInsight[];
}

const MOOD_EMOJIS = {
  1: { emoji: '😔', label: 'Very Low', color: 'text-red-500' },
  2: { emoji: '😟', label: 'Low', color: 'text-orange-500' },
  3: { emoji: '😕', label: 'Below Average', color: 'text-yellow-600' },
  4: { emoji: '😐', label: 'Neutral', color: 'text-yellow-500' },
  5: { emoji: '🙂', label: 'Okay', color: 'text-green-400' },
  6: { emoji: '😊', label: 'Good', color: 'text-green-500' },
  7: { emoji: '😄', label: 'Very Good', color: 'text-green-600' },
  8: { emoji: '😁', label: 'Great', color: 'text-blue-500' },
  9: { emoji: '🤗', label: 'Excellent', color: 'text-blue-600' },
  10: { emoji: '🌟', label: 'Amazing', color: 'text-purple-500' }
};

const METRIC_CATEGORIES = {
  mood: { name: 'Mood', icon: Sun, color: 'from-yellow-400 to-orange-500' },
  anxiety: { name: 'Anxiety', icon: CloudRain, color: 'from-blue-400 to-indigo-500' },
  depression: { name: 'Depression', icon: Cloud, color: 'from-gray-400 to-gray-600' },
  stress: { name: 'Stress', icon: Zap, color: 'from-red-400 to-pink-500' },
  coping: { name: 'Coping Skills', icon: Brain, color: 'from-purple-400 to-violet-500' },
  social: { name: 'Social Connection', icon: Heart, color: 'from-pink-400 to-red-500' },
  physical: { name: 'Physical Wellness', icon: Activity, color: 'from-green-400 to-emerald-500' }
};

export const TherapeuticProgressTracker: React.FC = () => {
  const [metrics, setMetrics] = useState<TherapeuticMetric[]>([]);
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [insights, setInsights] = useState<ProgressInsight[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof METRIC_CATEGORIES | 'all'>('all');
  const [showAddMetric, setShowAddMetric] = useState(false);
  const [newMetric, setNewMetric] = useState<Partial<TherapeuticMetric>>({
    category: 'mood',
    value: 5
  });

  // Load saved data on mount
  useEffect(() => {
    loadProgressData();
  }, []);

  // Generate insights when data changes
  useEffect(() => {
    generateProgressInsights();
  }, [metrics, sessions]);

  const loadProgressData = () => {
    try {
      const savedMetrics = secureStorage.getItem('therapeuticMetrics');
      const savedSessions = secureStorage.getItem('therapySessions');
      
      if (savedMetrics) {
        const parsed = JSON.parse(savedMetrics);
        setMetrics(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      }
      
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed.map((s: any) => ({ ...s, date: new Date(s.date) })));
      }
    } catch (error) {
      console.error('Failed to load progress data:', error);
    }
  };

  const saveProgressData = () => {
    try {
      secureStorage.setItem('therapeuticMetrics', JSON.stringify(metrics));
      secureStorage.setItem('therapySessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save progress data:', error);
    }
  };

  const addMetric = () => {
    if (!newMetric.category || newMetric.value === undefined) return;

    const metric: TherapeuticMetric = {
      id: `metric-${Date.now()}`,
      name: METRIC_CATEGORIES[newMetric.category].name,
      category: newMetric.category,
      value: newMetric.value,
      timestamp: new Date(),
      notes: newMetric.notes,
      triggers: newMetric.triggers,
      copingUsed: newMetric.copingUsed
    };

    const updatedMetrics = [...metrics, metric];
    setMetrics(updatedMetrics);
    secureStorage.setItem('therapeuticMetrics', JSON.stringify(updatedMetrics));
    
    setShowAddMetric(false);
    setNewMetric({ category: 'mood', value: 5 });
    
    // Check for crisis indicators in notes
    if (newMetric.notes) {
      const crisisLevel = detectCrisisLevel(newMetric.notes);
      if (crisisLevel.level === 'high' || crisisLevel.level === 'critical') {
        generateCrisisInsight(crisisLevel.level);
      }
    }
  };

  const generateProgressInsights = () => {
    const newInsights: ProgressInsight[] = [];
    const now = new Date();
    const weekAgo = subDays(now, 7);
    
    // Recent metrics
    const recentMetrics = metrics.filter(m => m.timestamp > weekAgo);
    
    if (recentMetrics.length === 0) {
      newInsights.push({
        id: `insight-${Date.now()}-1`,
        type: 'concern',
        category: 'tracking',
        message: 'No progress tracked this week. Regular tracking helps identify patterns.',
        severity: 'info',
        timestamp: now
      });
    } else {
      // Calculate averages by category
      const categoryAverages = Object.keys(METRIC_CATEGORIES).reduce((acc, cat) => {
        const catMetrics = recentMetrics.filter(m => m.category === cat);
        if (catMetrics.length > 0) {
          acc[cat] = catMetrics.reduce((sum, m) => sum + m.value, 0) / catMetrics.length;
        }
        return acc;
      }, {} as Record<string, number>);

      // Check mood trends
      const moodMetrics = recentMetrics.filter(m => m.category === 'mood').sort((a, b) => 
        a.timestamp.getTime() - b.timestamp.getTime()
      );
      
      if (moodMetrics.length >= 3) {
        const firstHalf = moodMetrics.slice(0, Math.floor(moodMetrics.length / 2));
        const secondHalf = moodMetrics.slice(Math.floor(moodMetrics.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length;
        
        if (secondAvg - firstAvg > 1) {
          newInsights.push({
            id: `insight-${Date.now()}-2`,
            type: 'improvement',
            category: 'mood',
            message: `Your mood has improved by ${Math.round((secondAvg - firstAvg) * 10) / 10} points this week!`,
            severity: 'success',
            data: { firstAvg, secondAvg },
            timestamp: now
          });
        } else if (firstAvg - secondAvg > 1) {
          newInsights.push({
            id: `insight-${Date.now()}-3`,
            type: 'concern',
            category: 'mood',
            message: 'Your mood has been declining. Consider reaching out for support.',
            severity: 'warning',
            data: { firstAvg, secondAvg },
            timestamp: now
          });
        }
      }

      // Check anxiety levels
      if (categoryAverages['anxiety'] && categoryAverages['anxiety'] > 7) {
        newInsights.push({
          id: `insight-${Date.now()}-4`,
          type: 'concern',
          category: 'anxiety',
          message: 'Your anxiety levels have been high. Practice grounding techniques and consider professional support.',
          severity: 'warning',
          timestamp: now
        });
      }

      // Check coping effectiveness
      if (categoryAverages['coping'] && categoryAverages['coping'] > 6) {
        newInsights.push({
          id: `insight-${Date.now()}-5`,
          type: 'improvement',
          category: 'coping',
          message: 'Your coping skills are working well! Keep using what works for you.',
          severity: 'success',
          timestamp: now
        });
      }

      // Milestone checks
      if (metrics.length === 7) {
        newInsights.push({
          id: `insight-${Date.now()}-6`,
          type: 'milestone',
          category: 'tracking',
          message: 'One week of consistent tracking! You\'re building a healthy habit.',
          severity: 'success',
          timestamp: now
        });
      } else if (metrics.length === 30) {
        newInsights.push({
          id: `insight-${Date.now()}-7`,
          type: 'milestone',
          category: 'tracking',
          message: 'One month of progress tracking! Your dedication is admirable.',
          severity: 'success',
          timestamp: now
        });
      }

      // Pattern detection
      const triggers = recentMetrics.flatMap(m => m.triggers || []);
      const triggerCounts = triggers.reduce((acc, trigger) => {
        acc[trigger] = (acc[trigger] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const commonTriggers = Object.entries(triggerCounts)
        .filter(([_, count]) => count >= 3)
        .map(([trigger]) => trigger);
      
      if (commonTriggers.length > 0) {
        newInsights.push({
          id: `insight-${Date.now()}-8`,
          type: 'pattern',
          category: 'triggers',
          message: `Common triggers identified: ${commonTriggers.join(', ')}. Awareness is the first step to management.`,
          severity: 'info',
          data: { triggers: commonTriggers },
          timestamp: now
        });
      }
    }

    setInsights(newInsights);
  };

  const generateCrisisInsight = (level: string) => {
    const insight: ProgressInsight = {
      id: `crisis-${Date.now()}`,
      type: 'concern',
      category: 'crisis',
      message: level === 'critical' 
        ? 'Your recent entry suggests you may need immediate support. Please reach out to 988 or your therapist.'
        : 'You seem to be going through a difficult time. Support is available when you need it.',
      severity: 'alert',
      timestamp: new Date()
    };
    setInsights(prev => [insight, ...prev]);
  };

  const getMetricsByTimeRange = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    
    switch (selectedTimeRange) {
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subDays(now, 30);
        break;
      case 'year':
        startDate = subDays(now, 365);
        break;
    }
    
    let filtered = metrics.filter(m => m.timestamp >= startDate);
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(m => m.category === selectedCategory);
    }
    
    return filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [metrics, selectedTimeRange, selectedCategory]);

  const chartData = useMemo(() => {
    const data = getMetricsByTimeRange.reduce((acc, metric) => {
      const date = format(metric.timestamp, 'MMM dd');
      if (!acc[date]) {
        acc[date] = { date, values: [] };
      }
      acc[date].values.push(metric.value);
      return acc;
    }, {} as Record<string, { date: string; values: number[] }>);
    
    return Object.values(data).map(d => ({
      date: d.date,
      value: d.values.reduce((sum, v) => sum + v, 0) / d.values.length
    }));
  }, [getMetricsByTimeRange]);

  const exportProgressReport = () => {
    const report = generateProgressReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progress-report-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateProgressReport = () => {
    let report = '=== THERAPEUTIC PROGRESS REPORT ===\n\n';
    report += `Generated: ${format(new Date(), 'MMMM dd, yyyy')}\n`;
    report += `Time Period: Last ${selectedTimeRange}\n\n`;
    
    // Summary statistics
    const avgMood = getMetricsByTimeRange
      .filter(m => m.category === 'mood')
      .reduce((sum, m, _, arr) => sum + m.value / arr.length, 0);
    
    report += '--- SUMMARY ---\n';
    report += `Average Mood: ${avgMood.toFixed(1)}/10\n`;
    report += `Total Entries: ${getMetricsByTimeRange.length}\n`;
    report += `Therapy Sessions: ${sessions.filter(s => 
      s.date >= subDays(new Date(), selectedTimeRange === 'week' ? 7 : selectedTimeRange === 'month' ? 30 : 365)
    ).length}\n\n`;
    
    // Recent insights
    report += '--- KEY INSIGHTS ---\n';
    insights.slice(0, 5).forEach(insight => {
      report += `• ${insight.message}\n`;
    });
    
    report += '\n--- DETAILED METRICS ---\n';
    getMetricsByTimeRange.forEach(metric => {
      report += `${format(metric.timestamp, 'MMM dd, yyyy')}: ${metric.name} - ${metric.value}/10\n`;
      if (metric.notes) report += `  Notes: ${metric.notes}\n`;
      if (metric.triggers?.length) report += `  Triggers: ${metric.triggers.join(', ')}\n`;
      if (metric.copingUsed?.length) report += `  Coping: ${metric.copingUsed.join(', ')}\n`;
    });
    
    return report;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-400 to-violet-500 p-3 rounded-xl">
              <LineChart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Therapeutic Progress</h1>
              <p className="text-gray-300">Track your mental health journey</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddMetric(true)}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Add Entry
            </button>
            <button
              onClick={exportProgressReport}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Time Range and Category Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-1">
            {(['week', 'month', 'year'] as const).map(range => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  selectedTimeRange === range
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            {Object.entries(METRIC_CATEGORIES).map(([key, cat]) => {
              const Icon = cat.icon;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key as keyof typeof METRIC_CATEGORIES)}
                  className={`px-3 py-1 rounded-md transition-colors flex items-center space-x-1 ${
                    selectedCategory === key
                      ? 'bg-purple-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Chart */}
        <div className="lg:col-span-2 bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
          <h2 className="text-xl font-semibold text-white mb-4">Progress Over Time</h2>
          
          {chartData.length > 0 ? (
            <div className="h-64 flex items-end justify-between space-x-2">
              {chartData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(data.value / 10) * 100}%` }}
                    transition={{ delay: index * 0.05 }}
                    className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg relative group"
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      {data.value.toFixed(1)}
                    </div>
                  </motion.div>
                  <span className="text-xs text-gray-400 mt-2 rotate-45 origin-left">{data.date}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-400">No data for selected period</p>
            </div>
          )}
        </div>

        {/* Insights Panel */}
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
          <h2 className="text-xl font-semibold text-white mb-4">Insights</h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {insights.length > 0 ? (
              insights.map(insight => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg ${
                    insight.severity === 'success' ? 'bg-green-500/20 border border-green-400/50' :
                    insight.severity === 'warning' ? 'bg-yellow-500/20 border border-yellow-400/50' :
                    insight.severity === 'alert' ? 'bg-red-500/20 border border-red-400/50' :
                    'bg-blue-500/20 border border-blue-400/50'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {insight.severity === 'success' && <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />}
                    {insight.severity === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />}
                    {insight.severity === 'alert' && <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />}
                    {insight.severity === 'info' && <Info className="h-5 w-5 text-blue-400 flex-shrink-0" />}
                    <p className="text-sm text-gray-200">{insight.message}</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-400 text-center">Track more data to see insights</p>
            )}
          </div>
        </div>

        {/* Recent Metrics */}
        <div className="lg:col-span-3 bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Entries</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getMetricsByTimeRange.slice(-6).reverse().map(metric => {
              const category = METRIC_CATEGORIES[metric.category];
              const Icon = category.icon;
              const moodInfo = MOOD_EMOJIS[Math.round(metric.value) as keyof typeof MOOD_EMOJIS];
              
              return (
                <motion.div
                  key={metric.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gray-900/50 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`bg-gradient-to-r ${category.color} p-2 rounded-lg`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-medium">{category.name}</div>
                        <div className="text-xs text-gray-400">
                          {format(metric.timestamp, 'MMM dd, h:mm a')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl">{moodInfo.emoji}</div>
                      <div className={`text-sm ${moodInfo.color}`}>{metric.value}/10</div>
                    </div>
                  </div>
                  
                  {metric.notes && (
                    <p className="text-sm text-gray-300 mt-2">{metric.notes}</p>
                  )}
                  
                  {metric.triggers && metric.triggers.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {metric.triggers.map((trigger, i) => (
                        <span key={i} className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">
                          {trigger}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {metric.copingUsed && metric.copingUsed.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {metric.copingUsed.map((coping, i) => (
                        <span key={i} className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                          {coping}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Metric Modal */}
      <AnimatePresence>
        {showAddMetric && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddMetric(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-800 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-white mb-4">Track Your Progress</h3>
              
              {/* Category Selection */}
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">Category</label>
                <select
                  value={newMetric.category}
                  onChange={(e) => setNewMetric({ ...newMetric, category: e.target.value as any })}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
                >
                  {Object.entries(METRIC_CATEGORIES).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Value Slider */}
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">
                  How are you feeling? ({newMetric.value}/10)
                </label>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {MOOD_EMOJIS[Math.round(newMetric.value || 5) as keyof typeof MOOD_EMOJIS].emoji}
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={newMetric.value}
                    onChange={(e) => setNewMetric({ ...newMetric, value: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-white font-medium">{newMetric.value}</span>
                </div>
              </div>
              
              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">Notes (optional)</label>
                <textarea
                  value={newMetric.notes || ''}
                  onChange={(e) => setNewMetric({ ...newMetric, notes: e.target.value })}
                  placeholder="How are you feeling? What happened today?"
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 h-20 resize-none"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={addMetric}
                  className="flex-1 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Save Entry
                </button>
                <button
                  onClick={() => setShowAddMetric(false)}
                  className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
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

export default TherapeuticProgressTracker;