import { useState, useEffect, Suspense, lazy, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { useNavigate } from 'react-router-dom';
import { Bell, Settings, RefreshCw, Grid3x3, Sparkles, AlertTriangle, Shield, Brain, Users, Target, Activity, Trophy, BarChart3, Flame, WifiOff, AlertCircle } from 'lucide-react';
import { DashboardWidget, WidgetSkeleton } from './DashboardWidget';
import { CrisisPanel } from './widgets/CrisisPanel';
import { EnhancedCrisisPanel } from './widgets/EnhancedCrisisPanel';
import { CrisisPreventionDashboard } from './widgets/CrisisPreventionDashboard';
import { CrisisSupportNetwork } from './widgets/CrisisSupportNetwork';
import { WellnessStatus } from './widgets/WellnessStatus';
import { TodaySchedule } from './widgets/TodaySchedule';
import { QuickActions } from './widgets/QuickActions';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { ActivityTracker } from './widgets/ActivityTracker';
import { GoalProgressDashboard } from './widgets/GoalProgressDashboard';
import { HabitTracker } from './widgets/HabitTracker';
import { ActivityAnalytics } from './widgets/ActivityAnalytics';
import { BehavioralActivation } from './widgets/BehavioralActivation';
import { ProfessionalCareDashboard } from './ProfessionalCareDashboard';
import { AIInsightsDashboard } from './widgets/AIInsightsDashboard';
import { 
  DashboardData, 
  DashboardWidget as WidgetType,
  DashboardNotification 
} from '../../types/dashboard';
import { useAuth } from '../../contexts/AnonymousAuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useKeyboardNavigation, useScreenReaderAnnouncement } from '../../hooks/useKeyboardNavigation';
import { useNavigatorOnLine } from '../../hooks/useNavigatorOnLine';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';

// Widget Error Boundary Component
function WidgetErrorBoundary({ children, widgetName }: { children: React.ReactNode; widgetName: string }) {
  const { trackError } = useAnalytics();
  
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => {
        // Track the error when fallback is rendered
        trackError('widget_error', {
          widget: widgetName,
          message: error.message,
          stack: error.stack
        });
        
        return (
          <div className="flex flex-col items-center justify-center h-full p-4 bg-red-50 rounded-lg">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm text-red-700 text-center mb-3">
              Error loading {widgetName}
            </p>
            <button
              onClick={resetErrorBoundary}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        );
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Lazy load heavy widgets for better performance
const LazyAIInsightsDashboard = lazy(() => 
  import('./widgets/AIInsightsDashboard').then(module => ({
    default: module.AIInsightsDashboard
  }))
);

const LazyProfessionalCareDashboard = lazy(() => 
  import('./ProfessionalCareDashboard').then(module => ({
    default: module.ProfessionalCareDashboard
  }))
);

export function PersonalDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: dashboardData, isLoading, error, refetch } = useDashboardData();
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showEnhancedCrisis, setShowEnhancedCrisis] = useState(true);
  const [activeView, setActiveView] = useState<'main' | 'prevention' | 'network' | 'activities' | 'professional' | 'ai-insights'>('main');
  const [errorRetryCount, setErrorRetryCount] = useState(0);
  
  // Feature flags
  const enableEnhancedCrisis = useFeatureFlag('enhanced_crisis_panel');
  const enableAIInsights = useFeatureFlag('ai_insights_dashboard');
  const enableProfessionalCare = useFeatureFlag('professional_care_dashboard');
  const enableOfflineMode = useFeatureFlag('offline_mode');
  
  // Network and performance monitoring
  const isOnline = useNavigatorOnLine();
  const { recordMetric } = usePerformanceMonitor();
  const { trackEvent, trackError } = useAnalytics();
  
  // Accessibility hooks
  const { shortcuts } = useKeyboardNavigation();
  const { announce } = useScreenReaderAnnouncement();

  // Widget configurations
  const widgets: WidgetType[] = [
    {
      id: 'crisis-panel',
      type: 'crisis_panel',
      title: 'Enhanced Crisis Support',
      description: 'Real-time crisis monitoring & support',
      position: { x: 0, y: 0 },
      size: { width: 4, height: 3 },
      priority: 'critical',
      accessibility: {
        ariaLabel: 'Enhanced crisis support with real-time monitoring',
        keyboardShortcut: 'alt+c',
        focusOrder: 1,
      }
    },
    {
      id: 'wellness-status',
      type: 'wellness_status',
      title: 'Wellness Overview',
      position: { x: 3, y: 0 },
      size: { width: 3, height: 2 },
      priority: 'high',
      refreshInterval: 300, // 5 minutes
      accessibility: {
        ariaLabel: 'Your wellness status and trends',
        keyboardShortcut: 'alt+w',
        focusOrder: 2,
      }
    },
    {
      id: 'todays-schedule',
      type: 'todays_schedule',
      title: "Today's Schedule",
      position: { x: 6, y: 0 },
      size: { width: 3, height: 2 },
      priority: 'high',
      refreshInterval: 60, // 1 minute
      accessibility: {
        ariaLabel: 'Your schedule for today',
        keyboardShortcut: 'alt+s',
        focusOrder: 3,
      }
    },
    {
      id: 'quick-actions',
      type: 'quick_actions',
      title: 'Quick Actions',
      position: { x: 9, y: 0 },
      size: { width: 3, height: 2 },
      priority: 'medium',
      accessibility: {
        ariaLabel: 'Quick action shortcuts',
        keyboardShortcut: 'alt+q',
        focusOrder: 4,
      }
    },
  ];

  // Handle global refresh with error handling
  const handleGlobalRefresh = useCallback(async () => {
    if (!isOnline && !enableOfflineMode) {
      announce('Cannot refresh while offline');
      return;
    }
    
    setRefreshing(true);
    announce('Refreshing dashboard data...');
    
    try {
      await refetch();
      announce('Dashboard data refreshed successfully');
      trackEvent('dashboard_refresh', { success: true });
      setErrorRetryCount(0);
    } catch (error) {
      announce('Failed to refresh dashboard data');
      trackError('dashboard_refresh_error', {
        message: (error as Error).message,
        retryCount: errorRetryCount
      });
      
      // Auto-retry logic
      if (errorRetryCount < 3) {
        setTimeout(() => {
          setErrorRetryCount(prev => prev + 1);
          handleGlobalRefresh();
        }, 2000 * (errorRetryCount + 1));
      }
    } finally {
      setRefreshing(false);
    }
  }, [isOnline, enableOfflineMode, refetch, announce, trackEvent, trackError, errorRetryCount]);

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.name?.split(' ')[0] || 'there';
    
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    if (hour < 21) return `Good evening, ${name}`;
    return `Good night, ${name}`;
  };

  // Get motivational message
  const getMotivationalMessage = () => {
    const messages = [
      "You're doing great today!",
      "Every step forward counts.",
      "Your wellbeing matters.",
      "Take it one moment at a time.",
      "You've got this!",
      "Remember to be kind to yourself.",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Loading state
  if (isLoading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
          
          {/* Widget Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 auto-rows-[minmax(120px,auto)]">
            <WidgetSkeleton width={3} height={2} />
            <WidgetSkeleton width={3} height={2} />
            <WidgetSkeleton width={3} height={2} />
            <WidgetSkeleton width={3} height={2} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Dashboard Header */}
      <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-900">
                {getGreeting()}
              </h1>
              <p className="text-sm text-gray-600 mt-1 flex items-center">
                <Sparkles className="h-4 w-4 mr-1 text-yellow-500" />
                {getMotivationalMessage()}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <button 
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={`View notifications. ${notifications.length} unread`}
                aria-live="polite"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              
              {/* Refresh */}
              <button 
                onClick={handleGlobalRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Refresh dashboard"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              {/* Customize Layout */}
              <button 
                onClick={() => setIsCustomizing(!isCustomizing)}
                className={`p-2 rounded-lg transition-colors ${
                  isCustomizing ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label="Customize dashboard layout"
              >
                <Grid3x3 className="h-5 w-5" />
              </button>
              
              {/* Settings */}
              <button 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Dashboard settings"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Crisis Alert Banner - Shows when risk is elevated */}
      {dashboardData?.crisisData?.currentRiskLevel && 
       (dashboardData.crisisData.currentRiskLevel === 'high' || 
        dashboardData.crisisData.currentRiskLevel === 'critical') && (
        <div className="bg-red-600 text-white px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
              <span className="font-medium">Crisis support is available 24/7</span>
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-white text-red-600 rounded-md text-sm font-medium hover:bg-red-50">
                Call 988
              </button>
              <button className="px-3 py-1 bg-red-700 text-white rounded-md text-sm font-medium hover:bg-red-800">
                Get Help Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Toggle Buttons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex space-x-2 mb-4 flex-wrap">
          <button
            onClick={() => setActiveView('main')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'main' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Main Dashboard
          </button>
          <button
            onClick={() => setActiveView('prevention')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              activeView === 'prevention' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Brain className="h-4 w-4" />
            <span>Crisis Prevention</span>
          </button>
          <button
            onClick={() => setActiveView('network')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              activeView === 'network' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Support Network</span>
          </button>
          <button
            onClick={() => setActiveView('activities')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              activeView === 'activities' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Target className="h-4 w-4" />
            <span>Activities & Progress</span>
          </button>
          <button
            onClick={() => setActiveView('professional')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              activeView === 'professional' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Professional Care</span>
          </button>
          <button
            onClick={() => setActiveView('ai-insights')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              activeView === 'ai-insights' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>AI Insights</span>
          </button>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main Dashboard View */}
        {activeView === 'main' && (
          <div className="
            grid gap-4 auto-rows-[minmax(150px,auto)]
            grid-cols-1
            md:grid-cols-6
            lg:grid-cols-12
          ">
            {/* Enhanced Crisis Panel - Always First, Always Visible */}
            <motion.div
              className="col-span-1 md:col-span-6 lg:col-span-6 row-span-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <DashboardWidget
                widget={widgets[0]!}
                loading={isLoading}
                className="h-full"
              >
                <WidgetErrorBoundary widgetName="Crisis Panel">
                {enableEnhancedCrisis && showEnhancedCrisis ? (
                  <EnhancedCrisisPanel 
                    data={dashboardData?.crisisData}
                    onEmergencyCall={(contact, service) => {
                      // Handle emergency call with service info
                      console.log('Emergency call to:', contact, 'Service:', service);
                      window.location.href = `tel:${contact}`;
                    }}
                    onOpenSafetyPlan={() => {
                      // Navigate to safety plan
                      console.log('Open safety plan');
                      navigate('/crisis/safety-plan');
                    }}
                    onStartCrisisChat={() => {
                      // Start crisis chat
                      console.log('Starting crisis chat');
                      navigate('/crisis/chat');
                    }}
                    onLocationShare={(location) => {
                      // Share location for emergency services
                      console.log('Sharing location:', location);
                    }}
                  />
                ) : (
                  <CrisisPanel 
                    data={dashboardData?.crisisData}
                    onEmergencyCall={(contact) => {
                      console.log('Emergency call to:', contact);
                    }}
                    onOpenSafetyPlan={() => {
                      console.log('Open safety plan');
                      navigate('/crisis/safety-plan');
                    }}
                  />
                )}
                </WidgetErrorBoundary>
              </DashboardWidget>
            </motion.div>

            {/* Wellness Status */}
            <motion.div
              className="col-span-1 md:col-span-3 lg:col-span-3 row-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <DashboardWidget
              widget={widgets[1]!}
              loading={isLoading}
              onRefresh={async () => {
                await refetch();
              }}
              className="h-full"
            >
              <WellnessStatus 
                data={dashboardData?.wellnessStatus}
                onViewDetails={() => {
                  // Navigate to detailed analytics
                  console.log('View wellness details');
                }}
                onUpdateMood={() => {
                  // Open mood tracker
                  console.log('Update mood');
                }}
              />
            </DashboardWidget>
          </motion.div>

            {/* Today's Schedule */}
            <motion.div
              className="col-span-1 md:col-span-3 lg:col-span-3 row-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <DashboardWidget
              widget={widgets[2]!}
              loading={isLoading}
              onRefresh={async () => {
                await refetch();
              }}
              className="h-full"
            >
              <TodaySchedule 
                scheduleItems={dashboardData?.todaySchedule}
                onItemClick={(item) => {
                  console.log('Schedule item clicked:', item);
                }}
                onReschedule={(item) => {
                  console.log('Reschedule item:', item);
                }}
                onMarkComplete={(item) => {
                  console.log('Mark complete:', item);
                }}
              />
            </DashboardWidget>
          </motion.div>

            {/* Quick Actions */}
            <motion.div
              className="col-span-1 md:col-span-3 lg:col-span-3 row-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <DashboardWidget
              widget={widgets[3]!}
              loading={isLoading}
              className="h-full"
            >
              <QuickActions 
                actions={dashboardData?.quickActions}
                onActionClick={(action) => {
                  console.log('Quick action clicked:', action);
                  // Navigate to action route
                  if (action.action.startsWith('/')) {
                    navigate(action.action);
                  }
                }}
              />
            </DashboardWidget>
          </motion.div>

            {/* Crisis Support Network Widget */}
            <motion.div
              className="col-span-1 md:col-span-6 lg:col-span-6 row-span-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <DashboardWidget
                widget={{
                  id: 'support-network',
                  type: 'crisis_panel',
                  title: 'Support Network',
                  description: 'Your crisis support team',
                  position: { x: 0, y: 3 },
                  size: { width: 6, height: 3 },
                  priority: 'high',
                  accessibility: {
                    ariaLabel: 'Crisis support network',
                    keyboardShortcut: 'alt+n',
                    focusOrder: 5,
                  }
                }}
                loading={isLoading}
                className="h-full"
              >
                <CrisisSupportNetwork />
              </DashboardWidget>
            </motion.div>
          </div>
        )}

        {/* Crisis Prevention Dashboard View */}
        {activeView === 'prevention' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CrisisPreventionDashboard />
          </motion.div>
        )}

        {/* Support Network View */}
        {activeView === 'network' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="grid gap-4 grid-cols-1 lg:grid-cols-2"
          >
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary-600" />
                Your Support Network
              </h2>
              <CrisisSupportNetwork />
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary-600" />
                Crisis Resources
              </h2>
              <EnhancedCrisisPanel 
                data={dashboardData?.crisisData}
                onEmergencyCall={(contact, service) => {
                  window.location.href = `tel:${contact}`;
                }}
                onOpenSafetyPlan={() => {
                  navigate('/crisis/safety-plan');
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Activities & Progress View */}
        {activeView === 'activities' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="grid gap-4 grid-cols-1 lg:grid-cols-12"
          >
            {/* Daily Activity Tracker - Main Focus */}
            <motion.div
              className="col-span-1 lg:col-span-6 row-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <DashboardWidget
                widget={{
                  id: 'activity-tracker',
                  type: 'activity_tracker',
                  title: 'Daily Activities',
                  description: 'Track and complete your activities',
                  position: { x: 0, y: 0 },
                  size: { width: 6, height: 2 },
                  priority: 'high',
                  accessibility: {
                    ariaLabel: 'Daily activity tracker',
                    keyboardShortcut: 'alt+a',
                    focusOrder: 1,
                  }
                }}
                loading={isLoading}
                className="h-full"
              >
                <ActivityTracker
                  energyLevel="medium"
                  currentMood={7}
                  onActivityClick={(activity) => {
                    console.log('Activity clicked:', activity);
                  }}
                  onAddActivity={() => {
                    console.log('Add activity');
                  }}
                />
              </DashboardWidget>
            </motion.div>

            {/* Goal Progress Dashboard */}
            <motion.div
              className="col-span-1 lg:col-span-6 row-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <DashboardWidget
                widget={{
                  id: 'goal-progress',
                  type: 'goal_progress',
                  title: 'Goals & Milestones',
                  description: 'Track your wellness goals',
                  position: { x: 6, y: 0 },
                  size: { width: 6, height: 2 },
                  priority: 'high',
                  accessibility: {
                    ariaLabel: 'Goal progress dashboard',
                    keyboardShortcut: 'alt+g',
                    focusOrder: 2,
                  }
                }}
                loading={isLoading}
                className="h-full"
              >
                <GoalProgressDashboard
                  onGoalClick={(goal) => {
                    console.log('Goal clicked:', goal);
                  }}
                  onAddGoal={() => {
                    console.log('Add goal');
                  }}
                  onViewDetails={(goalId) => {
                    console.log('View goal details:', goalId);
                  }}
                />
              </DashboardWidget>
            </motion.div>

            {/* Habit Tracker */}
            <motion.div
              className="col-span-1 lg:col-span-4 row-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <DashboardWidget
                widget={{
                  id: 'habit-tracker',
                  type: 'habit_tracker',
                  title: 'Habit Tracker',
                  description: 'Build and maintain healthy habits',
                  position: { x: 0, y: 2 },
                  size: { width: 4, height: 2 },
                  priority: 'high',
                  accessibility: {
                    ariaLabel: 'Habit tracker',
                    keyboardShortcut: 'alt+h',
                    focusOrder: 3,
                  }
                }}
                loading={isLoading}
                className="h-full"
              >
                <HabitTracker
                  onHabitClick={(habit) => {
                    console.log('Habit clicked:', habit);
                  }}
                  onAddHabit={() => {
                    console.log('Add habit');
                  }}
                  onViewAnalytics={(habitId) => {
                    console.log('View habit analytics:', habitId);
                  }}
                />
              </DashboardWidget>
            </motion.div>

            {/* Activity Analytics */}
            <motion.div
              className="col-span-1 lg:col-span-4 row-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <DashboardWidget
                widget={{
                  id: 'activity-analytics',
                  type: 'activity_analytics',
                  title: 'Progress Analytics',
                  description: 'Insights and trends',
                  position: { x: 4, y: 2 },
                  size: { width: 4, height: 2 },
                  priority: 'medium',
                  accessibility: {
                    ariaLabel: 'Activity analytics',
                    keyboardShortcut: 'alt+n',
                    focusOrder: 4,
                  }
                }}
                loading={isLoading}
                className="h-full"
              >
                <ActivityAnalytics
                  onExportData={() => {
                    console.log('Export data');
                  }}
                  onViewDetails={(activityId) => {
                    console.log('View activity details:', activityId);
                  }}
                />
              </DashboardWidget>
            </motion.div>

            {/* Behavioral Activation Tools */}
            <motion.div
              className="col-span-1 lg:col-span-4 row-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <DashboardWidget
                widget={{
                  id: 'behavioral-activation',
                  type: 'behavioral_activation',
                  title: 'Behavioral Activation',
                  description: 'Pleasant activity scheduling',
                  position: { x: 8, y: 2 },
                  size: { width: 4, height: 2 },
                  priority: 'medium',
                  accessibility: {
                    ariaLabel: 'Behavioral activation tools',
                    keyboardShortcut: 'alt+b',
                    focusOrder: 5,
                  }
                }}
                loading={isLoading}
                className="h-full"
              >
                <BehavioralActivation
                  currentMood={7}
                  energyLevel="medium"
                  onScheduleActivity={(activity) => {
                    console.log('Schedule activity:', activity);
                  }}
                  onStartExperiment={(experiment) => {
                    console.log('Start experiment:', experiment);
                  }}
                />
              </DashboardWidget>
            </motion.div>
          </motion.div>
        )}

        {/* Professional Care View */}
        {activeView === 'professional' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <div className="absolute inset-0 -m-6">
              <ProfessionalCareDashboard />
            </div>
          </motion.div>
        )}

        {/* AI Insights View */}
        {activeView === 'ai-insights' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            }>
              <LazyAIInsightsDashboard />
            </Suspense>
          </motion.div>
        )}

        {/* Keyboard Shortcuts Help */}
        {activeView !== 'professional' && activeView !== 'ai-insights' && <KeyboardShortcutsHelp />}

        {/* Customization Mode Overlay */}
        {isCustomizing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={() => setIsCustomizing(false)}
          >
            <div className="bg-white rounded-xl p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">Customize Dashboard</h2>
              <p className="text-gray-600 mb-4">
                Drag and drop widgets to rearrange your dashboard layout.
              </p>
              <button
                onClick={() => setIsCustomizing(false)}
                className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Screen Reader Announcements Region */}
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {/* This region is used for screen reader announcements */}
      </div>
    </div>
  );
}