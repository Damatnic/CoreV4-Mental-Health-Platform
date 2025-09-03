/**
 * HIPAA-Compliant Structured Logging Service
 * 
 * This service provides structured logging with:
 * - HIPAA compliance (no PII/PHI in logs)
 * - Performance metrics tracking
 * - Crisis intervention audit trail
 * - Error boundary integration
 * - Configurable log levels based on environment
 */

import { auditLogger } from '../security/auditLogger';
import { logger } from '../utils/logger';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
  SILENT = 5
}

export enum LogCategory {
  CRISIS = 'CRISIS',
  AUTH = 'AUTH',
  WELLNESS = 'WELLNESS',
  COMMUNITY = 'COMMUNITY',
  PERFORMANCE = 'PERFORMANCE',
  SECURITY = 'SECURITY',
  SYSTEM = 'SYSTEM',
  USER_ACTION = 'USER_ACTION',
  API = 'API',
  ERROR = 'ERROR',
  AI = 'AI',
  EMERGENCY = 'EMERGENCY',
  NOTIFICATIONS = 'NOTIFICATIONS',
  ACCESSIBILITY = 'ACCESSIBILITY'
}

interface LogContext {
  category: LogCategory;
  action?: string;
  userId?: string;
  sessionId?: string;
  signId?: string;
  contactId?: string;
  buddyId?: string;
  newStatus?: boolean;
  relationship?: string;
  _metadata?: Record<string, any>;
  performanceMetrics?: {
    duration?: number;
    memoryUsage?: number;
    responseTime?: number;
  };
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: LogContext;
  environment: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private isDevelopment: boolean;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;
  private flushInterval = 5000; // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
    this.startFlushTimer();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  private sanitizeData(data: unknown): unknown {
    if (data === null || data === undefined) {
      return data;
    }

    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'token',
      'apiKey',
      'ssn',
      'dateOfBirth',
      'email',
      'phone',
      'address',
      'creditCard',
      'diagnosis',
      'medication',
      'therapyNotes',
      'mentalHealthHistory'
    ];

