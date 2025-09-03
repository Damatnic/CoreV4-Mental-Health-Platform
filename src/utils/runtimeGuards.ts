import { logger } from '../utils/logger';
/**
 * Runtime Guards - Defensive Programming Patterns
 * Prevents common runtime errors and lexical declaration issues
 */

// Safe variable accessor to prevent undefined access
export function safeAccess<T>(obj: unknown, path: string, defaultValue?: T): T | undefined {
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
  } catch (_error) {
    logger.warn('Safe access failed:', path, e);
    return defaultValue;
  }
}

// Safe function caller to prevent call stack issues
export function safeCall<T extends (...args: unknown[]) => any>(
  fn: T | undefined | null,
  defaultValue?: ReturnType<T>,
  ...args: Parameters<T>
): ReturnType<T> | undefined {
  try {
    if (typeof fn === 'function') {
      return fn(...args);
    }
    return defaultValue;
  } catch (_error) {
    logger.error('Safe call failed:', e);
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
  } catch {
    if (e instanceof ReferenceError && e.message.includes('before initialization')) {
      logger.warn(`Temporal dead zone detected for ${varName || 'variable'}, using default:`, defaultValue);
      return defaultValue;
    }
    throw e; // Re-throw other errors
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
    logger.error('🚨 Runtime Error Caught:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      timestamp: new Date().toISOString()
    });
    
    // Log to storage for analysis
    try {
      const errorLog = JSON.parse(localStorage.getItem('runtime_errors') || '[]');
      errorLog.push({
        type: 'script_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 50 errors
      const _recentErrors = errorLog.slice(-50);
      localStorage.setItem('runtime_errors', JSON.stringify(_recentErrors));
    } catch (_error) {
      logger.warn('Failed to log runtime error: ', e);
    }
    
    // Don't prevent default error handling
    return false;
  });
  
  // Prevent unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('🚨 Unhandled Promise Rejection:', {
      reason: event.reason,
      promise: event.promise,
      timestamp: new Date().toISOString()
    });
    
    // Log promise rejections
    try {
      const rejectionLog = JSON.parse(localStorage.getItem('promise_rejections') || '[]');
      rejectionLog.push({
        reason: event.reason?.toString(),
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 30 rejections
      const _recentRejections = rejectionLog.slice(-30);
      localStorage.setItem('promise_rejections', JSON.stringify(_recentRejections));
    } catch (_error) {
    logger.warn('Failed to log promise rejection:', e);
    }
    
    // Prevent the rejection from being logged to console
    event.preventDefault();
  });
  
  logger.info('✅ Runtime guards initialized');
}

// Memory leak prevention
export class MemoryLeakGuard {
  private static instance: MemoryLeakGuard;
  private observers: Set<unknown> = new Set();
  private timers: Set<unknown> = new Set();
  private listeners: Map<EventTarget, Map<string, EventListener>> = new Map();
  
  static getInstance(): MemoryLeakGuard {
    if (!MemoryLeakGuard.instance) {
      MemoryLeakGuard.instance = new MemoryLeakGuard();
    }
    return MemoryLeakGuard.instance;
  }
  
  // Track observers for cleanup
  trackObserver(observer: unknown) {
    this.observers.add(_observer);
    return observer;
  }
  
  // Track timers for cleanup
  trackTimer(_timerId: unknown) {
    this.timers.add(_timerId);
    return _timerId;
  }
  
  // Track event listeners for cleanup
  trackListener(element: EventTarget, event: string, listener: EventListener) {
    if (!this.listeners.has(_element)) {
      this.listeners.set(element, new Map());
    }
    this.listeners.get(_element)!.set(event, listener);
  }
  
  // Clean up all tracked resources
  cleanup() {
    // Disconnect observers
    this.observers.forEach(observer => {
      try {
        if (observer.disconnect) observer.disconnect();
        if (observer.unobserve) observer.unobserve();
      } catch (_error) {
    logger.warn('Failed to disconnect observer:', e);
      }
    });
    this.observers.clear();
    
    // Clear timers
    this.timers.forEach(_timerId => {
      try {
        clearTimeout(_timerId);
        clearInterval(_timerId);
      } catch (_error) {
    logger.warn('Failed to clear timer:', e);
      }
    });
    this.timers.clear();
    
    // Remove event listeners
    this.listeners.forEach((events, element) => {
      events.forEach((listener, event) => {
        try {
          element.removeEventListener(event, listener);
        } catch (_error) {
    logger.warn('Failed to remove event listener:', e);
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
    if (_start) {
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