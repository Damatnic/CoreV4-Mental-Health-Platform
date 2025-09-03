import { useState, _useEffect, useMemo } from 'react';
import { motion, _AnimatePresence } from 'framer-motion';
import {
  Brain,
  Wind,
  Heart,
  _Play,
  _Pause,
  Clock,
  _Calendar,
  Flame,
  TrendingUp,
  _Award,
  _Volume2,
  Headphones,
  Sun,
  Moon,
  _Cloud,
  _Zap,
  Target,
  ChevronRight,
  _BarChart,
  _PieChart
} from 'lucide-react';
import { format, _startOfWeek, _endOfWeek, _eachDayOfInterval, isToday } from 'date-fns';
import {
  _LineChart,
  _Line,
  _BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  _PieChart as _RechartsPieChart,
  _Pie
} from 'recharts';

interface MeditationSession {
  id: string;
  timestamp: Date;
  duration: number; // in minutes
  type: 'guided' | 'unguided' | 'breathing' | 'body-scan' | 'loving-kindness' | 'mindfulness';
  moodBefore?: number;
  moodAfter?: number;
  notes?: string;
  technique?: string;
  environment?: 'quiet' | 'nature' | 'music' | 'guided-audio';
}

interface MeditationMindfulnessProps {
  sessions?: MeditationSession[];
  currentStreak?: number;
  totalMinutes?: number;
  onStartSession?: (type: string) => void;
  onViewHistory?: () => void;
  onSetGoal?: () => void;
}

