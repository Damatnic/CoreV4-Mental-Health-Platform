/**
 * Rate Limiting and DDoS Protection Service
 * Implements comprehensive rate limiting, request throttling, and attack detection
 * OWASP compliant with adaptive protection mechanisms
 */

import { auditLogger } from './auditLogger';
import { cryptoService } from './cryptoService';
import { secureStorage } from './SecureLocalStorage';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (context: any) => string; // Custom key generation
  handler?: (context: any) => void; // Custom rate limit handler
  onLimitReached?: (key: string, info: RateLimitInfo) => void;
}

interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
  retryAfter: number;
}

interface EndpointLimits {
  [endpoint: string]: RateLimitConfig;
}

interface AttackPattern {
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'log' | 'throttle' | 'block' | 'honeypot';
  description: string;
}

interface IPReputation {
  ip: string;
  score: number; // 0-100, higher is worse
  lastSeen: Date;
  violations: number;
  blocked: boolean;
  reason?: string;
}

class RateLimiterService {
  private static instance: RateLimiterService;
  private requestCounts: Map<string, number[]> = new Map();
  private blockedIPs: Map<string, Date> = new Map();
  private ipReputations: Map<string, IPReputation> = new Map();
  private honeypotEndpoints: Set<string> = new Set();
  private attackPatterns: AttackPattern[] = [];
  private captchaRequired: Map<string, Date> = new Map();

