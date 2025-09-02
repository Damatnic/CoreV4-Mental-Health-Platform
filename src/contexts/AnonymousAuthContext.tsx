/**
 * Anonymous-Only Authentication Context
 * 
 * Provides anonymous access without any registration or data collection
 * All user data is stored locally and never transmitted
 * Complete privacy and anonymity guaranteed
 * SECURITY: Updated to use secure storage and backend integration
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { secureStorage } from '../services/security/SecureLocalStorage';
import { ApiService } from '../services/api/ApiService';

interface AnonymousUser {
  id: string; // Random session ID stored locally only
  nickname?: string; // Optional friendly name (stored locally)
  name?: string; // Optional display name for dashboard components
  email?: string; // Optional email for display purposes only (never transmitted)
  token?: string; // Optional session token for authenticated features
  profile: {
    pronouns?: string;
    ageRange?: '13-17' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
    preferredLanguage?: string;
    timezone?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    mentalHealthGoals?: string[];
    supportPreferences?: {
      peerSupport: boolean;
      professionalSupport: boolean;
      groupActivities: boolean;
      onlineTherapy: boolean;
    };
    triggerWarnings?: string[];
    copingStrategies?: string[];
    medication?: {
      taking: boolean;
      reminders: boolean;
      names?: string[];
    };
    therapyExperience?: 'none' | 'some' | 'extensive';
    crisisHistory?: boolean;
  };
  preferences: {
    theme?: 'light' | 'dark' | 'auto';
    fontSize?: 'small' | 'medium' | 'large';
    reducedMotion?: boolean;
    highContrast?: boolean;
    colorBlind?: boolean;
    screenReader?: boolean;
    language?: string;
    notifications?: {
      enabled: boolean;
      types: {
        moodReminders: boolean;
        medicationReminders: boolean;
        appointmentReminders: boolean;
        crisisAlerts: boolean;
        communityUpdates: boolean;
        achievementAlerts: boolean;
      };
      schedule: {
        quietHours: { start: string; end: string };
        weekendDifferent: boolean;
      };
    };
    privacy?: {
      shareProgress: boolean;
      allowCommunityInteraction: boolean;
      dataRetentionDays: number;
      exportDataOnExit: boolean;
    };
  };
  sessionStarted: Date;
  isAnonymous: true; // Always true
  lastActive: Date;
  dataVersion: string;
  sessionStats: {
    moodEntriesCount: number;
    wellnessActivitiesCompleted: number;
    communityInteractions: number;
    therapeuticContentAccessed: number;
    crisisResourcesUsed: number;
  };
}

interface AnonymousAuthContextType {
  // User state
  user: AnonymousUser;
  isAuthenticated: true; // Always authenticated as anonymous
  isAnonymous: true; // Always anonymous
  
  // Profile management (no server calls)
  updateNickname: (nickname: string) => void;
  updateProfile: (profile: Partial<AnonymousUser['profile']>) => void;
  updatePreferences: (preferences: Partial<AnonymousUser['preferences']>) => void;
  updateSessionStats: (stats: Partial<AnonymousUser['sessionStats']>) => void;
  
  // Data management
  exportUserData: () => Promise<string>;
  importUserData: (data: string) => Promise<boolean>;
  clearLocalData: () => void;
  logout: () => void; // Alias for clearLocalData for compatibility
  
  // Session info
  sessionDuration: number; // Minutes since session started
  extendSession: () => void;
  updateLastActive: () => void;
  
  // Security & Privacy
  isDataStale: () => boolean;
  cleanupStaleData: () => void;
  validateDataIntegrity: () => boolean;
  
  // Analytics (anonymous)
  getSessionInsights: () => {
    totalSessions: number;
    averageSessionDuration: number;
    mostUsedFeatures: string[];
    wellnessProgress: number;
    lastWeekActivity: number[];
  };
}

const AnonymousAuthContext = createContext<AnonymousAuthContextType | undefined>(undefined);

export function useAnonymousAuth() {
  const context = useContext(AnonymousAuthContext);
  if (!context) {
    throw new Error('useAnonymousAuth must be used within AnonymousAuthProvider');
  }
  return context;
}


// Generate a random session ID (never sent to server)
function generateSessionId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get or create anonymous user from secure storage with data migration
function getOrCreateAnonymousUser(): AnonymousUser {
  const stored = secureStorage.getItem('anonymous_user');
  
  if (stored) {
    try {
      const user = JSON.parse(stored);
      
      // Restore date objects
      user.sessionStarted = new Date(user.sessionStarted);
      user.lastActive = user.lastActive ? new Date(user.lastActive) : new Date();
      
      // Migrate old data structure if needed
      if (!user.dataVersion || user.dataVersion < '2.0') {
        console.info('🔄 Migrating user data to new structure...');
        return migrateUserData(user);
      }
      
      return user;
    } catch (error) {
      console.error('Failed to parse stored user data:', error);
      // Create new user if data is corrupted
    }
  }
  
  // Create new anonymous user with complete structure
  const newUser: AnonymousUser = {
    id: generateSessionId(),
    profile: {
      supportPreferences: {
        peerSupport: true,
        professionalSupport: false,
        groupActivities: true,
        onlineTherapy: false,
      },
      mentalHealthGoals: [],
      triggerWarnings: [],
      copingStrategies: [],
      medication: {
        taking: false,
        reminders: false,
      },
      therapyExperience: 'none',
      crisisHistory: false,
    },
    preferences: {
      theme: 'auto',
      fontSize: 'medium',
      reducedMotion: false,
      highContrast: false,
      colorBlind: false,
      screenReader: false,
      language: 'en',
      notifications: {
        enabled: true,
        types: {
          moodReminders: true,
          medicationReminders: false,
          appointmentReminders: true,
          crisisAlerts: true,
          communityUpdates: false,
          achievementAlerts: true,
        },
        schedule: {
          quietHours: { start: '22:00', end: '07:00' },
          weekendDifferent: false,
        },
      },
      privacy: {
        shareProgress: false,
        allowCommunityInteraction: true,
        dataRetentionDays: 365,
        exportDataOnExit: false,
      },
    },
    sessionStarted: new Date(),
    lastActive: new Date(),
    isAnonymous: true,
    dataVersion: '2.0',
    sessionStats: {
      moodEntriesCount: 0,
      wellnessActivitiesCompleted: 0,
      communityInteractions: 0,
      therapeuticContentAccessed: 0,
      crisisResourcesUsed: 0,
    },
  };
  
  secureStorage.setItem('anonymous_user', JSON.stringify(newUser));
  return newUser;
}

// Migrate user data from older versions
function migrateUserData(oldUser: any): AnonymousUser {
  const migratedUser: AnonymousUser = {
    ...oldUser,
    profile: {
      ...oldUser.profile,
      supportPreferences: oldUser.profile?.supportPreferences || {
        peerSupport: true,
        professionalSupport: false,
        groupActivities: true,
        onlineTherapy: false,
      },
      mentalHealthGoals: oldUser.profile?.mentalHealthGoals || [],
      triggerWarnings: oldUser.profile?.triggerWarnings || [],
      copingStrategies: oldUser.profile?.copingStrategies || [],
      medication: oldUser.profile?.medication || {
        taking: false,
        reminders: false,
      },
      therapyExperience: oldUser.profile?.therapyExperience || 'none',
      crisisHistory: oldUser.profile?.crisisHistory || false,
    },
    preferences: {
      ...oldUser.preferences,
      notifications: oldUser.preferences?.notifications || {
        enabled: true,
        types: {
          moodReminders: true,
          medicationReminders: false,
          appointmentReminders: true,
          crisisAlerts: true,
          communityUpdates: false,
          achievementAlerts: true,
        },
        schedule: {
          quietHours: { start: '22:00', end: '07:00' },
          weekendDifferent: false,
        },
      },
      privacy: oldUser.preferences?.privacy || {
        shareProgress: false,
        allowCommunityInteraction: true,
        dataRetentionDays: 365,
        exportDataOnExit: false,
      },
    },
    lastActive: oldUser.lastActive ? new Date(oldUser.lastActive) : new Date(),
    dataVersion: '2.0',
    sessionStats: oldUser.sessionStats || {
      moodEntriesCount: 0,
      wellnessActivitiesCompleted: 0,
      communityInteractions: 0,
      therapeuticContentAccessed: 0,
      crisisResourcesUsed: 0,
    },
  };
  
  // Save migrated data
  secureStorage.setItem('anonymous_user', JSON.stringify(migratedUser));
  console.info('✅ User data migration completed');
  
  return migratedUser;
}

export function AnonymousAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AnonymousUser>(getOrCreateAnonymousUser);
  const [sessionDuration, setSessionDuration] = useState(0);
  
  // Update session duration every minute
  useEffect(() => {
    const updateDuration = () => {
      const minutes = Math.floor((Date.now() - user.sessionStarted.getTime()) / 60000);
      setSessionDuration(minutes);
    };
    
    updateDuration();
    const interval = setInterval(updateDuration, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [user.sessionStarted]);
  
  // Auto-update last active and cleanup stale data
  useEffect(() => {
    const handleActivity = () => updateLastActive();
    
    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });
    
    // Cleanup stale data on component mount
    cleanupStaleData();
    
    // Validate data integrity
    if (!validateDataIntegrity()) {
      console.warn('⚠️ Data integrity issues detected, creating fresh user data');
      setUser(getOrCreateAnonymousUser());
    }
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, []);
  
  // Save user to secure storage whenever it changes
  useEffect(() => {
    secureStorage.setItem('anonymous_user', JSON.stringify(user));
  }, [user]);
  
  const updateNickname = (nickname: string) => {
    setUser(prev => ({ 
      ...prev, 
      nickname,
      lastActive: new Date(),
    }));
  };
  
  const updateProfile = (profile: Partial<AnonymousUser['profile']>) => {
    setUser(prev => ({
      ...prev,
      profile: { ...prev.profile, ...profile },
      lastActive: new Date(),
    }));
  };
  
  const updatePreferences = (preferences: Partial<AnonymousUser['preferences']>) => {
    setUser(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...preferences },
      lastActive: new Date(),
    }));
  };
  
  const updateSessionStats = (stats: Partial<AnonymousUser['sessionStats']>) => {
    setUser(prev => ({
      ...prev,
      sessionStats: { ...prev.sessionStats, ...stats },
      lastActive: new Date(),
    }));
  };
  
  const updateLastActive = () => {
    setUser(prev => ({
      ...prev,
      lastActive: new Date(),
    }));
  };
  
  const clearLocalData = () => {
    secureStorage.removeItem('anonymous_user');
    // Clear all other local data (both secure and regular storage)
    secureStorage.clear();
    sessionStorage.clear();
    // Create fresh anonymous user
    setUser(getOrCreateAnonymousUser());
  };
  
  const extendSession = () => {
    // Update the session started time and last active
    setUser(prev => ({ 
      ...prev, 
      sessionStarted: new Date(),
      lastActive: new Date(),
    }));
  };
  
  // Export user data for backup or transfer
  const exportUserData = async (): Promise<string> => {
    try {
      const exportData = {
        user,
        exportDate: new Date().toISOString(),
        version: '2.0',
        // Include wellness and activity data from other stores
        wellnessData: localStorage.getItem('wellness-storage'),
        activityData: localStorage.getItem('activity-store'),
        metadata: {
          sessionDuration,
          totalSessions: 1, // Could be enhanced to track multiple sessions
        },
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw new Error('Unable to export data. Please try again.');
    }
  };
  
  // Import user data from backup
  const importUserData = async (data: string): Promise<boolean> => {
    try {
      const importedData = JSON.parse(data);
      
      // Validate data structure
      if (!importedData.user || !importedData.version) {
        throw new Error('Invalid data format');
      }
      
      // Restore user data
      const restoredUser = {
        ...importedData.user,
        sessionStarted: new Date(importedData.user.sessionStarted),
        lastActive: new Date(importedData.user.lastActive || new Date()),
        id: generateSessionId(), // Generate new session ID for security
      };
      
      setUser(restoredUser);
      
      // Restore related data if present
      if (importedData.wellnessData) {
        localStorage.setItem('wellness-storage', importedData.wellnessData);
      }
      if (importedData.activityData) {
        localStorage.setItem('activity-store', importedData.activityData);
      }
      
      console.info('✅ Successfully imported user data');
      return true;
    } catch (error) {
      console.error('Failed to import user data:', error);
      return false;
    }
  };
  
  // Check if data is stale (older than retention period)
  const isDataStale = (): boolean => {
    const retentionDays = user.preferences.privacy?.dataRetentionDays || 365;
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - retentionDays);
    
    return new Date(user.lastActive) < staleDate;
  };
  
  // Clean up stale data based on privacy preferences
  const cleanupStaleData = () => {
    if (isDataStale()) {
      console.info('🧹 Cleaning up stale data based on privacy preferences');
      clearLocalData();
    }
  };
  
  // Validate data integrity
  const validateDataIntegrity = (): boolean => {
    try {
      // Check essential fields
      if (!user.id || !user.sessionStarted || !user.dataVersion) {
        return false;
      }
      
      // Check data structure
      if (!user.profile || !user.preferences || !user.sessionStats) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Data integrity validation failed:', error);
      return false;
    }
  };
  
  // Get session insights
  const getSessionInsights = () => {
    return {
      totalSessions: 1, // Could be enhanced to track multiple sessions
      averageSessionDuration: sessionDuration,
      mostUsedFeatures: [
        user.sessionStats.moodEntriesCount > 0 ? 'Mood Tracking' : '',
        user.sessionStats.wellnessActivitiesCompleted > 0 ? 'Wellness Activities' : '',
        user.sessionStats.communityInteractions > 0 ? 'Community' : '',
        user.sessionStats.therapeuticContentAccessed > 0 ? 'Therapeutic Content' : '',
      ].filter(Boolean),
      wellnessProgress: Math.min(
        (user.sessionStats.moodEntriesCount + 
         user.sessionStats.wellnessActivitiesCompleted + 
         user.sessionStats.therapeuticContentAccessed) / 3,
        100
      ),
      lastWeekActivity: [0, 0, 0, 0, 0, 0, 0], // Placeholder for weekly activity
    };
  };
  
  const value: AnonymousAuthContextType = {
    user,
    isAuthenticated: true,
    isAnonymous: true,
    updateNickname,
    updateProfile,
    updatePreferences,
    updateSessionStats,
    exportUserData,
    importUserData,
    clearLocalData,
    logout: clearLocalData, // Alias for compatibility
    sessionDuration,
    extendSession,
    updateLastActive,
    isDataStale,
    cleanupStaleData,
    validateDataIntegrity,
    getSessionInsights,
  };
  
  return (
    <AnonymousAuthContext.Provider value={value}>
      {children}
    </AnonymousAuthContext.Provider>
  );
}

/**
 * Privacy Notice Component
 * Shows users that they're anonymous
 */
export function AnonymousNotice() {
  const { user, sessionDuration } = useAnonymousAuth();
  
  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200">
      <div className="flex items-center gap-3">
        <div className="text-blue-600">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">You're Completely Anonymous</h3>
          <p className="text-sm text-gray-600 mt-1">
            {user.nickname ? `Hi ${user.nickname}! ` : ''}
            No registration required. No data collected. Your privacy is protected.
            {sessionDuration > 0 && ` You've been here for ${sessionDuration} minute${sessionDuration !== 1 ? 's' : ''}.`}
          </p>
        </div>
      </div>
    </div>
  );
}