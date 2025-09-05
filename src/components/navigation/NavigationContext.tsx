import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

// Navigation mode types for different user states
export type NavigationMode = 'normal' | 'crisis' | 'simplified' | 'professional';

// User preference settings for navigation
export interface NavigationPreferences {
  showQuickAccess: boolean;
  enableKeyboardShortcuts: boolean;
  enableVoiceNavigation: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  favoriteRoutes: string[];
  recentRoutes: string[];
  customShortcuts: Record<string, string>;
}

// Navigation context state
interface NavigationContextState {
  mode: NavigationMode;
  preferences: NavigationPreferences;
  isSearchOpen: boolean;
  isMobileMenuOpen: boolean;
  breadcrumbs: Array<{ label: string; path: string }>;
  quickActions: Array<{ label: string; action: () => void; icon?: string }>;
  crisisDetected: boolean;
  userRole: 'patient' | 'caregiver' | 'professional' | 'guest';
  favoriteRoutes: string[]; // Access via preferences.favoriteRoutes for compatibility
  recentRoutes: string[]; // Access via preferences.recentRoutes for compatibility
  setMode: (mode: NavigationMode) => void;
  updatePreferences: (prefs: Partial<NavigationPreferences>) => void;
  setSearchOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  addToFavorites: (route: string) => void;
  removeFromFavorites: (route: string) => void;
  addToRecent: (route: string) => void;
  setCrisisDetected: (detected: boolean) => void;
  setUserRole: (role: 'patient' | 'caregiver' | 'professional' | 'guest') => void;
}

// Default preferences
const defaultPreferences: NavigationPreferences = {
  showQuickAccess: true,
  enableKeyboardShortcuts: true,
  enableVoiceNavigation: false,
  reducedMotion: false,
  highContrast: false,
  fontSize: 'medium',
  favoriteRoutes: [],
  recentRoutes: [],
  customShortcuts: {},
};

// Create context
const NavigationContext = createContext<NavigationContextState | undefined>(undefined);

// Provider component
export function NavigationProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [mode, setMode] = useState<NavigationMode>('normal');
  const [preferences, setPreferences] = useState<NavigationPreferences>(() => {
    // Load preferences from localStorage if available
    const saved = localStorage.getItem('navigationPreferences');
    return saved ? { ...defaultPreferences, ...JSON.parse(saved) } : defaultPreferences;
  });
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [userRole, setUserRole] = useState<'patient' | 'caregiver' | 'professional' | 'guest'>('guest');
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ label: string; path: string }>>([]);

  // Update breadcrumbs based on current path
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const newBreadcrumbs: Array<{ label: string; path: string }> = [
      { label: 'Home', path: '/' }
    ];

    let currentPath = '';
    pathSegments.forEach(segment => {
      currentPath += `/${segment}`;
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      newBreadcrumbs.push({ label, path: currentPath });
    });

    setBreadcrumbs(newBreadcrumbs);
  }, [location]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('navigationPreferences', JSON.stringify(preferences));
  }, [preferences]);

  // Define functions first
  const updatePreferences = React.useCallback((prefs: Partial<NavigationPreferences>) => {
    setPreferences((prev: NavigationPreferences) => ({ ...prev, ...prefs }));
  }, []);

  const addToFavorites = React.useCallback((route: string) => {
    setPreferences((prev: NavigationPreferences) => ({
      ...prev,
      favoriteRoutes: [...new Set([...prev.favoriteRoutes, route])],
    }));
  }, []);

  const removeFromFavorites = React.useCallback((route: string) => {
    setPreferences((prev: NavigationPreferences) => ({
      ...prev,
      favoriteRoutes: prev.favoriteRoutes.filter((r: string) => r !== route),
    }));
  }, []);

  const addToRecent = React.useCallback((route: string) => {
    setPreferences((prev: NavigationPreferences) => {
      const recent = [route, ...prev.recentRoutes.filter((r: string) => r !== route)].slice(0, 10);
      return { ...prev, recentRoutes: recent };
    });
  }, []);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPreferences((prev: NavigationPreferences) => ({ ...prev, reducedMotion: mediaQuery.matches }));

    const handleChange = (e: MediaQueryListEvent) => {
      setPreferences((prev: NavigationPreferences) => ({ ...prev, reducedMotion: e.matches }));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Check for high contrast preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPreferences((prev: NavigationPreferences) => ({ ...prev, highContrast: mediaQuery.matches }));

    const handleChange = (e: MediaQueryListEvent) => {
      setPreferences((prev: NavigationPreferences) => ({ ...prev, highContrast: e.matches }));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Auto-detect crisis mode based on route
  useEffect(() => {
    if (location.pathname.includes('/crisis')) {
      setCrisisDetected(true);
      setMode('crisis');
    } else if (crisisDetected && !location.pathname.includes('/crisis')) {
      // Keep crisis mode active for a period after leaving crisis page
      const _timeout = setTimeout(() => {
        setCrisisDetected(false);
        setMode('normal');
      }, 5 * 60 * 1000); // 5 minutes
      return () => clearTimeout(_timeout);
    }
  }, [location, crisisDetected]);

  // Update recent routes
  useEffect(() => {
    addToRecent(location.pathname);
  }, [location, addToRecent]);

  // Quick actions based on current context
  const quickActions = React.useMemo(() => {
    const actions = [];
    
    if (crisisDetected) {
      actions.push(
        { label: 'Call Hotline', action: () => window.location.href = 'tel:988', icon: '📞' },
        { label: 'Text Support', action: () => window.location.href = 'sms:741741', icon: '💬' },
        { label: 'Breathing Exercise', action: () => window.location.href = '/wellness/breathing', icon: '🫁' }
      );
    } else {
      actions.push(
        { label: 'Log Mood', action: () => window.location.href = '/wellness/mood', icon: '😊' },
        { label: 'Journal', action: () => window.location.href = '/wellness/journal', icon: '📝' },
        { label: 'Meditate', action: () => window.location.href = '/wellness/meditation', icon: '🧘' }
      );
    }

    return actions;
  }, [crisisDetected]);

  const value: NavigationContextState = {
    mode,
    preferences,
    isSearchOpen,
    isMobileMenuOpen,
    breadcrumbs,
    quickActions,
    crisisDetected,
    userRole,
    favoriteRoutes: preferences.favoriteRoutes, // Expose as direct property for easier access
    recentRoutes: preferences.recentRoutes, // Expose as direct property for easier access
    setMode,
    updatePreferences,
    setSearchOpen,
    setMobileMenuOpen,
    addToFavorites,
    removeFromFavorites,
    addToRecent,
    setCrisisDetected,
    setUserRole,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

// Hook to use navigation context
export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}