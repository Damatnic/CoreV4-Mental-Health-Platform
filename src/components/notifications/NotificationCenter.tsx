import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Settings,
  Clock,
  _CheckCircle,
  AlertCircle,
  Info,
  X,
  Calendar,
  Zap,
  Heart,
  MessageCircle,
  _Phone,
  Plus,
  _Filter,
  Search,
  MoreHorizontal
} from 'lucide-react';
import {
  comprehensiveNotificationService,
  NotificationPreferences,
  NotificationRule,
  SmartNotification
} from '../../services/notifications/ComprehensiveNotificationService';
import { logger } from '../../utils/logger';

interface NotificationCenterProps {
  className?: string;
}

interface InAppNotification extends SmartNotification {
  show: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className = ''
}) => {
  const [preferences, _setPreferences] = useState<NotificationPreferences | null>(null);
  const [rules, _setRules] = useState<NotificationRule[]>([]);
  const [notifications, _setNotifications] = useState<SmartNotification[]>([]);
  const [____isLoading, _setIsLoading] = useState(true);
  const [activeTab, _setActiveTab] = useState<'notifications' | 'rules' | 'settings'>('notifications');
  const [filterPriority, _setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [searchQuery, _setSearchQuery] = useState('');
  const [___inAppNotifications, _setInAppNotifications] = useState<InAppNotification[]>([]);

  useEffect(() => {
    initializeNotificationCenter();
    setupInAppNotificationListener();
  }, []);

  const initializeNotificationCenter = async () => {
    try {
      setIsLoading(true);
      
      // Load preferences, rules, and notification history
      const _userPreferences = comprehensiveNotificationService.getPreferences();
      const _allRules = comprehensiveNotificationService.getAllRules();
      const _notificationHistory = comprehensiveNotificationService.getNotificationHistory();
      
      setPreferences(_userPreferences);
      setRules(_allRules);
      setNotifications(_notificationHistory);
      
    } catch {
      logger.error('Failed to initialize notification center:');
    } finally {
      setIsLoading(false);
    }
  };

  const setupInAppNotificationListener = () => {
    const handleInAppNotification = (event: CustomEvent) => {
      const notification = event.detail;
      setInAppNotifications(prev => [...prev, {
        ...notification,
        timestamp: Date.now(),
        show: true
      }]);
      
      // Auto-hide after 8 seconds for non-critical notifications
      if (notification.priority !== 'critical') {
        setTimeout(() => {
          setInAppNotifications(prev => 
            prev.map(n => n.id === notification.id ? { ...n, show: false } : n)
          );
        }, 8000);
      }
    };

    window.addEventListener('inAppNotification', handleInAppNotification as EventListener);
    
    return () => {
      window.removeEventListener('inAppNotification', handleInAppNotification as EventListener);
    };
  };

  const updatePreferences = async (_updates: Partial<NotificationPreferences>) => {
    try {
      await comprehensiveNotificationService.updatePreferences(_updates);
      const _updatedPreferences = comprehensiveNotificationService.getPreferences();
      setPreferences(_updatedPreferences);
    } catch {
      logger.error('Failed to update preferences:');
    }
  };

  const toggleRule = async (ruleId: string) => {
    try {
      const rule = rules.find(r => r.id === ruleId);
      if (rule) {
        rule.isActive = !rule.isActive;
        setRules(prev => prev.map(r => r.id === ruleId ? rule : r));
        
        // In a real implementation, this would update the rule in the service
        // For now, we&apos;ll just update the local state
      }
    } catch {
      logger.error('Failed to toggle rule:');
    }
  };

  const dismissInAppNotification = (notificationId: string) => {
    setInAppNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, show: false } : n)
    );
  };

  const handleNotificationAction = async (notificationId: string, actionId: string) => {
    try {
      await comprehensiveNotificationService.handleNotificationClick(notificationId, actionId);
      dismissInAppNotification(_notificationId);
    } catch {
      logger.error('Failed to handle notification action:');
    }
  };

  const getNotificationIcon = (_type: NotificationRule['type']) => {
    switch (_type) {
      case 'wellness_reminder': return Heart;
      case 'medication_reminder': return Clock;
      case 'mood_check': return MessageCircle;
      case 'crisis_followup': return AlertCircle;
      case 'appointment_reminder': return Calendar;
      case 'self_care_prompt': return Zap;
      default: return Info;
    }
  };

  const getPriorityColor = (_priority: string) => {
    switch (_priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesPriority = filterPriority === 'all' || notification._priority === filterPriority;
    const matchesSearch = searchQuery === '' || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.body.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesPriority && matchesSearch;
  });

  if (_isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading notification center...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* In-App Notifications Overlay */}
      <AnimatePresence>
        {inAppNotifications.filter(n => n.show).map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -100, x: '50%' }}
            animate={{ opacity: 1, y: 20, x: '50%' }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
          >
            <div className={`rounded-lg shadow-lg p-4 border ${getPriorityColor(notification._priority)} bg-white`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{notification.body}</p>
                  
                  {notification.actions && notification.actions.length > 0 && (
                    <div className="flex space-x-2 mt-3">
                      {notification.actions.slice(0, 2).map((action: unknown) => (
                        <button
                          key={action.id}
                          onClick={() => handleNotificationAction(notification.id, action.id)}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium hover:bg-purple-200 transition-colors"
                        >
                          {action.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => dismissInAppNotification(notification.id)}
                  className="text-gray-400 hover:text-gray-600 ml-4"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Main Notification Center */}
      <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold">Notification Center</h2>
                <p className="text-purple-100 text-sm">
                  Manage your mental health reminders and alerts
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {preferences?.globalEnabled ? (
                <div className="flex items-center space-x-1 text-green-200">
                  <Bell className="w-4 h-4" />
                  <span className="text-sm">Active</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-red-200">
                  <BellOff className="w-4 h-4" />
                  <span className="text-sm">Disabled</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'rules', label: 'Rules', icon: Settings },
              { id: 'settings', label: 'Preferences', icon: Settings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as unknown)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value as unknown)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Notification List */}
              <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No notifications found</p>
                    <p className="text-sm">Notifications will appear here when triggered</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border rounded-lg p-4 ${getPriorityColor(notification._priority)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{notification.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(notification._priority)}`}>
                              {notification._priority}
                            </span>
                          </div>
                          
                          <p className="text-sm mb-3">{notification.body}</p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{new Date(notification.timestamp).toLocaleString()}</span>
                            <span className="capitalize">{notification.status}</span>
                          </div>
                          
                          {notification.actions.length > 0 && (
                            <div className="flex space-x-2 mt-3">
                              {notification.actions.map((action) => (
                                <button
                                  key={action.id}
                                  onClick={() => handleNotificationAction(notification.id, action.id)}
                                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium hover:bg-purple-200 transition-colors"
                                >
                                  {action.title}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Rules Tab */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notification Rules</h3>
                <button className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Add Rule</span>
                </button>
              </div>

              <div className="space-y-4">
                {rules.map((rule) => {
                  const IconComponent = getNotificationIcon(rule._type);
                  
                  return (
                    <motion.div
                      key={rule.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg ${rule.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900">{rule.name}</h4>
                            <p className="text-sm text-gray-600 capitalize">{rule._type.replace('_', ' ')}</p>
                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                              <span className="capitalize">{rule._priority} priority</span>
                              <span className="capitalize">{rule.schedule.frequency}</span>
                              {rule.lastTriggered && (
                                <span>Last: {new Date(rule.lastTriggered).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleRule(rule.id)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              rule.isActive ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                rule.isActive ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                        <p><strong>Trigger:</strong> {rule.content.title}</p>
                        <p className="text-gray-600 mt-1">{rule.content.body}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && preferences && (
            <div className="space-y-6">
              {/* Global Settings */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Global Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">Enable Notifications</span>
                      <p className="text-sm text-gray-600">Turn all notifications on or off</p>
                    </div>
                    <button
                      onClick={() => updatePreferences({ globalEnabled: !preferences.globalEnabled })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        preferences.globalEnabled ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          preferences.globalEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">Quiet Hours</span>
                      <p className="text-sm text-gray-600">
                        {preferences.quietHours.enabled 
                          ? `${preferences.quietHours.start} - ${preferences.quietHours.end}`
                          : 'Disabled'
                        }
                      </p>
                    </div>
                    <button
                      onClick={() => updatePreferences({
                        quietHours: { ...preferences.quietHours, enabled: !preferences.quietHours.enabled }
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        preferences.quietHours.enabled ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          preferences.quietHours.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Category Settings */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Notification Categories</h3>
                
                <div className="space-y-4">
                  {Object.entries(preferences.categories).map(([key, enabled]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900 capitalize">
                          {key.replace('_', ' ')}
                        </span>
                      </div>
                      <button
                        onClick={() => updatePreferences({
                          categories: { ...preferences.categories, [key]: !enabled }
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          enabled ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Methods */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Delivery Methods</h3>
                
                <div className="space-y-4">
                  {Object.entries(preferences.delivery).map(([key, enabled]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900 capitalize">{key}</span>
                        <p className="text-sm text-gray-600">
                          {key === 'push' && 'Browser notifications'}
                          {key === 'email' && 'Email notifications'}
                          {key === 'sms' && 'Text message notifications'}
                          {key === 'inApp' && 'In-app notifications'}
                        </p>
                      </div>
                      <button
                        onClick={() => updatePreferences({
                          delivery: { ...preferences.delivery, [key]: !enabled }
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          enabled ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationCenter;