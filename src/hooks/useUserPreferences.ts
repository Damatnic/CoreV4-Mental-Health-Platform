import { useState, useEffect, useCallback } from 'react';
import { secureStorage } from '../services/security/SecureLocalStorage';

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto' | 'calm' | 'focus';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  accessibility: AccessibilityPreferences;
  quickActions: QuickActionPreferences;
  dashboard: DashboardPreferences;
}

interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  crisisAlerts: boolean;
  medicationReminders: boolean;
  appointmentReminders: boolean;
  moodCheckIns: boolean;
  supportMessages: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface PrivacyPreferences {
  shareLocation: boolean;
  shareWithTherapist: boolean;
  anonymousData: boolean;
  emergencyContactAccess: boolean;
  dataRetention: '30days' | '90days' | '1year' | 'forever';
}

interface AccessibilityPreferences {
  fontSize: number;
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  voiceControl: boolean;
}

interface QuickActionPreferences {
  layout: 'grid' | 'list' | 'compact';
  showLabels: boolean;
  showDescriptions: boolean;
  actionSize: 'small' | 'medium' | 'large';
  frequentActionsCount: number;
  contextualSuggestions: boolean;
}

interface DashboardPreferences {
  widgetLayout: string[];
  compactMode: boolean;
  showWelcomeMessage: boolean;
  defaultView: 'overview' | 'crisis' | 'wellness' | 'schedule';
  refreshInterval: number;
}

const defaultPreferences: UserPreferences = {
  theme: 'auto',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  notifications: {
    enabled: true,
    sound: true,
    vibration: true,
    crisisAlerts: true,
    medicationReminders: true,
    appointmentReminders: true,
    moodCheckIns: true,
    supportMessages: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  },
  privacy: {
    shareLocation: false,
    shareWithTherapist: true,
    anonymousData: true,
    emergencyContactAccess: true,
    dataRetention: '1year'
  },
  accessibility: {
    fontSize: 100,
    highContrast: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: true,
    voiceControl: false
  },
  quickActions: {
    layout: 'grid',
    showLabels: true,
    showDescriptions: true,
    actionSize: 'medium',
    frequentActionsCount: 5,
    contextualSuggestions: true
  },
  dashboard: {
    widgetLayout: [],
    compactMode: false,
    showWelcomeMessage: true,
    defaultView: 'overview',
    refreshInterval: 60
  }
};

export function useUserPreferences(userId: string) {
  const [preferences, setPreferences] = useState<UserPreferences>(_defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load preferences from localStorage or API
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        
        // Try to load from localStorage first
        const _localKey = `userPreferences_${userId}`;
        const _savedPreferences = secureStorage.getItem(_localKey);
        
        if (_savedPreferences) {
          const parsed = JSON.parse(_savedPreferences);
          setPreferences({ ...defaultPreferences, ...parsed });
        } else {
          // If not in localStorage, you could fetch from API here
          // const response = await fetch(`/api/users/${userId}/preferences`);
          // const data = await response.json();
          // setPreferences(_data);
        }
      } catch (error) {
        logger.error('Error loading preferences:', err);
        setError('Failed to load preferences');
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [userId]);

  // Save preferences to localStorage (and optionally to API)
  const savePreferences = useCallback(async (_newPreferences: UserPreferences) => {
    try {
      const _localKey = `userPreferences_${userId}`;
      secureStorage.setItem(_localKey, JSON.stringify(_newPreferences));
      
      // Optionally save to API
      // await fetch(`/api/users/${userId}/preferences`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(_newPreferences)
      // });
      
      return true;
    } catch (error) {
      logger.error('Error saving preferences:', err);
      setError('Failed to save preferences');
      return false;
    }
  }, [userId]);

  // Update a specific preference
  const _updatePreference  = useCallback(async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    const _newPreferences = { ...preferences, [key]: value };
    setPreferences(_newPreferences);
    await savePreferences(_newPreferences);
  }, [preferences, savePreferences]);

  // Update nested preference
  const _updateNestedPreference  = useCallback(async <
    K extends keyof UserPreferences,
    NK extends keyof UserPreferences[K]
  >(
    category: K,
    key: NK,
    value: UserPreferences[K][NK]
  ) => {
    const _newPreferences = {
      ...preferences,
      [category]: {
        ...(preferences[category] as object),
        [key]: value
      }
    };
    setPreferences(_newPreferences);
    await savePreferences(_newPreferences);
  }, [preferences, savePreferences]);

  // Reset to defaults
  const _resetToDefaults  = useCallback(async () => {
    setPreferences(_defaultPreferences);
    await savePreferences(_defaultPreferences);
  }, [savePreferences]);

  // Export preferences
  const _exportPreferences  = useCallback(() => {
    const _dataStr = JSON.stringify(preferences, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${ encodeURIComponent(_dataStr)}`;
    
    const exportFileDefaultName = `preferences_${userId}_${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [preferences, userId]);

  // Import preferences
  const _importPreferences  = useCallback(async (file: File): Promise<boolean> => {
    try {
      const _text = await file._text();
      const imported = JSON.parse(_text);
      
      // Validate imported preferences
      if (!imported.theme || !imported.notifications) {
        throw new Error('Invalid preferences file');
      }
      
      const _newPreferences = { ...defaultPreferences, ...imported };
      setPreferences(_newPreferences);
      await savePreferences(_newPreferences);
      
      return true;
    } catch (error) {
      logger.error('Error importing preferences:', err);
      setError('Failed to import preferences');
import { logger } from '../utils/logger';
      return false;
    }
  }, [savePreferences]);

  // Apply theme
  useEffect(() => {
    const applyTheme = () => {
      let theme = preferences.theme;
      
      if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = prefersDark ? 'dark' : 'light';
      }
      
      document.documentElement.setAttribute('data-theme', theme);
      
      // Apply theme-specific classes
      document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-calm', 'theme-focus');
      document.documentElement.classList.add(`theme-${theme}`);
    };

    applyTheme();
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', applyTheme);
    
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [preferences.theme]);

  // Apply accessibility preferences
  useEffect(() => {
    const root = document.documentElement;
    
    // Font size
    root.style.fontSize = `${preferences.accessibility.fontSize}%`;
    
    // High contrast
    if (preferences.accessibility.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Reduced motion
    if (preferences.accessibility.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [preferences.accessibility]);

  return {
    preferences,
    loading,
    error,
    updatePreference,
    updateNestedPreference,
    resetToDefaults,
    exportPreferences,
    importPreferences
  };
}