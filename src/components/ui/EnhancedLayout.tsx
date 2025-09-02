import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, AlertTriangle, Search, User, Settings, LogOut, 
  Home, BarChart3, Heart, Users, Stethoscope, Bell, 
  ChevronDown, Star, Clock, Command, Accessibility,
  Sparkles, Moon, Sun, ChevronLeft, Phone, MessageCircle,
  Wind, Timer, BookOpen, Activity
} from 'lucide-react';
import { NavigationProvider, useNavigation } from '../navigation/NavigationContext';
import { GlobalSearch } from '../navigation/GlobalSearch';
import { Breadcrumbs, MobileBreadcrumbs } from '../navigation/Breadcrumbs';
import { FloatingCrisisButton, MobileCrisisButton } from '../navigation/FloatingCrisisButton';
import { MobileNavigation } from './MobileNavigation';
import { useEnhancedKeyboardNavigation } from '../../hooks/useEnhancedKeyboardNavigation';
import { useAuth } from '../../contexts/AnonymousAuthContext';
import { PrivacyBanner, FreeBadge } from './PrivacyBanner';
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
  const { preferences, favoriteRoutes } = useNavigation();

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
                    const event = new CustomEvent('showKeyboardHelp');
                    window.dispatchEvent(event);
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
function QuickAccessPanel() {
  const { quickActions, recentRoutes } = useNavigation();
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
  const { 
    mode, 
    isSearchOpen, 
    setSearchOpen, 
    isMobileMenuOpen, 
    setMobileMenuOpen,
    preferences,
    crisisDetected 
  } = useNavigation();
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [notificationCount] = useState(0);

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
      { name: '👨‍⚕️ Find Professionals', href: '/professional', icon: <Stethoscope className="h-5 w-5" /> },
      { name: '⚙️ My Settings', href: '/settings', icon: <Settings className="h-5 w-5" /> },
    ];
  };

  const navigation = getNavigationItems();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
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
    <div className={`h-screen bg-gray-50 dark:bg-gray-900 flex ${preferences.highContrast ? 'high-contrast' : ''} ${mode === 'crisis' ? 'crisis-mode' : ''}`}>
      {/* Crisis Banner - Always at top */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-pink-500 to-red-600 text-white px-4 py-2">
        <div className="flex items-center justify-center space-x-4 text-sm font-medium">
          <span>🆘 NEED HELP NOW?</span>
          <a 
            href="tel:988" 
            className="flex items-center space-x-1 bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-lg transition-all"
          >
            <Phone className="h-4 w-4" />
            <span>Call 988</span>
          </a>
          <Link 
            to="/crisis" 
            className="flex items-center space-x-1 bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-lg transition-all"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Crisis Chat</span>
          </Link>
        </div>
      </div>
      
      {/* Skip Links */}
      <SkipLinks />

      {/* Sidebar Navigation */}
      <motion.aside
        animate={{ width: isMobileMenuOpen ? 280 : 80 }}
        className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-hidden"
        style={{ marginTop: '48px' }} // Space for crisis banner
      >
        <div className="p-4">
          {/* Logo */}
          <div className="flex items-center mb-8">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <motion.div
              animate={{ opacity: isMobileMenuOpen ? 1 : 0 }}
              className="ml-3 overflow-hidden"
            >
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Wellness Suite
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Your mental health toolkit</p>
            </motion.div>
          </div>

          {/* Main Navigation */}
          <nav className="space-y-2">
            {navigation.map((item) => {
              const isActiveRoute = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center p-3 rounded-lg transition-all duration-200 ${
                    isActiveRoute
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {item.icon}
                  </div>
                  <motion.span
                    animate={{ opacity: isMobileMenuOpen ? 1 : 0 }}
                    className="ml-3 font-medium overflow-hidden whitespace-nowrap"
                  >
                    {item.name}
                  </motion.span>
                </Link>
              );
            })}
          </nav>

          {/* Wellness Tools - Show when expanded */}
          <motion.div
            animate={{ opacity: isMobileMenuOpen ? 1 : 0, height: isMobileMenuOpen ? 'auto' : 0 }}
            className="mt-8 overflow-hidden"
          >
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Quick Wellness
            </h3>
            <div className="space-y-2">
              <Link
                to="/wellness/breathing"
                className="group flex items-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-cyan-50 hover:text-cyan-700 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <Wind className="h-4 w-4" />
                <span className="ml-3 text-sm">Breathing</span>
              </Link>
              <Link
                to="/wellness/meditation"
                className="group flex items-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <Timer className="h-4 w-4" />
                <span className="ml-3 text-sm">Meditation</span>
              </Link>
              <Link
                to="/wellness/journal"
                className="group flex items-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-green-50 hover:text-green-700 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <BookOpen className="h-4 w-4" />
                <span className="ml-3 text-sm">Journal</span>
              </Link>
            </div>
          </motion.div>

          {/* Bottom Actions */}
          <motion.div
            animate={{ opacity: isMobileMenuOpen ? 1 : 0 }}
            className="absolute bottom-4 left-4 right-4"
          >
            <div className="space-y-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full flex items-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <Search className="h-4 w-4" />
                <span className="ml-3 text-sm">Search</span>
              </button>
              <UserMenu />
            </div>
          </motion.div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col" style={{ marginTop: '48px' }}>
        {/* Top Bar - Mobile Actions */}
        <header 
          id="main-navigation"
          className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 lg:hidden"
        >
          <div className="flex justify-between items-center">
            {/* Mobile Title */}
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Wellness Suite
            </h1>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle sidebar"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <ChevronLeft className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </header>

        {/* Breadcrumbs */}
        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <Breadcrumbs />
        </div>

        {/* Main Content */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: preferences.reducedMotion ? 0 : 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Global Search */}
      <GlobalSearch />
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