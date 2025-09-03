
/**
 * Centralized logging utility for CoreV4 Mental Health Platform
 * Provides structured logging with different severity levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
  CRISIS = 5 // Mental health crisis events requiring immediate attention
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  stack?: string;
  isPrivacySafe?: boolean; // Indicates if log contains no sensitive user data
  urgency?: 'low' | 'medium' | 'high' | 'critical'; // For crisis situations
  userId?: string; // Anonymized user ID for tracking (never PII)
}

class Logger {
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private privacyPatterns = {
    email: /[\w.-]+@[\w.-]+\.\w+/gi,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    dateOfBirth: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g
  };

  constructor() {
    // Set log level based on environment
    this.logLevel = import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO;
  }

  /**
   * Sanitizes sensitive data from log messages
   * Replaces PII with safe placeholders
   */
  private sanitizeData(data: unknown): unknown {
    if (typeof data === 'string') {
      let sanitized = data;
      // Replace sensitive patterns with placeholders
      sanitized = sanitized.replace(this.privacyPatterns.email, '[EMAIL_REDACTED]');
      sanitized = sanitized.replace(this.privacyPatterns.phone, '[PHONE_REDACTED]');
      sanitized = sanitized.replace(this.privacyPatterns.ssn, '[SSN_REDACTED]');
      sanitized = sanitized.replace(this.privacyPatterns.creditCard, '[CC_REDACTED]');
      sanitized = sanitized.replace(this.privacyPatterns.ipAddress, '[IP_REDACTED]');
      sanitized = sanitized.replace(this.privacyPatterns.dateOfBirth, '[DOB_REDACTED]');
      return sanitized;
    }
    
    if (typeof data === 'object' && data !== null) {
      // Deep clone and sanitize object
      const sanitized: unknown = Array.isArray(data) ? [] : {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          // Skip sensitive field names entirely
          if (['password', 'token', 'secret', 'apiKey', 'privateKey'].includes(key.toLowerCase())) {
            sanitized[key] = '[REDACTED]';
          } else {
            sanitized[key] = this.sanitizeData((data as unknown)[key]);
          }
        }
      }
      return sanitized;
    }
    
    return data;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level];
    const context = entry.context ? `[${entry.context}]` : '';
    return `${timestamp} ${level} ${context} ${entry.message}`;
  }

  private log(
    level: LogLevel, 
    message: string, 
    context?: string, 
    data?: unknown,
    options?: { isPrivacySafe?: boolean; urgency?: 'low' | 'medium' | 'high' | 'critical'; userId?: string }
  ): void {
    if (level < this.logLevel) return;

    // Sanitize data in production unless explicitly marked as privacy safe
    const sanitizedData = (import.meta.env.PROD && !options?.isPrivacySafe) 
      ? this.sanitizeData(data) 
      : data;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      data: sanitizedData,
      ...options
    };

    // Store in memory for debugging
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output in development
    if (import.meta.env.DEV) {
      const formattedMessage = this.formatMessage(entry);
      
      switch (level) {
        case LogLevel.DEBUG:
          // Using console methods allowed by ESLint - wrapping in condition
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log(`%c${formattedMessage}`, 'color: #888', sanitizedData);
          }
          break;
        case LogLevel.INFO:
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log(`%c${formattedMessage}`, 'color: #4CAF50', sanitizedData);
          }
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, sanitizedData);
          break;
        case LogLevel.ERROR:
        case LogLevel.CRITICAL:
          console.error(formattedMessage, sanitizedData);
          if (sanitizedData instanceof Error) {
            console.error(sanitizedData.stack);
          }
          break;
        case LogLevel.CRISIS:
          // Crisis logs always use console.error for visibility
          console.error(`🚨 CRISIS ${entry.urgency ? `[${entry.urgency.toUpperCase()}]` : ''}: ${formattedMessage}`, sanitizedData);
          break;
      }
    }

    // In production, send critical errors to monitoring service
    if (import.meta.env.PROD && level >= LogLevel.ERROR) {
      this.sendToMonitoring(entry);
    }
  }

  private sendToMonitoring(entry: LogEntry): void {
    // TODO: Integrate with error monitoring service (e.g., Sentry)
    // For now, just store critical errors in localStorage for debugging
    try {
      const criticalErrors = JSON.parse(
        localStorage.getItem('corev4_critical_errors') || '[]'
      );
      criticalErrors.push({
        ...entry,
        timestamp: entry.timestamp.toISOString()
      });
      // Keep only last 50 errors
      if (criticalErrors.length > 50) {
        criticalErrors.shift();
      }
      localStorage.setItem('corev4_critical_errors', JSON.stringify(criticalErrors));
    } catch (_error) {
      // Fail silently if localStorage is full or unavailable
    }
  }

  public debug(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  public info(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  public warn(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  /**
   * Logs a crisis event requiring immediate attention
   * @param message - Description of the crisis event
   * @param urgency - Crisis urgency level
   * @param context - Optional context/module name
   * @param data - Additional data (will be sanitized)
   */
  public crisis(
    message: string, 
    urgency: 'low' | 'medium' | 'high' | 'critical',
    context?: string, 
    data?: unknown
  ): void {
    this.log(LogLevel.CRISIS, message, context, data, { urgency });
    
    // For critical urgency, also trigger additional monitoring
    if (urgency === 'critical' && import.meta.env.PROD) {
      this.sendCrisisAlert(message, data);
    }
  }

  private sendCrisisAlert(message: string, data?: unknown): void {
    // In production, this would integrate with crisis response systems
    // For now, store in localStorage for monitoring
    try {
      const crisisEvents = JSON.parse(
        localStorage.getItem('corev4_crisis_events') || '[]'
      );
      crisisEvents.push({
        timestamp: new Date().toISOString(),
        message,
        data: this.sanitizeData(data)
      });
      // Keep only last 20 crisis events
      if (crisisEvents.length > 20) {
        crisisEvents.shift();
      }
      localStorage.setItem('corev4_crisis_events', JSON.stringify(crisisEvents));
    } catch (_error) {
      // Fail silently
    }
  }

  public error(message: string, context?: string, errorData?: Error | unknown): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: LogLevel.ERROR,
      message,
      context,
      data: errorData
    };

    if (errorData instanceof Error) {
      entry.stack = errorData.stack;
    }

    this.log(LogLevel.ERROR, message, context, errorData);
  }

  public critical(message: string, context?: string, error?: Error | unknown): void {
    this.log(LogLevel.CRITICAL, message, context, error);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const _logDebug = (message: string, context?: string, data?: unknown) => 
  logger.debug(message, context, data);

export const _logInfo = (message: string, context?: string, data?: unknown) => 
  logger.info(message, context, data);

export const _logWarn = (message: string, context?: string, data?: unknown) => 
  logger.warn(message, context, data);

export const _logError = (message: string, context?: string, error?: Error | unknown) => 
  logger.error(message, context, error);

export const _logCritical = (message: string, context?: string, error?: Error | unknown) => 
  logger.critical(message, context, error);

export const _logCrisis = (
  message: string, 
  urgency: 'low' | 'medium' | 'high' | 'critical', 
  context?: string, 
  data?: unknown
) => logger.crisis(message, urgency, context, data);