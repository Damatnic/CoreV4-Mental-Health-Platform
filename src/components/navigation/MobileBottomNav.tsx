/**
 * Mobile Bottom Navigation Component
 * Console-themed mobile navigation with PlayStation/Xbox-inspired design
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
  ChevronUp,
  BarChart3,
  Accessibility,
  Bell,
  Gamepad2,
  Zap,
  Power
} from 'lucide-react';
import { useVibration } from '../../hooks/useVibration';
import { useMobileFeatures, useTouchGestures } from '../../hooks/useMobileFeatures';
import { initializeTouchOptimization } from '../../utils/mobile/touchOptimization';
import { useAuth } from '../../hooks/useAuth';
import { useConsoleNavigation } from '../../hooks/useConsoleNavigation';
import { ConsoleFocusable } from '../console/ConsoleFocusable';
import { getConsoleNavStyle, getConsoleAccentColor } from '../../utils/console';

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
    id: 'analytics',
    path: '/analytics',
    icon: <BarChart3 className="h-5 w-5" />,
    label: 'Analytics',
    requiresAuth: true
  },
  {
    id: 'accessibility',
    path: '/accessibility',
    icon: <Accessibility className="h-5 w-5" />,
    label: 'Accessibility'
  },
  {
    id: 'notifications',
    path: '/notifications',
    icon: <Bell className="h-5 w-5" />,
    label: 'Notifications'
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
  const { vibrate } = useVibration();
  const { deviceInfo, isMobileDevice } = useMobileFeatures();
  const { navigationMode, isPerformanceMode } = useConsoleNavigation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showCrisisActions, setShowCrisisActions] = useState(false);
  const [consoleMode, setConsoleMode] = useState<'playstation' | 'xbox' | 'switch'>('playstation');
  const [isConsoleStyleActive, setIsConsoleStyleActive] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    const currentPath = location.pathname;
    const item = mainNavItems.find(item => item.path === currentPath);
    return item?.id || 'home';
  });
  
  const navRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Enhanced console-themed touch optimization for navigation
  useEffect(() => {
    if (navRef.current) {
      const touchManager = initializeTouchOptimization(navRef.current, {
        enableSwipeGestures: true,
        enableVibration: true,
        swipeThreshold: isMobileDevice ? 25 : 30, // More sensitive on mobile
        longPressDelay: 500,
        enableFastClick: true
      });

      // Console-style haptic patterns
      const _consoleTapPattern = consoleMode === 'playstation' ? [25] : 
                              consoleMode === 'xbox' ? [30] : [20];
      const _consoleSwipePattern = consoleMode === 'playstation' ? [40, 20, 40] : 
                                consoleMode === 'xbox' ? [50, 30] : [35, 15, 35];
      const _consoleActivatePattern = consoleMode === 'playstation' ? [80, 40, 80, 40, 80] : 
                                   consoleMode === 'xbox' ? [100, 50, 100] : [60, 30, 60, 30];

      touchManager.on('swipe', (gesture) => {
        if (gesture.direction === 'up') {
          vibrate(_consoleSwipePattern);
          setIsDrawerOpen(true);
          // Console power-up sound effect would go here
        } else if (gesture.direction === 'down' && isDrawerOpen) {
          vibrate(_consoleSwipePattern);
          setIsDrawerOpen(false);
        } else if (gesture.direction === 'left') {
          // Cycle console modes
          const modes: typeof consoleMode[] = ['playstation', 'xbox', 'switch'];
          const currentIndex = modes.indexOf(consoleMode);
          const _nextMode = modes[(currentIndex + 1) % modes.length] || 'playstation';
          setConsoleMode(_nextMode);
          vibrate(_consoleTapPattern);
        } else if (gesture.direction === 'right') {
          // Toggle console style
          setIsConsoleStyleActive(!isConsoleStyleActive);
          vibrate([50, 25]);
        }
      });

      touchManager.on('longPress', () => {
        vibrate(_consoleActivatePattern);
        setShowCrisisActions(true);
        setTimeout(() => setShowCrisisActions(false), 5000);
        
        // Console-style announcement
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = 'Emergency console activated - Crisis actions menu opened';
        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 1000);
      });

      // Double-tap to toggle performance mode
      touchManager.on('doubleTap', () => {
        vibrate([25, 25]);
        // Toggle console performance mode visually
        document.body.classList.toggle('console-performance-mode');
      });

      return () => touchManager.destroy();
    }
  }, [isDrawerOpen, vibrate, consoleMode, isConsoleStyleActive, isMobileDevice]);

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
      currentPath === item.path || currentPath.startsWith(`${item.path  }/`)
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

    // Console-style haptic feedback based on current console mode
    const _consoleNavigatePattern = consoleMode === 'playstation' ? [40, 20] : 
                                 consoleMode === 'xbox' ? [50] : [30, 15];
    vibrate(_consoleNavigatePattern);
    
    setActiveTab(item.id);
    navigate(item.path);
    setIsDrawerOpen(false);
    
    // Visual feedback for console navigation
    if (isConsoleStyleActive && navRef.current) {
      navRef.current.classList.add('console-navigation-active');
      setTimeout(() => {
        navRef.current?.classList.remove('console-navigation-active');
      }, 200);
    }
  };

  const handleMenuToggle = () => {
    // Console menu haptic feedback
    const _consoleMenuPattern = consoleMode === 'playstation' ? [60, 30, 60] : 
                             consoleMode === 'xbox' ? [80, 40] : [45, 25, 45];
    vibrate(_consoleMenuPattern);
    setIsDrawerOpen(!isDrawerOpen);
    
    // Console-style menu animation
    if (isConsoleStyleActive && navRef.current) {
      navRef.current.classList.add('console-menu-toggle');
      setTimeout(() => {
        navRef.current?.classList.remove('console-menu-toggle');
      }, 300);
    }
  };

  // Don&apos;t show navigation on certain pages
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
                    className={`${action.color} text-white rounded-xl px-4 py-3 flex flex-col items-center space-y-1 min-h-[56px] min-w-[56px]`}
                    style={{
                      pointerEvents: 'auto',
                      touchAction: 'manipulation',
                      minWidth: '56px',
                      minHeight: '56px'
                    }}
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
              <div className="flex flex-wrap justify-center gap-3">
                {drawerItems.map(item => {
                  if (item.requiresAuth && !isAuthenticated) return null;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item)}
                      className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[56px] min-w-[56px]"
                      style={{
                        pointerEvents: 'auto',
                        touchAction: 'manipulation',
                        minWidth: '56px',
                        minHeight: '56px'
                      }}
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
                <div className="flex flex-wrap justify-center gap-2">
                  {crisisQuickActions.map(action => (
                    <button
                      key={action.id}
                      onClick={action.action}
                      className={`${action.color} text-white rounded-xl py-3 flex flex-col items-center space-y-1 min-h-[56px] min-w-[56px]`}
                      style={{
                        pointerEvents: 'auto',
                        touchAction: 'manipulation',
                        minWidth: '56px',
                        minHeight: '56px'
                      }}
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

      {/* Console-themed Bottom Navigation Bar */}
      <nav 
        ref={navRef}
        className={`
          fixed bottom-0 left-0 right-0 z-40 safe-area-pb transition-all duration-300
          ${isConsoleStyleActive ? getConsoleNavStyle(consoleMode) : 'bg-white border-t border-gray-200'}
          ${isPerformanceMode ? 'console-performance-nav' : ''}
        `}
        data-console-mode={consoleMode}
        aria-label="Console Navigation"
      >
        {/* Console Gaming Indicator */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
          <AnimatePresence>
            {!isDrawerOpen && isConsoleStyleActive && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.7, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex flex-col items-center px-3 py-1 rounded-full backdrop-blur-sm"
                style={{ backgroundColor: getConsoleAccentColor(consoleMode, 0.1) }}
              >
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-console-accent" />
                  <span className="text-[8px] font-bold" style={{ color: getConsoleAccentColor(consoleMode) }}>
                    {consoleMode.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  <ChevronUp className="h-3 w-3" style={{ color: getConsoleAccentColor(consoleMode, 0.8) }} />
                  <span className="text-[8px] font-medium" style={{ color: getConsoleAccentColor(consoleMode, 0.8) }}>
                    Power Menu
                  </span>
                </div>
              </motion.div>
            )}
            {!isDrawerOpen && !isConsoleStyleActive && (
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

        <div className="flex items-center justify-between h-16 px-2">
          {/* Console-themed Main Navigation Items */}
          {mainNavItems.map(item => {
            const isActive = activeTab === item.id;
            const isDisabled = item.requiresAuth && !isAuthenticated;

            return (
              <ConsoleFocusable
                key={item.id}
                id={`mobile-nav-${item.id}`}
                group="mobile-navigation"
                priority={isActive ? 100 : 50}
                className="flex-1 min-h-[56px] min-w-[56px]"
                onActivate={() => handleNavClick(item)}
              >
                <button
                  onClick={() => handleNavClick(item)}
                  disabled={isDisabled}
                  className={`
                    w-full h-full flex flex-col items-center justify-center px-2 py-2 rounded-console transition-all duration-200 min-h-[56px] min-w-[56px]
                    ${isActive ? 'bg-console-accent/20 text-console-accent' : 'text-gray-400 hover:text-console-accent'}
                    ${isDisabled ? 'opacity-50' : ''}
                  `}
                  aria-label={`${item.label} - Console Navigation`}
                  aria-current={isActive ? 'page' : undefined}
                  data-console-button={consoleMode}
                  style={{
                    pointerEvents: 'auto',
                    touchAction: 'manipulation'
                  }}
                >
                  <div className="relative">
                    {React.cloneElement(item.icon as React.ReactElement, {
                      className: `h-6 w-6 transition-all duration-200 ${
                        isActive ? 'scale-110 drop-shadow-glow' : ''
                      } ${!isPerformanceMode ? 'filter-none' : ''}`
                    })}
                    {item.badge && item.badge > 0 && (
                      <span 
                        className="absolute -top-1 -right-1 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
                        style={{ backgroundColor: getConsoleAccentColor(consoleMode) }}
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                    {isConsoleStyleActive && isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ 
                          boxShadow: `0 0 20px ${getConsoleAccentColor(consoleMode, 0.6)}`,
                          background: `radial-gradient(circle, ${getConsoleAccentColor(consoleMode, 0.1)} 0%, transparent 70%)`
                        }}
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.7, 0.3]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                      />
                    )}
                  </div>
                  <span className={`text-[10px] mt-1 font-medium transition-all duration-200 ${
                    isActive ? 'block opacity-100' : 'hidden opacity-0'
                  }`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeConsoleTab"
                      className="absolute top-0 left-0 right-0 h-0.5"
                      style={{ backgroundColor: getConsoleAccentColor(consoleMode) }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  )}
                </button>
              </ConsoleFocusable>
            );
          })}

          {/* Console Menu Button */}
          <ConsoleFocusable
            id="mobile-nav-menu"
            group="mobile-navigation"
            priority={75}
            className="min-h-[56px] min-w-[56px]"
            onActivate={handleMenuToggle}
          >
            <button
              onClick={handleMenuToggle}
              className={`
                w-full h-full flex flex-col items-center justify-center px-2 py-2 rounded-console transition-all duration-200 min-h-[56px] min-w-[56px]
                ${isDrawerOpen ? 'bg-console-accent/20 text-console-accent' : 'text-gray-400 hover:text-console-accent'}
              `}
              aria-label="Console Menu - More options"
              aria-expanded={isDrawerOpen}
              data-console-menu={consoleMode}
              style={{
                pointerEvents: 'auto',
                touchAction: 'manipulation'
              }}
            >
              <div className="relative">
                {isConsoleStyleActive ? (
                  <div className="relative">
                    <Power className={`h-6 w-6 transition-all duration-300 ${
                      isDrawerOpen ? 'rotate-180 scale-110' : ''
                    }`} style={{ color: isDrawerOpen ? getConsoleAccentColor(consoleMode) : undefined }} />
                    {isDrawerOpen && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ 
                          boxShadow: `0 0 15px ${getConsoleAccentColor(consoleMode, 0.8)}`
                        }}
                        animate={{
                          scale: [1, 1.3, 1],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <Menu className={`h-6 w-6 transition-transform ${isDrawerOpen ? 'rotate-90' : ''}`} />
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium transition-all duration-200 ${
                isDrawerOpen ? 'block opacity-100' : 'hidden opacity-0'
              }`}>
                {isConsoleStyleActive ? 'Power' : 'More'}
              </span>
            </button>
          </ConsoleFocusable>
        </div>
      </nav>

      {/* Console-themed Mobile Navigation Styles */}
      <style>{`
        .safe-area-pb {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        
        body {
          padding-bottom: calc(64px + env(safe-area-inset-bottom, 0));
        }
        
        /* Console Performance Optimizations */
        .console-performance-nav {
          will-change: transform;
          transform: translateZ(0);
        }
        
        .console-performance-mode * {
          animation-duration: 0.1s !important;
          transition-duration: 0.1s !important;
        }
        
        /* Console Navigation Effects */
        .console-navigation-active {
          transform: scale(1.02);
          transition: transform 0.2s ease-out;
        }
        
        .console-menu-toggle {
          animation: consoleMenuPulse 0.3s ease-out;
        }
        
        @keyframes consoleMenuPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        /* Console Button Glow Effects */
        .drop-shadow-glow {
          filter: drop-shadow(0 0 8px currentColor);
        }
        
        /* Touch Target Optimization for Console */
        .touch-target {
          min-width: 56px;
          min-height: 56px;
        }
        
        /* Console Theme Specific Styles */
        [data-console-mode="playstation"] {
          --console-primary: #3b82f6;
          --console-glow: 0 0 20px rgba(59, 130, 246, 0.3);
        }
        
        [data-console-mode="xbox"] {
          --console-primary: #22c55e;
          --console-glow: 0 0 20px rgba(34, 197, 94, 0.3);
        }
        
        [data-console-mode="switch"] {
          --console-primary: #ef4444;
          --console-glow: 0 0 20px rgba(239, 68, 68, 0.3);
        }
        
        /* Console Focus Ring */
        .console-focusable:focus-within {
          box-shadow: var(--console-glow, 0 0 20px rgba(59, 130, 246, 0.3));
          outline: 2px solid var(--console-primary, #3b82f6);
          outline-offset: 2px;
        }
        
        /* Mobile-specific Console Optimizations */
        @media (max-width: 768px) {
          .touch-target {
            min-width: 60px;
            min-height: 60px;
          }
          
          button, a, .touchable {
            min-width: 56px;
            min-height: 56px;
          }
          
          .console-navigation-active {
            transform: scale(1.01);
          }
        }
        
        /* Haptic Feedback Visual Indicators */
        @keyframes hapticPulse {
          0% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 0.7; }
        }
        
        .haptic-active {
          animation: hapticPulse 0.2s ease-out;
        }
      `}</style>
    </>
  );
}