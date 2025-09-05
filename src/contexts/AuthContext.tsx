/**
 * Enhanced Authentication Context
 * Comprehensive security features including MFA, privacy controls, and HIPAA compliance
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User, PrivacySettings, ConsentRecord } from '@/types';
import { authService } from '@/services/auth/authService';
import { mfaService, MFAMethod, MFASetup } from '@/services/auth/mfaService';
import { privacyService, ConsentType, DataCategory } from '@/services/privacy/privacyService';
import { hipaaService } from '@/services/compliance/hipaaService';
import { auditLogger } from '@/services/security/auditLogger';
import { secureStorage } from '@/services/security/secureStorage';
import { logger } from '../utils/logger';

interface AuthContextType {
  // User state
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  
  // Authentication methods
  login: (email: string, password: string, options?: LoginOptions) => Promise<LoginResult>;
  loginAnonymous: () => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, options?: RegisterOptions) => Promise<void>;
  
  // Profile management
  updateProfile: (updatedProfile: Partial<User>) => Promise<void>;
  deleteAccount: (reason?: string) => Promise<void>;
  
  // Password management
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  
  // Multi-factor authentication
  mfaEnabled: boolean;
  mfaChallengeId: string | null;
  setupMFA: (method: MFAMethod) => Promise<unknown>;
  verifyMFA: (code: string) => Promise<boolean>;
  disableMFA: (method: MFAMethod) => Promise<void>;
  getMFAMethods: () => Promise<MFASetup[]>;
  
  // Privacy controls
  privacySettings: PrivacySettings | null;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => Promise<void>;
  grantConsent: (type: ConsentType, categories: DataCategory[], purpose: string) => Promise<void>;
  revokeConsent: (consentId: string) => Promise<void>;
  getConsents: () => Promise<ConsentRecord[]>;
  
  // Data management
  exportUserData: (format?: 'json' | 'csv' | 'pdf') => Promise<string>;
  requestDataDeletion: (categories?: DataCategory[]) => Promise<void>;
  
  // Session management
  refreshSession: () => Promise<void>;
  checkSessionExpiry: () => Promise<void>;
  extendSession: () => void;
  sessionExpiresAt: Date | null;
  
  // Privacy settings
  getPrivacySettings: () => Promise<PrivacySettings | null>;
  
  // Security events
  getSecurityEvents: () => Promise<unknown[]>;
  
  // Emergency access
  enableEmergencyAccess: () => Promise<void>;
  disableEmergencyAccess: () => Promise<void>;
  emergencyAccessEnabled: boolean;
}

interface LoginOptions {
  rememberMe?: boolean;
  mfaCode?: string;
  anonymousMode?: boolean;
}

interface LoginResult {
  success: boolean;
  requiresMFA?: boolean;
  mfaMethod?: MFAMethod;
  error?: string;
}

interface RegisterOptions {
  acceptTerms: boolean;
  consentToDataProcessing: boolean;
  anonymousMode?: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);
  const [emergencyAccessEnabled, setEmergencyAccessEnabled] = useState(false);
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);

  const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Check if user is authenticated
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            
            // Load additional user data
            await loadUserData(currentUser.id);
            
            // Check session expiry
            const session = authService.getCurrentSession();
            if (session) {
              setSessionExpiresAt(new Date(session.expiresAt));
            }
          }
        }
      } catch (err) {
        logger.error('Auth check failed:', err instanceof Error ? err.message : String(err));
        setError(err instanceof Error ? err.message : 'Authentication check failed');
        await authService.logout();
      } finally {
        setLoading(false);
      }
    };
  
  const loadUserData = async (userId: string) => {
    try {
      // Load MFA status
      const hasMFA = await mfaService.hasMFAEnabled(userId);
      setMfaEnabled(hasMFA);
      
      // Load privacy settings
      const settings = await privacyService.getPrivacySettings(userId);
      setPrivacySettings(settings);
      
      // Check emergency access status
      const emergencyKey = `emergency_access_${userId}`;
      const emergencyStatus = await secureStorage.getItem(emergencyKey) as { enabled?: boolean } | null;
      setEmergencyAccessEnabled(!!emergencyStatus?.enabled);
    } catch (err) {
      logger.error('Failed to load user data:', err instanceof Error ? err.message : String(err));
    }
  };
  
  // Forward declaration needed for checkSessionExpiry
  let logout: () => Promise<void>;
  
  const checkSessionExpiry = useCallback(async () => {
    if (sessionExpiresAt && new Date() > sessionExpiresAt && logout) {
      // Session expired, auto-logout
      await logout();
    }
  }, [sessionExpiresAt]);

  useEffect(() => {
    // Check for existing session
    checkAuth();
  }, []);
  
  useEffect(() => {
    // Set up session monitoring
    const sessionInterval = setInterval(() => {
      checkSessionExpiry();
    }, 60000); // Check every minute
    
    return () => clearInterval(sessionInterval);
  }, [checkSessionExpiry]);

  const login = async (
    email: string,
    password: string,
    options: LoginOptions = {}
  ): Promise<LoginResult> => {
    try {
      setLoading(true);
      
      // Check if MFA is required
      if (mfaChallengeId && options.mfaCode) {
        // Verify MFA code
        const mfaValid = await mfaService.verifyChallenge(
          user?.id || '',
          mfaChallengeId,
          options.mfaCode
        );
        
        if (!mfaValid) {
          return {
            success: false,
            error: 'Invalid MFA code',
          };
        }
        
        setMfaChallengeId(null);
      }
      
      // Perform login
      const result = await authService.login({
        email,
        password,
        mfaCode: options.mfaCode,
        anonymousMode: options.anonymousMode,
        rememberMe: options.rememberMe,
      });
      
      if (result.success && result.data) {
        setUser(result.data.user);
        setSessionExpiresAt(new Date(result.data.expiresAt));
        
        // Load additional user data
        await loadUserData(result.data.user.id);
        
        // Check if MFA is required but not provided
        const hasMFA = await mfaService.hasMFAEnabled(result.data.user.id);
        if (hasMFA && !options.mfaCode) {
          // Create MFA challenge
          const challenge = await mfaService.createChallenge(result.data.user.id);
          setMfaChallengeId(challenge.challengeId);
          
          return {
            success: false,
            requiresMFA: true,
            mfaMethod: challenge.method,
          };
        }
        
        return { success: true };
      }
      
      return {
        success: false,
        error: 'Login failed',
      };
    } catch (err) {
      logger.error('Login failed:', err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err.message : 'Login failed');
      return {
        success: false,
        error: err instanceof Error ? err.message : '[Error details unavailable]',
      };
    } finally {
      setLoading(false);
    }
  };
  
  const loginAnonymous = async () => {
    try {
      setLoading(true);
      
      const result = await authService.login({
        email: '',
        password: '',
        anonymousMode: true,
      });
      
      if (result.success && result.data) {
        setUser(result.data.user);
        setSessionExpiresAt(new Date(result.data.expiresAt));
      }
    } catch (err) {
      logger.error('Anonymous login failed:', err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err.message : 'Anonymous login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setMfaEnabled(false);
      setPrivacySettings(null);
      setSessionExpiresAt(null);
      setEmergencyAccessEnabled(false);
      setMfaChallengeId(null);
      setError(null);
    } catch (err) {
      logger.error('Logout failed:', err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err.message : 'Logout failed');
      // Force cleanup even if logout fails
      setUser(null);
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    options?: RegisterOptions
  ) => {
    try {
      setLoading(true);
      
      if (!options?.acceptTerms || !options?.consentToDataProcessing) {
        throw new Error('Must accept terms and consent to data processing');
      }
      
      const result = await authService.register({
        email,
        password,
        name,
        acceptedTerms: options.acceptTerms,
        consentToDataProcessing: options.consentToDataProcessing,
        anonymousMode: options.anonymousMode,
      });
      
      if (result.success && result.data) {
        // Record initial consent
        await privacyService.recordConsent({
          userId: result.data.id,
          type: 'data_processing',
          consentGiven: true,
          purpose: 'Account creation and platform usage',
          dataCategories: ['personalinfo'],
        });
        
        // Auto-login after registration
        if (!options.anonymousMode) {
          await login(email, password);
        }
      }
    } catch (err) {
      logger.error('Registration failed:', err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updatedProfile: Partial<User>) => {
    try {
      const result = await authService.updateProfile(updatedProfile);
      if (result.success && result.data) {
        setUser(result.data);
      }
    } catch (err) {
      logger.error('Profile update failed:', err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err.message : 'Profile update failed');
      throw err;
    }
  };
  
  const deleteAccount = async (reason?: string) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      // Request data deletion
      await privacyService.requestDataDeletion(user.id, undefined, reason);
      
      // Logout
      await logout();
    } catch (err) {
      logger.error('Account deletion failed:', err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err.message : 'Account deletion failed');
      throw err;
    }
  };
  
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      // In production, verify current password and update
      await auditLogger.log({
        event: 'PASSWORD_CHANGE',
        userId: user.id,
        severity: 'info',
      });
    } catch (err) {
      logger.error('Password change failed:', err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err.message : 'Password change failed');
      throw err;
    }
  };
  
  const requestPasswordReset = async (email: string) => {
    try {
      await authService.requestPasswordReset({ email });
    } catch (err) {
      logger.error('Password reset request failed:', err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err.message : 'Password reset request failed');
      throw err;
    }
  };
  
  const confirmPasswordReset = async (token: string, newPassword: string) => {
    try {
      await authService.confirmPasswordReset({
        token,
        newPassword,
        confirmPassword: newPassword,
      });
    } catch (err) {
      logger.error('Password reset confirmation failed:', err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err.message : 'Password reset confirmation failed');
      throw err;
    }
  };

  // MFA methods
  const setupMFA = async (method: MFAMethod) => {
    if (!user) throw new Error('No user logged in');
    
    switch (method) {
      case 'totp':
        return await mfaService.setupTOTP(user.id);
      case 'sms':
        // Need phone number
        throw new Error('Phone number required for SMS MFA');
      case 'email':
        return await mfaService.setupEmail(user.id, user.email);
      case 'biometric':
        return await mfaService.setupBiometric(user.id);
      default:
        throw new Error('Invalid MFA method');
    }
  };
  
  const verifyMFA = async (code: string) => {
    if (!user || !mfaChallengeId) return false;
    
    const result = await mfaService.verifyChallenge(user.id, mfaChallengeId, code);
    if (result) {
      setMfaChallengeId(null);
      setMfaEnabled(true);
    }
    return result;
  };
  
  const disableMFA = async (method: MFAMethod) => {
    if (!user) throw new Error('No user logged in');
    
    await mfaService.disableMFA(user.id, method);
    const hasMFA = await mfaService.hasMFAEnabled(user.id);
    setMfaEnabled(hasMFA);
  };
  
  const getMFAMethods = async () => {
    if (!user) return [];
    return await mfaService.getUserMFAMethods(user.id);
  };
  
  // Privacy methods
  const updatePrivacySettings = async (settings: Partial<PrivacySettings>) => {
    if (!user) throw new Error('No user logged in');
    
    const updated = await privacyService.updatePrivacySettings(user.id, settings);
    setPrivacySettings(updated);
  };
  
  const grantConsent = async (
    type: ConsentType,
    categories: DataCategory[],
    purpose: string
  ) => {
    if (!user) throw new Error('No user logged in');
    
    await privacyService.recordConsent({
      userId: user.id,
      type,
      consentGiven: true,
      purpose,
      dataCategories: categories,
    });
  };
  
  const revokeConsent = async (consentId: string) => {
    if (!user) throw new Error('No user logged in');
    
    await privacyService.withdrawConsent(user.id, consentId);
  };
  
  const getConsents = async () => {
    if (!user) return [];
    return await privacyService.getUserConsents(user.id);
  };
  
  // Data management
  const exportUserData = async (format: 'json' | 'csv' | 'pdf' = 'json') => {
    if (!user) throw new Error('No user logged in');
    
    const request = await privacyService.requestDataPortability(user.id, format);
    // In production, this would return download URL
    return `export_${request.id}_${format}`;
  };
  
  const requestDataDeletion = async (categories?: DataCategory[]) => {
    if (!user) throw new Error('No user logged in');
    
    await privacyService.requestDataDeletion(user.id, categories);
  };
  
  // Session management
  const refreshSession = async () => {
    const tokens = await authService.refreshTokens();
    if (tokens) {
      const session = authService.getCurrentSession();
      if (session) {
        setSessionExpiresAt(new Date(session.expiresAt));
      }
    }
  };
  
  const extendSession = () => {
    if (sessionExpiresAt) {
      const newExpiry = new Date(sessionExpiresAt.getTime() + 30 * 60 * 1000);
      setSessionExpiresAt(newExpiry);
    }
  };
  
  // Emergency access
  const enableEmergencyAccess = async () => {
    if (!user) throw new Error('No user logged in');
    
    const key = `emergency_access_${user.id}`;
    await secureStorage.setItem(key, {
      enabled: true,
      enabledAt: new Date(),
    });
    setEmergencyAccessEnabled(true);
    
    await auditLogger.log({
      event: 'EMERGENCY_ACCESS',
      userId: user.id,
      details: { action: 'enabled' },
      severity: 'warning',
    });
  };
  
  const disableEmergencyAccess = async () => {
    if (!user) throw new Error('No user logged in');
    
    const key = `emergency_access_${user.id}`;
    await secureStorage.removeItem(key);
    setEmergencyAccessEnabled(false);
    
    await auditLogger.log({
      event: 'EMERGENCY_ACCESS',
      userId: user.id,
      details: { action: 'disabled' },
      severity: 'info',
    });
  };
  
  // Add missing getPrivacySettings function
  const getPrivacySettings = async () => {
    if (!user) return null;
    const settings = await privacyService.getPrivacySettings(user.id);
    setPrivacySettings(settings);
    return settings;
  };
  
  // Add missing getSecurityEvents function  
  const getSecurityEvents = async () => {
    if (!user) return [];
    // In production, fetch security events from API
    return [];
  };
  
  // Initialize authentication check on mount
  useEffect(() => {
    checkAuth();
  }, []);
  
  // Set up session monitoring
  useEffect(() => {
    const sessionInterval = setInterval(() => {
      checkSessionExpiry();
    }, 60000); // Check every minute
    
    return () => clearInterval(sessionInterval);
  }, [checkSessionExpiry]);
  
  // Computed values
  const isAuthenticated = !!user && !authService.isAnonymous();
  const isAnonymous = authService.isAnonymous();

  const value: AuthContextType = {
    // Authentication state
    user,
    isAuthenticated,
    isAnonymous,
    loading,
    error,
    
    // Authentication methods
    login,
    loginAnonymous,
    logout,
    register,
    
    // Profile management
    updateProfile,
    deleteAccount,
    
    // Password management
    changePassword,
    requestPasswordReset,
    confirmPasswordReset,
    
    // Multi-factor authentication
    setupMFA,
    verifyMFA,
    disableMFA,
    getMFAMethods,
    mfaEnabled,
    mfaChallengeId,
    
    // Session management
    refreshSession,
    checkSessionExpiry,
    extendSession,
    sessionExpiresAt,
    
    // Privacy settings
    updatePrivacySettings,
    getPrivacySettings,
    privacySettings,
    grantConsent,
    revokeConsent,
    getConsents,
    
    // Data management
    exportUserData,
    requestDataDeletion,
    
    // Security events
    getSecurityEvents,
    
    // Emergency
    enableEmergencyAccess,
    disableEmergencyAccess,
    emergencyAccessEnabled,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
