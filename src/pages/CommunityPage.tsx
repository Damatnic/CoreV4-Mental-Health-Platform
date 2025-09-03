import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, MessageSquare, Calendar, Award, Shield, Heart, TrendingUp, Activity } from 'lucide-react';
import { CommunityPosts } from '../components/community/CommunityPosts';
import { SupportGroups } from '../components/community/SupportGroups';
import { CommunityEvents } from '../components/community/CommunityEvents';
import { useAnonymousAuth } from '../contexts/AnonymousAuthContext';
import { toast } from 'react-hot-toast';

export function CommunityPage() {
  const { user } = useAnonymousAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('posts');
  const [onlineCount, setOnlineCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Initialize community connection (simplified for stability)
  useEffect(() => {
    if (_user) {
      // Set mock online count for now
      setOnlineCount(Math.floor(Math.random() * 50) + 10);
    }
  }, [user]);

  // Determine active tab based on route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/groups')) setActiveTab('groups');
    else if (path.includes('/events')) setActiveTab('events');
    else setActiveTab('posts');
  }, [location]);

  const tabs = [
    { id: 'posts', label: 'Community Posts', icon: MessageSquare, path: '/community' },
    { id: 'groups', label: 'Support Groups', icon: Users, path: '/community/groups' },
    { id: 'events', label: 'Events', icon: Calendar, path: '/community/events' },
  ];

  const stats = [
    { label: 'Online Now', value: onlineCount, icon: Activity, color: 'text-green-600' },
    { label: 'Active Groups', value: 24, icon: Users, color: 'text-blue-600' },
    { label: 'Upcoming Events', value: 8, icon: Calendar, color: 'text-purple-600' },
    { label: 'Peer Supporters', value: 156, icon: Heart, color: 'text-red-600' },
  ];

  return (
    <div className="min-h-screen relative">
      {/* Console Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-500/5 to-green-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8 relative z-10">
        {/* Console Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-gray-800/90 to-gray-900/90 border border-gray-700/50 backdrop-blur-md shadow-console-depth relative overflow-hidden"
        >
          {/* Header background effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
          
          <div className="relative z-10 flex items-center space-x-4">
            <div className="p-4 bg-gradient-to-r from-green-400 to-emerald-600 rounded-console-lg shadow-console-glow">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                💬 Community Support
              </h1>
              <p className="text-gray-300 text-lg">
                Connect with others who understand your journey. Share, support, and grow together.
              </p>
            </div>
          </div>

          {/* Animated border */}
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Console Community Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="group p-6 rounded-console-lg bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 backdrop-blur-md shadow-console-card hover:shadow-console-hover transition-all duration-300 relative overflow-hidden"
              >
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="text-3xl font-bold text-white"
                    >
                      {stat.value}
                    </motion.p>
                  </div>
                  <div className={`p-3 rounded-console bg-gradient-to-r ${stat.color === 'text-green-600' ? 'from-green-500/20 to-emerald-500/20' : stat.color === 'text-blue-600' ? 'from-blue-500/20 to-cyan-500/20' : stat.color === 'text-purple-600' ? 'from-purple-500/20 to-pink-500/20' : 'from-red-500/20 to-rose-500/20'} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-6 w-6 ${stat.color === 'text-green-600' ? 'text-green-400' : stat.color === 'text-blue-600' ? 'text-blue-400' : stat.color === 'text-purple-600' ? 'text-purple-400' : 'text-red-400'}`} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Console Safety Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-console-lg p-6 mb-8 backdrop-blur-md relative overflow-hidden"
        >
          {/* Safety notice glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
          
          <div className="relative z-10 flex items-start space-x-4">
            <div className="p-2 bg-blue-500/20 rounded-console flex-shrink-0">
              <Shield className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">Community Safety</h3>
              <p className="text-gray-300">
                Our community is moderated 24/7 for your safety. Crisis support is available anytime.
                Remember: this is peer support, not professional medical advice.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Console Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="border-b border-gray-700/30 mb-8"
        >
          <nav className="flex space-x-2">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <Link
                    to={tab.path}
                    className={`group flex items-center space-x-3 py-4 px-6 rounded-console-lg transition-all duration-300 relative overflow-hidden ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-400/30 shadow-console-glow'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/30 border border-transparent hover:border-gray-600/50'
                    }`}
                  >
                    {/* Tab background effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className={`p-2 rounded-console transition-all duration-300 ${
                      activeTab === tab.id 
                        ? 'bg-blue-500/20' 
                        : 'bg-gray-700/50 group-hover:bg-gray-600/50'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium relative z-10">{tab.label}</span>
                    
                    {/* Active indicator */}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-t-full"
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>
        </motion.div>

        {/* Recent Notifications */}
        {notifications.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-yellow-900 mb-2">Recent Activity</h3>
            <div className="space-y-1">
              {notifications.slice(0, 3).map((notif, index) => (
                <p key={index} className="text-xs text-yellow-700">
                  {notif.content}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Routes>
              <Route path="/" element={<CommunityPosts />} />
              <Route path="/groups" element={<SupportGroups />} />
              <Route path="/events" element={<CommunityEvents />} />
            </Routes>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
          {/* Community Guidelines */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Community Guidelines</h2>
            </div>
            <div className="card-content">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Be respectful and supportive</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Maintain confidentiality</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>No medical advice</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Report concerning content</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Practice active listening</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Achievement Progress */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <span>Your Impact</span>
              </h2>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Supportive Member</span>
                    <span className="font-medium">Level 3</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-lg font-bold text-gray-900">42</p>
                    <p className="text-xs text-gray-600">Posts Shared</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-lg font-bold text-gray-900">128</p>
                    <p className="text-xs text-gray-600">Helpful Votes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Quick Actions</h2>
            </div>
            <div className="card-content">
              <div className="space-y-2">
                <button 
                  onClick={() => toast.success('Peer support request sent! A community member will reach out soon.')}
                  className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  Request Peer Support
                </button>
                <button className="w-full px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium">
                  Join Live Meditation
                </button>
                <Link 
                  to="/crisis"
                  className="block w-full px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium text-center"
                >
                  Crisis Support
                </Link>
              </div>
            </div>
          </div>

          {/* Trending Topics */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span>Trending Topics</span>
              </h2>
            </div>
            <div className="card-content">
              <div className="flex flex-wrap gap-2">
                {['anxiety', 'self-care', 'mindfulness', 'recovery', 'gratitude', 'boundaries'].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// Default export for lazy loading
export default CommunityPage;