    if (typeof data === 'object') {
      const sanitized: unknown = Array.isArray(data) ? [] : {};
      
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const lowerKey = key.toLowerCase();
          if (sensitiveFields.some(_field => lowerKey.includes(_field))) {
            sanitized[key] = '[REDACTED]';
          } else if (typeof data[key] === 'object') {
            sanitized[key] = this.sanitizeData(data[key]);
          } else {
            sanitized[key] = data[key];
          }
        }
      }
      
      return sanitized;
    }

    return data;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category: context?.category || LogCategory.SYSTEM,
      message,
      context: context ? this.sanitizeData(_context) : undefined,
      environment: this.isDevelopment ? 'development' : 'production'
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private writeToConsole(entry: LogEntry): void {
    if (!this.isDevelopment && entry.level < LogLevel.WARN) {
      return; // Only log warnings and errors in production
    }

    const prefix = `[${entry.timestamp}] [${LogLevel[entry.level]}] [${entry.category}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        if (this.isDevelopment) {
          logger.info(message, entry.context || '');
        }
        break;
      case LogLevel.WARN:
        logger.warn(message, entry.context || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        logger.error(message, entry.context || '');
        break;
    }
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }

    const entriesToFlush = [...this.logBuffer];
    this.logBuffer = [];

    // Send to remote logging service (if configured)
    if (!this.isDevelopment) {
      try {
        await this.sendToRemoteLogging(_entriesToFlush);
      } catch {
        // Fallback to console if remote logging fails
        logger.error('[Logger] Failed to send logs to remote service');
      }
    }

    // Send critical logs to audit service
    const criticalLogs = entriesToFlush.filter(
      entry => entry.level >= LogLevel.ERROR || entry.category === LogCategory.CRISIS
    );
    
    for (const log of criticalLogs) {
      if (log.context?.userId) {
        await auditLogger.log({
          event: 'SECURITY_ALERT' as const,
          userId: log.context.userId,
          action: 'CRITICAL_EVENT',
          outcome: 'success',
          severity: 'critical',
          details: {
            message: log.message,
            ...log.context._metadata
          }
        });
      }
    }
  }

  private async sendToRemoteLogging(entries: LogEntry[]): Promise<void> {
    // Implementation would send to your logging service (e.g., Sentry, LogRocket, etc.)
    // For now, this is a placeholder
    if (typeof window !== 'undefined' && window.Sentry) {
      entries.forEach(entry => {
        if (entry.level >= LogLevel.ERROR && window.Sentry) {
          window.Sentry.captureMessage(entry.message, {
            level: entry.level === LogLevel.CRITICAL ? 'fatal' : 'error',
            extra: entry.context
          });
        }
      });
    }
  }

  // Public logging methods

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.formatMessage(LogLevel.DEBUG, message, context);
      this.writeToConsole(entry);
      this.addToBuffer(entry);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.formatMessage(LogLevel.INFO, message, context);
      this.writeToConsole(entry);
      this.addToBuffer(entry);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.formatMessage(LogLevel.WARN, message, context);
      this.writeToConsole(entry);
      this.addToBuffer(entry);
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const enrichedContext: LogContext = {
        ...context,
        category: context?.category || LogCategory.ERROR,
        error: error ? {
          message: error.message,
          stack: error.stack,
          code: (error as unknown).code
        } : undefined
      };
      
      const entry = this.formatMessage(LogLevel.ERROR, message, enrichedContext);
      this.writeToConsole(entry);
      this.addToBuffer(entry);
    }
  }

  critical(message: string, error?: Error, context?: LogContext): void {
    const enrichedContext: LogContext = {
      ...context,
      category: context?.category || LogCategory.CRISIS,
      error: error ? {
        message: error.message,
        stack: error.stack,
        code: (error as unknown).code
      } : undefined
    };
    
    const entry = this.formatMessage(LogLevel.CRITICAL, message, enrichedContext);
    this.writeToConsole(entry);
    this.addToBuffer(entry);
    
    // Immediately flush critical logs
    this.flush();
  }

  // Specialized logging methods for mental health features

  logCrisisIntervention(action: string, userId?: string, _metadata?: Record<string, any>): void {
    this.info(`Crisis intervention: ${action}`, {
      category: LogCategory.CRISIS,
      action,
      userId,
      _metadata: this.sanitizeData(_metadata)
    });
  }

  logWellnessActivity(action: string, userId?: string, _metadata?: Record<string, any>): void {
    this.info(`Wellness activity: ${action}`, {
      category: LogCategory.WELLNESS,
      action,
      userId,
      _metadata: this.sanitizeData(_metadata)
    });
  }

  logPerformance(metric: string, value: number, metadata?: Record<string, any>): void {
    this.debug(`Performance metric: ${metric}`, {
      category: LogCategory.PERFORMANCE,
      action: metric,
      performanceMetrics: {
        duration: value
      },
      metadata
    });
  }

  logSecurityEvent(event: string, userId?: string, _metadata?: Record<string, any>): void {
    this.warn(`Security event: ${event}`, {
      category: LogCategory.SECURITY,
      action: event,
      userId,
      _metadata: this.sanitizeData(_metadata)
    });
  }

  logApiCall(endpoint: string, method: string, statusCode?: number, duration?: number): void {
    const message = `API ${method} ${endpoint} - ${statusCode || 'pending'}`;
    this.debug(message, {
      category: LogCategory.API,
      action: `${method} ${endpoint}`,
      performanceMetrics: duration ? { duration } : undefined,
      _metadata: { statusCode }
    });
  }

  // Performance tracking

  startTimer(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.logPerformance(label, duration);
      return duration;
    };
  }

  // Cleanup

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions
export const __logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
export const __logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const __logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const __logError = (message: string, error?: Error, context?: LogContext) => logger.error(message, error, context);
export const __logCritical = (message: string, error?: Error, context?: LogContext) => logger.critical(message, error, context);

// Extend window interface for Sentry integration
declare global {
  interface Window {
    Sentry?: {
      captureMessage: (message: string, options?: unknown) => void;
      captureException: (error: Error, options?: unknown) => void;
    };
  }
}

export default logger;