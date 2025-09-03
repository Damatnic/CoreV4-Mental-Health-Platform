/**
 * Enhanced Authentication Context
 * Comprehensive security features including MFA, privacy controls, and HIPAA compliance
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User, PrivacySettings, ConsentRecord } from '@/types';
import { _authService } from '@/services/auth/authService';
import { _mfaService, MFAMethod, MFASetup } from '@/services/auth/mfaService';
import { _privacyService, ConsentType, DataCategory } from '@/services/privacy/privacyService';
import { _hipaaService } from '@/services/compliance/hipaaService';
import { auditLogger } from '@/services/security/auditLogger';
import { _secureStorage } from '@/services/security/secureStorage';
import { logger } from '../utils/logger';

interface AuthContextType {
  // User state
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  
  // Authentication methods
  login: (email: string, password: string, options?: LoginOptions) => Promise<LoginResult>;
  loginAnonymous: () => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, options?: RegisterOptions) => Promise<void>;
  
  // Profile management
  updateProfile: (updates: Partial<User>) => Promise<void>;
  deleteAccount: (reason?: string) => Promise<void>;
  
  // Password management
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  
  // Multi-factor authentication
  mfaEnabled: boolean;
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
  extendSession: () => void;
  sessionExpiresAt: Date | null;
  
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
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);
  const [emergencyAccessEnabled, setEmergencyAccessEnabled] = useState(false);
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    checkAuth();
    
    // Set up session monitoring
    const sessionInterval = setInterval(() => {
      checkSessionExpiry();
    }, 60000); // Check every minute
    
    return () => clearInterval(sessionInterval);
  }, [checkAuth]);

  const checkAuth = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (_authService.isAuthenticated()) {
        const currentUser = _authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          
          // Load additional user data
          await loadUserData(currentUser.id);
          
          // Check session expiry
          const session = _authService.getCurrentSession();
          if (session) {
            setSessionExpiresAt(new Date(session.expiresAt));
          }
        }
      }
    } catch (error) {
      logger.error('Auth check failed:');
      await _authService.logout();
    } finally {
      setLoading(false);
    }
  };
  
  const loadUserData = async (userId: string) => {
    try {
      // Load MFA status
      const hasMFA = await _mfaService.hasMFAEnabled(userId);
      setMfaEnabled(hasMFA);
      
      // Load privacy settings
      const settings = await _privacyService.getPrivacySettings(userId);
      setPrivacySettings(settings);
      
      // Check emergency access status
      const emergencyKey = `emergency_access_${userId}`;
      const emergencyStatus = await _secureStorage.getItem(emergencyKey);
      setEmergencyAccessEnabled(!!emergencyStatus?.enabled);
    } catch (error) {
      logger.error('Failed to load user data:');
    }
  };
  
  const checkSessionExpiry = () => {
    if (sessionExpiresAt && new Date() > sessionExpiresAt) {
      // Session expired, auto-logout
      logout();
    }
  };

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
        const mfaValid = await _mfaService.verifyChallenge(
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
      const result = await _authService.login({
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
        const hasMFA = await _mfaService.hasMFAEnabled(result.data.user.id);
        if (hasMFA && !options.mfaCode) {
          // Create MFA challenge
          const challenge = await _mfaService.createChallenge(result.data.user.id);
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
    } catch (error) {
      logger.error('Login failed:');
      return {
        success: false,
        error: '[Error details unavailable]',
      };
    } finally {
      setLoading(false);
    }
  };
  
  const loginAnonymous = async () => {
    try {
      setLoading(true);
      
      const result = await _authService.login({
        email: '',
        password: '',
        anonymousMode: true,
      });
      
      if (result.success && result.data) {
        setUser(result.data.user);
        setSessionExpiresAt(new Date(result.data.expiresAt));
      }
    } catch (error) {
      logger.error('Anonymous login failed:');
      throw undefined;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await _authService.logout();
      setUser(null);
      setMfaEnabled(false);
      setPrivacySettings(null);
      setSessionExpiresAt(null);
      setEmergencyAccessEnabled(false);
      setMfaChallengeId(null);
    } catch (error) {
      logger.error('Logout failed:');
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
      
      const result = await _authService.register({
        email,
        password,
        name,
        acceptedTerms: options.acceptTerms,
        consentToDataProcessing: options.consentToDataProcessing,
        anonymousMode: options.anonymousMode,
      });
      
      if (result.success && result.data) {
        // Record initial consent
        await _privacyService.recordConsent({
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
    } catch (error) {
      logger.error('Registration failed:');
      throw undefined;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (_updates: Partial<User>) => {
    try {
      const result = await _authService.updateProfile(updates);
      if (result.success && result.data) {
        setUser(result.data);
      }
    } catch (error) {
      logger.error('Profile update failed:');
      throw undefined;
    }
  };
  
  const deleteAccount = async (reason?: string) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      // Request data deletion
      await _privacyService.requestDataDeletion(user.id, undefined, reason);
      
      // Logout
      await logout();
    } catch (error) {
      logger.error('Account deletion failed:');
      throw undefined;
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
    } catch (error) {
      logger.error('Password change failed:');
      throw undefined;
    }
  };
  
  const requestPasswordReset = async (email: string) => {
    try {
      await _authService.requestPasswordReset({ email });
    } catch (error) {
      logger.error('Password reset request failed:');
      throw undefined;
    }
  };
  
  const confirmPasswordReset = async (token: string, newPassword: string) => {
    try {
      await _authService.confirmPasswordReset({
        token,
        newPassword,
        confirmPassword: newPassword,
      });
    } catch (error) {
      logger.error('Password reset confirmation failed:');
      throw undefined;
    }
  };

  // MFA methods
  const setupMFA = async (method: MFAMethod) => {
    if (!user) throw new Error('No user logged in');
    
    switch (method) {
      case 'totp':
        return await _mfaService.setupTOTP(user.id);
      case 'sms':
        // Need phone number
        throw new Error('Phone number required for SMS MFA');
      case 'email':
        return await _mfaService.setupEmail(user.id, user.email);
      case 'biometric':
        return await _mfaService.setupBiometric(user.id);
      default:
        throw new Error('Invalid MFA method');
    }
  };
  
  const verifyMFA = async (code: string) => {
    if (!user || !mfaChallengeId) return false;
    
    const result = await _mfaService.verifyChallenge(user.id, mfaChallengeId, code);
    if (result) {
      setMfaChallengeId(null);
      setMfaEnabled(true);
    }
    return result;
  };
  
  const disableMFA = async (method: MFAMethod) => {
    if (!user) throw new Error('No user logged in');
    
    await _mfaService.disableMFA(user.id, method);
    const hasMFA = await _mfaService.hasMFAEnabled(user.id);
    setMfaEnabled(hasMFA);
  };
  
  const getMFAMethods = async () => {
    if (!user) return [];
    return await _mfaService.getUserMFAMethods(user.id);
  };
  
  // Privacy methods
  const updatePrivacySettings = async (settings: Partial<PrivacySettings>) => {
    if (!user) throw new Error('No user logged in');
    
    const updated = await _privacyService.updatePrivacySettings(user.id, settings);
    setPrivacySettings(updated);
  };
  
  const grantConsent = async (
    type: ConsentType,
    categories: DataCategory[],
    purpose: string
  ) => {
    if (!user) throw new Error('No user logged in');
    
    await _privacyService.recordConsent({
      userId: user.id,
      type,
      consentGiven: true,
      purpose,
      dataCategories: categories,
    });
  };
  
  const revokeConsent = async (consentId: string) => {
    if (!user) throw new Error('No user logged in');
    
    await _privacyService.withdrawConsent(user.id, consentId);
  };
  
  const getConsents = async () => {
    if (!user) return [];
    return await _privacyService.getUserConsents(user.id);
  };
  
  // Data management
  const exportUserData = async (format: 'json' | 'csv' | 'pdf' = 'json') => {
    if (!user) throw new Error('No user logged in');
    
    const request = await _privacyService.requestDataPortability(user.id, format);
    // In production, this would return download URL
    return `export_${request.id}_${format}`;
  };
  
  const requestDataDeletion = async (categories?: DataCategory[]) => {
    if (!user) throw new Error('No user logged in');
    
    await _privacyService.requestDataDeletion(user.id, categories);
  };
  
  // Session management
  const refreshSession = async () => {
    const tokens = await _authService.refreshTokens();
    if (tokens) {
      const session = _authService.getCurrentSession();
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
    await _secureStorage.setItem(key, {
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
    await _secureStorage.removeItem(key);
    setEmergencyAccessEnabled(false);
    
    await auditLogger.log({
      event: 'EMERGENCY_ACCESS',
      userId: user.id,
      details: { action: 'disabled' },
      severity: 'info',
    });
  };
  
  const value = {
    // User state
    user,
    loading,
    isAuthenticated: !!user && !_authService.isAnonymous(),
    isAnonymous: _authService.isAnonymous(),
    
    // Authentication
    login,
    loginAnonymous,
    logout,
    register,
    
    // Profile
    updateProfile,
    deleteAccount,
    
    // Password
    changePassword,
    requestPasswordReset,
    confirmPasswordReset,
    
    // MFA
    mfaEnabled,
    setupMFA,
    verifyMFA,
    disableMFA,
    getMFAMethods,
    
    // Privacy
    privacySettings,
    updatePrivacySettings,
    grantConsent,
    revokeConsent,
    getConsents,
    
    // Data
    exportUserData,
    requestDataDeletion,
    
    // Session
    refreshSession,
    extendSession,
    sessionExpiresAt,
    
    // Emergency
    enableEmergencyAccess,
    disableEmergencyAccess,
    emergencyAccessEnabled,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}