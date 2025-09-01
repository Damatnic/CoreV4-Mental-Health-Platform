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
  preferences: {
    theme?: 'light' | 'dark' | 'auto';
    fontSize?: 'small' | 'medium' | 'large';
    reducedMotion?: boolean;
    highContrast?: boolean;
  };
  sessionStarted: Date;
  isAnonymous: true; // Always true
}

interface AnonymousAuthContextType {
  // User state
  user: AnonymousUser;
  isAuthenticated: true; // Always authenticated as anonymous
  isAnonymous: true; // Always anonymous
  
  // Local preferences (no server calls)
  updateNickname: (nickname: string) => void;
  updatePreferences: (preferences: Partial<AnonymousUser['preferences']>) => void;
  clearLocalData: () => void;
  
  // Session info
  sessionDuration: number; // Minutes since session started
  extendSession: () => void;
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

// Get or create anonymous user from secure storage
function getOrCreateAnonymousUser(): AnonymousUser {
  const stored = secureStorage.getItem('anonymous_user');
  
  if (stored) {
    try {
      const user = JSON.parse(stored);
      // Restore session started as Date object
      user.sessionStarted = new Date(user.sessionStarted);
      return user;
    } catch {
      // Invalid stored data, create new
    }
  }
  
  // Create new anonymous user
  const newUser: AnonymousUser = {
    id: generateSessionId(),
    preferences: {
      theme: 'light',
      fontSize: 'medium',
      reducedMotion: false,
      highContrast: false,
    },
    sessionStarted: new Date(),
    isAnonymous: true,
  };
  
  secureStorage.setItem('anonymous_user', JSON.stringify(newUser));
  return newUser;
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
  
  // Save user to secure storage whenever it changes
  useEffect(() => {
    secureStorage.setItem('anonymous_user', JSON.stringify(user));
  }, [user]);
  
  const updateNickname = (nickname: string) => {
    setUser(prev => ({ ...prev, nickname }));
  };
  
  const updatePreferences = (preferences: Partial<AnonymousUser['preferences']>) => {
    setUser(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...preferences }
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
    // Just update the session started time
    setUser(prev => ({ ...prev, sessionStarted: new Date() }));
  };
  
  const value: AnonymousAuthContextType = {
    user,
    isAuthenticated: true,
    isAnonymous: true,
    updateNickname,
    updatePreferences,
    clearLocalData,
    sessionDuration,
    extendSession,
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