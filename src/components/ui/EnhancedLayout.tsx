import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, AlertTriangle, Search, User, Settings, LogOut, 
  Home, _BarChart3, Heart, Users, Stethoscope, _Bell, 
  ChevronDown, Star, Clock, Command, Accessibility,
  Sparkles, _Moon, _Sun, _ChevronLeft, Phone, MessageCircle,
  Wind, Timer, BookOpen, _Activity
} from 'lucide-react';
import { NavigationProvider, useNavigation } from '../navigation/NavigationContext';
import { GlobalSearch } from '../navigation/GlobalSearch';
import { Breadcrumbs, MobileBreadcrumbs } from '../navigation/Breadcrumbs';
import { FloatingCrisisButton, MobileCrisisButton } from '../navigation/FloatingCrisisButton';
import { _MobileNavigation } from './MobileNavigation';
import { useEnhancedKeyboardNavigation } from '../../hooks/useEnhancedKeyboardNavigation';
import { useAuth } from '../../hooks/useAuth';
import { _PrivacyBanner, _FreeBadge } from './PrivacyBanner';
import { toast } from 'react-hot-toast';

interface EnhancedLayoutProps {
  children: ReactNode;
}

// Skip links for accessibility
function SkipLinks() {
  return (
    <div className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50">
      <a 
        href="#main-content" 
        className="bg-primary-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        Skip to main content
      </a>
      <a 
        href="#main-navigation" 
        className="bg-primary-600 text-white px-4 py-2 rounded-md ml-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        Skip to navigation
      </a>
      <a 
        href="#crisis-help" 
        className="bg-red-600 text-white px-4 py-2 rounded-md ml-2 focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        Skip to crisis help
      </a>
    </div>
  );
}

// User menu dropdown
function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const { _preferences, favoriteRoutes } = useNavigation();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsOpen(false);
                }
              }}
              role="button"
              tabIndex={0}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-40"
            >
              {/* User info */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="font-semibold text-gray-900 dark:text-white">{user?.name || 'Guest User'}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{user?.email || 'Not signed in'}</div>
              </div>

              {/* Favorite routes */}
              {favoriteRoutes.length > 0 && (
                <div className="px-2 py-2 border-b border-gray-200">
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500">FAVORITES</div>
                  {favoriteRoutes.slice(0, 3).map(route => (
                    <Link
                      key={route}
                      to={route}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Star className="h-3 w-3 mr-2 text-yellow-500" />
                      {route.split('/').pop() || 'Dashboard'}
                    </Link>
                  ))}
                </div>
              )}

              {/* Menu items */}
              <div className="px-2 py-2">
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <User className="h-4 w-4 mr-3" />
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    const _event = new CustomEvent('showKeyboardHelp');
                    window.dispatchEvent(_event);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <Command className="h-4 w-4 mr-3" />
                  Keyboard Shortcuts
                </button>
                <Link
                  to="/accessibility"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <Accessibility className="h-4 w-4 mr-3" />
                  Accessibility
                </Link>
              </div>

              {/* Logout */}
              <div className="px-2 py-2 border-t border-gray-200">
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                    toast.success('Logged out successfully');
                  }}
                  className="w-full flex items-center px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Log Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Quick access panel
