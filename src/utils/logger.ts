/**
 * Centralized logging utility for CoreV4 Mental Health Platform
 * Provides structured logging with different severity levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  stack?: string;
}

class Logger {
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  constructor() {
    // Set log level based on environment
    this.logLevel = import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level];
    const context = entry.context ? `[${entry.context}]` : '';
    return `${timestamp} ${level} ${context} ${entry.message}`;
  }

  private log(level: LogLevel, message: string, context?: string, data?: unknown): void {
    if (level < this.logLevel) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      data
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
          console.log(`%c${formattedMessage}`, 'color: #888', data);
          break;
        case LogLevel.INFO:
          console.log(`%c${formattedMessage}`, 'color: #4CAF50', data);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, data);
          break;
        case LogLevel.ERROR:
        case LogLevel.CRITICAL:
          console.error(formattedMessage, data);
          if (data instanceof Error) {
            console.error(data.stack);
          }
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
    } catch (error) {
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
export const logDebug = (message: string, context?: string, data?: unknown) => 
  logger.debug(message, context, data);

export const logInfo = (message: string, context?: string, data?: unknown) => 
  logger.info(message, context, data);

export const logWarn = (message: string, context?: string, data?: unknown) => 
  logger.warn(message, context, data);

export const logError = (message: string, context?: string, error?: Error | unknown) => 
  logger.error(message, context, error);

export const logCritical = (message: string, context?: string, error?: Error | unknown) => 
  logger.critical(message, context, error);