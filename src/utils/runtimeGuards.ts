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
  } catch (e) {
    console.warn('Safe access failed:', path, e);
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
  } catch (e) {
    console.error('Safe call failed:', e);
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
  } catch (e) {
    if (e instanceof ReferenceError && e.message.includes('before initialization')) {
      console.warn(`Temporal dead zone detected for ${varName || 'variable'}, using default:`, defaultValue);
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
    console.error('Module import failed, using fallback:', error);
    return fallback;
  });
}

// Global error handler setup
export function setupRuntimeGuards() {
  // Prevent unhandled errors from crashing the app
  window.addEventListener('error', (event) => {
    console.error('🚨 Runtime Error Caught:', {
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
      const recentErrors = errorLog.slice(-50);
      localStorage.setItem('runtime_errors', JSON.stringify(recentErrors));
    } catch (e) {
      console.warn('Failed to log runtime error:', e);
    }
    
    // Don't prevent default error handling
    return false;
  });
  
  // Prevent unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled Promise Rejection:', {
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
      const recentRejections = rejectionLog.slice(-30);
      localStorage.setItem('promise_rejections', JSON.stringify(recentRejections));
    } catch (e) {
      console.warn('Failed to log promise rejection:', e);
    }
    
    // Prevent the rejection from being logged to console
    event.preventDefault();
  });
  
  console.log('✅ Runtime guards initialized');
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
    this.observers.forEach(observer => {
      try {
        if (observer.disconnect) observer.disconnect();
        if (observer.unobserve) observer.unobserve();
      } catch (e) {
        console.warn('Failed to disconnect observer:', e);
      }
    });
    this.observers.clear();
    
    // Clear timers
    this.timers.forEach(timerId => {
      try {
        clearTimeout(timerId);
        clearInterval(timerId);
      } catch (e) {
        console.warn('Failed to clear timer:', e);
      }
    });
    this.timers.clear();
    
    // Remove event listeners
    this.listeners.forEach((events, element) => {
      events.forEach((listener, event) => {
        try {
          element.removeEventListener(event, listener);
        } catch (e) {
          console.warn('Failed to remove event listener:', e);
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
        console.warn(`⚠️ Performance warning: ${name} took ${duration.toFixed(2)}ms`);
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