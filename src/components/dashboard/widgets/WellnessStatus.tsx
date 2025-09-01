import { TrendingUp, TrendingDown, Minus, Target, Flame, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { WellnessStatus as WellnessStatusType } from '../../../types/dashboard';

interface WellnessStatusProps {
  data?: WellnessStatusType;
  onViewDetails?: () => void;
  onUpdateMood?: () => void;
}

export function WellnessStatus({ data, onViewDetails, onUpdateMood }: WellnessStatusProps) {
  // Default data if not provided
  const defaultData: WellnessStatusType = {
    overallScore: 75,
    trend: 'stable',
    activeGoals: [],
    streaks: [],
    riskLevel: 'low',
    recommendations: [
      'Try a 5-minute breathing exercise today',
      'Consider journaling about your feelings',
      'Connect with a friend or loved one',
    ],
  };

  const statusData = data || defaultData;

  // Score color based on value
  const getScoreColor = () => {
    if (statusData.overallScore >= 80) return 'text-green-600';
    if (statusData.overallScore >= 60) return 'text-blue-600';
    if (statusData.overallScore >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Score background gradient
  const getScoreGradient = () => {
    if (statusData.overallScore >= 80) return 'from-green-400 to-green-600';
    if (statusData.overallScore >= 60) return 'from-blue-400 to-blue-600';
    if (statusData.overallScore >= 40) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  // Trend icon component
  const TrendIcon = () => {
    switch (statusData.trend) {
      case 'improving':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTrendText = () => {
    switch (statusData.trend) {
      case 'improving':
        return 'Improving';
      case 'declining':
        return 'Needs Attention';
      default:
        return 'Stable';
    }
  };

  // Mood emoji based on last entry
  const getMoodEmoji = (mood?: number) => {
    if (!mood) return '😐';
    if (mood >= 4) return '😊';
    if (mood >= 3) return '🙂';
    if (mood >= 2) return '😐';
    return '😔';
  };

  return (
    <div className="space-y-4">
      {/* Overall Wellness Score */}
      <div className="text-center">
        <div className="relative inline-flex items-center justify-center">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              stroke="url(#scoreGradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${(statusData.overallScore / 100) * 352} 352`}
              initial={{ strokeDasharray: "0 352" }}
              animate={{ strokeDasharray: `${(statusData.overallScore / 100) * 352} 352` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className={`${getScoreGradient().split(' ')[0]?.replace('from-', 'text-') || 'text-blue-500'}`} />
                <stop offset="100%" className={`${getScoreGradient().split(' ')[1]?.replace('to-', 'text-') || 'text-blue-600'}`} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${getScoreColor()}`}>
              {statusData.overallScore}
            </span>
            <span className="text-xs text-gray-500">Wellness Score</span>
          </div>
        </div>
        
        <div className="mt-2 flex items-center justify-center space-x-2">
          <TrendIcon />
          <span className="text-sm font-medium text-gray-700">{getTrendText()}</span>
        </div>
      </div>

      {/* Last Mood Entry */}
      {statusData.lastMoodEntry && (
        <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getMoodEmoji(statusData.lastMoodEntry.mood)}</span>
              <div>
                <p className="text-sm font-medium text-gray-700">Last Mood Check</p>
                <p className="text-xs text-gray-500">
                  {new Date(statusData.lastMoodEntry.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <button
              onClick={onUpdateMood}
              className="px-3 py-1 text-sm bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      )}

      {/* Active Streaks */}
      {statusData.streaks && statusData.streaks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Active Streaks</h4>
          <div className="grid grid-cols-2 gap-2">
            {statusData.streaks.slice(0, 4).map((streak, idx) => (
              <div key={idx} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <Flame className="h-4 w-4 text-orange-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {streak.type.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {streak.count} {streak.unit}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Goals Progress */}
      {statusData.activeGoals && statusData.activeGoals.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Active Goals</h4>
          <div className="space-y-2">
            {statusData.activeGoals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-900 truncate flex-1">{goal.title}</p>
                  <span className="text-xs text-gray-500 ml-2">{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {statusData.recommendations && statusData.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Today's Recommendations</h4>
          <div className="space-y-1">
            {statusData.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start space-x-2 p-2 bg-blue-50 rounded-lg">
                <Activity className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Details Button */}
      <button
        onClick={onViewDetails}
        className="w-full py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-colors"
      >
        View Detailed Analytics
      </button>
    </div>
  );
}