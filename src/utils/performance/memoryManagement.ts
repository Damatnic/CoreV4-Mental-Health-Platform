/**
 * Memory Management and Cleanup Utilities
 * Prevents memory leaks and optimizes resource usage in mental health app
 */

import { RefObject, useEffect, useRef } from 'react';

/**
 * WeakMap-based cache for component data
 */
export class WeakCache<K extends object, V> {
  private cache = new WeakMap<K, V>();
  
  set(key: K, value: V): void {
    this.cache.set(key, value);
  }
  
  get(key: K): V | undefined {
    return this.cache.get(key);
  }
  
  has(key: K): boolean {
    return this.cache.has(key);
  }
  
  delete(key: K): boolean {
    return this.cache.delete(key);
  }
}

/**
 * Resource cleanup manager
 */
class ResourceManager {
  private cleanupFunctions: Map<string, () => void> = new Map();
  private timers: Map<string, number> = new Map();
  private intervals: Map<string, number> = new Map();
  private observers: Map<string, IntersectionObserver | MutationObserver | ResizeObserver> = new Map();
  private eventListeners: Map<string, { element: EventTarget; event: string; handler: EventListener }[]> = new Map();
  
  /**
   * Register a cleanup function
   */
  registerCleanup(id: string, cleanup: () => void): void {
    this.cleanupFunctions.set(id, cleanup);
  }
  
  /**
   * Register a timer for automatic cleanup
   */
  registerTimer(id: string, timerId: number): void {
    // Clear existing timer if any
    if (this.timers.has(id)) {
      clearTimeout(this.timers.get(id)!);
    }
    this.timers.set(id, timerId);
  }
  
  /**
   * Register an interval for automatic cleanup
   */
  registerInterval(id: string, intervalId: number): void {
    // Clear existing interval if any
    if (this.intervals.has(id)) {
      clearInterval(this.intervals.get(id)!);
    }
    this.intervals.set(id, intervalId);
  }
  
  /**
   * Register an observer for automatic cleanup
   */
  registerObserver(id: string, observer: IntersectionObserver | MutationObserver | ResizeObserver): void {
    // Disconnect existing observer if any
    if (this.observers.has(id)) {
      this.observers.get(id)!.disconnect();
    }
    this.observers.set(id, observer);
  }
  
  /**
   * Register event listener for automatic cleanup
   */
  registerEventListener(id: string, element: EventTarget, event: string, handler: EventListener): void {
    if (!this.eventListeners.has(id)) {
      this.eventListeners.set(id, []);
    }
    this.eventListeners.get(id)!.push({ element, event, handler });
    element.addEventListener(event, handler);
  }
  
  /**
   * Clean up specific resource
   */
  cleanup(id: string): void {
    // Run cleanup function
    const cleanupFn = this.cleanupFunctions.get(id);
    if (cleanupFn) {
      cleanupFn();
      this.cleanupFunctions.delete(id);
    }
    
    // Clear timer
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    
    // Clear interval
    const interval = this.intervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(id);
    }
    
    // Disconnect observer
    const observer = this.observers.get(id);
    if (observer) {
      observer.disconnect();
      this.observers.delete(id);
    }
    
    // Remove event listeners
    const listeners = this.eventListeners.get(id);
    if (listeners) {
      listeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      this.eventListeners.delete(id);
    }
  }
  
  /**
   * Clean up all resources
   */
  cleanupAll(): void {
    // Run all cleanup functions
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions.clear();
    
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    
    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Remove all event listeners
    this.eventListeners.forEach(listeners => {
      listeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
    });
    this.eventListeners.clear();
  }
  
  /**
   * Get resource stats
   */
  getStats() {
    return {
      cleanupFunctions: this.cleanupFunctions.size,
      timers: this.timers.size,
      intervals: this.intervals.size,
      observers: this.observers.size,
      eventListeners: this.eventListeners.size,
    };
  }
}

// Global resource manager instance
export const resourceManager = new ResourceManager();

/**
 * Hook for automatic resource cleanup
 */
export function useResourceCleanup(componentId: string) {
  useEffect(() => {
    return () => {
      resourceManager.cleanup(componentId);
    };
  }, [componentId]);
  
  return {
    registerCleanup: (cleanup: () => void) => resourceManager.registerCleanup(componentId, cleanup),
    registerTimer: (timerId: number) => resourceManager.registerTimer(componentId, timerId),
    registerInterval: (intervalId: number) => resourceManager.registerInterval(componentId, intervalId),
    registerObserver: (observer: any) => resourceManager.registerObserver(componentId, observer),
    registerEventListener: (element: EventTarget, event: string, handler: EventListener) => 
      resourceManager.registerEventListener(componentId, element, event, handler),
  };
}

/**
 * Hook for cleaning up DOM event listeners
 */
export function useEventListenerCleanup(
  ref: RefObject<HTMLElement>,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    element.addEventListener(event, handler, options);
    
    return () => {
      element.removeEventListener(event, handler, options);
    };
  }, [ref, event, handler, options]);
}

