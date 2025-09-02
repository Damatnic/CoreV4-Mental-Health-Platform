import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, AlertTriangle, Search, User, Settings, LogOut, 
  Home, BarChart3, Heart, Users, Stethoscope, Bell, 
  ChevronDown, Star, Clock, Command, Accessibility,
  Sparkles, Moon, Sun, ChevronLeft
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

  // Navigation items based on mode
  const getNavigationItems = () => {
    if (mode === 'crisis') {
      // Simplified navigation for crisis mode
      return [
        { name: 'Help', href: '/crisis', icon: <AlertTriangle className="h-4 w-4" /> },
        { name: 'Breathe', href: '/wellness/breathing', icon: <Heart className="h-4 w-4" /> },
        { name: 'Support', href: '/community', icon: <Users className="h-4 w-4" /> },
      ];
    }
    
    // Normal navigation - Dashboard is now the home page
    return [
      { name: 'Dashboard', href: '/', icon: <BarChart3 className="h-4 w-4" /> },
      { name: 'Wellness', href: '/wellness', icon: <Heart className="h-4 w-4" /> },
      { name: 'Community', href: '/community', icon: <Users className="h-4 w-4" /> },
      { name: 'Professional', href: '/professional', icon: <Stethoscope className="h-4 w-4" /> },
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
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${preferences.highContrast ? 'high-contrast' : ''} ${mode === 'crisis' ? 'crisis-mode' : ''}`}>
      {/* Privacy Banner - Always visible */}
      <PrivacyBanner />
      
      {/* Skip Links */}
      <SkipLinks />

      {/* Header */}
      <header 
        id="main-navigation"
        className={`sticky top-0 z-50 ${
          mode === 'crisis' 
            ? 'bg-gradient-to-r from-pink-50 to-red-50 border-b-2 border-red-200' 
            : 'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'
        } transition-all duration-300`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Simplified Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                    Wellness Suite
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Your mental health toolkit</p>
                </div>
              </Link>
            </div>

            {/* Simplified Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center space-x-2">
              {/* Simplified Search Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Notifications - Simplified */}
              <button
                className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-gradient-to-r from-pink-400 to-red-500 rounded-full animate-pulse"></span>
                )}
              </button>

              {/* User Menu */}
              <UserMenu />

              {/* Install PWA Button */}
              {isInstallable && (
                <button
                  onClick={handleInstallClick}
                  className="hidden sm:flex px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
                >
                  Install App
                </button>
              )}
              
              {/* Crisis Button - Always Visible */}
              <Link
                to="/crisis"
                id="crisis-help"
                className={`flex items-center space-x-1 px-4 py-2 ${
                  crisisDetected 
                    ? 'bg-gradient-to-r from-pink-500 to-red-600 animate-pulse' 
                    : 'bg-gradient-to-r from-pink-400 to-red-500'
                } text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200`}
              >
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Crisis</span>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <div className="px-4 py-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center px-3 py-2 rounded-lg text-base font-medium transition-all duration-200
                      ${isActive(item.href)
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    {item.icon}
                    <span className="ml-2">{item.name}</span>
                  </Link>
                ))}
                
                {/* Mobile Search */}
                <button
                  onClick={() => {
                    setSearchOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Search className="h-4 w-4" />
                  <span className="ml-2">Search</span>
                </button>
                
                {/* Mobile Install Button */}
                {isInstallable && (
                  <button
                    onClick={handleInstallClick}
                    className="w-full text-left px-3 py-2 rounded-lg text-base font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg transition-all duration-200"
                  >
                    📱 Install App
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Breadcrumbs */}
      <Breadcrumbs />
      <MobileBreadcrumbs />

      {/* Main Content */}
      <main id="main-content" className="flex-1 pb-16 md:pb-0 bg-gray-50 dark:bg-gray-900">
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

      {/* Global Search */}
      <GlobalSearch />

      {/* Floating Crisis Button */}
      <FloatingCrisisButton />
      <MobileCrisisButton />

      {/* Mobile Navigation */}
      <MobileNavigation />

      {/* Footer - Hidden on mobile to save space */}
      <footer className="hidden md:block bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/wellness/guide" className="hover:text-primary-600">Mental Health Guide</Link></li>
                <li><Link to="/crisis" className="hover:text-primary-600">Crisis Resources</Link></li>
                <li><Link to="/wellness/self-care" className="hover:text-primary-600">Self-Care Tips</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Community</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/community/groups" className="hover:text-primary-600">Support Groups</Link></li>
                <li><Link to="/community/stories" className="hover:text-primary-600">Success Stories</Link></li>
                <li><Link to="/community/events" className="hover:text-primary-600">Events</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">About</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/about" className="hover:text-primary-600">Our Mission</Link></li>
                <li><Link to="/privacy" className="hover:text-primary-600">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-primary-600">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Emergency Contacts</h3>
              <ul className="space-y-2 text-sm">
                <li className="text-red-600 font-semibold">Crisis Hotline: 988</li>
                <li className="text-gray-600">Text HOME to 741741</li>
                <li className="text-gray-600">Emergency: 911</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>© 2025 CoreV4 Mental Health Platform. Built with care for your wellbeing.</p>
          </div>
        </div>
      </footer>
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