// Unused component - kept for potential future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _QuickAccessPanel() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { quickActions, recentRoutes } = useNavigation();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Quick access"
      >
        <Clock className="h-5 w-5 text-gray-600" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setIsOpen(false);
                }
              }}
              role="button"
              tabIndex={0}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-40"
            >
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-3 gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        action.action();
                        setIsOpen(false);
                      }}
                      className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <span className="text-2xl mb-1">{action.icon}</span>
                      <span className="text-xs text-gray-600">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {recentRoutes.length > 0 && (
                <div className="border-t border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Recent Pages</h3>
                  <div className="space-y-1">
                    {recentRoutes.slice(0, 5).map((route, index) => (
                      <Link
                        key={index}
                        to={route}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Clock className="h-3 w-3 mr-2 text-gray-400" />
                        {route.split('/').pop() || 'Dashboard'}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main enhanced layout component
function EnhancedLayoutContent({ children }: EnhancedLayoutProps) {
  const location = useLocation();
  const { mode, _isSearchOpen, setSearchOpen, isMobileMenuOpen, setMobileMenuOpen, _preferences, _crisisDetected } = useNavigation();
  const [__isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<unknown>(null);
  const [_notificationCount] = useState(0);

  // Enhanced keyboard navigation
  useEnhancedKeyboardNavigation();

  // Navigation items based on mode - Crisis-first design
  const getNavigationItems = () => {
    if (mode === 'crisis') {
      // Simplified navigation for crisis mode
      return [
        { name: '🆘 Crisis Help', href: '/crisis', icon: <AlertTriangle className="h-5 w-5" /> },
        { name: '🌬️ Breathe', href: '/wellness/breathing', icon: <Wind className="h-5 w-5" /> },
        { name: '💬 Support', href: '/community', icon: <Users className="h-5 w-5" /> },
      ];
    }
    
    // Normal navigation - Maximum 5 sections with emoji visual anchors
    return [
      { name: '🏠 Home', href: '/', icon: <Home className="h-5 w-5" /> },
      { name: '🧘 Wellness Tools', href: '/wellness', icon: <Heart className="h-5 w-5" /> },
      { name: '💬 Community Support', href: '/community', icon: <Users className="h-5 w-5" /> },
      { name: '👨⚕️ Find Professionals', href: '/professional', icon: <Stethoscope className="h-5 w-5" /> },
      { name: '⚙️ My Settings', href: '/settings', icon: <Settings className="h-5 w-5" /> },
    ];
  };

  const navigation = getNavigationItems();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(_path);
  };

  // PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(_e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const __handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
      toast.success('App installed successfully!');
    }
    setDeferredPrompt(null);
  };

  return (
    <div className={`h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex ${_preferences.highContrast ? 'high-contrast' : ''} ${mode === 'crisis' ? 'crisis-mode' : ''} relative overflow-hidden`}>
      {/* Console Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-full blur-3xl"
        />
      </div>

      {/* Crisis Banner - Console Style */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 via-pink-600 to-red-600 text-white px-4 py-3 backdrop-blur-md shadow-console-depth">
        <div className="flex items-center justify-center space-x-6 text-sm font-medium">
          <motion.span 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center space-x-2"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>🆘 NEED HELP NOW?</span>
          </motion.span>
          <a 
            href="tel:988" 
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-console border border-white/20 hover:border-white/40 transition-all hover:scale-105"
          >
            <Phone className="h-4 w-4" />
            <span>Call 988</span>
          </a>
          <Link 
            to="/crisis" 
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-console border border-white/20 hover:border-white/40 transition-all hover:scale-105"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Crisis Chat</span>
          </Link>
        </div>
      </div>
      
      {/* Skip Links */}
      <SkipLinks />

      {/* Console Sidebar Navigation - Mobile Enhanced */}
      <motion.aside
        animate={{ 
          width: isMobileMenuOpen ? 300 : 90,
          x: window.innerWidth < 768 && !isMobileMenuOpen ? -90 : 0 // Hide on mobile when closed
        }}
        transition={{
          duration: 0.2,
          ease: 'easeInOut'
        }}
        className="bg-gradient-to-b from-gray-800/95 to-gray-900/95 border-r border-gray-700/50 flex-shrink-0 overflow-hidden backdrop-blur-console shadow-console-depth fixed z-50 md:relative md:z-30"
        style={{ 
          marginTop: '56px',
          pointerEvents: 'auto'
        }}
      >
        {/* Sidebar glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        
        <div className="p-6 relative z-10">
          {/* Console Logo */}
          <motion.div 
            className="flex items-center mb-10"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-console-lg flex items-center justify-center flex-shrink-0 shadow-console-glow">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <motion.div
              animate={{ opacity: isMobileMenuOpen ? 1 : 0 }}
              className="ml-4 overflow-hidden"
            >
              <h1 className="text-xl font-bold text-white mb-1">
                Astral Core
              </h1>
              <p className="text-sm text-gray-300">Mental Health Console</p>
            </motion.div>
          </motion.div>

          {/* Console Navigation */}
          <nav className="space-y-3">
            {navigation.map((item, index) => {
              const isActiveRoute = isActive(item.href);
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={item.href}
                    className={`group flex items-center p-4 rounded-console-lg transition-all duration-300 relative overflow-hidden min-h-[56px] min-w-[56px] ${
                      isActiveRoute
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-400/30 shadow-console-glow'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50 border border-gray-700/30 hover:border-gray-600/50'
                    }`}
                    style={{
                      pointerEvents: 'auto',
                      zIndex: 10
                    }}
                  >
                    {/* Console tile background effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className={`flex-shrink-0 p-2 rounded-console ${isActiveRoute ? 'bg-blue-500/20' : 'bg-gray-700/50 group-hover:bg-gray-600/50'} transition-colors duration-300`}>
                      {item.icon}
                    </div>
                    
                    <motion.div
                      animate={{ opacity: isMobileMenuOpen ? 1 : 0, x: isMobileMenuOpen ? 0 : -10 }}
                      className="ml-4 overflow-hidden relative z-10"
                    >
                      <span className="font-medium text-sm">
                        {item.name}
                      </span>
                      {isActiveRoute && (
                        <div className="w-full h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 mt-1 rounded-full" />
                      )}
                    </motion.div>

                    {/* Active indicator */}
                    {isActiveRoute && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r-full"
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Console Quick Wellness - Show when expanded */}
          <motion.div
            animate={{ opacity: isMobileMenuOpen ? 1 : 0, height: isMobileMenuOpen ? 'auto' : 0 }}
            className="mt-8 overflow-hidden"
          >
            <div className="flex items-center mb-4">
              <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent flex-1" />
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mx-3">
                Quick Actions
              </h3>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent flex-1" />
            </div>
            
            <div className="space-y-2">
              <Link
                to="/wellness/breathing"
                className="group flex items-center p-3 rounded-console text-gray-300 hover:text-white hover:bg-cyan-500/10 border border-gray-700/50 hover:border-cyan-400/30 transition-all duration-300 min-h-[56px] min-w-[56px]"
                style={{
                  pointerEvents: 'auto',
                  zIndex: 10
                }}
              >
                <div className="p-1.5 bg-cyan-500/20 rounded-console">
                  <Wind className="h-4 w-4 text-cyan-400" />
                </div>
                <span className="ml-3 text-sm font-medium">Breathing</span>
                <motion.div
                  className="ml-auto opacity-0 group-hover:opacity-100"
                  initial={false}
                  animate={{ x: 0 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                </motion.div>
              </Link>
              
              <Link
                to="/wellness/meditation"
                className="group flex items-center p-3 rounded-console text-gray-300 hover:text-white hover:bg-indigo-500/10 border border-gray-700/50 hover:border-indigo-400/30 transition-all duration-300 min-h-[56px] min-w-[56px]"
                style={{
                  pointerEvents: 'auto',
                  zIndex: 10
                }}
              >
                <div className="p-1.5 bg-indigo-500/20 rounded-console">
                  <Timer className="h-4 w-4 text-indigo-400" />
                </div>
                <span className="ml-3 text-sm font-medium">Meditation</span>
                <motion.div
                  className="ml-auto opacity-0 group-hover:opacity-100"
                  initial={false}
                  animate={{ x: 0 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                </motion.div>
              </Link>
              
              <Link
                to="/wellness/journal"
                className="group flex items-center p-3 rounded-console text-gray-300 hover:text-white hover:bg-green-500/10 border border-gray-700/50 hover:border-green-400/30 transition-all duration-300 min-h-[56px] min-w-[56px]"
                style={{
                  pointerEvents: 'auto',
                  zIndex: 10
                }}
              >
                <div className="p-1.5 bg-green-500/20 rounded-console">
                  <BookOpen className="h-4 w-4 text-green-400" />
                </div>
                <span className="ml-3 text-sm font-medium">Journal</span>
                <motion.div
                  className="ml-auto opacity-0 group-hover:opacity-100"
                  initial={false}
                  animate={{ x: 0 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                </motion.div>
              </Link>
            </div>
          </motion.div>

          {/* Console Bottom Actions */}
          <motion.div
            animate={{ opacity: isMobileMenuOpen ? 1 : 0 }}
            className="absolute bottom-6 left-6 right-6"
          >
            <div className="space-y-3">
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full flex items-center p-3 rounded-console text-gray-300 hover:text-white hover:bg-gray-700/50 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 group min-h-[56px] min-w-[56px]"
                style={{
                  pointerEvents: 'auto',
                  zIndex: 10
                }}
              >
                <div className="p-1.5 bg-gray-700/50 group-hover:bg-gray-600/50 rounded-console transition-colors">
                  <Search className="h-4 w-4" />
                </div>
                <span className="ml-3 text-sm font-medium">Search Platform</span>
              </button>
              <UserMenu />
            </div>
          </motion.div>
        </div>
      </motion.aside>

      {/* Console Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10" style={{ marginTop: '56px' }}>
        {/* Console Mobile Header - Enhanced Gaming Aesthetics */}
        <header 
          id="main-navigation"
          className="bg-gradient-to-r from-gray-800/95 via-gray-850/95 to-gray-800/95 backdrop-blur-console border-b border-gray-700/50 px-4 py-3 lg:hidden shadow-console-card relative overflow-hidden"
        >
          {/* Header gaming accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-console-accent to-transparent opacity-30" />
          
          <div className="flex justify-between items-center relative z-10">
            {/* Mobile Console Title - Gaming Style */}
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-console-accent to-blue-500 rounded-console-lg flex items-center justify-center shadow-console-glow relative">
                <Sparkles className="w-6 h-6 text-white" />
                <div className="absolute inset-0 bg-gradient-to-r from-console-accent/20 to-blue-500/20 rounded-console-lg blur-sm" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide">
                  ASTRAL CORE
                </h1>
                <p className="text-xs text-console-accent font-medium tracking-wider">
                  MENTAL HEALTH CONSOLE
                </p>
              </div>
            </motion.div>

            {/* Console Menu Toggle - Gaming Button */}
            <motion.button
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              className="console-focusable group relative p-3 rounded-console-lg text-gray-300 hover:text-white bg-gray-700/30 hover:bg-gray-600/40 border border-gray-600/50 hover:border-console-accent/50 transition-all duration-300 shadow-console-card min-h-[56px] min-w-[56px]"
              aria-label="Toggle console sidebar"
              aria-expanded={isMobileMenuOpen}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                pointerEvents: 'auto',
                zIndex: 20
              }}
            >
              {/* Button glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-console-accent/10 to-blue-500/10 rounded-console-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <motion.div
                animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </motion.div>
            </motion.button>
          </div>
        </header>

        {/* Console Breadcrumbs - Mobile Optimized */}
        <div className="bg-gradient-to-r from-gray-800/40 via-gray-850/50 to-gray-800/40 backdrop-blur-console px-4 md:px-6 py-3 border-b border-gray-700/30 relative overflow-hidden">
          {/* Mobile breadcrumb accent */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-console-accent/30 to-transparent" />
          
          <div className="hidden md:block">
            <Breadcrumbs />
          </div>
          <div className="block md:hidden">
            <MobileBreadcrumbs />
          </div>
        </div>

        {/* Console Main Content - Mobile Enhanced */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-transparent relative smooth-scroll">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: _preferences.reducedMotion ? 0 : 0.4 }}
            className="relative z-10 min-h-screen console-safe-area"
          >
            {children}
          </motion.div>
          
          {/* Mobile bottom padding for fixed nav */}
          <div className="h-20 md:h-0" /> {/* Safe area for mobile navigation */}
        </main>
      </div>

      {/* Global Search */}
      <GlobalSearch />
      
      {/* Mobile Console Navigation Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Floating Crisis Button - Mobile Enhanced */}
      <FloatingCrisisButton />
      <MobileCrisisButton />
      
      {/* Console Mobile Safe Area Styles */}
      <style>{`
        .console-safe-area {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        
        @media (max-width: 768px) {
          .console-safe-area {
            padding-left: env(safe-area-inset-left, 0);
            padding-right: env(safe-area-inset-right, 0);
          }
        }
        
        .backdrop-blur-console {
          backdrop-filter: blur(_12px);
          -webkit-backdrop-filter: blur(_12px);
        }
      `}</style>
    </div>
  );
}

// Export the wrapped component
export function EnhancedLayout({ children }: EnhancedLayoutProps) {
  return (
    <NavigationProvider>
      <EnhancedLayoutContent>{children}</EnhancedLayoutContent>
    </NavigationProvider>
  );
}