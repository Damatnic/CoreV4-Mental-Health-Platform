import React, { useState, _useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  _Calendar, 
  _TrendingUp, 
  Heart, 
  _Target, 
  Award, 
  Flame, 
  _Star, 
  _Clock,
  Activity,
  _Zap,
  _Shield,
  Sunrise,
  Brain,
  Smile
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

interface MentalHealthStat {
  id: string;
  label: string;
  value: number;
  maxValue: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
  trend: 'up' | 'down' | 'stable';
  description: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export function ConsoleUserStats() {
  const { user } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(7);
  const [totalSessions, setTotalSessions] = useState(42);
  const [wellnessLevel, setWellnessLevel] = useState(15);
  
  // Mock user stats (in real app, this would come from user data)
  const mentalHealthStats: MentalHealthStat[] = [
    {
      id: 'mood-average',
      label: 'Mood Average',
      value: 7.2,
      maxValue: 10,
      unit: '/10',
      icon: <Smile className="h-5 w-5" />,
      color: 'from-green-400 to-emerald-500',
      trend: 'up',
      description: '7-day rolling average'
    },
    {
      id: 'mindfulness-minutes',
      label: 'Mindfulness',
      value: 485,
      maxValue: 600,
      unit: ' min',
      icon: <Brain className="h-5 w-5" />,
      color: 'from-purple-400 to-indigo-500',
      trend: 'up',
      description: 'This week'
    },
    {
      id: 'sleep-quality',
      label: 'Sleep Quality',
      value: 8.4,
      maxValue: 10,
      unit: '/10',
      icon: <Sunrise className="h-5 w-5" />,
      color: 'from-blue-400 to-cyan-500',
      trend: 'stable',
      description: 'Average rating'
    },
    {
      id: 'stress-level',
      label: 'Stress Level',
      value: 3.2,
      maxValue: 10,
      unit: '/10',
      icon: <Activity className="h-5 w-5" />,
      color: 'from-yellow-400 to-orange-500',
      trend: 'down',
      description: 'Lower is better'
    }
  ];

  const achievements: Achievement[] = [
    {
      id: 'week-warrior',
      title: 'Week Warrior',
      description: 'Complete wellness activities for 7 days straight',
      icon: <Flame className="h-6 w-6" />,
      unlocked: true,
      progress: 7,
      maxProgress: 7,
      rarity: 'rare'
    },
    {
      id: 'mindful-master',
      title: 'Mindful Master',
      description: 'Complete 30 meditation sessions',
      icon: <Brain className="h-6 w-6" />,
      unlocked: true,
      progress: 30,
      maxProgress: 30,
      rarity: 'epic'
    },
    {
      id: 'mood-tracker',
      title: 'Mood Tracker',
      description: 'Log your mood 100 times',
      icon: <Heart className="h-6 w-6" />,
      unlocked: false,
      progress: 67,
      maxProgress: 100,
      rarity: 'common'
    },
    {
      id: 'wellness-champion',
      title: 'Wellness Champion',
      description: 'Reach wellness level 25',
      icon: <Award className="h-6 w-6" />,
      unlocked: false,
      progress: 15,
      maxProgress: 25,
      rarity: 'legendary'
    }
  ];

  const rarityColors = {
    common: 'from-gray-400 to-gray-500',
    rare: 'from-blue-400 to-blue-500',
    epic: 'from-purple-400 to-purple-500',
    legendary: 'from-yellow-400 to-yellow-500'
  };

  return (
    <div className="space-y-8">
      {/* User Level & Experience */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 backdrop-blur-md shadow-console-depth relative overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-console-lg flex items-center justify-center shadow-console-glow">
                <span className="text-2xl font-bold text-white">{wellnessLevel}</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  Welcome back, {user?.name || user?.nickname || 'friend'}!
                </h3>
                <p className="text-gray-300">Wellness Level {wellnessLevel} • Mind Guardian</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Current Streak</p>
              <div className="flex items-center space-x-2">
                <Flame className="h-5 w-5 text-orange-400" />
                <span className="text-2xl font-bold text-orange-400">{currentStreak}</span>
                <span className="text-gray-400">days</span>
              </div>
            </div>
          </div>

          {/* Experience Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Progress to Level {wellnessLevel + 1}</span>
              <span>2,450 / 3,000 XP</span>
            </div>
            <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '81.7%' }}
                transition={{ duration: 2, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full relative"
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </motion.div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-700/30 rounded-console">
              <p className="text-2xl font-bold text-white">{totalSessions}</p>
              <p className="text-xs text-gray-400">Total Sessions</p>
            </div>
            <div className="text-center p-3 bg-gray-700/30 rounded-console">
              <p className="text-2xl font-bold text-green-400">96%</p>
              <p className="text-xs text-gray-400">Wellness Score</p>
            </div>
            <div className="text-center p-3 bg-gray-700/30 rounded-console">
              <p className="text-2xl font-bold text-purple-400">12h</p>
              <p className="text-xs text-gray-400">This Week</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mental Health Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {mentalHealthStats.map((stat, index) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="p-6 rounded-console-lg bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 backdrop-blur-md shadow-console-card hover:shadow-console-hover transition-all duration-300 relative overflow-hidden group"
          >
            {/* Background glow */}
            <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-console bg-gradient-to-r ${stat.color} bg-opacity-20 group-hover:scale-110 transition-transform duration-300`}>
                  <div className="text-white">
                    {stat.icon}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  stat.trend === 'up' ? 'bg-green-500/20 text-green-400' :
                  stat.trend === 'down' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {stat.trend === 'up' && '↗'}{stat.trend === 'down' && '↘'}{stat.trend === 'stable' && '→'}
                </div>
              </div>
              
              <h4 className="text-lg font-semibold text-white mb-1">{stat.label}</h4>
              <p className="text-3xl font-bold text-white mb-2">
                {stat.value}{stat.unit}
              </p>
              <p className="text-xs text-gray-400">{stat.description}</p>

              {/* Progress bar for stats with max values */}
              {stat.maxValue && (
                <div className="mt-3">
                  <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: `${(stat.value / stat.maxValue) * 100}%` }}
                      transition={{ duration: 1.5, delay: 0.5 + index * 0.1 }}
                      className={`h-full bg-gradient-to-r ${stat.color} rounded-full`}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 backdrop-blur-md shadow-console-depth"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-console-lg shadow-console-glow">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Achievements</h3>
            <p className="text-gray-400">Your wellness milestones</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className={`p-4 rounded-console-lg border transition-all duration-300 ${
                achievement.unlocked
                  ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-400/30 shadow-yellow-500/20'
                  : 'bg-gray-700/30 border-gray-600/50'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-console ${
                  achievement.unlocked 
                    ? `bg-gradient-to-r ${rarityColors[achievement.rarity]}` 
                    : 'bg-gray-600/50'
                } ${achievement.unlocked ? 'shadow-console-glow' : ''}`}>
                  <div className="text-white">
                    {achievement.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-semibold ${achievement.unlocked ? 'text-white' : 'text-gray-400'}`}>
                      {achievement.title}
                    </h4>
                    {achievement.unlocked && (
                      <div className={`px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${rarityColors[achievement.rarity]}`}>
                        {achievement.rarity.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{achievement.description}</p>
                  
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Progress</span>
                      <span>{achievement.progress}/{achievement.maxProgress}</span>
                    </div>
                    <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                        transition={{ duration: 1.5, delay: 0.8 + index * 0.1 }}
                        className={`h-full rounded-full ${
                          achievement.unlocked 
                            ? `bg-gradient-to-r ${rarityColors[achievement.rarity]}` 
                            : 'bg-gray-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}