  // Default rate limits for different endpoint types
  private readonly defaultLimits: EndpointLimits = {
    // Authentication endpoints - strict limits
    '/api/auth/login': {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      skipSuccessfulRequests: true,
    },
    '/api/auth/register': {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
    },
    '/api/auth/reset-password': {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
    },
    '/api/auth/mfa': {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 5,
      skipSuccessfulRequests: true,
    },

    // Crisis services - balanced for emergency access
    '/api/crisis/emergency': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // Higher limit for crisis situations
    },
    '/api/crisis/chat': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // Allow rapid messages in crisis
    },
    '/api/crisis/resources': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20,
    },

    // Health data endpoints - moderate limits
    '/api/health/mood': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
    },
    '/api/health/journal': {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 20,
    },
    '/api/health/medication': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
    },

    // Community endpoints - stricter to prevent spam
    '/api/community/post': {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 5,
    },
    '/api/community/comment': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
    },
    '/api/community/report': {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 3,
    },

    // General API endpoints
    '/api/*': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60, // 1 request per second average
    },
  };

  private constructor() {
    this.initializeRateLimiter();
  }

  static getInstance(): RateLimiterService {
    if (!RateLimiterService.instance) {
      RateLimiterService.instance = new RateLimiterService();
    }
    return RateLimiterService.instance;
  }

  private initializeRateLimiter(): void {
    this.setupAttackPatterns();
    this.setupHoneypots();
    this.startCleanupInterval();
    this.loadBlockedIPs();
  }

  /**
   * Check if request should be rate limited
   */
  async checkRateLimit(params: {
    endpoint: string;
    ip: string;
    userId?: string;
    method?: string;
    headers?: Record<string, string>;
  }): Promise<{
    allowed: boolean;
    info: RateLimitInfo;
    reason?: string;
  }> {
    const { endpoint, ip, userId, method = 'GET' } = params;

    // Check if IP is blocked
    if (this.isIPBlocked(ip)) {
      return {
        allowed: false,
        info: this.getRateLimitInfo(endpoint, 0, 0),
        reason: 'IP address is blocked',
      };
    }

    // Check for attack patterns
    const attackDetected = this.detectAttackPattern(endpoint, params.headers);
    if (attackDetected) {
      await this.handleAttackDetection(ip, attackDetected);
      if (attackDetected.action === 'block') {
        return {
          allowed: false,
          info: this.getRateLimitInfo(endpoint, 0, 0),
          reason: 'Suspicious activity detected',
        };
      }
    }

    // Check if honeypot endpoint
    if (this.isHoneypot(endpoint)) {
      await this.handleHoneypotAccess(ip, endpoint);
      return {
        allowed: false,
        info: this.getRateLimitInfo(endpoint, 0, 0),
        reason: 'Invalid endpoint',
      };
    }

    // Get rate limit configuration for endpoint
    const config = this.getRateLimitConfig(endpoint);
    
    // Generate rate limit key
    const key = this.generateKey(ip, userId, endpoint);
    
    // Get current request count
    const count = this.getRequestCount(key, config.windowMs);
    
    // Check if limit exceeded
    if (count >= config.maxRequests) {
      await this.handleRateLimitExceeded(ip, endpoint, count);
      
      // Check if CAPTCHA is required
      if (this.requiresCaptcha(ip)) {
        return {
          allowed: false,
          info: this.getRateLimitInfo(endpoint, config.maxRequests, 0),
          reason: 'CAPTCHA verification required',
        };
      }
      
      return {
        allowed: false,
        info: this.getRateLimitInfo(endpoint, config.maxRequests, 0),
        reason: 'Rate limit exceeded',
      };
    }

    // Increment request count
    this.incrementRequestCount(key);

    // Update IP reputation
    this.updateIPReputation(ip, true);

    return {
      allowed: true,
      info: this.getRateLimitInfo(endpoint, config.maxRequests, config.maxRequests - count - 1),
    };
  }

  /**
   * Throttle request with adaptive delay
   */
  async throttleRequest(params: {
    ip: string;
    endpoint: string;
    userId?: string;
  }): Promise<number> {
    const reputation = this.getIPReputation(params.ip);
    const baseDelay = 100; // Base delay in milliseconds
    
    // Calculate adaptive delay based on reputation
    let delay = baseDelay;
    
    if (reputation.score > 80) {
      delay = baseDelay * 10; // 1 second for very bad reputation
    } else if (reputation.score > 60) {
      delay = baseDelay * 5; // 500ms for bad reputation
    } else if (reputation.score > 40) {
      delay = baseDelay * 2; // 200ms for moderate reputation
    }
    
    // Add jitter to prevent timing attacks
    const jitter = Math.random() * 50;
    delay += jitter;
    
    // Apply throttle
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return delay;
  }

  /**
   * Block IP address
   */
  async blockIP(ip: string, reason: string, duration: number = 3600000): Promise<void> {
    const blockUntil = new Date(Date.now() + duration);
    this.blockedIPs.set(ip, blockUntil);
    
    // Update reputation
    const reputation = this.getIPReputation(ip);
    reputation.blocked = true;
    reputation.reason = reason;
    reputation.score = 100;
    
    // Log security event
    await auditLogger.log({
      event: 'SECURITY_ALERT',
      details: {
        action: 'ip_blocked',
        ip,
        reason,
        duration,
        blockUntil,
      },
      severity: 'warning',
    });
    
    // Persist blocked IPs
    await this.persistBlockedIPs();
  }

  /**
   * Unblock IP address
   */
  async unblockIP(ip: string): Promise<void> {
    this.blockedIPs.delete(ip);
    
    const reputation = this.ipReputations.get(ip);
    if (reputation) {
      reputation.blocked = false;
      reputation.reason = undefined;
    }
    
    await this.persistBlockedIPs();
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ip: string): boolean {
    const blockUntil = this.blockedIPs.get(ip);
    if (!blockUntil) return false;
    
    if (new Date() > blockUntil) {
      // Block expired, remove it
      this.blockedIPs.delete(ip);
      return false;
    }
    
    return true;
  }

  /**
   * Get IP reputation
   */
  getIPReputation(ip: string): IPReputation {
    let reputation = this.ipReputations.get(ip);
    
    if (!reputation) {
      reputation = {
        ip,
        score: 0,
        lastSeen: new Date(),
        violations: 0,
        blocked: false,
      };
      this.ipReputations.set(ip, reputation);
    }
    
    return reputation;
  }

  /**
   * Require CAPTCHA for IP
   */
  requireCaptcha(ip: string, duration: number = 3600000): void {
    const requireUntil = new Date(Date.now() + duration);
    this.captchaRequired.set(ip, requireUntil);
  }

  /**
   * Check if CAPTCHA is required
   */
  requiresCaptcha(ip: string): boolean {
    const requireUntil = this.captchaRequired.get(ip);
    if (!requireUntil) return false;
    
    if (new Date() > requireUntil) {
      this.captchaRequired.delete(ip);
      return false;
    }
    
    return true;
  }

  /**
   * Verify CAPTCHA response
   */
  async verifyCaptcha(ip: string, token: string): Promise<boolean> {
    // In production, verify with CAPTCHA service (reCAPTCHA, hCaptcha, etc.)
    // For now, simple validation
    if (token && token.length > 10) {
      this.captchaRequired.delete(ip);
      
      // Improve reputation
      const reputation = this.getIPReputation(ip);
      reputation.score = Math.max(0, reputation.score - 10);
      
      return true;
    }
    
    return false;
  }

  /**
   * Get rate limit statistics
   */
  getStatistics(): {
    totalRequests: number;
    blockedIPs: number;
    captchaRequired: number;
    averageReputationScore: number;
    topViolators: Array<{ ip: string; violations: number }>;
  } {
    let totalRequests = 0;
    this.requestCounts.forEach(counts => {
      totalRequests += counts.length;
    });
    
    const reputations = Array.from(this.ipReputations.values());
    const averageScore = reputations.length > 0
      ? reputations.reduce((sum, r) => sum + r.score, 0) / reputations.length
      : 0;
    
    const topViolators = reputations
      .sort((a, b) => b.violations - a.violations)
      .slice(0, 10)
      .map(r => ({ ip: r.ip, violations: r.violations }));
    
    return {
      totalRequests,
      blockedIPs: this.blockedIPs.size,
      captchaRequired: this.captchaRequired.size,
      averageReputationScore: averageScore,
      topViolators,
    };
  }

  /**
   * Private helper methods
   */
  private getRateLimitConfig(endpoint: string): RateLimitConfig {
    // Check for exact match
    if (this.defaultLimits[endpoint]) {
      return this.defaultLimits[endpoint];
    }
    
    // Check for pattern match
    for (const [pattern, config] of Object.entries(this.defaultLimits)) {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        if (regex.test(endpoint)) {
          return config;
        }
      }
    }
    
    // Default fallback
    return this.defaultLimits['/api/*'];
  }

  private generateKey(ip: string, userId?: string, endpoint?: string): string {
    const parts = [ip];
    if (userId) parts.push(userId);
    if (endpoint) parts.push(endpoint);
    return parts.join(':');
  }

  private getRequestCount(key: string, windowMs: number): number {
    const counts = this.requestCounts.get(key) || [];
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Filter counts within window
    const validCounts = counts.filter(timestamp => timestamp > windowStart);
    
    // Update stored counts
    if (validCounts.length !== counts.length) {
      this.requestCounts.set(key, validCounts);
    }
    
    return validCounts.length;
  }

  private incrementRequestCount(key: string): void {
    const counts = this.requestCounts.get(key) || [];
    counts.push(Date.now());
    this.requestCounts.set(key, counts);
  }

  private getRateLimitInfo(endpoint: string, limit: number, remaining: number): RateLimitInfo {
    const config = this.getRateLimitConfig(endpoint);
    const resetTime = new Date(Date.now() + config.windowMs);
    const retryAfter = Math.ceil(config.windowMs / 1000);
    
    return {
      limit,
      current: limit - remaining,
      remaining,
      resetTime,
      retryAfter,
    };
  }

  private setupAttackPatterns(): void {
    this.attackPatterns = [
      // SQL Injection patterns
      {
        pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b|--|;|\||\\x[0-9a-f]{2})/i,
        severity: 'high',
        action: 'block',
        description: 'SQL injection attempt',
      },
      // XSS patterns
      {
        pattern: /<script[^>]*>|javascript:|onerror=|onload=|alert\(|prompt\(|confirm\(/i,
        severity: 'high',
        action: 'block',
        description: 'XSS attempt',
      },
      // Path traversal
      {
        pattern: /\.\.[\/\\]|\.\.[\/\\]\.\.[\/\\]/,
        severity: 'medium',
        action: 'block',
        description: 'Path traversal attempt',
      },
      // Command injection
      {
        pattern: /[;&|`$]|\$\(|\bexec\b|\bsystem\b|\beval\b/i,
        severity: 'high',
        action: 'block',
        description: 'Command injection attempt',
      },
      // Suspicious user agents
      {
        pattern: /sqlmap|nikto|havij|acunetix|nessus|metasploit/i,
        severity: 'critical',
        action: 'block',
        description: 'Security scanner detected',
      },
    ];
  }

  private detectAttackPattern(
    endpoint: string,
    headers?: Record<string, string>
  ): AttackPattern | null {
    const checkString = endpoint + JSON.stringify(headers || {});
    
    for (const pattern of this.attackPatterns) {
      if (pattern.pattern.test(checkString)) {
        return pattern;
      }
    }
    
    return null;
  }

  private async handleAttackDetection(ip: string, attack: AttackPattern): Promise<void> {
    // Update reputation
    const reputation = this.getIPReputation(ip);
    reputation.violations++;
    reputation.score = Math.min(100, reputation.score + 20);
    
    // Log security event
    await auditLogger.log({
      event: 'SECURITY_ALERT',
      details: {
        type: 'attack_detected',
        ip,
        pattern: attack.description,
        severity: attack.severity,
        action: attack.action,
      },
      severity: attack.severity === 'critical' ? 'critical' : 'warning',
    });
    
    // Take action based on severity
    if (attack.severity === 'critical' || reputation.violations > 5) {
      await this.blockIP(ip, attack.description, 24 * 3600000); // 24 hour block
    } else if (attack.severity === 'high') {
      await this.blockIP(ip, attack.description, 3600000); // 1 hour block
    } else {
      this.requireCaptcha(ip);
    }
  }

  private setupHoneypots(): void {
    // Add fake endpoints that should never be accessed
    this.honeypotEndpoints.add('/admin.php');
    this.honeypotEndpoints.add('/wp-admin');
    this.honeypotEndpoints.add('/.env');
    this.honeypotEndpoints.add('/config.json');
    this.honeypotEndpoints.add('/api/v1/admin');
    this.honeypotEndpoints.add('/phpmyadmin');
    this.honeypotEndpoints.add('/.git/config');
    this.honeypotEndpoints.add('/backup.sql');
  }

  private isHoneypot(endpoint: string): boolean {
    return this.honeypotEndpoints.has(endpoint);
  }

  private async handleHoneypotAccess(ip: string, endpoint: string): Promise<void> {
    // Immediate block for honeypot access
    await this.blockIP(ip, `Honeypot access: ${endpoint}`, 7 * 24 * 3600000); // 7 day block
    
    // Log critical security event
    await auditLogger.log({
      event: 'SECURITY_ALERT',
      details: {
        type: 'honeypot_triggered',
        ip,
        endpoint,
      },
      severity: 'critical',
    });
  }

  private async handleRateLimitExceeded(ip: string, endpoint: string, count: number): Promise<void> {
    // Update reputation
    const reputation = this.getIPReputation(ip);
    reputation.violations++;
    reputation.score = Math.min(100, reputation.score + 5);
    
    // Log event
    await auditLogger.log({
      event: 'SECURITY_ALERT',
      details: {
        type: 'rate_limit_exceeded',
        ip,
        endpoint,
        requestCount: count,
      },
      severity: 'warning',
    });
    
    // Progressive penalties
    if (reputation.violations > 10) {
      await this.blockIP(ip, 'Excessive rate limit violations', 3600000);
    } else if (reputation.violations > 5) {
      this.requireCaptcha(ip);
    }
  }

  private updateIPReputation(ip: string, success: boolean): void {
    const reputation = this.getIPReputation(ip);
    reputation.lastSeen = new Date();
    
    if (success) {
      // Slowly improve reputation for successful requests
      reputation.score = Math.max(0, reputation.score - 0.1);
    }
  }

  private startCleanupInterval(): void {
    // Clean up old data every hour
    setInterval(() => {
      this.cleanup();
    }, 3600000);
  }

  private cleanup(): void {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    // Clean up old request counts
    this.requestCounts.forEach((counts, key) => {
      const validCounts = counts.filter(timestamp => timestamp > oneHourAgo);
      if (validCounts.length === 0) {
        this.requestCounts.delete(key);
      } else if (validCounts.length !== counts.length) {
        this.requestCounts.set(key, validCounts);
      }
    });
    
    // Clean up expired blocks
    this.blockedIPs.forEach((blockUntil, ip) => {
      if (new Date() > blockUntil) {
        this.blockedIPs.delete(ip);
      }
    });
    
    // Clean up expired CAPTCHA requirements
    this.captchaRequired.forEach((requireUntil, ip) => {
      if (new Date() > requireUntil) {
        this.captchaRequired.delete(ip);
      }
    });
    
    // Clean up old reputations
    this.ipReputations.forEach((reputation, ip) => {
      const daysSinceLastSeen = (now - reputation.lastSeen.getTime()) / (24 * 3600000);
      if (daysSinceLastSeen > 30 && reputation.score < 10) {
        this.ipReputations.delete(ip);
      }
    });
  }

  private async loadBlockedIPs(): Promise<void> {
    // Load blocked IPs from storage
    try {
      const stored = secureStorage.getItem('blocked_ips');
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([ip, blockUntil]) => {
          this.blockedIPs.set(ip, new Date(blockUntil as string));
        });
      }
    } catch (error) {
      console.error('Failed to load blocked IPs:', error);
    }
  }

  private async persistBlockedIPs(): Promise<void> {
    // Persist blocked IPs to storage
    try {
      const data: Record<string, string> = {};
      this.blockedIPs.forEach((blockUntil, ip) => {
        data[ip] = blockUntil.toISOString();
      });
      secureStorage.setItem('blocked_ips', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist blocked IPs:', error);
    }
  }
}

export const rateLimiter = RateLimiterService.getInstance();