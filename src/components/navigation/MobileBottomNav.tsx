/**
 * Mobile Bottom Navigation Component
 * Provides thumb-friendly navigation with haptic feedback and gesture support
 */

import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Heart,
  Users,
  Calendar,
  AlertTriangle,
  Menu,
  X,
  Activity,
  Brain,
  BookOpen,
  Settings,
  Phone,
  MessageSquare,
  Shield,
  Target,
  ChevronUp
} from 'lucide-react';
import { useVibration } from '../../hooks/useVibration';
import { useMobileFeatures, useTouchGestures } from '../../hooks/useMobileFeatures';
import { initializeTouchOptimization } from '../../utils/mobile/touchOptimization';
import { useAuth } from '../../contexts/AnonymousAuthContext';

interface NavItem {
  id: string;
  path: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  requiresAuth?: boolean;
  color?: string;
}

const mainNavItems: NavItem[] = [
  {
    id: 'home',
    path: '/',
    icon: <Home className="h-6 w-6" />,
    label: 'Home'
  },
  {
    id: 'wellness',
    path: '/wellness',
    icon: <Heart className="h-6 w-6" />,
    label: 'Wellness',
    color: 'text-pink-500'
  },
  {
    id: 'community',
    path: '/community',
    icon: <Users className="h-6 w-6" />,
    label: 'Community',
    requiresAuth: true,
    color: 'text-blue-500'
  },
  {
    id: 'schedule',
    path: '/schedule',
    icon: <Calendar className="h-6 w-6" />,
    label: 'Schedule',
    requiresAuth: true,
    color: 'text-green-500'
  }
];

const drawerItems: NavItem[] = [
  {
    id: 'crisis',
    path: '/crisis',
    icon: <AlertTriangle className="h-5 w-5" />,
    label: 'Crisis Support',
    color: 'text-red-500'
  },
  {
    id: 'mood',
    path: '/wellness/mood',
    icon: <Activity className="h-5 w-5" />,
    label: 'Mood Tracker'
  },
  {
    id: 'meditation',
    path: '/wellness/meditation',
    icon: <Brain className="h-5 w-5" />,
    label: 'Meditation'
  },
  {
    id: 'journal',
    path: '/wellness/journal',
    icon: <BookOpen className="h-5 w-5" />,
    label: 'Journal'
  },
  {
    id: 'goals',
    path: '/goals',
    icon: <Target className="h-5 w-5" />,
    label: 'Goals',
    requiresAuth: true
  },
  {
    id: 'safety',
    path: '/crisis/safety-plan',
    icon: <Shield className="h-5 w-5" />,
    label: 'Safety Plan',
    requiresAuth: true
  },
  {
    id: 'settings',
    path: '/settings',
    icon: <Settings className="h-5 w-5" />,
    label: 'Settings'
  }
];

