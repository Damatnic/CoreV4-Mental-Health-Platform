import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Users, MessageSquare, Calendar, Award, Shield, Heart, TrendingUp, Activity } from 'lucide-react';
import { CommunityPosts } from '../components/community/CommunityPosts';
import { SupportGroups } from '../components/community/SupportGroups';
import { CommunityEvents } from '../components/community/CommunityEvents';
import { websocketService } from '../services/realtime/websocketService';
import { useAnonymousAuth } from '../contexts/AnonymousAuthContext';
import { toast } from 'react-hot-toast';

export function CommunityPage() {
  const { user } = useAnonymousAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('posts');
  const [onlineCount, setOnlineCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (user) {
      // Connect to WebSocket server
      websocketService.connect(user.id, user.token || '').then(() => {
        console.log('Connected to community real-time features');
        // Join community room
        websocketService.joinRoom('community-main');
      }).catch((error) => {
        console.error('Failed to connect to real-time features:', error);
      });

      // Set up event listeners
      const handlePresenceUpdate = () => {
        const onlineUsers = websocketService.getOnlineUsers();
        setOnlineCount(onlineUsers.length);
      };

      const handleNotification = (notification: any) => {
        setNotifications(prev => [notification, ...prev].slice(0, 5));
      };

      websocketService.on('presence:bulk', handlePresenceUpdate);
      websocketService.on('presence:update', handlePresenceUpdate);
      websocketService.on('notification:new', handleNotification);

      // Update presence status
      websocketService.updatePresence('online');

      return () => {
        websocketService.off('presence:bulk', handlePresenceUpdate);
        websocketService.off('presence:update', handlePresenceUpdate);
        websocketService.off('notification:new', handleNotification);
        websocketService.leaveRoom('community-main');
      };
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
          Community Support
        </h1>
        <p className="text-gray-600">
          Connect with others who understand your journey. Share, support, and grow together.
        </p>
      </div>

      {/* Community Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <Icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">Community Safety</h3>
            <p className="text-sm text-blue-700 mt-1">
              Our community is moderated 24/7 for your safety. Crisis support is available anytime.
              Remember: this is peer support, not professional medical advice.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

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
                  onClick={() => websocketService.requestPeerSupport('general', 'medium')}
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
  );
}
// Default export for lazy loading
export default CommunityPage;
