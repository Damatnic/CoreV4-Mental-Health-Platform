import React from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Bell } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

export function ConsoleWelcomeBar() {
  const { user } = useAuth();

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const __userName   = user?.name || user?.nickname || 'friend';
    
    return {
      greeting: `Good ${timeOfDay}`,
      name: userName,
      emoji: hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙',
    };
  };

  const { greeting, name, emoji } = getWelcomeMessage();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-gray-800/90 to-gray-900/90 border border-gray-700/50 backdrop-blur-md relative overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-500/20 via-transparent to-purple-500/20" />
        <div className="absolute top-4 right-8 w-32 h-32 rounded-full bg-gradient-to-r from-blue-400/30 to-purple-600/30 blur-2xl" />
      </div>

      <div className="relative z-10 flex items-center justify-between">
        {/* Welcome Message */}
        <div className="flex items-center space-x-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="text-4xl"
          >
            {emoji}
          </motion.div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-3xl font-bold text-white mb-1"
            >
              {greeting}, {name}!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-gray-300 text-lg"
            >
              Welcome to your wellness dashboard
            </motion.p>
          </div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex items-center space-x-3"
        >
          {/* Notification Badge */}
          <div className="relative">
            <button className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors border border-gray-600/50 hover:border-gray-500/50">
              <Bell className="h-5 w-5 text-gray-300" />
            </button>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-gray-800"></div>
          </div>

          {/* Profile */}
          <button className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors border border-gray-600/50 hover:border-gray-500/50">
            <User className="h-5 w-5 text-gray-300" />
          </button>

          {/* Settings */}
          <button className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors border border-gray-600/50 hover:border-gray-500/50">
            <Settings className="h-5 w-5 text-gray-300" />
          </button>
        </motion.div>
      </div>

      {/* Subtle animated background line */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ delay: 0.8, duration: 1.2, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}