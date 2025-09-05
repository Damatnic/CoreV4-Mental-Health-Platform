import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Users, Stethoscope, AlertTriangle, Clock, Shield, 
  Plus, TrendingUp, Calendar, MessageCircle, Phone, Zap,
  Wind, Timer, BookOpen, Activity, Sparkles, ChevronRight,
  Bell, User, Settings, Search, Menu, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMobileFeatures, useTouchGestures, usePullToRefresh } from '../../hooks/useMobileFeatures';
import { useAuth } from '../../hooks/useAuth';

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  path: string;
  urgent?: boolean;
}

interface StatusCard {
  title: string;
  value: string;
  change?: string;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

export function MobileEnhancedDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deviceInfo, isMobileDevice, canVibrate } = useMobileFeatures();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const quickActions: QuickAction[] = [
    {
      id: 'crisis',
      title: 'Crisis Support',
      subtitle: '24/7 immediate help',
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      path: '/crisis',
      urgent: true
    },
    {
      id: 'mood',
      title: 'Log Mood',
      subtitle: 'Quick check-in',
      icon: Heart,
      color: 'from-pink-500 to-rose-500',
      path: '/wellness/mood-tracker'
    },
    {
      id: 'breathe',
      title: 'Breathing',
      subtitle: '5 min session',
      icon: Wind,
      color: 'from-cyan-500 to-blue-500',
      path: '/wellness/breathing'
    },
    {
      id: 'ai-chat',
      title: 'AI Support',
      subtitle: 'Talk to therapist',
      icon: Sparkles,
      color: 'from-purple-500 to-indigo-500',
      path: '/ai-therapy'
    },
    {
      id: 'journal',
      title: 'Journal',
      subtitle: 'Express thoughts',
      icon: BookOpen,
      color: 'from-green-500 to-emerald-500',
      path: '/wellness/journal'
    },
    {
      id: 'meditation',
      title: 'Meditate',
      subtitle: '10 min guided',
      icon: Timer,
      color: 'from-indigo-500 to-purple-500',
      path: '/wellness/meditation'
    }
  ];

  const statusCards: StatusCard[] = [
    {
      title: 'Mood Score',
      value: '7.2',
      change: '+0.5',
      trend: 'up',
      color: 'text-green-500'
    },
    {
      title: 'Streak',
      value: '12d',
      change: '+1',
      trend: 'up',
      color: 'text-blue-500'
    },
    {
      title: 'Sessions',
      value: '23',
      change: '+3',
      trend: 'up',
      color: 'text-purple-500'
    },
    {
      title: 'Goals',
      value: '4/6',
      change: '66%',
      trend: 'stable',
      color: 'text-orange-500'
    }
  ];

  // Pull to refresh functionality
  const { isPulling, pullProgress } = usePullToRefresh(
    async () => {
      setIsRefreshing(true);
      // Simulate refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsRefreshing(false);
      if (canVibrate) {
        navigator.vibrate(50);
      }
    },
    { disabled: !isMobileDevice }
  );

  const handleQuickAction = (action: QuickAction) => {
    setSelectedAction(action.id);
    
    // Haptic feedback if available
    if (canVibrate) {
      navigator.vibrate(action.urgent ? [100, 50, 100] : 30);
    }
    
    // Navigate with slight delay for visual feedback
    setTimeout(() => {
      navigate(action.path);
    }, 150);
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { greeting: 'Good morning', emoji: '🌅' };
    if (hour < 17) return { greeting: 'Good afternoon', emoji: '☀️' };
    return { greeting: 'Good evening', emoji: '🌙' };
  };

  const { greeting, emoji } = getTimeGreeting();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
      {/* Mobile Header */}
      <motion.header 
        className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Pull to refresh indicator */}
        <AnimatePresence>
          {isPulling && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: Math.min(pullProgress * 40, 40) }}
              exit={{ height: 0 }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center"
            >
              {pullProgress >= 1 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: isRefreshing ? 360 : 0 }}
                  transition={{ duration: isRefreshing ? 1 : 0.3, repeat: isRefreshing ? Infinity : 0 }}
                >
                  <Activity className="w-5 h-5 text-white" />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-4 py-4 safe-area-top">
          <div className="flex items-center justify-between">
            {/* Greeting */}
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                className="text-2xl"
              >
                {emoji}
              </motion.div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  {greeting}, {user?.name || 'friend'}!
                </h1>
                <p className="text-sm text-gray-400">How are you feeling today?</p>
              </div>
            </div>

            {/* Quick Menu Button */}
            <motion.button
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className="p-3 rounded-2xl bg-gray-800/80 border border-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-700/80 transition-all duration-200"
              style={{ minWidth: '48px', minHeight: '48px' }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: showQuickMenu ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {showQuickMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.div>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Quick Menu Overlay */}
      <AnimatePresence>
        {showQuickMenu && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50 bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 shadow-2xl"
          >
            <div className="space-y-2">
              <button className="w-full flex items-center space-x-3 p-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all min-h-[48px]">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all min-h-[48px]">
                <Search className="w-5 h-5" />
                <span>Search</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all min-h-[48px]">
                <User className="w-5 h-5" />
                <span>Profile</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all min-h-[48px]">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="px-4 pb-24 safe-area-x">
        {/* Status Cards */}
        <motion.div
          className="grid grid-cols-2 gap-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {statusCards.map((card, index) => (
            <motion.div
              key={card.title}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-xs font-medium text-gray-400 mb-1">
                {card.title}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">
                  {card.value}
                </span>
                {card.change && (
                  <div className={`text-xs font-medium ${card.color} flex items-center`}>
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {card.change}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Quick Actions</h2>
            <motion.button
              className="text-sm text-blue-400 font-medium"
              whileTap={{ scale: 0.95 }}
            >
              View All
            </motion.button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300 min-h-[120px] ${
                  selectedAction === action.id 
                    ? 'scale-95 opacity-80' 
                    : 'hover:scale-105 active:scale-95'
                } ${
                  action.urgent 
                    ? 'ring-2 ring-red-500/50 animate-pulse' 
                    : ''
                }`}
                style={{ 
                  background: `linear-gradient(135deg, ${action.color.replace('from-', '').replace('to-', ', ')})`,
                  minHeight: '120px',
                  minWidth: '120px'
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  delay: 0.2 + index * 0.1,
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-black/10" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <action.icon className="w-6 h-6 text-white drop-shadow-lg" />
                    {action.urgent && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 bg-white rounded-full"
                      />
                    )}
                  </div>
                  <div className="mt-auto">
                    <h3 className="font-bold text-white text-sm mb-1 drop-shadow-lg">
                      {action.title}
                    </h3>
                    <p className="text-xs text-white/90 drop-shadow-lg">
                      {action.subtitle}
                    </p>
                  </div>
                </div>

                {/* Shine effect on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
                  whileHover={{
                    translateX: '200%',
                    transition: { duration: 0.6 }
                  }}
                />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Recent Activity</h2>
            <motion.button
              className="text-sm text-blue-400 font-medium flex items-center"
              whileTap={{ scale: 0.95 }}
            >
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </motion.button>
          </div>

          <div className="space-y-3">
            {[
              { title: 'Morning mood check-in', time: '2 hours ago', icon: Heart, color: 'text-pink-500' },
              { title: 'Completed breathing exercise', time: '1 day ago', icon: Wind, color: 'text-cyan-500' },
              { title: 'Journal entry: "Feeling grateful"', time: '2 days ago', icon: BookOpen, color: 'text-green-500' }
            ].map((activity, index) => (
              <motion.div
                key={index}
                className="flex items-center space-x-3 p-4 bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
              >
                <div className={`p-2 bg-gray-700/50 rounded-lg ${activity.color}`}>
                  <activity.icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{activity.title}</p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Emergency Contact */}
        <motion.div
          className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-2xl p-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center space-x-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-white">Need Immediate Help?</h3>
          </div>
          <p className="text-sm text-gray-300 mb-4">
            Crisis support is available 24/7. You're not alone.
          </p>
          <div className="flex space-x-3">
            <motion.a
              href="tel:988"
              className="flex-1 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-medium transition-colors min-h-[48px]"
              whileTap={{ scale: 0.95 }}
            >
              <Phone className="w-4 h-4" />
              <span>Call 988</span>
            </motion.a>
            <motion.button
              onClick={() => navigate('/crisis')}
              className="flex-1 flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-medium transition-colors min-h-[48px]"
              whileTap={{ scale: 0.95 }}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat Now</span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Safe area padding */}
      <div className="safe-area-bottom" />

      {/* Background effects for mobile */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-gradient-to-r from-pink-500/5 to-cyan-500/5 rounded-full blur-3xl"
        />
      </div>
    </div>
  );
}

export default MobileEnhancedDashboard;