/**
 * Hook for cleaning up timers
 */
export function useTimerCleanup() {
  const timersRef = useRef<Set<number>>(new Set());
  
  const setTimeout = (callback: () => void, delay: number): number => {
    const id = window.setTimeout(() => {
      timersRef.current.delete(id);
      callback();
    }, delay);
    timersRef.current.add(id);
    return id;
  };
  
  const clearTimeout = (id: number) => {
    window.clearTimeout(id);
    timersRef.current.delete(id);
  };
  
  useEffect(() => {
    return () => {
      timersRef.current.forEach(id => window.clearTimeout(id));
      timersRef.current.clear();
    };
  }, []);
  
  return { setTimeout, clearTimeout };
}

/**
 * Hook for cleaning up intervals
 */
export function useIntervalCleanup() {
  const intervalsRef = useRef<Set<number>>(new Set());
  
  const setInterval = (callback: () => void, delay: number): number => {
    const id = window.setInterval(callback, delay);
    intervalsRef.current.add(id);
    return id;
  };
  
  const clearInterval = (id: number) => {
    window.clearInterval(id);
    intervalsRef.current.delete(id);
  };
  
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(id => window.clearInterval(id));
      intervalsRef.current.clear();
    };
  }, []);
  
  return { setInterval, clearInterval };
}

/**
 * Memory-efficient image loader with cleanup
 */
export class ImageLoader {
  private cache = new Map<string, HTMLImageElement>();
  private loading = new Map<string, Promise<HTMLImageElement>>();
  
  async load(src: string): Promise<HTMLImageElement> {
    // Return cached image
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }
    
    // Return existing loading promise
    if (this.loading.has(src)) {
      return this.loading.get(src)!;
    }
    
    // Start new load
    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache.set(src, img);
        this.loading.delete(src);
        resolve(img);
      };
      
      img.onerror = () => {
        this.loading.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });
    
    this.loading.set(src, loadPromise);
    return loadPromise;
  }
  
  /**
   * Preload multiple images
   */
  async preload(srcs: string[]): Promise<void> {
    await Promise.all(srcs.map(src => this.load(src).catch(() => {})));
  }
  
  /**
   * Clear image from cache
   */
  clear(src: string): void {
    const img = this.cache.get(src);
    if (img) {
      img.src = ''; // Clear image source
      this.cache.delete(src);
    }
  }
  
  /**
   * Clear all cached images
   */
  clearAll(): void {
    this.cache.forEach(img => {
      img.src = ''; // Clear image source
    });
    this.cache.clear();
    this.loading.clear();
  }
  
  /**
   * Get cache stats
   */
  getStats() {
    return {
      cached: this.cache.size,
      loading: this.loading.size,
    };
  }
}

export const imageLoader = new ImageLoader();

/**
 * Debounce with cleanup
 */
export function debounceWithCleanup<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: number | null = null;
  
  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = window.setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  }) as T;
  
  (debounced as any).cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return debounced as T & { cancel: () => void };
}

/**
 * Throttle with cleanup
 */
export function throttleWithCleanup<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T & { cancel: () => void } {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  let timeoutId: number | null = null;
  
  const throttled = ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      
      timeoutId = window.setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          throttled(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  }) as T;
  
  (throttled as any).cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    inThrottle = false;
    lastArgs = null;
  };
  
  return throttled as T & { cancel: () => void };
}

/**
 * Memory leak detector
 */
export class MemoryLeakDetector {
  private snapshots: any[] = [];
  private maxSnapshots = 10;
  
  takeSnapshot(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.snapshots.push({
        timestamp: Date.now(),
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      });
      
      // Keep only recent snapshots
      if (this.snapshots.length > this.maxSnapshots) {
        this.snapshots.shift();
      }
    }
  }
  
  detectLeak(): boolean {
    if (this.snapshots.length < 3) return false;
    
    // Check if memory is consistently increasing
    let increasing = true;
    for (let i = 1; i < this.snapshots.length; i++) {
      if (this.snapshots[i].usedJSHeapSize <= this.snapshots[i - 1].usedJSHeapSize) {
        increasing = false;
        break;
      }
    }
    
    if (increasing) {
      const firstSnapshot = this.snapshots[0];
      const lastSnapshot = this.snapshots[this.snapshots.length - 1];
      const increase = lastSnapshot.usedJSHeapSize - firstSnapshot.usedJSHeapSize;
      const timeElapsed = lastSnapshot.timestamp - firstSnapshot.timestamp;
      
      // Leak detected if memory increased by more than 10MB in 1 minute
      if (increase > 10 * 1024 * 1024 && timeElapsed < 60000) {
        return true;
      }
    }
    
    return false;
  }
  
  getReport() {
    return {
      snapshots: this.snapshots,
      hasLeak: this.detectLeak(),
      currentMemory: this.snapshots[this.snapshots.length - 1],
    };
  }
  
  clear(): void {
    this.snapshots = [];
  }
}

export const memoryLeakDetector = new MemoryLeakDetector();