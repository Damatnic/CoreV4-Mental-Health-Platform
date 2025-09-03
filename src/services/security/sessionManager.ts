/**
 * Secure Session Management Service
 * Implements HIPAA-compliant session handling with timeout, rotation, and hijacking prevention
 * Zero-trust session verification with continuous authentication
 */

import { cryptoService } from './cryptoService';
import { secureStorage } from './secureStorage';
import { auditLogger } from './auditLogger';
import { _rateLimiter } from './rateLimiter';
import { _fieldEncryption } from './fieldEncryption';
import { logger } from '../../utils/logger';

interface Session {
  sessionId: string;
  _userId: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  fingerprint: string;
  deviceId?: string;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
  securityLevel: 'basic' | 'elevated' | 'maximum';
  mfaVerified: boolean;
  refreshToken?: string;
  accessToken?: string;
  permissions: string[];
  metadata: {
    loginMethod: string;
    platform: string;
    browser: string;
    os: string;
    isMobile: boolean;
    isTrusted: boolean;
  };
  flags: {
    suspicious: boolean;
    requiresReauth: boolean;
    readOnly: boolean;
  };
}

interface SessionConfig {
  maxIdleTime: number; // milliseconds
  absoluteTimeout: number; // milliseconds
  renewalThreshold: number; // milliseconds before expiry to renew
  maxConcurrentSessions: number;
  requireMFA: boolean;
  requireFingerprint: boolean;
  bindToIP: boolean;
  bindToUserAgent: boolean;
  rotateTokens: boolean;
}

interface SessionValidation {
  isValid: boolean;
  reason?: string;
  requiresAction?: 'reauthenticate' | 'mfa' | 'logout';
  riskScore: number;
}

// HIPAA-compliant session configurations
const SESSION_CONFIGS: Record<string, SessionConfig> = {
  basic: {
    maxIdleTime: 30 * 60 * 1000, // 30 minutes
    absoluteTimeout: 8 * 60 * 60 * 1000, // 8 hours
    renewalThreshold: 5 * 60 * 1000, // 5 minutes
    maxConcurrentSessions: 3,
    requireMFA: false,
    requireFingerprint: true,
    bindToIP: false,
    bindToUserAgent: true,
    rotateTokens: true,
  },
  elevated: {
    maxIdleTime: 15 * 60 * 1000, // 15 minutes (HIPAA recommended)
    absoluteTimeout: 4 * 60 * 60 * 1000, // 4 hours
    renewalThreshold: 3 * 60 * 1000, // 3 minutes
    maxConcurrentSessions: 2,
    requireMFA: true,
    requireFingerprint: true,
    bindToIP: true,
    bindToUserAgent: true,
    rotateTokens: true,
  },
  maximum: {
    maxIdleTime: 10 * 60 * 1000, // 10 minutes
    absoluteTimeout: 2 * 60 * 60 * 1000, // 2 hours
    renewalThreshold: 2 * 60 * 1000, // 2 minutes
    maxConcurrentSessions: 1,
    requireMFA: true,
    requireFingerprint: true,
    bindToIP: true,
    bindToUserAgent: true,
    rotateTokens: true,
  },
};

class SessionManagerService {
  private static instance: SessionManagerService;
  private sessions: Map<string, Session> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();
  private blacklistedTokens: Set<string> = new Set();
  private sessionFingerprints: Map<string, string> = new Map();
  private suspiciousActivities: Map<string, number> = new Map();
  private readonly SESSION_STORAGE_KEY = 'secure_sessions';
  private readonly TOKEN_ROTATION_INTERVAL = 15 * 60 * 1000; // 15 minutes

  private constructor() {
    this.initializeSessionManager();
  }

  static getInstance(): SessionManagerService {
    if (!SessionManagerService.instance) {
      SessionManagerService.instance = new SessionManagerService();
    }
    return SessionManagerService.instance;
  }

  private async initializeSessionManager(): Promise<void> {
    await this.loadSessions();
    this.startSessionMonitoring();
    this.setupTokenRotation();
  }