export function MeditationMindfulness({
  sessions = [],
  currentStreak = 0,
  totalMinutes = 0,
  onStartSession,
  onViewHistory,
  onSetGoal
}: MeditationMindfulnessProps) {
  const [selectedTimeRange, _setSelectedTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [__showRecommendations, _setShowRecommendations] = useState(true);
  const [__activeSession, _setActiveSession] = useState<string | null>(null);

  // Mock data if no sessions provided
  const mockSessions: MeditationSession[] = [
    {
      id: '1',
      timestamp: new Date(),
      duration: 15,
      type: 'mindfulness',
      moodBefore: 5,
      moodAfter: 7,
      environment: 'quiet'
    },
    {
      id: '2',
      timestamp: new Date(Date._now() - 86400000),
      duration: 10,
      type: 'breathing',
      moodBefore: 6,
      moodAfter: 8,
      environment: 'nature'
    },
    {
      id: '3',
      timestamp: new Date(Date._now() - 172800000),
      duration: 20,
      type: 'guided',
      moodBefore: 4,
      moodAfter: 7,
      environment: 'guided-audio'
    }
  ];

  const meditationSessions = sessions.length > 0 ? sessions : mockSessions;

  // Calculate statistics
  const ___stats   = useMemo(() => {
    const _now = new Date();
    const _weekAgo = new Date(_now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const _monthAgo = new Date(_now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const _yearAgo = new Date(_now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const getSessionsInRange = (start: Date) => 
      meditationSessions.filter(s => new Date(s.timestamp) >= start);

    const _weekSessions = getSessionsInRange(_weekAgo);
    const _monthSessions = getSessionsInRange(_monthAgo);
    const _yearSessions = getSessionsInRange(_yearAgo);

    const calculateStats = (sessions: MeditationSession[]) => ({
      totalSessions: sessions.length,
      totalMinutes: sessions.reduce((sum, s) => sum + s.duration, 0),
      avgDuration: sessions.length > 0 
        ? Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length)
        : 0,
      avgMoodImprovement: sessions.filter(s => s.moodBefore && s.moodAfter).length > 0
        ? sessions
            .filter(s => s.moodBefore && s.moodAfter)
            .reduce((sum, s) => sum + ((s.moodAfter || 0) - (s.moodBefore || 0)), 0) /
          sessions.filter(s => s.moodBefore && s.moodAfter).length
        : 0,
      favoriteType: sessions.length > 0
        ? Object.entries(
            sessions.reduce((acc, s) => {
              acc[s.type] = (acc[s.type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).sort((a, b) => b[1] - a[1])[0]?.[0]
        : null
    });

    return {
      week: calculateStats(_weekSessions),
      month: calculateStats(_monthSessions),
      year: calculateStats(_yearSessions),
      allTime: {
        totalMinutes: totalMinutes || meditationSessions.reduce((sum, s) => sum + s.duration, 0),
        totalSessions: meditationSessions.length,
        currentStreak: currentStreak || calculateCurrentStreak()
      }
    };
  }, [meditationSessions, selectedTimeRange, totalMinutes, currentStreak]);

  // Calculate current streak
  function calculateCurrentStreak(): number {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const date = new Date(_today);
      date.setDate(date.getDate() - i);
      
      const _hasSession = meditationSessions.some(s => {
        const sessionDate = new Date(s.timestamp);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === date.getTime();
      });

      if (_hasSession) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  }

  // Get chart data
  const chartData = useMemo(() => {
    const _now = new Date();
    let days = 7;
    
    switch (_selectedTimeRange) {
      case 'month': days = 30; break;
      case 'year': days = 365; break;
    }

    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(_now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const daySessions = meditationSessions.filter(s => {
        const sessionDate = new Date(s.timestamp);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === date.getTime();
      });

      data.push({
        date: format(date, days > 30 ? 'MMM' : 'MMM dd'),
        minutes: daySessions.reduce((sum, s) => sum + s.duration, 0),
        sessions: daySessions.length,
        avgMood: daySessions.length > 0
          ? daySessions.reduce((sum, s) => sum + (s.moodAfter || 0), 0) / daySessions.length
          : 0
      });
    }

    return data;
  }, [meditationSessions, selectedTimeRange]);

  // Get session type distribution
  const typeDistribution = useMemo(() => {
    const _distribution = meditationSessions.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(_distribution).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
      value: count,
      percentage: Math.round((count / meditationSessions.length) * 100)
    }));
  }, [meditationSessions]);

  // Get recommendations based on patterns
  const recommendations = useMemo(() => {
    const currentStats = stats[selectedTimeRange];
    const recs = [];

    // Time of day recommendation
    const morningSessions = meditationSessions.filter(s => 
      new Date(s.timestamp).getHours() < 12
    );
    const eveningSessions = meditationSessions.filter(s => 
      new Date(s.timestamp).getHours() >= 18
    );

    if (morningSessions.length > eveningSessions.length) {
      recs.push({
        icon: Sun,
        title: 'Morning Meditator',
        description: 'You prefer morning sessions. Keep this routine!',
        color: 'text-yellow-500'
      });
    } else if (eveningSessions.length > morningSessions.length) {
      recs.push({
        icon: Moon,
        title: 'Evening Practice',
        description: 'Evening meditation helps you unwind. Great choice!',
        color: 'text-indigo-500'
      });
    }

    // Mood improvement recommendation
    if (currentStats.avgMoodImprovement > 1.5) {
      recs.push({
        icon: TrendingUp,
        title: 'Mood Booster',
        description: `Average mood improvement: +${currentStats.avgMoodImprovement.toFixed(1)} points`,
        color: 'text-green-500'
      });
    }

    // Consistency recommendation
    if (stats.allTime.currentStreak >= 7) {
      recs.push({
        icon: Flame,
        title: `${stats.allTime.currentStreak} Day Streak!`,
        description: 'Amazing consistency! Keep it going!',
        color: 'text-orange-500'
      });
    } else if (stats.allTime.currentStreak < 3) {
      recs.push({
        icon: Target,
        title: 'Build Consistency',
        description: 'Try to meditate 3 days in a row to start a streak',
        color: 'text-blue-500'
      });
    }

    // Duration recommendation
    if (currentStats.avgDuration < 10) {
      recs.push({
        icon: Clock,
        title: 'Extend Sessions',
        description: 'Try increasing to 10-15 minutes for deeper benefits',
        color: 'text-purple-500'
      });
    }

    return recs.slice(0, 3);
  }, [meditationSessions, _stats, selectedTimeRange]);

  // Quick meditation options
  const quickMeditations = [
    {
      id: 'breathing',
      title: '3-Minute Breathing',
      description: 'Quick stress relief',
      icon: Wind,
      duration: 3,
      color: 'from-blue-400 to-blue-600'
    },
    {
      id: 'mindfulness',
      title: '5-Minute Mindfulness',
      description: 'Present moment awareness',
      icon: Brain,
      duration: 5,
      color: 'from-purple-400 to-purple-600'
    },
    {
      id: 'body-scan',
      title: '10-Minute Body Scan',
      description: 'Full body relaxation',
      icon: Heart,
      duration: 10,
      color: 'from-pink-400 to-pink-600'
    },
    {
      id: 'loving-kindness',
      title: '15-Minute Loving Kindness',
      description: 'Compassion practice',
      icon: Heart,
      duration: 15,
      color: 'from-red-400 to-red-600'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header with streak and stats */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-1">Meditation & Mindfulness</h3>
            <p className="text-indigo-100">Find your inner peace</p>
          </div>
          
          {/* Streak indicator */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Flame className="h-8 w-8 text-orange-400" />
              <span className="text-3xl font-bold ml-2">{stats.allTime.currentStreak}</span>
            </div>
            <p className="text-xs text-indigo-100">Day Streak</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.allTime.totalMinutes}</p>
            <p className="text-xs text-indigo-100">Total Minutes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.allTime.totalSessions}</p>
            <p className="text-xs text-indigo-100">Sessions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {stats[selectedTimeRange].avgMoodImprovement > 0 ? '+' : ''}
              {stats[selectedTimeRange].avgMoodImprovement.toFixed(1)}
            </p>
            <p className="text-xs text-indigo-100">Mood Boost</p>
          </div>
        </div>
      </div>

      {/* Quick start meditations */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">Quick Start</h4>
        <div className="grid grid-cols-2 gap-3">
          {quickMeditations.map(meditation => {
            const Icon = meditation.icon;
            return (
              <motion.button
                key={meditation.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onStartSession?.(meditation.id)}
                className={`relative overflow-hidden rounded-xl p-4 text-white bg-gradient-to-br ${meditation.color} hover:shadow-lg transition-all`}
              >
                <div className="relative z-10">
                  <Icon className="h-6 w-6 mb-2" />
                  <h5 className="font-medium text-sm">{meditation.title}</h5>
                  <p className="text-xs opacity-90 mt-1">{meditation.description}</p>
                  <div className="flex items-center mt-2">
                    <Clock className="h-3 w-3 mr-1" />
                    <span className="text-xs">{meditation.duration} min</span>
                  </div>
                </div>
                {activeSession === meditation.id && (
                  <motion.div
                    className="absolute inset-0 bg-white opacity-20"
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Progress chart */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-800">Progress</h4>
          <div className="flex space-x-1">
            {(['week', 'month', 'year'] as const).map(range => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(_range)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedTimeRange === range
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <RechartsBarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }}
              interval={selectedTimeRange === 'year' ? 30 : 'preserveStartEnd'}
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="minutes" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.minutes > 0 ? '#8b5cf6' : '#e5e7eb'} 
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>

        {/* Summary stats for selected period */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">Sessions</p>
            <p className="text-lg font-bold text-gray-800">
              {stats[selectedTimeRange].totalSessions}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Minutes</p>
            <p className="text-lg font-bold text-gray-800">
              {stats[selectedTimeRange].totalMinutes}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Avg Duration</p>
            <p className="text-lg font-bold text-gray-800">
              {stats[selectedTimeRange].avgDuration}m
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Favorite</p>
            <p className="text-lg font-bold text-gray-800 truncate">
              {stats[selectedTimeRange].favoriteType || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Session type _distribution */}
      {typeDistribution.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Practice Distribution</h4>
          <div className="space-y-2">
            {typeDistribution.map(type => (
              <div key={type.name} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{type.name}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${type.percentage}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-10 text-right">
                    {type.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-800">Insights</h4>
          {recommendations.map((rec, _idx) => {
            const Icon = rec.icon;
            return (
              <motion.div
                key={_idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: _idx * 0.1 }}
                className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200"
              >
                <Icon className={`h-5 w-5 mt-0.5 ${rec.color}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{rec.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{rec.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Recent sessions */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-800">Recent Sessions</h4>
          <button
            onClick={onViewHistory}
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center"
          >
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
        
        {meditationSessions.slice(0, 3).map((session, _idx) => (
          <div
            key={session.id}
            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                {session.type === 'breathing' && <Wind className="h-4 w-4 text-purple-600" />}
                {session.type === 'mindfulness' && <Brain className="h-4 w-4 text-purple-600" />}
                {session.type === 'guided' && <Headphones className="h-4 w-4 text-purple-600" />}
                {session.type === 'body-scan' && <Heart className="h-4 w-4 text-purple-600" />}
                {session.type === 'loving-kindness' && <Heart className="h-4 w-4 text-purple-600" />}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 capitalize">
                  {session.type.replace('-', ' ')}
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(session.timestamp), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{session.duration} min</p>
              {session.moodBefore && session.moodAfter && (
                <p className="text-xs text-green-600">
                  Mood +{session.moodAfter - session.moodBefore}
                </p>
              )}
            </div>
          </div>
        ))}

        {meditationSessions.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Brain className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No sessions yet</p>
            <p className="text-xs mt-1">Start your mindfulness journey today</p>
          </div>
        )}
      </div>

      {/* Goals section */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-800 flex items-center">
            <Target className="h-5 w-5 mr-2 text-orange-500" />
            Meditation Goals
          </h4>
          <button
            onClick={onSetGoal}
            className="text-sm text-orange-600 hover:text-orange-700"
          >
            Set Goal
          </button>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-white rounded-lg">
            <span className="text-sm text-gray-700">Daily Practice</span>
            <span className="text-sm font-medium text-gray-800">
              {isToday(new Date(meditationSessions[0]?.timestamp || 0)) ? '✓ Done' : 'Pending'}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 bg-white rounded-lg">
            <span className="text-sm text-gray-700">Weekly Goal: 70 min</span>
            <span className="text-sm font-medium text-gray-800">
              {stats.week.totalMinutes}/70 min
            </span>
          </div>
          <div className="flex items-center justify-between p-2 bg-white rounded-lg">
            <span className="text-sm text-gray-700">Streak Goal: 30 days</span>
            <span className="text-sm font-medium text-gray-800">
              {stats.allTime.currentStreak}/30 days
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}