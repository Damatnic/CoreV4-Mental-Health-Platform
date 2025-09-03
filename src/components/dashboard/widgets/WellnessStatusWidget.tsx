import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, _Heart, _Brain, Target, Award } from 'lucide-react';
import { WellnessStatus } from '../../../types/dashboard';
import { useNavigate } from 'react-router-dom';

interface WellnessStatusWidgetProps {
  data?: WellnessStatus;
  error?: string;
}

export function WellnessStatusWidget({ data, error }: WellnessStatusWidgetProps) {
  const __navigate   = useNavigate();

  if (_error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-gray-200 rounded-lg"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const getTrendIcon = () => {
    switch (data.trend) {
      case 'improving':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRiskColor = () => {
    switch (data.riskLevel) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(data.overallScore / 100) * 226} 226`}
                  className="text-primary-600 transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{data.overallScore}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Wellness Score</p>
              <div className="flex items-center mt-1">
                {getTrendIcon()}
                <span className="ml-1 text-sm font-medium text-gray-700 capitalize">
                  {data.trend}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Level */}
        <div className={`px-3 py-1 rounded-full ${getRiskColor()}`}>
          <span className="text-sm font-medium">
            {data.riskLevel.toUpperCase()} RISK
          </span>
        </div>
      </div>

      {/* Last Mood Entry */}
      {data.lastMoodEntry && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Last Mood Check</span>
            <span className="text-xs text-gray-500">
              {new Date(data.lastMoodEntry.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`w-2 h-8 mx-0.5 rounded-full transition-colors ${
                    level <= data.lastMoodEntry!.mood
                      ? 'bg-primary-500'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {data.lastMoodEntry.emotions.slice(0, 3).map((emotion) => (
                <span
                  key={emotion.name}
                  className="px-2 py-1 bg-white rounded-md text-xs text-gray-600"
                >
                  {emotion.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Goals */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Active Goals</span>
          <button
            onClick={() => navigate('/wellness/goals')}
            className="text-xs text-primary-600 hover:text-primary-700"
          >
            View All
          </button>
        </div>
        {data.activeGoals.slice(0, 2).map((goal) => (
          <div key={goal.id} className="bg-white border border-gray-200 rounded-lg p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">{goal.title}</span>
              </div>
              <span className="text-xs font-medium text-primary-600">
                {goal.progress}%
              </span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <motion.div
                className="bg-primary-600 h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${goal.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Streaks */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Streaks</span>
        <div className="flex space-x-3">
          {data.streaks.slice(0, 3).map((streak) => (
            <div key={streak.type} className="flex items-center space-x-1">
              <Award className="h-4 w-4 text-yellow-500" />
              <span className="text-xs font-medium text-gray-600">
                {streak.count} {streak.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Tip:</span> {data.recommendations[0]}
          </p>
        </div>
      )}
    </div>
  );
}