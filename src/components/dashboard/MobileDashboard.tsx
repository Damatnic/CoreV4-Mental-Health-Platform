/**
 * Mobile-optimized Dashboard Component
 * Provides responsive, touch-friendly dashboard experience with collapsible widgets
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  RefreshCw,
  Settings,
  Plus,
  X,
  Battery,
  Wifi,
  WifiOff,
  Bell,
  AlertTriangle,
  Heart,
  Brain,
  Activity,
  Target,
  Calendar,
  TrendingUp,
  Users,
  Shield
} from 'lucide-react';
import { useMobileFeatures, useTouchGestures, usePullToRefresh } from '../../hooks/useMobileFeatures';
import { useVibration } from '../../hooks/useVibration';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useNavigatorOnLine } from '../../hooks/useNavigatorOnLine';
import { useBatteryStatus } from '../../hooks/useBatteryStatus';

// Widget types
interface DashboardWidget {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  size: 'small' | 'medium' | 'large' | 'full';
  priority: number;
  component: React.ComponentType<any>;
  requiresAuth?: boolean;
  offlineCapable?: boolean;
}

// Available widgets
const availableWidgets: DashboardWidget[] = [
  {
    id: 'crisis-panel',
    title: 'Crisis Support',
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'from-red-500 to-red-600',
    size: 'medium',
    priority: 1,
    component: CrisisQuickAccess,
    offlineCapable: true
  },
  {
    id: 'mood-tracker',
    title: 'Mood Check-In',
    icon: <Heart className="h-5 w-5" />,
    color: 'from-pink-500 to-pink-600',
    size: 'medium',
    priority: 2,
    component: MoodCheckIn,
    offlineCapable: true
  },
  {
    id: 'wellness-score',
    title: 'Wellness Score',
    icon: <Activity className="h-5 w-5" />,
    color: 'from-green-500 to-green-600',
    size: 'small',
    priority: 3,
    component: WellnessScore,
    offlineCapable: false
  },
  {
    id: 'breathing',
    title: 'Quick Breathe',
    icon: <Brain className="h-5 w-5" />,
    color: 'from-blue-500 to-blue-600',
    size: 'small',
    priority: 4,
    component: QuickBreathe,
    offlineCapable: true
  },
  {
    id: 'goals',
    title: 'Daily Goals',
    icon: <Target className="h-5 w-5" />,
    color: 'from-purple-500 to-purple-600',
    size: 'medium',
    priority: 5,
    component: DailyGoals,
    requiresAuth: true,
    offlineCapable: true
  },
  {
    id: 'appointments',
    title: 'Appointments',
    icon: <Calendar className="h-5 w-5" />,
    color: 'from-indigo-500 to-indigo-600',
    size: 'medium',
    priority: 6,
    component: UpcomingAppointments,
    requiresAuth: true,
    offlineCapable: false
  },
  {
    id: 'community',
    title: 'Community',
    icon: <Users className="h-5 w-5" />,
    color: 'from-teal-500 to-teal-600',
    size: 'small',
    priority: 7,
    component: CommunityHighlights,
    requiresAuth: true,
    offlineCapable: false
  },
  {
    id: 'safety-plan',
    title: 'Safety Plan',
    icon: <Shield className="h-5 w-5" />,
    color: 'from-gray-600 to-gray-700',
    size: 'medium',
    priority: 8,
    component: SafetyPlanWidget,
    requiresAuth: true,
    offlineCapable: true
  }
];

// Mobile Dashboard Component
export function MobileDashboard() {
  const { deviceInfo, isSmallScreen } = useMobileFeatures();
  const vibrate = useVibration();
  const isOnline = useNavigatorOnLine();
  const { level: batteryLevel, charging } = useBatteryStatus();
  const { data, isLoading, refetch } = useDashboardData();
  
  const [widgets, setWidgets] = useState(() => {
    // Load widget preferences from localStorage
    const saved = localStorage.getItem('dashboard_widgets');
    if (saved) {
      return JSON.parse(saved);
    }
    return availableWidgets.slice(0, 6); // Default to first 6 widgets
  });
  
  const [expandedWidgets, setExpandedWidgets] = useState<Set<string>>(new Set());
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Pull to refresh
  const { isPulling, pullDistance, pullProgress } = usePullToRefresh(
    async () => {
      setRefreshing(true);
      vibrate([50]);
      await refetch();
      setTimeout(() => setRefreshing(false), 500);
    },
    { disabled: isLoading || !isOnline }
  );

  // Handle widget reordering
  const handleReorder = (newOrder: DashboardWidget[]) => {
    vibrate([30]);
    setWidgets(newOrder);
    localStorage.setItem('dashboard_widgets', JSON.stringify(newOrder));
  };

  // Toggle widget expansion
  const toggleWidget = (widgetId: string) => {
    vibrate([20]);
    setExpandedWidgets(prev => {
      const next = new Set(prev);
      if (next.has(widgetId)) {
        next.delete(widgetId);
      } else {
        next.add(widgetId);
      }
      return next;
    });
  };

  // Add/remove widget
  const toggleWidgetInDashboard = (widget: DashboardWidget) => {
    vibrate([30]);
    const exists = widgets.find((w: DashboardWidget) => w.id === widget.id);
    
    if (exists) {
      const newWidgets = widgets.filter((w: DashboardWidget) => w.id !== widget.id);
      setWidgets(newWidgets);
      localStorage.setItem('dashboard_widgets', JSON.stringify(newWidgets));
    } else {
      const newWidgets = [...widgets, widget].sort((a, b) => a.priority - b.priority);
      setWidgets(newWidgets);
      localStorage.setItem('dashboard_widgets', JSON.stringify(newWidgets));
    }
  };

  return (
    <div 
      ref={dashboardRef}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-20"
    >
      {/* Status Bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
            {!isOnline && (
              <div className="flex items-center space-x-1 text-yellow-600">
                <WifiOff className="h-4 w-4" />
                <span className="text-xs">Offline</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {batteryLevel !== null && batteryLevel < 0.2 && (
              <div className="text-red-500 text-xs flex items-center">
                <Battery className="h-4 w-4 mr-1" />
                {Math.round(batteryLevel * 100)}%
              </div>
            )}
            
            <button
              onClick={() => setIsCustomizing(!isCustomizing)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Customize dashboard"
            >
              <Settings className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Pull to refresh indicator */}
        {isPulling && (
          <div className="absolute top-full left-0 right-0 flex justify-center">
            <motion.div
              style={{ 
                translateY: pullDistance,
                opacity: pullProgress 
              }}
              className="bg-white rounded-full shadow-lg p-2"
            >
              <RefreshCw 
                className={`h-5 w-5 text-primary-600 ${pullProgress === 1 ? 'animate-spin' : ''}`} 
              />
            </motion.div>
          </div>
        )}
      </div>

      {/* Customization Panel */}
      <AnimatePresence>
        {isCustomizing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b border-gray-200 overflow-hidden"
          >
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Tap to add/remove widgets
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {availableWidgets.map(widget => {
                  const isActive = widgets.find((w: DashboardWidget) => w.id === widget.id);
                  const isOffline = !isOnline && !widget.offlineCapable;
                  
                  return (
                    <button
                      key={widget.id}
                      onClick={() => !isOffline && toggleWidgetInDashboard(widget)}
                      disabled={isOffline}
                      className={`
                        p-3 rounded-lg border-2 transition-all
                        ${isActive 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 bg-white'
                        }
                        ${isOffline ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
                      `}
                    >
                      <div className={`flex flex-col items-center space-y-1 ${isOffline ? 'text-gray-400' : ''}`}>
                        {widget.icon}
                        <span className="text-xs">{widget.title}</span>
                        {isOffline && (
                          <WifiOff className="h-3 w-3" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard Widgets */}
      <div className="p-4">
        {isLoading ? (
          <DashboardSkeleton />
        ) : isCustomizing ? (
          <Reorder.Group 
            axis="y" 
            values={widgets} 
            onReorder={handleReorder}
            className="space-y-4"
          >
            {widgets.map((widget: DashboardWidget) => (
              <Reorder.Item 
                key={widget.id} 
                value={widget}
                className="relative"
              >
                <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                </div>
                <WidgetContainer
                  widget={widget}
                  isExpanded={expandedWidgets.has(widget.id)}
                  onToggle={() => toggleWidget(widget.id)}
                  data={data}
                  isCustomizing={true}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          <div className="space-y-4">
            {widgets.map((widget: DashboardWidget) => (
              <WidgetContainer
                key={widget.id}
                widget={widget}
                isExpanded={expandedWidgets.has(widget.id)}
                onToggle={() => toggleWidget(widget.id)}
                data={data}
                isCustomizing={false}
              />
            ))}
          </div>
        )}

        {/* Add widget prompt when empty */}
        {widgets.length === 0 && !isCustomizing && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No widgets added
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Customize your dashboard by adding widgets
            </p>
            <button
              onClick={() => setIsCustomizing(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium"
            >
              Add Widgets
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Widget Container Component
function WidgetContainer({ 
  widget, 
  isExpanded, 
  onToggle, 
  data,
  isCustomizing 
}: {
  widget: DashboardWidget;
  isExpanded: boolean;
  onToggle: () => void;
  data: any;
  isCustomizing: boolean;
}) {
  const Component = widget.component;
  const widgetRef = useRef<HTMLDivElement>(null);
  
  // Touch gestures for widget
  useTouchGestures(widgetRef, {
    onDoubleTap: () => onToggle(),
    onSwipe: (direction) => {
      if (direction === 'up' && !isExpanded) {
        onToggle();
      } else if (direction === 'down' && isExpanded) {
        onToggle();
      }
    }
  });

  return (
    <motion.div
      ref={widgetRef}
      layout
      className={`
        bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden
        ${isCustomizing ? 'pl-10' : ''}
      `}
    >
      {/* Widget Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${widget.color} text-white`}>
            {widget.icon}
          </div>
          <h3 className="font-medium text-gray-900">{widget.title}</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {/* Widget Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100"
          >
            <div className="p-4">
              <Component data={data} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Widget Components (simplified examples)

function CrisisQuickAccess() {
  return (
    <div className="space-y-3">
      <button className="w-full bg-red-500 text-white py-3 rounded-lg font-medium">
        Call 988 Crisis Line
      </button>
      <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium">
        Text Crisis Support
      </button>
    </div>
  );
}

function MoodCheckIn() {
  const moods = ['😔', '😐', '🙂', '😊', '😄'];
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">How are you feeling?</p>
      <div className="flex justify-between">
        {moods.map((mood, index) => (
          <button
            key={index}
            className="text-3xl hover:scale-110 transition-transform"
          >
            {mood}
          </button>
        ))}
      </div>
    </div>
  );
}

function WellnessScore({ data }: { data: any }) {
  const score = data?.wellnessScore || 75;
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-primary-600">{score}%</div>
      <p className="text-sm text-gray-600 mt-1">Wellness Score</p>
      <div className="mt-2 flex items-center justify-center space-x-1">
        <TrendingUp className="h-4 w-4 text-green-500" />
        <span className="text-xs text-green-600">+5% this week</span>
      </div>
    </div>
  );
}

function QuickBreathe() {
  return (
    <button className="w-full py-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
      <Brain className="h-12 w-12 text-blue-500 mx-auto mb-2" />
      <p className="text-sm font-medium text-gray-700">Start Breathing Exercise</p>
    </button>
  );
}

function DailyGoals({ data }: { data: any }) {
  const goals = data?.goals || [
    { id: 1, title: 'Morning meditation', completed: true },
    { id: 2, title: 'Take a walk', completed: false },
    { id: 3, title: 'Journal entry', completed: false }
  ];
  
  return (
    <div className="space-y-2">
      {goals.map((goal: any) => (
        <div key={goal.id} className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={goal.completed}
            className="h-5 w-5 text-primary-600 rounded"
            readOnly
          />
          <span className={goal.completed ? 'line-through text-gray-400' : 'text-gray-700'}>
            {goal.title}
          </span>
        </div>
      ))}
    </div>
  );
}

function UpcomingAppointments({ data }: { data: any }) {
  return (
    <div className="space-y-2">
      <div className="p-3 bg-blue-50 rounded-lg">
        <p className="font-medium text-gray-900">Therapy Session</p>
        <p className="text-sm text-gray-600">Tomorrow at 2:00 PM</p>
      </div>
    </div>
  );
}

function CommunityHighlights() {
  return (
    <div className="text-center py-4">
      <Users className="h-8 w-8 text-teal-500 mx-auto mb-2" />
      <p className="text-sm text-gray-600">3 new support group posts</p>
    </div>
  );
}

function SafetyPlanWidget() {
  return (
    <div className="space-y-3">
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-700">Warning Signs</p>
        <p className="text-xs text-gray-600 mt-1">Tap to review</p>
      </div>
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-700">Coping Strategies</p>
        <p className="text-xs text-gray-600 mt-1">5 strategies available</p>
      </div>
    </div>
  );
}

// Dashboard Skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            <div className="h-5 bg-gray-200 rounded w-32" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}