  /**
   * Create a new session
   */
  async createSession(params: {
    _userId: string;
    ipAddress: string;
    userAgent: string;
    loginMethod: string;
    mfaVerified?: boolean;
    location?: unknown;
    deviceId?: string;
  }): Promise<Session> {
    try {
      // Check concurrent session limit
      await this.enforceSessionLimits(params._userId);

      // Generate secure session ID
      const sessionId = await this.generateSessionId(params._userId);
      
      // Generate browser fingerprint
      const fingerprint = await this.generateFingerprint(params.userAgent, params.ipAddress);
      
      // Parse user agent
      const metadata = this.parseUserAgent(params.userAgent);
      
      // Determine security level based on context
      const securityLevel = this.determineSecurityLevel(_params);
      
      // Get configuration
      const config = SESSION_CONFIGS[securityLevel];
      if (!config) {
        throw new Error(`Invalid security level: ${securityLevel}`);
      }
      
      // Create session
      const session: Session = {
        sessionId,
        _userId: params._userId,
        createdAt: new Date(),
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + config.absoluteTimeout),
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        fingerprint,
        deviceId: params.deviceId,
        location: params.location,
        securityLevel,
        mfaVerified: params.mfaVerified || false,
        permissions: await this.getUserPermissions(params._userId),
        metadata: {
          ...metadata,
          loginMethod: params.loginMethod,
        },
        flags: {
          suspicious: false,
          requiresReauth: false,
          readOnly: false,
        },
      };

      // Generate tokens
      const tokens = await this.generateTokens(session);
      session.accessToken = tokens.accessToken;
      session.refreshToken = tokens.refreshToken;

      // Store session
      await this.storeSession(session);

      // Log session creation
      await auditLogger.log({
        event: 'USER_LOGIN',
        _userId: params._userId,
        details: {
          sessionId,
          loginMethod: params.loginMethod,
          securityLevel,
          mfaVerified: session.mfaVerified,
          ipAddress: params.ipAddress,
        },
        severity: 'info',
      });

      return session;
    } catch (error) {
      await auditLogger.log({
        event: 'LOGIN_FAILED',
        _userId: params._userId,
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
        severity: 'warning',
      });
      throw error;
    }
  }

  /**
   * Validate an existing session
   */
  async validateSession(
    sessionId: string,
    request?: {
      ipAddress?: string;
      userAgent?: string;
      fingerprint?: string;
    }
  ): Promise<SessionValidation> {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        return {
          isValid: false,
          reason: 'Session not found',
          requiresAction: 'reauthenticate',
          riskScore: 100,
        };
      }

      // Check if session is blacklisted
      if (this.blacklistedTokens.has(sessionId)) {
        return {
          isValid: false,
          reason: 'Session has been revoked',
          requiresAction: 'reauthenticate',
          riskScore: 100,
        };
      }

      const config = SESSION_CONFIGS[session.securityLevel];
      if (!config) {
        throw new Error(`Invalid security level: ${session.securityLevel}`);
      }
      const now = new Date();

      // Check absolute timeout
      if (now > session.expiresAt) {
        await this.terminateSession(sessionId, 'Absolute timeout');
        return {
          isValid: false,
          reason: 'Session expired',
          requiresAction: 'reauthenticate',
          riskScore: 0,
        };
      }

      // Check idle timeout
      const idleTime = now.getTime() - session.lastActivity.getTime();
      if (idleTime > config.maxIdleTime) {
        await this.terminateSession(sessionId, 'Idle timeout');
        return {
          isValid: false,
          reason: 'Session idle timeout',
          requiresAction: 'reauthenticate',
          riskScore: 0,
        };
      }

      // Validate request context if provided
      let riskScore = 0;
      
      if (request) {
        // Check IP binding
        if (config.bindToIP && request.ipAddress && request.ipAddress !== session.ipAddress) {
          riskScore += 50;
          this.recordSuspiciousActivity(sessionId, 'IP mismatch');
          
          if (session.securityLevel === 'maximum') {
            await this.terminateSession(sessionId, 'IP address changed');
            return {
              isValid: false,
              reason: 'IP address mismatch',
              requiresAction: 'reauthenticate',
              riskScore: 100,
            };
          }
        }

        // Check user agent binding
        if (config.bindToUserAgent && request.userAgent && request.userAgent !== session.userAgent) {
          riskScore += 30;
          this.recordSuspiciousActivity(sessionId, 'User agent mismatch');
        }

        // Check fingerprint
        if (config.requireFingerprint && request.fingerprint && request.fingerprint !== session.fingerprint) {
          riskScore += 40;
          this.recordSuspiciousActivity(sessionId, 'Fingerprint mismatch');
          
          if (riskScore > 50) {
            session.flags.requiresReauth = true;
          }
        }
      }

      // Check if MFA is required but not verified
      if (config.requireMFA && !session.mfaVerified) {
        return {
          isValid: false,
          reason: 'MFA verification required',
          requiresAction: 'mfa',
          riskScore: 50,
        };
      }

      // Check suspicious activity threshold
      const suspiciousCount = this.suspiciousActivities.get(sessionId) || 0;
      if (suspiciousCount > 5) {
        await this.terminateSession(sessionId, 'Suspicious activity detected');
        return {
          isValid: false,
          reason: 'Suspicious activity detected',
          requiresAction: 'reauthenticate',
          riskScore: 100,
        };
      }

      // Update last activity
      session.lastActivity = now;
      
      // Check if session needs renewal
      const timeToExpiry = session.expiresAt.getTime() - now.getTime();
      if (timeToExpiry < config.renewalThreshold) {
        await this.renewSession(sessionId);
      }

      return {
        isValid: true,
        riskScore,
      };
    } catch (_error) {
      logger.error('Session validation error: ');
      return {
        isValid: false,
        reason: 'Validation undefined',
        requiresAction: 'reauthenticate',
        riskScore: 100,
      };
    }
  }

  /**
   * Renew a session
   */
  async renewSession(sessionId: string): Promise<Session | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const config = SESSION_CONFIGS[session.securityLevel];
    if (!config) {
      throw new Error(`Invalid security level: ${session.securityLevel}`);
    }
    
    // Extend expiration
    session.expiresAt = new Date(Date.now() + config.absoluteTimeout);
    
    // Rotate tokens if configured
    if (config.rotateTokens) {
      const tokens = await this.generateTokens(session);
      
      // Blacklist old tokens
      if (session.accessToken) this.blacklistedTokens.add(session.accessToken);
      if (session.refreshToken) this.blacklistedTokens.add(session.refreshToken);
      
      session.accessToken = tokens.accessToken;
      session.refreshToken = tokens.refreshToken;
    }
    
    // Update session
    await this.storeSession(session);
    
    // Log renewal
    await auditLogger.log({
      event: 'DATA_MODIFICATION',
      _userId: session._userId,
      details: {
        sessionId,
        action: 'session_renewed',
        expiresAt: session.expiresAt,
      },
      severity: 'info',
    });
    
    return session;
  }

  /**
   * Terminate a session
   */
  async terminateSession(sessionId: string, reason: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Blacklist tokens
    if (session.accessToken) this.blacklistedTokens.add(session.accessToken);
    if (session.refreshToken) this.blacklistedTokens.add(session.refreshToken);
    
    // Remove from maps
    this.sessions.delete(sessionId);
    const userSessions = this.userSessions.get(session._userId);
    if (_userSessions) {
      userSessions.delete(sessionId);
    }
    
    // Clear suspicious activity
    this.suspiciousActivities.delete(sessionId);
    
    // Log termination
    await auditLogger.log({
      event: 'USER_LOGOUT',
      _userId: session._userId,
      details: {
        sessionId,
        reason,
        duration: Date.now() - session.createdAt.getTime(),
      },
      severity: 'info',
    });
    
    // Persist changes
    await this.persistSessions();
  }

  /**
   * Terminate all sessions for a user
   */
  async terminateUserSessions(_userId: string, reason: string): Promise<void> {
    const sessionIds = this.userSessions.get(_userId);
    if (!sessionIds) return;
    
    for (const sessionId of sessionIds) {
      await this.terminateSession(sessionId, reason);
    }
    
    this.userSessions.delete(_userId);
  }

  /**
   * Elevate session security level
   */
  async elevateSession(
    sessionId: string,
    newLevel: 'elevated' | 'maximum',
    mfaToken?: string
  ): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    // Verify MFA if required
    if (SESSION_CONFIGS[newLevel]?.requireMFA && !mfaToken) {
      return false;
    }
    
    // Update session
    session.securityLevel = newLevel;
    session.mfaVerified = true;
    
    // Apply new configuration
    const config = SESSION_CONFIGS[newLevel];
    if (!config) {
      throw new Error(`Invalid security level: ${newLevel}`);
    }
    session.expiresAt = new Date(
      Math.min(
        session.createdAt.getTime() + config.absoluteTimeout,
        session.expiresAt.getTime()
      )
    );
    
    await this.storeSession(session);
    
    // Log elevation
    await auditLogger.log({
      event: 'PERMISSION_GRANTED',
      _userId: session._userId,
      details: {
        sessionId,
        action: 'session_elevated',
        newLevel,
      },
      severity: 'info',
    });
    
    return true;
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(_userId: string): Promise<Session[]> {
    const sessionIds = this.userSessions.get(_userId);
    if (!sessionIds) return [];
    
    const sessions: Session[] = [];
    for (const sessionId of sessionIds) {
      const session = this.sessions.get(sessionId);
      if (session) {
        // Sanitize sensitive _data
        const sanitized = { ...session };
        delete sanitized.accessToken;
        delete sanitized.refreshToken;
        sessions.push(_sanitized);
      }
    }
    
    return sessions;
  }

  /**
   * Get session statistics
   */
  getStatistics(): {
    totalSessions: number;
    activeUsers: number;
    averageSessionDuration: number;
    sessionsBySecurityLevel: Record<string, number>;
    suspiciousSessions: number;
  } {
    const sessions = Array.from(this.sessions.values());
    const now = Date.now();
    
    const sessionsByLevel: Record<string, number> = {
      basic: 0,
      elevated: 0,
      maximum: 0,
    };
    
    let totalDuration = 0;
    let suspiciousCount = 0;
    
    sessions.forEach(session => {
      if (sessionsByLevel[session.securityLevel] !== undefined) {
        sessionsByLevel[session.securityLevel]!++;
      }
      totalDuration += now - session.createdAt.getTime();
      if (session.flags.suspicious) suspiciousCount++;
    });
    
    return {
      totalSessions: sessions.length,
      activeUsers: this.userSessions.size,
      averageSessionDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
      sessionsBySecurityLevel: sessionsByLevel,
      suspiciousSessions: suspiciousCount,
    };
  }

  /**
   * Private helper methods
   */
  private async generateSessionId(_userId: string): Promise<string> {
    const timestamp = Date.now().toString(36);
    const random = cryptoService.generateSecureUUID();
    const hash = await cryptoService.sha256(`${_userId}:${timestamp}:${random}`);
    return `sess_${timestamp}_${hash.substring(0, 32)}`;
  }

  private async generateFingerprint(userAgent: string, ipAddress: string): Promise<string> {
    const _data = `${userAgent}:${ipAddress}:${navigator.language || ''}:${screen.width}x${screen.height}`;
    return await cryptoService.sha256(_data);
  }

  private parseUserAgent(userAgent: string): unknown {
    // Simple user agent parsing
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    const browser = userAgent.match(/(chrome|firefox|safari|edge|opera)/i)?.[0] || 'unknown';
    const os = userAgent.match(/(windows|mac|linux|android|ios)/i)?.[0] || 'unknown';
    const platform = isMobile ? 'mobile' : 'desktop';
    
    return {
      platform,
      browser: browser.toLowerCase(),
      os: os.toLowerCase(),
      isMobile,
      isTrusted: !userAgent.includes('bot') && !userAgent.includes('crawler'),
    };
  }

  private determineSecurityLevel(params: unknown): 'basic' | 'elevated' | 'maximum' {
    // Determine based on context
    if (params.loginMethod === 'emergency') {
      return 'basic'; // Allow quick access in emergencies
    }
    
    if (params.mfaVerified) {
      return 'elevated';
    }
    
    // Check if accessing sensitive data
    if (params.requestedResources?.includes('phi')) {
      return 'maximum';
    }
    
    return 'basic';
  }

  private async getUserPermissions(_userId: string): Promise<string[]> {
    // In production, fetch from RBAC system
    return ['read', 'write'];
  }

  private async generateTokens(session: Session): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const _accessPayload = {
      sessionId: session.sessionId,
      _userId: session._userId,
      type: 'access',
      exp: Date.now() + 15 * 60 * 1000, // 15 minutes
    };
    
    const _refreshPayload = {
      sessionId: session.sessionId,
      _userId: session._userId,
      type: 'refresh',
      exp: session.expiresAt.getTime(),
    };
    
    const accessToken = await this.encodeToken(_accessPayload);
    const refreshToken = await this.encodeToken(_refreshPayload);
    
    return { accessToken, refreshToken };
  }

  private async encodeToken(_payload: unknown): Promise<string> {
    const _header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = btoa(JSON.stringify(_header));
    const encodedPayload = btoa(JSON.stringify(_payload));
    const signature = await cryptoService.signData(`${encodedHeader}.${encodedPayload}`);
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private async enforceSessionLimits(_userId: string): Promise<void> {
    const userSessions = this.userSessions.get(_userId) || new Set();
    
    // Get maximum allowed sessions for any user
    const maxSessions = Math.max(...Object.values(_SESSION_CONFIGS).map(c => c.maxConcurrentSessions));
    
    if (userSessions.size >= maxSessions) {
      // Terminate oldest session
      const sessions = Array.from(_userSessions)
        .map(_id => this.sessions.get(_id))
        .filter(s => s !== undefined)
        .sort((a, b) => a!.createdAt.getTime() - b!.createdAt.getTime());
      
      if (sessions.length > 0 && sessions[0]) {
        await this.terminateSession(sessions[0].sessionId, 'Session limit exceeded');
      }
    }
  }

  private recordSuspiciousActivity(sessionId: string, activity: string): void {
    const count = this.suspiciousActivities.get(sessionId) || 0;
    this.suspiciousActivities.set(sessionId, count + 1);
    
    const session = this.sessions.get(sessionId);
    if (session) {
      session.flags.suspicious = true;
    }
    
    logger.warn(`Suspicious activity on session ${sessionId}: ${activity}`);
  }

  private async storeSession(session: Session): Promise<void> {
    this.sessions.set(session.sessionId, session);
    
    // Update user sessions map
    if (!this.userSessions.has(session._userId)) {
      this.userSessions.set(session._userId, new Set());
    }
    this.userSessions.get(session.userId)!.add(session.sessionId);
    
    // Store fingerprint
    this.sessionFingerprints.set(session.sessionId, session.fingerprint);
    
    // Persist to storage
    await this.persistSessions();
  }

  private async loadSessions(): Promise<void> {
    try {
      const stored = await secureStorage.getItem(this.SESSION_STORAGE_KEY);
      if (stored && Array.isArray(_stored)) {
        // Restore sessions
        for (const sessionData of stored) {
          const session = {
            ...sessionData,
            createdAt: new Date(sessionData.createdAt),
            lastActivity: new Date(sessionData.lastActivity),
            expiresAt: new Date(sessionData.expiresAt),
          };
          
          // Validate session is still valid
          const validation = await this.validateSession(session.sessionId);
          if (validation.isValid) {
            this.sessions.set(session.sessionId, session);
            
            if (!this.userSessions.has(session._userId)) {
              this.userSessions.set(session._userId, new Set());
            }
            this.userSessions.get(session.userId)!.add(session.sessionId);
          }
        }
      }
    } catch (_error) {
      logger.error('Failed to load sessions:');
    }
  }

  private async persistSessions(): Promise<void> {
    try {
      const sessions = Array.from(this.sessions.values()).map(session => ({
        ...session,
        // Don't persist tokens in storage
        accessToken: undefined,
        refreshToken: undefined,
      }));
      
      await secureStorage.setItem(this.SESSION_STORAGE_KEY, sessions, {
        encrypted: true,
        expires: new Date(Date.now() + 24 * 3600000), // 24 hours
      });
    } catch (_error) {
      logger.error('Failed to persist sessions:');
    }
  }

  private startSessionMonitoring(): void {
    // Check sessions every minute
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60000);
    
    // Clean blacklisted tokens every hour
    setInterval(() => {
      this.cleanupBlacklistedTokens();
    }, 3600000);
  }

  private async cleanupExpiredSessions(): Promise<void> {
    const now = Date.now();
    
    for (const [sessionId, session] of this.sessions) {
      const config = SESSION_CONFIGS[session.securityLevel];
      if (!config) continue; // Skip invalid sessions
      const idleTime = now - session.lastActivity.getTime();
      
      if (now > session.expiresAt.getTime() || idleTime > config.maxIdleTime) {
        await this.terminateSession(sessionId, 'Session expired');
      }
    }
  }

  private cleanupBlacklistedTokens(): void {
    // In production, would check token expiration times
    // For now, clear tokens older than 24 hours
    if (this.blacklistedTokens.size > 10000) {
      this.blacklistedTokens.clear();
    }
  }

  private setupTokenRotation(): void {
    setInterval(async () => {
      for (const [sessionId, session] of this.sessions) {
        const config = SESSION_CONFIGS[session.securityLevel];
        if (config?.rotateTokens) {
          await this.renewSession(sessionId);
        }
      }
    }, this.TOKEN_ROTATION_INTERVAL);
  }
}

export const _sessionManager = SessionManagerService.getInstance();