const crisisQuickActions = [
  {
    id: 'call-988',
    action: () => window.location.href = 'tel:988',
    icon: <Phone className="h-5 w-5" />,
    label: '988',
    color: 'bg-red-500'
  },
  {
    id: 'text-crisis',
    action: () => window.location.href = 'sms:741741?body=HOME',
    icon: <MessageSquare className="h-5 w-5" />,
    label: 'Text',
    color: 'bg-blue-500'
  },
  {
    id: 'emergency',
    action: () => window.location.href = 'tel:911',
    icon: <Shield className="h-5 w-5" />,
    label: '911',
    color: 'bg-gray-700'
  }
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const vibrate = useVibration();
  const { deviceInfo } = useMobileFeatures();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showCrisisActions, setShowCrisisActions] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const currentPath = location.pathname;
    const item = mainNavItems.find(item => item.path === currentPath);
    return item?.id || 'home';
  });
  
  const navRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Enhanced touch optimization for navigation
  useEffect(() => {
    if (navRef.current) {
      const touchManager = initializeTouchOptimization(navRef.current, {
        enableSwipeGestures: true,
        enableVibration: true,
        swipeThreshold: 30,
        longPressDelay: 600
      });

      touchManager.on('swipe', (gesture) => {
        if (gesture.direction === 'up') {
          vibrate([30]);
          setIsDrawerOpen(true);
        } else if (gesture.direction === 'down' && isDrawerOpen) {
          vibrate([30]);
          setIsDrawerOpen(false);
        }
      });

      touchManager.on('longPress', () => {
        vibrate([100, 50, 100]);
        setShowCrisisActions(true);
        setTimeout(() => setShowCrisisActions(false), 5000);
        
        // Announce to screen reader
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = 'Crisis actions menu opened';
        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 1000);
      });

      return () => touchManager.destroy();
    }
  }, [isDrawerOpen, vibrate]);

  // Legacy touch gestures for fallback
  useTouchGestures(navRef, {
    onSwipe: (direction) => {
      if (direction === 'up') {
        vibrate([30]);
        setIsDrawerOpen(true);
      } else if (direction === 'down' && isDrawerOpen) {
        vibrate([30]);
        setIsDrawerOpen(false);
      }
    },
    onLongPress: () => {
      vibrate([100, 50, 100]);
      setShowCrisisActions(true);
      setTimeout(() => setShowCrisisActions(false), 5000);
    }
  });

  // Handle swipe on drawer
  useTouchGestures(drawerRef, {
    onSwipe: (direction) => {
      if (direction === 'down') {
        vibrate([30]);
        setIsDrawerOpen(false);
      }
    }
  });

  // Update active tab based on route changes
  useEffect(() => {
    const currentPath = location.pathname;
    const item = mainNavItems.find(item => 
      currentPath === item.path || currentPath.startsWith(item.path + '/')
    );
    if (item) {
      setActiveTab(item.id);
    }
  }, [location]);

  const handleNavClick = (item: NavItem) => {
    if (item.requiresAuth && !isAuthenticated) {
      navigate('/auth/login');
      return;
    }

    vibrate([30]);
    setActiveTab(item.id);
    navigate(item.path);
    setIsDrawerOpen(false);
  };

  const handleMenuToggle = () => {
    vibrate([40]);
    setIsDrawerOpen(!isDrawerOpen);
  };

  // Don't show navigation on certain pages
  const hideNavPaths = ['/auth/login', '/auth/register', '/onboarding'];
  if (hideNavPaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  return (
    <>
      {/* Crisis Quick Actions Overlay */}
      <AnimatePresence>
        {showCrisisActions && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-24 left-4 right-4 z-50"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-4 border-2 border-red-200">
              <p className="text-sm font-medium text-gray-700 mb-3">Emergency Actions:</p>
              <div className="flex justify-around">
                {crisisQuickActions.map(action => (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className={`${action.color} text-white rounded-xl px-4 py-3 flex flex-col items-center space-y-1`}
                  >
                    {action.icon}
                    <span className="text-xs font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsDrawerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sliding Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            ref={drawerRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[70vh] overflow-y-auto"
          >
            {/* Drawer Handle */}
            <div className="flex justify-center py-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Drawer Header */}
            <div className="px-6 pb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Quick Access</h3>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Drawer Items */}
            <div className="px-4 pb-4">
              <div className="grid grid-cols-3 gap-3">
                {drawerItems.map(item => {
                  if (item.requiresAuth && !isAuthenticated) return null;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item)}
                      className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      <div className={`mb-2 ${item.color || 'text-gray-600'}`}>
                        {item.icon}
                      </div>
                      <span className="text-xs text-gray-700 font-medium">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Crisis Section */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 px-2">
                  Crisis Support
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {crisisQuickActions.map(action => (
                    <button
                      key={action.id}
                      onClick={action.action}
                      className={`${action.color} text-white rounded-xl py-3 flex flex-col items-center space-y-1`}
                    >
                      {action.icon}
                      <span className="text-xs font-medium">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <nav 
        ref={navRef}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-pb"
      >
        {/* Swipe Indicator */}
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
          <AnimatePresence>
            {!isDrawerOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                className="flex flex-col items-center"
              >
                <ChevronUp className="h-4 w-4 text-gray-400" />
                <span className="text-[10px] text-gray-400">Swipe up</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-around h-16">
          {/* Main Navigation Items */}
          {mainNavItems.map(item => {
            const isActive = activeTab === item.id;
            const isDisabled = item.requiresAuth && !isAuthenticated;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                disabled={isDisabled}
                className={`
                  flex flex-col items-center justify-center flex-1 h-full
                  transition-all duration-200 relative touch-target
                  ${isActive ? 'text-primary-600' : 'text-gray-500'}
                  ${isDisabled ? 'opacity-50' : 'active:bg-gray-50'}
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                  hover:bg-gray-50 active:scale-95
                `}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  {React.cloneElement(item.icon as React.ReactElement, {
                    className: `h-6 w-6 transition-transform ${isActive ? 'scale-110' : ''}`
                  })}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-medium ${isActive ? 'block' : 'hidden'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute top-0 left-0 right-0 h-0.5 bg-primary-600"
                  />
                )}
              </button>
            );
          })}

          {/* Menu Button */}
          <button
            onClick={handleMenuToggle}
            className={`
              flex flex-col items-center justify-center px-4 h-full
              transition-all duration-200 touch-target
              ${isDrawerOpen ? 'text-primary-600' : 'text-gray-500'}
              active:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500
              hover:bg-gray-50 active:scale-95
            `}
            aria-label="More options"
            aria-expanded={isDrawerOpen}
          >
            <Menu className={`h-6 w-6 transition-transform ${isDrawerOpen ? 'rotate-90' : ''}`} />
            <span className={`text-[10px] mt-1 font-medium ${isDrawerOpen ? 'block' : 'hidden'}`}>
              More
            </span>
          </button>
        </div>
      </nav>

      {/* Add padding to page content to account for navigation */}
      <style>{`
        .safe-area-pb {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        
        body {
          padding-bottom: calc(64px + env(safe-area-inset-bottom, 0));
        }
      `}</style>
    </>
  );
}