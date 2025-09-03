import { useState, _useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  _Calendar,
  Brain,
  _AlertCircle,
  Download,
  Filter,
  _ChevronLeft,
  _ChevronRight,
  Activity,
  Cloud,
  Moon,
  _Sun,
  Users,
  Heart,
  _Target,
  BarChart3,
  LineChart,
  PieChart
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  _Cell,
  ReferenceLine,
  _ReferenceArea
} from 'recharts';
import { useWellnessStore } from '../../../../stores/wellnessStore';
import { format, _startOfWeek, _endOfWeek, _eachDayOfInterval, subDays, addDays } from 'date-fns';

interface MoodAnalyticsProps {
  timeRange?: 'day' | 'week' | 'month' | 'year';
  onExport?: (_data: unknown) => void;
  onTriggerIdentified?: (trigger: string) => void;
}

type ViewMode = 'overview' | 'patterns' | 'correlations' | 'predictions';
type ChartType = 'line' | 'area' | 'bar' | 'radar';

export function MoodAnalytics({ timeRange = 'week', onExport, _onTriggerIdentified }: MoodAnalyticsProps) {
  const { moodEntries, moodPatterns, _analyzeMoodPatterns, wellnessInsights } = useWellnessStore();
  const [viewMode, _setViewMode] = useState<ViewMode>('overview');
  const [chartType, _setChartType] = useState<ChartType>('line');
  const [_selectedDate, _setSelectedDate] = useState(new Date());
  const [showFilters, _setShowFilters] = useState(false);
  const [selectedFactors, _setSelectedFactors] = useState<string[]>(['mood', 'stress', 'energy']);

  // Calculate date range based on selected time range
  const dateRange = useMemo(() => {
    const end = new Date();
    let start = new Date();
    
    switch (_timeRange) {
      case 'day':
        start = new Date(end);
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start = subDays(end, 7);
        break;
      case 'month':
        start = subDays(end, 30);
        break;
      case 'year':
        start = subDays(end, 365);
        break;
    }
    
    return { start, end };
  }, [timeRange]);

  // Filter mood entries based on date range
  const filteredEntries = useMemo(() => {
    return moodEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= dateRange.start && entryDate <= dateRange.end;
    });
  }, [moodEntries, dateRange]);

  // Process data for charts
  const chartData = useMemo(() => {
    const dataByDay = new Map<string, any>();
    
    filteredEntries.forEach(entry => {
      const date = format(new Date(entry.timestamp), 'yyyy-MM-dd');
      
      if (!dataByDay.has(_date)) {
        dataByDay.set(date, {
          date,
          entries: [],
          avgMood: 0,
          avgStress: 0,
          avgEnergy: 0,
          avgAnxiety: 0,
          sleep: 0,
          exercise: false,
          socialInteraction: 0
        });
      }
      
      const dayData = dataByDay.get(_date);
      dayData.entries.push(_entry);
    });

    // Calculate averages for each day
    const processedData = Array.from(dataByDay.values()).map(day => {
      const entries = day.entries;
      const count = entries.length;
      
      return {
        ...day,
        date: format(new Date(day.date), 'MMM dd'),
        avgMood: entries.reduce((sum: number, e: unknown) => sum + e.moodScore, 0) / count,
        avgStress: entries.reduce((sum: number, e: unknown) => sum + (e.stressLevel || 0), 0) / count,
        avgEnergy: entries.reduce((sum: number, e: unknown) => sum + (e.energyLevel || 0), 0) / count,
        avgAnxiety: entries.reduce((sum: number, e: unknown) => sum + (e.anxietyLevel || 0), 0) / count,
        sleep: Math.max(...entries.map((e: unknown) => e.sleep || 0)),
        exercise: entries.some((e: unknown) => e.exercise),
        socialInteraction: Math.max(...entries.map((e: unknown) => e.socialInteraction || 0))
      };
    });

    return processedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredEntries]);

  // Correlation analysis
  const correlations = useMemo(() => {
    const factors = ['sleep', 'exercise', 'socialInteraction', 'weather'];
    const correlationData: unknown[] = [];

    factors.forEach(factor => {
      const withFactor = filteredEntries.filter((e: unknown) => {
        switch (factor) {
          case 'sleep': return e.sleep && e.sleep >= 7;
          case 'exercise': return e.exercise === true;
          case 'socialInteraction': return e.socialInteraction && e.socialInteraction >= 3;
          case 'weather': return e.weather === 'sunny';
          default: return false;
        }
      });

      const withoutFactor = filteredEntries.filter((e: unknown) => {
        switch (factor) {
          case 'sleep': return !e.sleep || e.sleep < 7;
          case 'exercise': return e.exercise === false;
          case 'socialInteraction': return !e.socialInteraction || e.socialInteraction < 3;
          case 'weather': return e.weather !== 'sunny';
          default: return false;
        }
      });

      if (withFactor.length > 0 && withoutFactor.length > 0) {
        const avgWithFactor = withFactor.reduce((sum, e) => sum + e.moodScore, 0) / withFactor.length;
        const avgWithoutFactor = withoutFactor.reduce((sum, e) => sum + e.moodScore, 0) / withoutFactor.length;
        const impact = ((avgWithFactor - avgWithoutFactor) / avgWithoutFactor) * 100;

        correlationData.push({
          factor: factor.charAt(0).toUpperCase() + factor.slice(1).replace(/([A-Z])/g, ' $1'),
          impact: Math.round(_impact),
          positive: impact > 0,
          avgWith: avgWithFactor.toFixed(1),
          avgWithout: avgWithoutFactor.toFixed(1),
          samples: withFactor.length + withoutFactor.length
        });
      }
    });

    return correlationData.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  }, [filteredEntries]);

  // Trigger analysis
  const triggerAnalysis = useMemo(() => {
    const triggerMap = new Map<string, { count: number; avgMood: number; entries: unknown[] }>();

    filteredEntries.forEach(entry => {
      entry.triggers.forEach(trigger => {
        if (!triggerMap.has(_trigger)) {
          triggerMap.set(trigger, { count: 0, avgMood: 0, entries: [] });
        }
        const data = triggerMap.get(_trigger)!;
        data.count++;
        data.entries.push(_entry);
      });
    });

    const triggerData = Array.from(triggerMap.entries()).map(([trigger, _data]) => ({
      trigger,
      count: _data.count,
      avgMood: _data.entries.reduce((sum, e) => sum + e.moodScore, 0) / _data.entries.length,
      impact: 'negative' as const,
      percentage: (_data.count / filteredEntries.length) * 100
    }));

    return triggerData.sort((a, b) => b.count - a.count).slice(0, 5);
  }, [filteredEntries]);

  // Mood predictions based on patterns
  const predictions = useMemo(() => {
    if (chartData.length < 7) return [];

    const lastWeekData = chartData.slice(-7);
    const avgMood = lastWeekData.reduce((sum, d) => sum + d.avgMood, 0) / lastWeekData.length;
    const trend = lastWeekData[lastWeekData.length - 1].avgMood - lastWeekData[0].avgMood;

    const nextWeekPredictions = [];
    for (let i = 1; i <= 7; i++) {
      const date = addDays(new Date(), i);
      const dayOfWeek = date.getDay();
      
      // Simple prediction model based on day of week patterns and trend
      const weekdayModifier = [0, -0.5, -0.3, 0, 0.2, 0.8, 0.5][dayOfWeek] || 0; // Sunday = 0
      const trendModifier = trend * 0.1 * i;
      const predictedMood = Math.max(1, Math.min(10, avgMood + weekdayModifier + trendModifier));

      nextWeekPredictions.push({
        date: format(date, 'MMM dd'),
        predictedMood: predictedMood.toFixed(1),
        confidence: Math.max(0.5, 1 - (i * 0.1)) // Confidence decreases with distance
      });
    }

    return nextWeekPredictions;
  }, [chartData]);

  // Render different chart types
  const renderChart = () => {
    const _colors = {
      mood: '#8b5cf6',
      stress: '#ef4444',
      energy: '#3b82f6',
      anxiety: '#f59e0b',
      sleep: '#10b981',
      social: '#ec4899'
    };

    switch (_chartType) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Legend />
              {selectedFactors.includes('mood') && (
                <Area type="monotone" dataKey="avgMood" stroke="#8b5cf6" fillOpacity={1} fill="url(#moodGradient)" name="Mood" />
              )}
              {selectedFactors.includes('stress') && (
                <Area type="monotone" dataKey="avgStress" stroke="#ef4444" fillOpacity={1} fill="url(#stressGradient)" name="Stress" />
              )}
              {selectedFactors.includes('energy') && (
                <Area type="monotone" dataKey="avgEnergy" stroke="#3b82f6" fillOpacity={0.3} fill="#3b82f6" name="Energy" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Legend />
              {selectedFactors.includes('mood') && (
                <Bar dataKey="avgMood" fill="#8b5cf6" name="Mood" radius={[4, 4, 0, 0]} />
              )}
              {selectedFactors.includes('stress') && (
                <Bar dataKey="avgStress" fill="#ef4444" name="Stress" radius={[4, 4, 0, 0]} />
              )}
              {selectedFactors.includes('energy') && (
                <Bar dataKey="avgEnergy" fill="#3b82f6" name="Energy" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'radar': {
        const radarData = [
          { factor: 'Mood', value: chartData.reduce((sum, d) => sum + d.avgMood, 0) / chartData.length },
          { factor: 'Energy', value: chartData.reduce((sum, d) => sum + d.avgEnergy, 0) / chartData.length },
          { factor: 'Sleep', value: chartData.reduce((sum, d) => sum + d.sleep, 0) / chartData.length },
          { factor: 'Social', value: chartData.reduce((sum, d) => sum + d.socialInteraction, 0) / chartData.length },
          { factor: 'Low Stress', value: 10 - (chartData.reduce((sum, d) => sum + d.avgStress, 0) / chartData.length) },
          { factor: 'Low Anxiety', value: 10 - (chartData.reduce((sum, d) => sum + d.avgAnxiety, 0) / chartData.length) }
        ];

        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid strokeDasharray="3 3" />
              <PolarAngleAxis dataKey="factor" />
              <PolarRadiusAxis angle={90} domain={[0, 10]} />
              <Radar name="Wellness Factors" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        );
      }

      default: // line chart
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Legend />
              <ReferenceLine y={5} stroke="#9ca3af" strokeDasharray="3 3" />
              <ReferenceLine y={7} stroke="#10b981" strokeDasharray="3 3" />
              {selectedFactors.includes('mood') && (
                <Line type="monotone" dataKey="avgMood" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="Mood" />
              )}
              {selectedFactors.includes('stress') && (
                <Line type="monotone" dataKey="avgStress" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Stress" />
              )}
              {selectedFactors.includes('energy') && (
                <Line type="monotone" dataKey="avgEnergy" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Energy" />
              )}
              {selectedFactors.includes('anxiety') && (
                <Line type="monotone" dataKey="avgAnxiety" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Anxiety" />
              )}
            </RechartsLineChart>
          </ResponsiveContainer>
        );
    }
  };

  // Export data for healthcare providers
  const handleExport = () => {
    const _exportData = {
      dateRange,
      entries: filteredEntries,
      patterns: moodPatterns,
      correlations,
      triggers: triggerAnalysis,
      summary: {
        avgMood: filteredEntries.reduce((sum, e) => sum + e.moodScore, 0) / filteredEntries.length,
        totalEntries: filteredEntries.length,
        insights: wellnessInsights.filter(i => i.category === 'mood')
      }
    };

    if (_onExport) {
      onExport(_exportData);
    } else {
      // Create CSV or PDF export
      const csv = convertToCSV(_exportData);
      downloadCSV(csv, `mood-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    }
  };

  const convertToCSV = (_data: unknown) => {
    const headers = ['Date', 'Mood', 'Stress', 'Energy', 'Anxiety', 'Sleep', 'Exercise', 'Social', 'Triggers', 'Notes'];
    const rows = filteredEntries.map(entry => [
      format(new Date(entry.timestamp), 'yyyy-MM-dd HH:mm'),
      entry.moodScore,
      entry.stressLevel || '',
      entry.energyLevel || '',
      entry.anxietyLevel || '',
      entry.sleep || '',
      entry.exercise ? 'Yes' : 'No',
      entry.socialInteraction || '',
      entry.triggers.join('; '),
      entry.notes || ''
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const _blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(_blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(_url);
  };

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-_colors ${
              viewMode === 'overview' 
                ? 'bg-purple-100 text-purple-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode('patterns')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-_colors ${
              viewMode === 'patterns' 
                ? 'bg-purple-100 text-purple-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Patterns
          </button>
          <button
            onClick={() => setViewMode('correlations')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-_colors ${
              viewMode === 'correlations' 
                ? 'bg-purple-100 text-purple-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Correlations
          </button>
          <button
            onClick={() => setViewMode('predictions')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-_colors ${
              viewMode === 'predictions' 
                ? 'bg-purple-100 text-purple-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Predictions
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Chart type selector */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setChartType('line')}
              className={`p-1 rounded ${chartType === 'line' ? 'bg-white shadow-sm' : ''}`}
              aria-label="Line chart"
            >
              <LineChart className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`p-1 rounded ${chartType === 'area' ? 'bg-white shadow-sm' : ''}`}
              aria-label="Area chart"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-1 rounded ${chartType === 'bar' ? 'bg-white shadow-sm' : ''}`}
              aria-label="Bar chart"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType('radar')}
              className={`p-1 rounded ${chartType === 'radar' ? 'bg-white shadow-sm' : ''}`}
              aria-label="Radar chart"
            >
              <PieChart className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle filters"
          >
            <Filter className="h-4 w-4" />
          </button>

          <button
            onClick={handleExport}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Export data"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div>
                <label htmlFor="input_j8q7wvae1" className="text-sm font-medium text-gray-700 mb-2 block">Factors to Display</label>
                <div className="flex flex-wrap gap-2">
                  {['mood', 'stress', 'energy', 'anxiety', 'sleep', 'social'].map(factor => (
                    <button
                      key={factor}
                      onClick={() => {
                        setSelectedFactors(prev => 
                          prev.includes(factor) 
                            ? prev.filter(f => f !== factor)
                            : [...prev, factor]
                        );
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-_colors ${
                        selectedFactors.includes(factor)
                          ? 'bg-purple-500 text-white'
                          : 'bg-white text-gray-700 border border-gray-300'
                      }`}
                    >
                      {factor.charAt(0).toUpperCase() + factor.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content based on view mode */}
      <div className="bg-white rounded-lg p-4">
        {viewMode === 'overview' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Mood Trends</h3>
            {renderChart()}
            
            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-purple-600 mb-1">Avg Mood</p>
                <p className="text-xl font-bold text-purple-700">
                  {(filteredEntries.reduce((sum, e) => sum + e.moodScore, 0) / filteredEntries.length || 0).toFixed(1)}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 mb-1">Entries</p>
                <p className="text-xl font-bold text-blue-700">{filteredEntries.length}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600 mb-1">Best Day</p>
                <p className="text-xl font-bold text-green-700">
                  {chartData.length > 0 ? Math.max(...chartData.map(d => d.avgMood)).toFixed(1) : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-600 mb-1">Worst Day</p>
                <p className="text-xl font-bold text-red-700">
                  {chartData.length > 0 ? Math.min(...chartData.map(d => d.avgMood)).toFixed(1) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'patterns' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Mood Patterns</h3>
            
            {moodPatterns.length > 0 ? (
              <div className="space-y-3">
                {moodPatterns.map((pattern, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`p-4 rounded-lg border ${
                      pattern.impact === 'positive' 
                        ? 'bg-green-50 border-green-200' 
                        : pattern.impact === 'negative'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 flex items-center">
                          {pattern.impact === 'positive' ? (
                            <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                          ) : pattern.impact === 'negative' ? (
                            <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                          ) : (
                            <Activity className="h-4 w-4 text-gray-500 mr-2" />
                          )}
                          {pattern.pattern}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{pattern.recommendation}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-gray-500">
                            Frequency: {pattern.frequency} occurrences
                          </span>
                          <span className="text-xs text-gray-500">
                            Confidence: {(pattern.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <Brain className="h-5 w-5 text-gray-400" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Not enough data to detect patterns yet.</p>
                <p className="text-sm mt-1">Keep tracking your mood to see patterns emerge!</p>
              </div>
            )}
          </div>
        )}

        {viewMode === 'correlations' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Mood Correlations</h3>
            
            {correlations.length > 0 ? (
              <div className="space-y-3">
                {correlations.map((correlation, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {correlation.factor === 'Sleep' && <Moon className="h-5 w-5 text-indigo-500" />}
                        {correlation.factor === 'Exercise' && <Activity className="h-5 w-5 text-green-500" />}
                        {correlation.factor === 'Social Interaction' && <Users className="h-5 w-5 text-blue-500" />}
                        {correlation.factor === 'Weather' && <Cloud className="h-5 w-5 text-yellow-500" />}
                        <span className="font-medium text-gray-800">{correlation.factor}</span>
                      </div>
                      <span className={`text-lg font-bold ${
                        correlation.positive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {correlation.positive ? '+' : ''}{correlation.impact}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>With: {correlation.avgWith}</span>
                      <span>Without: {correlation.avgWithout}</span>
                      <span className="text-xs text-gray-400">n={correlation.samples}</span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${
                          correlation.positive ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.abs(correlation.impact)}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.1 + 0.2 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Heart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Not enough data to show correlations yet.</p>
              </div>
            )}

            {/* Trigger Analysis */}
            {triggerAnalysis.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Common Triggers</h4>
                <div className="space-y-2">
                  {triggerAnalysis.map((trigger, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                      <span className="text-sm font-medium text-yellow-800">{trigger.name}</span>
                      <span className="text-xs text-yellow-600">{trigger.frequency} occurrences</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === 'predictions' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Mood Predictions</h3>
            
            {predictions.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Based on your patterns, here&apos;s what we expect:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {predictions.map((prediction, idx) => (
                    <div key={idx} className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{prediction.date}</span>
                        <span className={`text-lg font-bold ${
                          prediction.predictedMood >= 7 ? 'text-green-600' : 
                          prediction.predictedMood >= 4 ? 'text-yellow-600' : 
                          'text-red-600'
                        }`}>
                          {prediction.predictedMood.toFixed(1)}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        Confidence: {(prediction.confidence * 100).toFixed(0)}%
                      </div>
                      {prediction.factors && (
                        <div className="mt-2 text-xs text-gray-500">
                          Key factors: {prediction.factors.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Not enough data to make predictions yet.</p>
                <p className="text-sm mt-2">Keep tracking your mood to unlock insights!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
