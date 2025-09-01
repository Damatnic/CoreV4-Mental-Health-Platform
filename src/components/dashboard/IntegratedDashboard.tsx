/**
 * Integrated Dashboard Component
 * Manages real-time data flow and synchronization across all dashboard widgets
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AnonymousAuthContext';
import { useDashboardData, useWidgetData } from '../../hooks/useDashboardData';
import { useDataIntegration, IntegrationEvent } from '../../services/integration/DataIntegrationService';
import { useRealtimeSync, RealtimeEvent } from '../../services/integration/RealtimeSyncService';
import { useWellnessStore } from '../../stores/wellnessStore';
import { useActivityStore } from '../../stores/activityStore';
import { useAccessibilityStore } from '../../stores/accessibilityStore';
import { DashboardWidget, WidgetSkeleton } from './DashboardWidget';
import { 
  Activity, 
  TrendingUp, 
  Calendar, 
  Heart, 
  Users, 
  AlertCircle,
  Bell,
  Shield,
  Brain,
  Target,
  MessageCircle,
  Clock,
  Zap,
  ChevronRight,
  RefreshCw,
  Settings,
  Wifi,
  WifiOff
} from 'lucide-react';
import { 
  DashboardWidget as WidgetType,
  WellnessStatus,
  ScheduleItem,
  CrisisPanelData,
  QuickAction
} from '../../types/dashboard';

// Widget Components
import { WellnessStatusWidget } from './widgets/WellnessStatusWidget';
import { TodaysScheduleWidget } from './widgets/TodaysScheduleWidget';
import { CrisisPanelWidget } from './widgets/CrisisPanelWidget';
import { QuickActionsWidget } from './widgets/QuickActionsWidget';
import { CommunityFeedWidget } from './widgets/CommunityFeedWidget';
import { TherapyProgressWidget } from './widgets/TherapyProgressWidget';
import { MoodTrendsWidget } from './widgets/MoodTrendsWidget';
import { MedicationTrackerWidget } from './widgets/MedicationTrackerWidget';
import { GoalsProgressWidget } from './widgets/GoalsProgressWidget';
import { InsightsWidget } from './widgets/InsightsWidget';

// Connection status indicator
function ConnectionStatus({ isConnected, isDataSyncing }: { isConnected: boolean; isDataSyncing: boolean }) {
  return (
    <div className="fixed top-4 right-4 z-50">
      <AnimatePresence>
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center"
          >
            <WifiOff className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Offline Mode</span>
          </motion.div>
        )}
        {isDataSyncing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            <span className="text-sm font-medium">Syncing...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Real-time notification toast
function NotificationToast({ notification }: { notification: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 max-w-sm z-50"
    >
      <div className="flex items-start">
        <Bell className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-gray-900">{notification.title}</p>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function IntegratedDashboard() {
  const { user } = useAuth();
  const { data: dashboardData, isLoading, refetch } = useDashboardData();
  const dataIntegration = useDataIntegration();
  const realtimeSync = useRealtimeSync();
  
  // Store hooks
  const wellnessStore = useWellnessStore();
  const activityStore = useActivityStore();
  const accessibilityStore = useAccessibilityStore();
  
  // State
  const [widgets, setWidgets] = useState<WidgetType[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeNotification, setActiveNotification] = useState<any>(null);
  const [widgetErrors, setWidgetErrors] = useState<Map<string, string>>(new Map());
  
  // Initialize widgets configuration
  useEffect(() => {
    const initialWidgets: WidgetType[] = [
      {
        id: 'wellness-status',
        type: 'wellness_status',
        title: 'Wellness Overview',
        size: { width: 6, height: 3 },
        position: { x: 0, y: 0 },
        priority: 'high',
        refreshInterval: 60,
        accessibility: {
          ariaLabel: 'Wellness status overview',
          keyboardShortcut: 'alt+w',
          focusOrder: 1
        }
      },
      {
        id: 'todays-schedule',
        type: 'todays_schedule',
        title: "Today's Schedule",
        size: { width: 3, height: 2 },
        position: { x: 6, y: 0 },
        priority: 'medium',
        refreshInterval: 300,
        accessibility: {
          ariaLabel: "Today's appointments and activities",
          keyboardShortcut: 'alt+s',
          focusOrder: 2
        }
      },
      {
        id: 'crisis-panel',
        type: 'crisis_panel',
        title: 'Crisis Support',
        size: { width: 3, height: 2 },
        position: { x: 9, y: 0 },
        priority: 'critical',
        accessibility: {
          ariaLabel: 'Crisis support and emergency contacts',
          keyboardShortcut: 'alt+c',
          focusOrder: 3
        }
      },
      {
        id: 'quick-actions',
        type: 'quick_actions',
        title: 'Quick Actions',
        size: { width: 12, height: 1 },
        position: { x: 0, y: 3 },
        priority: 'medium',
        accessibility: {
          ariaLabel: 'Quick action buttons',
          focusOrder: 4
        }
      },
      {
        id: 'mood-trends',
        type: 'mood_trends',
        title: 'Mood Trends',
        size: { width: 4, height: 2 },
        position: { x: 0, y: 4 },
        priority: 'medium',
        refreshInterval: 120,
        accessibility: {
          ariaLabel: 'Mood tracking trends',
          keyboardShortcut: 'alt+m',
          focusOrder: 5
        }
      },
      {
        id: 'therapy-progress',
        type: 'therapy_progress',
        title: 'Therapy Progress',
        size: { width: 4, height: 2 },
        position: { x: 4, y: 4 },
        priority: 'medium',
        refreshInterval: 600,
        accessibility: {
          ariaLabel: 'Therapy session progress',
          keyboardShortcut: 'alt+t',
          focusOrder: 6
        }
      },
      {
        id: 'community-feed',
        type: 'community_feed',
        title: 'Community',
        size: { width: 4, height: 2 },
        position: { x: 8, y: 4 },
        priority: 'low',
        refreshInterval: 30,
        accessibility: {
          ariaLabel: 'Community feed and updates',
          keyboardShortcut: 'alt+u',
          focusOrder: 7
        }
      },
      {
        id: 'goals-progress',
        type: 'goals_progress',
        title: 'Goals & Milestones',
        size: { width: 6, height: 2 },
        position: { x: 0, y: 6 },
        priority: 'medium',
        refreshInterval: 300,
        accessibility: {
          ariaLabel: 'Goals and milestone progress',
          keyboardShortcut: 'alt+g',
          focusOrder: 8
        }
      },
      {
        id: 'insights',
        type: 'insights',
        title: 'Insights & Recommendations',
        size: { width: 6, height: 2 },
        position: { x: 6, y: 6 },
        priority: 'low',
        refreshInterval: 3600,
        accessibility: {
          ariaLabel: 'Personalized insights and recommendations',
          keyboardShortcut: 'alt+i',
          focusOrder: 9
        }
      }
    ];
    
    // Apply user preferences
    const userLayout = localStorage.getItem(`dashboard_layout_${user?.id}`);
    if (userLayout) {
      try {
        const savedWidgets = JSON.parse(userLayout);
        setWidgets(savedWidgets);
      } catch {
        setWidgets(initialWidgets);
      }
    } else {
      setWidgets(initialWidgets);
    }
  }, [user]);
  
  // Setup real-time connection
  useEffect(() => {
    if (!user) return;
    
    const connectRealtime = async () => {
      try {
        await realtimeSync.connect({
          token: user.token || '',
          userId: user.id
        });
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to connect real-time sync:', error);
        setIsConnected(false);
      }
    };
    
    connectRealtime();
    
    return () => {
      realtimeSync.disconnect();
    };
  }, [user, realtimeSync]);
  
  // Setup data integration listeners
  useEffect(() => {
    // Listen for data sync events
    const unsubSync = dataIntegration.on(IntegrationEvent.STORE_SYNC_STARTED, () => {
      setIsSyncing(true);
    });
    
    const unsubSyncComplete = dataIntegration.on(IntegrationEvent.STORE_SYNC_COMPLETED, () => {
      setIsSyncing(false);
      refetch(); // Refresh dashboard data
    });
    
    const unsubSyncFailed = dataIntegration.on(IntegrationEvent.STORE_SYNC_FAILED, (error) => {
      setIsSyncing(false);
      console.error('Data sync failed:', error);
    });
    
    // Listen for real-time events
    const unsubCrisis = realtimeSync.on(RealtimeEvent.CRISIS_ALERT_RECEIVED, (alert) => {
      handleCrisisAlert(alert);
    });
    
    const unsubNotification = realtimeSync.on(RealtimeEvent.NOTIFICATION_RECEIVED, (notification) => {
      handleNotification(notification);
    });
    
    const unsubMoodUpdate = dataIntegration.on(IntegrationEvent.MOOD_UPDATED, () => {
      refreshWidget('wellness-status');
      refreshWidget('mood-trends');
    });
    
    const unsubGoalAchieved = dataIntegration.on(IntegrationEvent.GOAL_ACHIEVED, (goal) => {
      handleGoalAchievement(goal);
    });
    
    return () => {
      unsubSync();
      unsubSyncComplete();
      unsubSyncFailed();
      unsubCrisis();
      unsubNotification();
      unsubMoodUpdate();
      unsubGoalAchieved();
    };
  }, [dataIntegration, realtimeSync]);
  
  // Handle crisis alert
  const handleCrisisAlert = useCallback((alert: any) => {
    // Update crisis panel immediately
    refreshWidget('crisis-panel');
    
    // Show notification
    const notification = {
      id: `crisis-${Date.now()}`,
      title: 'Crisis Alert',
      message: alert.message || 'Immediate support available',
      type: 'crisis',
      priority: 'critical'
    };
    
    setNotifications(prev => [notification, ...prev]);
    setActiveNotification(notification);
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      setActiveNotification(null);
    }, 10000);
  }, []);
  
  // Handle notifications
  const handleNotification = useCallback((notification: any) => {
    setNotifications(prev => [notification, ...prev]);
    
    // Show toast for high priority notifications
    if (notification.priority === 'high' || notification.priority === 'critical') {
      setActiveNotification(notification);
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setActiveNotification(null);
      }, 5000);
    }
  }, []);
  
  // Handle goal achievement
  const handleGoalAchievement = useCallback((goal: any) => {
    const notification = {
      id: `goal-${Date.now()}`,
      title: 'Goal Achieved!',
      message: `Congratulations! You've completed "${goal.title}"`,
      type: 'success',
      priority: 'medium'
    };
    
    handleNotification(notification);
    refreshWidget('goals-progress');
    refreshWidget('wellness-status');
  }, []);
  
  // Refresh specific widget
  const refreshWidget = useCallback(async (widgetId: string) => {
    try {
      // Trigger widget-specific data refresh
      // This would typically call the API for that specific widget
      const widget = widgets.find(w => w.id === widgetId);
      if (widget) {
        // Use the widget-specific data hook to refetch
        // For now, we'll just clear any errors
        setWidgetErrors(prev => {
          const newErrors = new Map(prev);
          newErrors.delete(widgetId);
          return newErrors;
        });
      }
    } catch (error) {
      console.error(`Failed to refresh widget ${widgetId}:`, error);
      setWidgetErrors(prev => {
        const newErrors = new Map(prev);
        newErrors.set(widgetId, 'Failed to refresh widget');
        return newErrors;
      });
    }
  }, [widgets]);
  
  // Render widget content based on type
  const renderWidgetContent = useCallback((widget: WidgetType) => {
    const error = widgetErrors.get(widget.id);
    
    switch (widget.type) {
      case 'wellness_status':
        return <WellnessStatusWidget data={dashboardData?.wellnessStatus} error={error} />;
        
      case 'todays_schedule':
        return <TodaysScheduleWidget data={dashboardData?.todaySchedule} error={error} />;
        
      case 'crisis_panel':
        return <CrisisPanelWidget data={dashboardData?.crisisData} error={error} />;
        
      case 'quick_actions':
        return <QuickActionsWidget actions={dashboardData?.quickActions} error={error} />;
        
      case 'mood_trends':
        return <MoodTrendsWidget moodData={wellnessStore.moodEntries} error={error} />;
        
      case 'therapy_progress':
        return <TherapyProgressWidget progress={activityStore.therapyProgress} error={error} />;
        
      case 'community_feed':
        return <CommunityFeedWidget isConnected={isConnected} error={error} />;
        
      case 'goals_progress':
        return <GoalsProgressWidget goals={activityStore.goals} error={error} />;
        
      case 'insights':
        return <InsightsWidget insights={wellnessStore.insights} error={error} />;
        
      case 'medication_tracker':
        return <MedicationTrackerWidget medications={activityStore.medications} error={error} />;
        
      default:
        return <div>Unknown widget type: {widget.type}</div>;
    }
  }, [dashboardData, wellnessStore, activityStore, isConnected, widgetErrors]);
  
  // Handle widget settings
  const handleWidgetSettings = useCallback((widgetId: string) => {
    // Open widget settings modal
    console.log('Opening settings for widget:', widgetId);
  }, []);
  
  // Handle widget expand/collapse
  const handleWidgetExpand = useCallback((widgetId: string) => {
    console.log('Expanding widget:', widgetId);
  }, []);
  
  const handleWidgetCollapse = useCallback((widgetId: string) => {
    console.log('Collapsing widget:', widgetId);
  }, []);
  
  // Force sync all data
  const handleForceSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await dataIntegration.forceSync();
      await refetch();
    } catch (error) {
      console.error('Force sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [dataIntegration, refetch]);
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-12 gap-4 auto-rows-[minmax(120px,auto)]">
            {Array.from({ length: 6 }).map((_, i) => (
              <WidgetSkeleton 
                key={i} 
                width={i === 0 ? 6 : i < 3 ? 3 : 4} 
                height={i === 3 ? 1 : 2} 
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Connection Status */}
      <ConnectionStatus isConnected={isConnected} isDataSyncing={isSyncing} />
      
      {/* Notification Toast */}
      <AnimatePresence>
        {activeNotification && (
          <NotificationToast notification={activeNotification} />
        )}
      </AnimatePresence>
      
      {/* Dashboard Header */}
      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.name || 'Friend'}
              </h1>
              <p className="text-gray-600 mt-1">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleForceSync}
                disabled={isSyncing}
                className="flex items-center px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync Data
              </button>
              <button className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <Settings className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Dashboard Grid */}
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="grid grid-cols-12 gap-4 auto-rows-[minmax(120px,auto)]"
            layout
          >
            {widgets
              .sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0))
              .map((widget) => (
                <DashboardWidget
                  key={widget.id}
                  widget={widget}
                  onRefresh={() => refreshWidget(widget.id)}
                  onExpand={() => handleWidgetExpand(widget.id)}
                  onCollapse={() => handleWidgetCollapse(widget.id)}
                  onSettings={() => handleWidgetSettings(widget.id)}
                  loading={isLoading}
                  error={widgetErrors.get(widget.id)}
                >
                  {renderWidgetContent(widget)}
                </DashboardWidget>
              ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}