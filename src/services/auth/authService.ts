/**
 * Core Authentication Service
 * Handles JWT token management, user authentication, and session management
 * HIPAA-compliant with end-to-end encryption for sensitive data
 */

import { User, ApiResponse } from '@/types';
import { auditLogger } from '../security/auditLogger';
import { cryptoService } from '../security/cryptoService';
import { secureStorage } from '../security/SecureLocalStorage';
import { logger } from '../utils/logger';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

interface LoginCredentials {
  email: string;
  password: string;
  mfaCode?: string;
  anonymousMode?: boolean;
  rememberMe?: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  acceptedTerms: boolean;
  consentToDataProcessing: boolean;
  anonymousMode?: boolean;
}

interface SessionData {
  user: User;
  tokens: AuthTokens;
  sessionId: string;
  deviceId: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
}

interface PasswordResetRequest {
  email: string;
  securityQuestionAnswers?: Record<string, string>;
}

interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

class AuthenticationService {
  private static instance: AuthenticationService;
  private currentSession: SessionData | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private readonly TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity
  private activityTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeService();
  }

  static getInstance(): AuthenticationService {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService();
    }
    return AuthenticationService.instance;
  }

  private async initializeService(): Promise<void> {
    // Load existing session from secure storage
    await this.loadStoredSession();
    
    // Set up activity monitoring
    this.setupActivityMonitoring();
    
    // Initialize token refresh mechanism
    if (this.currentSession) {
      this.scheduleTokenRefresh();
    }
  }

  /**
   * User Registration with comprehensive validation and security
   */
  async register(data: RegisterData): Promise<ApiResponse<User>> {
    try {
      // Validate registration data
      this.validateRegistrationData(data);
      
      // Check password strength
      const passwordStrength = this.checkPasswordStrength(data.password);
      if (passwordStrength.score < 3) {
        throw new Error(`Weak password: ${passwordStrength.feedback.join(', ')}`);
      }

      // Hash password with salt
      const hashedPassword = await cryptoService.hashPassword(data.password);
      
      // Create user account (API call would go here)
      const response = await this.mockApiCall('/auth/register', {
        ...data,
        password: hashedPassword,
        registrationIp: await this.getClientIp(),
        registrationDevice: this.getDeviceFingerprint(),
      });

      // Log registration event
      await auditLogger.log({
        event: 'USER_REGISTRATION',
        userId: response.data.user.id,
        details: {
          email: data.email,
          anonymousMode: data.anonymousMode,
        },
        severity: 'info',
      });

      // Auto-login after registration
      if (!data.anonymousMode) {
        await this.login({
          email: data.email,
          password: data.password,
        });
      }

      return {
        success: true,
        data: response.data.user,
      };
    } catch (error) {
      await auditLogger.log({
        event: 'REGISTRATION_FAILED',
        details: { error: error instanceof Error ? error.message : String(error), email: data.email },
        severity: 'warning',
      });
      throw error;
    }
  }

  /**
   * User Login with MFA support
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<SessionData>> {
    try {
      // Rate limiting check
      await this.checkRateLimit(credentials.email);
      
      // Validate credentials
      if (!credentials.anonymousMode && (!credentials.email || !credentials.password)) {
        throw new Error('Email and password are required');
      }

      let sessionData: SessionData;

      if (credentials.anonymousMode) {
        // Handle anonymous login
        _sessionData = await this.createAnonymousSession();
      } else {
        // Hash password for comparison
        const hashedPassword = await cryptoService.hashPassword(credentials.password);
        
        // Authenticate with backend (API call would go here)
        const response = await this.mockApiCall('/auth/login', {
          email: credentials.email,
          password: hashedPassword,
          mfaCode: credentials.mfaCode,
          deviceId: this.getDeviceFingerprint(),
        });

        sessionData = response.data;
      }

      // Store session securely
      await this.storeSession(_sessionData, credentials.rememberMe);
      
      // Set up token refresh
      this.scheduleTokenRefresh();
      
      // Log successful login
      await auditLogger.log({
        event: 'USER_LOGIN',
        userId: _sessionData.user.id,
        details: {
          anonymous: credentials.anonymousMode,
          mfaUsed: !!credentials.mfaCode,
        },
        severity: 'info',
      });

      return {
        success: true,
        data: _sessionData,
      };
    } catch (error) {
      await auditLogger.log({
        event: 'LOGIN_FAILED',
        details: { error: error instanceof Error ? error.message : String(error), email: credentials.email },
        severity: 'warning',
      });
      throw error;
    }
  }

  /**
   * Logout with secure session cleanup
   */
  async logout(): Promise<void> {
    try {
      if (this.currentSession) {
        // Revoke tokens on backend (API call would go here)
        await this.mockApiCall('/auth/logout', {
          sessionId: this.currentSession.sessionId,
        });

        // Log logout event
        await auditLogger.log({
          event: 'USER_LOGOUT',
          userId: this.currentSession.user.id,
          severity: 'info',
        });
      }

      // Clear all session data
      await this.clearSession();
      
      // Cancel refresh timer
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }

      // Clear activity timer
      if (this.activityTimer) {
        clearTimeout(this.activityTimer);
        this.activityTimer = null;
      }
    } catch (_error) {
      logger.error('Logout error: ');
      // Force clear session even if API call fails
      await this.clearSession();
    }
  }

  /**
   * Refresh authentication tokens
   */
  async refreshTokens(): Promise<AuthTokens | null> {
    try {
      if (!this.currentSession?.tokens.refreshToken) {
        return null;
      }

      // Call refresh endpoint (API call would go here)
      const response = await this.mockApiCall('/auth/refresh', {
        refreshToken: this.currentSession.tokens.refreshToken,
      });

      const newTokens = response.data.tokens;
      
      // Update stored tokens
      this.currentSession.tokens = newTokens;
      await this.storeSession(this.currentSession);
      
      // Reschedule next refresh
      this.scheduleTokenRefresh();

      return newTokens;
    } catch (_error) {
      logger.error('Token refresh failed:');
      // If refresh fails, user needs to re-authenticate
      await this.logout();
      return null;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentSession?.user || null;
  }

  /**
   * Get current session
   */
  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.currentSession && new Date() < new Date(this.currentSession.expiresAt);
  }

  /**
   * Check if session is anonymous
   */
  isAnonymous(): boolean {
    return this.currentSession?.user.role === 'user' && 
           this.currentSession?.user.email.includes('@anonymous.local');
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      if (!this.currentSession) {
        throw new Error('Not authenticated');
      }

      // API call to update profile
      const response = await this.mockApiCall('/auth/profile', {
        ...updates,
      });

      // Update session with new user data
      this.currentSession.user = { ...this.currentSession.user, ...response.data };
      await this.storeSession(this.currentSession);

      // Log profile update
      await auditLogger.log({
        event: 'PROFILE_UPDATED',
        userId: this.currentSession.user.id,
        details: { updatedFields: Object.keys(_updates) },
        severity: 'info',
      });

      return {
        success: true,
        data: this.currentSession.user,
      };
    } catch (error) {
      await auditLogger.log({
        event: 'PROFILE_UPDATE_FAILED',
        userId: this.currentSession?.user.id,
        details: { error: error instanceof Error ? error.message : String(error) },
        severity: 'error',
      });
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(request: PasswordResetRequest): Promise<ApiResponse<void>> {
    try {
      // API call to initiate password reset
      await this.mockApiCall('/auth/password-reset/request', request);

      // Log password reset request
      await auditLogger.log({
        event: 'PASSWORD_RESET_REQUESTED',
        details: { email: request.email },
        severity: 'info',
      });

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      await auditLogger.log({
        event: 'PASSWORD_RESET_FAILED',
        details: { error: error instanceof Error ? error.message : String(error) },
        severity: 'warning',
      });
      throw error;
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(confirm: PasswordResetConfirm): Promise<ApiResponse<void>> {
    try {
      // Validate new password
      const passwordStrength = this.checkPasswordStrength(confirm.newPassword);
      if (passwordStrength.score < 3) {
        throw new Error(`Weak password: ${passwordStrength.feedback.join(', ')}`);
      }

      if (confirm.newPassword !== confirm.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Hash new password
      const hashedPassword = await cryptoService.hashPassword(confirm.newPassword);

      // API call to reset password
      await this.mockApiCall('/auth/password-reset/confirm', {
        token: confirm.token,
        password: hashedPassword,
      });

      // Log password reset
      await auditLogger.log({
        event: 'PASSWORD_RESET_COMPLETED',
        severity: 'info',
      });

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      await auditLogger.log({
        event: 'PASSWORD_RESET_FAILED',
        details: { error: error instanceof Error ? error.message : String(error) },
        severity: 'error',
      });
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async loadStoredSession(): Promise<void> {
    try {
      const _encryptedSession = await secureStorage.getItem('session');
      if (_encryptedSession) {
        const _sessionData = await cryptoService.decrypt(_encryptedSession);
        const session = JSON.parse(_sessionData) as SessionData;
        
        // Check if session is still valid
        if (new Date() < new Date(session.expiresAt)) {
          this.currentSession = session;
        } else {
          // Session expired, clear it
          await this.clearSession();
        }
      }
    } catch (_error) {
      logger.error('Failed to load stored session:');
      await this.clearSession();
    }
  }

  private async storeSession(session: SessionData, persistent = false): Promise<void> {
    this.currentSession = session;
    
    // Encrypt session data
    const _encryptedSession = await cryptoService.encrypt(JSON.stringify(_session));
    
    // Store in secure storage
    secureStorage.setItem('session', _encryptedSession);
  }

  private async clearSession(): Promise<void> {
    this.currentSession = null;
    await secureStorage.removeItem('session');
    await secureStorage.removeItem('deviceId');
  }

  private async createAnonymousSession(): Promise<SessionData> {
    const anonymousId = this.generateAnonymousId();
    const anonymousUser: User = {
      id: anonymousId,
      email: `${anonymousId}@anonymous.local`,
      name: 'Anonymous User',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: {
        preferences: {
          theme: 'system',
          notifications: {
            email: false,
            push: false,
            sms: false,
            reminders: true,
            crisisAlerts: true,
          },
          privacy: {
            shareData: false,
            publicProfile: false,
            showMoodHistory: false,
          },
        },
      },
    };

    const tokens: AuthTokens = {
      accessToken: this.generateMockToken(),
      refreshToken: this.generateMockToken(),
      expiresIn: 3600,
      tokenType: 'Bearer',
    };

    return {
      user: anonymousUser,
      tokens,
      sessionId: this.generateSessionId(),
      deviceId: this.getDeviceFingerprint(),
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours for anonymous
    };
  }

  private scheduleTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.currentSession) return;

    const expiresIn = this.currentSession.tokens.expiresIn * 1000;
    const refreshTime = expiresIn - this.TOKEN_REFRESH_THRESHOLD;

    this.refreshTimer = setTimeout(() => {
      this.refreshTokens();
    }, refreshTime);
  }

  private setupActivityMonitoring(): void {
    // Monitor user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const resetActivityTimer = () => {
      if (this.activityTimer) {
        clearTimeout(this.activityTimer);
      }

      if (this.currentSession && !this.isAnonymous()) {
        this.activityTimer = setTimeout(() => {
          // Auto-logout after inactivity
          this.logout();
        }, this.SESSION_TIMEOUT);
      }
    };

    events.forEach(event => {
      window.addEventListener(event, resetActivityTimer, { passive: true });
    });

    resetActivityTimer();
  }

  private validateRegistrationData(data: RegisterData): void {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.anonymousMode && !emailRegex.test(data.email)) {
      throw new Error('Invalid email address');
    }

    // Name validation
    if (!data.anonymousMode && (!data.name || data.name.length < 2)) {
      throw new Error('Name must be at least 2 characters');
    }

    // Terms acceptance
    if (!data.acceptedTerms) {
      throw new Error('You must accept the terms and conditions');
    }

    // Data processing consent
    if (!data.consentToDataProcessing) {
      throw new Error('Consent to data processing is required');
    }
  }

  private checkPasswordStrength(password: string): { score: number; feedback: string[] } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length < 8) feedback.push('Password should be at least 8 characters');

    // Complexity checks
    if (/[a-z]/.test(_password)) score++;
    if (/[A-Z]/.test(_password)) score++;
    if (/[0-9]/.test(_password)) score++;
    if (/[^a-zA-Z0-9]/.test(_password)) score++;

    // Common patterns check
    const commonPatterns = ['password', '12345', 'qwerty', 'admin', 'letmein'];
    if (commonPatterns.some(_pattern => password.toLowerCase().includes(_pattern))) {
      score = Math.max(0, score - 2);
      feedback.push('Password contains common patterns');
    }

    // Provide feedback
    if (!/[a-z]/.test(_password)) feedback.push('Add lowercase letters');
    if (!/[A-Z]/.test(_password)) feedback.push('Add uppercase letters');
    if (!/[0-9]/.test(_password)) feedback.push('Add numbers');
    if (!/[^a-zA-Z0-9]/.test(_password)) feedback.push('Add special characters');

    return { score: Math.min(5, score), feedback };
  }

  private async checkRateLimit(identifier: string): Promise<void> {
    // Implement rate limiting logic
    const _key = `rate_limit_${identifier}`;
    const attempts = await secureStorage.getItem(_key);
    
    if (attempts) {
      const data = JSON.parse(attempts);
      if (data.count >= 5 && Date.now() - data.firstAttempt < 15 * 60 * 1000) {
        throw new Error('Too many login attempts. Please try again later.');
      }
    }
  }

  private getDeviceFingerprint(): string {
    // Generate a unique device fingerprint
    const deviceId = secureStorage.getItem('deviceId') || this.generateDeviceId();
    secureStorage.setItem('deviceId', deviceId);
    return deviceId;
  }

  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAnonymousId(): string {
    return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMockToken(): string {
    return btoa(`${Date.now()}_${Math.random().toString(36).substr(2, 20)}`);
  }

  private async getClientIp(): Promise<string> {
    // In production, this would get the real IP
    return '127.0.0.1';
  }

  private async mockApiCall(endpoint: string, data: unknown): Promise<unknown> {
    // Simulate API call - in production, this would be a real API call
    logger.info(`API Call to ${endpoint}:`, data);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock response based on endpoint
    if (endpoint === '/auth/register') {
      return {
        data: {
          user: {
            id: `user_${Date.now()}`,
            email: data.email,
            name: data.name || data.email.split('@')[0],
            role: 'user',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      };
    } else if (endpoint === '/auth/login') {
      return {
        data: {
          user: {
            id: `user_${Date.now()}`,
            email: data.email,
            name: data.email.split('@')[0],
            role: 'user',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          tokens: {
            accessToken: this.generateMockToken(),
            refreshToken: this.generateMockToken(),
            expiresIn: 3600,
            tokenType: 'Bearer' as const,
          },
          sessionId: this.generateSessionId(),
          deviceId: data.deviceId,
          createdAt: new Date(),
          lastActivity: new Date(),
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      };
    } else if (endpoint === '/auth/refresh') {
      return {
        data: {
          tokens: {
            accessToken: this.generateMockToken(),
            refreshToken: this.generateMockToken(),
            expiresIn: 3600,
            tokenType: 'Bearer' as const,
          },
        },
      };
    }
    
    return { data: {} };
  }
}

export const authService = AuthenticationService.getInstance();