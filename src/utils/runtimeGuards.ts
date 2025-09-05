import { logger } from '../utils/logger';
/**
 * Runtime Guards - Defensive Programming Patterns
 * Prevents common runtime errors and lexical declaration issues
 */

// Safe variable accessor to prevent undefined access
export function safeAccess<T>(obj: any, path: string, defaultValue?: T): T | undefined {
  try {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result == null || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  } catch (error) {
    logger.warn('Safe access failed:', path, error);
    return defaultValue;
  }
}

// Safe function caller to prevent call stack issues
export function safeCall<T extends (...args: any[]) => any>(
  fn: T | undefined | null,
  defaultValue?: ReturnType<T>,
  ...args: Parameters<T>
): ReturnType<T> | undefined {
  try {
    if (typeof fn === 'function') {
      return fn(...args);
    }
    return defaultValue;
  } catch (error) {
    logger.error('Safe call failed:', String(error));
    return defaultValue;
  }
}

// Guard against temporal dead zone violations
export function initializeVariable<T>(
  getter: () => T,
  defaultValue: T,
  varName?: string
): T {
  try {
    const result = getter();
    return result !== undefined ? result : defaultValue;
  } catch (error) {
    if (error instanceof ReferenceError && error.message.includes('before initialization')) {
      logger.warn(`Temporal dead zone detected for ${varName || 'variable'} })(), using default:`, String(defaultValue));
      return defaultValue;
    }
    throw error; // Re-throw other errors
  }
}

// Safe module loader to prevent circular dependency issues
export function safeImport<T>(
  importPromise: Promise<T>,
  fallback: T
): Promise<T> {
  return importPromise.catch((error) => {
    logger.error('Module import failed, using fallback:', error);
    return fallback;
  });
}

// Global error handler setup
export function setupRuntimeGuards() {
  // Prevent unhandled errors from crashing the app
  window.addEventListener('error', (event) => {
    logger.error('🚨 Runtime Error Caught:', JSON.stringify({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      timestamp: new Date().toISOString()
    }));
    
    // Log to storage for analysis
    try {
      const errorLog = JSON.parse(localStorage.getItem('runtimeerrors') || '[]');
      errorLog.push({
        type: 'scripterror',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 50 errors
      const recentErrors = errorLog.slice(-50);
      localStorage.setItem('runtimeerrors', JSON.stringify(recentErrors));
    } catch (error) {
      logger.warn('Failed to log runtime error: ', String(error));
    }
    
    // Don't prevent default error handling
    return false;
  });
  
  // Prevent unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('🚨 Unhandled Promise Rejection:', JSON.stringify({
      reason: event.reason,
      promise: event.promise,
      timestamp: new Date().toISOString()
    }));
    
    // Log promise rejections
    try {
      const rejectionLog = JSON.parse(localStorage.getItem('promise_rejections') || '[]');
      rejectionLog.push({
        reason: event.reason?.toString(),
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 30 rejections
      const recentRejections = rejectionLog.slice(-30);
      localStorage.setItem('promise_rejections', JSON.stringify(recentRejections));
    } catch (error) {
    logger.warn('Failed to log promise rejection:', String(error));
    }
    
    // Prevent the rejection from being logged to console
    event.preventDefault();
  });
  
  logger.info('✅ Runtime guards initialized');
}

// Memory leak prevention
export class MemoryLeakGuard {
  private static instance: MemoryLeakGuard;
  private observers: Set<any> = new Set();
  private timers: Set<any> = new Set();
  private listeners: Map<EventTarget, Map<string, EventListener>> = new Map();
  
  static getInstance(): MemoryLeakGuard {
    if (!MemoryLeakGuard.instance) {
      MemoryLeakGuard.instance = new MemoryLeakGuard();
    }
    return MemoryLeakGuard.instance;
  }
  
  // Track observers for cleanup
  trackObserver(observer: any) {
    this.observers.add(observer);
    return observer;
  }
  
  // Track timers for cleanup
  trackTimer(timerId: any) {
    this.timers.add(timerId);
    return timerId;
  }
  
  // Track event listeners for cleanup
  trackListener(element: EventTarget, event: string, listener: EventListener) {
    if (!this.listeners.has(element)) {
      this.listeners.set(element, new Map());
    }
    this.listeners.get(element)!.set(event, listener);
  }
  
  // Clean up all tracked resources
  cleanup() {
    // Disconnect observers
    this.observers.forEach((observer: any) => {
      try {
        if (observer.disconnect) observer.disconnect();
        if (observer.unobserve) observer.unobserve();
      } catch (error) {
    logger.warn('Failed to disconnect observer:', String(error));
      }
    });
    this.observers.clear();
    
    // Clear timers
    this.timers.forEach((timerId: any) => {
      try {
        clearTimeout(timerId);
        clearInterval(timerId);
      } catch (error) {
    logger.warn('Failed to clear timer:', String(error));
      }
    });
    this.timers.clear();
    
    // Remove event listeners
    this.listeners.forEach((events, element) => {
      events.forEach((listener, event) => {
        try {
          element.removeEventListener(event, listener);
        } catch (error) {
    logger.warn('Failed to remove event listener:', String(error));
        }
      });
    });
    this.listeners.clear();
  }
}

// Performance monitoring guard
export class PerformanceGuard {
  private static metrics: Map<string, number> = new Map();
  
  static startMeasurement(name: string) {
    this.metrics.set(name, performance.now());
  }
  
  static endMeasurement(name: string, warnThreshold = 1000) {
    const start = this.metrics.get(name);
    if (start) {
      const duration = performance.now() - start;
      this.metrics.delete(name);
      
      if (duration > warnThreshold) {
        logger.warn(`⚠️ Performance warning: ${name} took ${duration.toFixed(2)}ms`);
      }
      
      return duration;
    }
    return 0;
  }
}

// Initialize guards when module loads
if (typeof window !== 'undefined') {
  setupRuntimeGuards();
}

export default {
  safeAccess,
  safeCall,
  initializeVariable,
  safeImport,
  setupRuntimeGuards,
  MemoryLeakGuard,
  PerformanceGuard
};