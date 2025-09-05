import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, User, Bell, X, Check, Volume2, VolumeX, Moon, Sun, Shield, LogOut, HelpCircle, UserCircle } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function ConsoleWelcomeBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Wellness Check-in', message: 'Time for your daily mood check-in', time: '5m ago', unread: true },
    { id: 2, title: 'Group Session Starting', message: 'Anxiety Support Group starts in 30 minutes', time: '25m ago', unread: true },
    { id: 3, title: 'Achievement Unlocked', message: 'You completed a 7-day meditation streak!', time: '1h ago', unread: false },
  ]);

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const userName = user?.name || user?.nickname || 'friend';
    
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
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
                setShowSettingsMenu(false);
              }}
              className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors border border-gray-600/50 hover:border-gray-500/50"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-gray-300" />
            </button>
            {notifications.filter(n => n.unread).length > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-gray-800 animate-pulse"></div>
            )}
          </div>

          {/* Profile */}
          <button 
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
              setShowSettingsMenu(false);
            }}
            className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors border border-gray-600/50 hover:border-gray-500/50"
            aria-label="Profile Menu"
          >
            <User className="h-5 w-5 text-gray-300" />
          </button>

          {/* Settings */}
          <button 
            onClick={() => {
              setShowSettingsMenu(!showSettingsMenu);
              setShowNotifications(false);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors border border-gray-600/50 hover:border-gray-500/50"
            aria-label="Settings"
          >
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

      {/* Notification Dropdown */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-80 bg-gray-800/95 border border-gray-700/50 rounded-xl shadow-2xl backdrop-blur-lg z-50"
          >
            <div className="p-4 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Notifications</h3>
                <button
                  onClick={() => setNotifications(notifications.map(n => ({ ...n, unread: false })))}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Mark all read
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-700/30 hover:bg-gray-700/30 transition-colors cursor-pointer ${
                    notification.unread ? 'bg-blue-500/5' : ''
                  }`}
                  onClick={() => {
                    setNotifications(notifications.map(n => 
                      n.id === notification.id ? { ...n, unread: false } : n
                    ));
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 mt-2 rounded-full ${
                      notification.unread ? 'bg-blue-400' : 'bg-transparent'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{notification.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-700/50">
              <button
                onClick={() => navigate('/notifications')}
                className="w-full text-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                View all notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Menu Dropdown */}
      <AnimatePresence>
        {showProfileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-12 mt-2 w-64 bg-gray-800/95 border border-gray-700/50 rounded-xl shadow-2xl backdrop-blur-lg z-50"
          >
            <div className="p-4 border-b border-gray-700/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                  <UserCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-400">{user?.email || 'user@example.com'}</p>
                </div>
              </div>
            </div>
            <div className="py-2">
              <button
                onClick={() => {
                  navigate('/profile');
                  setShowProfileMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors flex items-center space-x-3"
              >
                <UserCircle className="h-4 w-4" />
                <span>My Profile</span>
              </button>
              <button
                onClick={() => {
                  navigate('/wellness/journal');
                  setShowProfileMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors flex items-center space-x-3"
              >
                <Shield className="h-4 w-4" />
                <span>Privacy Settings</span>
              </button>
              <button
                onClick={() => {
                  navigate('/help');
                  setShowProfileMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors flex items-center space-x-3"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Help & Support</span>
              </button>
              <div className="border-t border-gray-700/50 mt-2 pt-2">
                <button
                  onClick={() => {
                    logout?.();
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center space-x-3"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Menu Dropdown */}
      <AnimatePresence>
        {showSettingsMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-64 bg-gray-800/95 border border-gray-700/50 rounded-xl shadow-2xl backdrop-blur-lg z-50"
          >
            <div className="p-4 border-b border-gray-700/50">
              <h3 className="text-lg font-semibold text-white">Quick Settings</h3>
            </div>
            <div className="py-2">
              <button
                onClick={() => {
                  // Toggle dark mode (implement actual functionality)
                  setShowSettingsMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Moon className="h-4 w-4" />
                  <span>Dark Mode</span>
                </div>
                <div className="w-8 h-5 bg-blue-500 rounded-full relative">
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform translate-x-3" />
                </div>
              </button>
              <button
                onClick={() => {
                  // Toggle notifications (implement actual functionality)
                  setShowSettingsMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Bell className="h-4 w-4" />
                  <span>Notifications</span>
                </div>
                <div className="w-8 h-5 bg-blue-500 rounded-full relative">
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform translate-x-3" />
                </div>
              </button>
              <button
                onClick={() => {
                  // Toggle sound (implement actual functionality)
                  setShowSettingsMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Volume2 className="h-4 w-4" />
                  <span>Sound Effects</span>
                </div>
                <div className="w-8 h-5 bg-gray-500 rounded-full relative">
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform" />
                </div>
              </button>
              <div className="border-t border-gray-700/50 mt-2 pt-2">
                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowSettingsMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-colors flex items-center space-x-3"
                >
                  <Settings className="h-4 w-4" />
                  <span>All Settings</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}