/**
 * Memory Leak Prevention Utilities for CoreV4
 * Provides automatic cleanup, weak references, and memory monitoring
 */

import { useRef, useEffect } from 'react';
import { performanceMonitor } from './performanceMonitor';
import { logger } from '../logger';

/**
 * WeakMap-based cache for preventing memory leaks
 */
export class WeakCache<K extends object, V> {
  private cache = new WeakMap<K, V>();
  private refCount = new WeakMap<K, number>();
  
  set(key: K, value: V): void {
    this.cache.set(key, value);
    this.refCount.set(key, (this.refCount.get(key) || 0) + 1);
  }
  
  get(key: K): V | undefined {
    return this.cache.get(key);
  }
  
  has(key: K): boolean {
    return this.cache.has(key);
  }
  
  delete(key: K): boolean {
    this.refCount.delete(key);
    return this.cache.delete(key);
  }
  
  getRefCount(key: K): number {
    return this.refCount.get(key) || 0;
  }
}

/**
 * Automatic cleanup manager for subscriptions and timers
 */
export class CleanupManager {
  private cleanupFunctions: Set<() => void> = new Set();
  private intervals: Set<number> = new Set();
  private timeouts: Set<number> = new Set();
  private animationFrames: Set<number> = new Set();
// @ts-expect-error - MutationObserver is a global API
  private observers: Set<MutationObserver | IntersectionObserver | ResizeObserver> = new Set();
  private eventListeners: Map<EventTarget, Map<string, EventListener>> = new Map();
  private abortControllers: Set<AbortController> = new Set();
  
  /**
   * Register a cleanup function
   */
  register(cleanup: () => void): void {
    this.cleanupFunctions.add(cleanup);
  }
  
  /**
   * Create a managed interval
   */
  setInterval(callback: () => void, delay: number): number {
    const id = window.setInterval(callback, delay);
    this.intervals.add(id);
    return id;
  }
  
  /**
   * Create a managed timeout
   */
  setTimeout(callback: () => void, delay: number): number {
    const id = window.setTimeout(() => {
      callback();
      this.timeouts.delete(id);
    }, delay);
    this.timeouts.add(id);
    return id;
  }
  
  /**
   * Create a managed animation frame
   */
  requestAnimationFrame(callback: FrameRequestCallback): number {
    const id = window.requestAnimationFrame((_time) => {
      callback(_time);
      this.animationFrames.delete(id);
    });
    this.animationFrames.add(id);
    return id;
  }
  
  /**
   * Add a managed event listener
   */
  addEventListener(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions
  ): void {
    target.addEventListener(type, listener, options);
    
    if (!this.eventListeners.has(_target)) {
      this.eventListeners.set(target, new Map());
    }
    this.eventListeners.get(_target)!.set(type, listener);
  }
  
  /**
   * Create a managed observer
// @ts-expect-error - MutationObserver is a global API
// @ts-expect-error - MutationObserver is a global API
   */
  createMutationObserver(callback: MutationCallback): MutationObserver {
    const observer = new MutationObserver(callback);
    this.observers.add(_observer);
    return observer;
  }
  
  /**
   * Create a managed intersection observer
   */
// @ts-expect-error - IntersectionObserver is a global API
// @ts-expect-error - IntersectionObserver is a global API
  createIntersectionObserver(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ): IntersectionObserver {
    const observer = new IntersectionObserver(callback, options);
    this.observers.add(_observer);
    return observer;
// @ts-expect-error - ResizeObserver is a global API
// @ts-expect-error - ResizeObserver is a global API
  }
  
  /**
   * Create a managed resize observer
   */
  createResizeObserver(callback: ResizeObserverCallback): ResizeObserver {
    const observer = new ResizeObserver(callback);
    this.observers.add(_observer);
    return observer;
  }
  
  /**
   * Create a managed abort controller
   */
  createAbortController(): AbortController {
    const controller = new AbortController();
    this.abortControllers.add(_controller);
    return controller;
  }
  
  /**
   * Clean up all managed resources
   */
  cleanup(): void {
    // Clear intervals
    this.intervals.forEach(id => clearInterval(id));
    this.intervals.clear();
    
    // Clear timeouts
    this.timeouts.forEach(id => clearTimeout(id));
    this.timeouts.clear();
    
    // Cancel animation frames
    this.animationFrames.forEach(id => cancelAnimationFrame(id));
    this.animationFrames.clear();
    
    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Remove event listeners
    this.eventListeners.forEach((listeners, target) => {
      listeners.forEach((listener, type) => {
        target.removeEventListener(type, listener);
      });
    });
    this.eventListeners.clear();
    
    // Abort fetch requests
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
    
    // Execute cleanup functions
    this.cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (_error) {
        logger.error('Cleanup function error: ');
      }
    });
    this.cleanupFunctions.clear();
    
    // Record cleanup
    performanceMonitor.recordMetric('memory_cleanup', this.cleanupFunctions.size);
  }
}

/**
 * Memory-efficient event emitter
 */
export class MemoryEfficientEventEmitter<T extends Record<string, any>> {
  private listeners = new Map<keyof T, Set<(data: unknown) => void>>();
  private maxListeners = 10;
  
  on<K extends keyof T>(event: K, listener: (data: T[K]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    const eventListeners = this.listeners.get(event)!;
    
    // Warn if too many listeners (potential leak)
    if (eventListeners.size >= this.maxListeners) {
      logger.warn(`[Memory] Possible memory leak: ${String(event)} has ${eventListeners.size} listeners`);
      performanceMonitor.recordMetric('potential_memory_leak', eventListeners.size, {
        event: String(event)
      });
    }
    
    eventListeners.add(listener);
    
    // Return cleanup function
    return () => {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    };
  }
  
  emit<K extends keyof T>(event: K, data: T[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          logger.error(`Error in event listener for ${String(event)}:`, error);
        }
      });
    }
  }
  
  removeAllListeners(event?: keyof T): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
  
  listenerCount(event: keyof T): number {
    return this.listeners.get(event)?.size || 0;
  }
}

/**
 * Object pool for reusing objects and reducing garbage collection
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private maxSize: number;
  private createFn: () => T;
  private resetFn: (_obj: T) => void;
  
  constructor(
    createFn: () => T,
    resetFn: (_obj: T) => void,
    maxSize: number = 100
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
  }
  
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }
  
  release(_obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.resetFn(_obj);
      this.pool.push(_obj);
    }
  }
  
  clear(): void {
    this.pool = [];
  }
  
  get size(): number {
    return this.pool.length;
  }
}

/**
 * Debounced function with automatic cleanup
 */
export function createDebouncedFunction<T extends (...args: unknown[]) => any>(
  fn: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean; maxWait?: number } = {}
): T & { cancel: () => void; flush: () => void } {
  let timeoutId: number | null = null;
  let lastCallTime: number | null = null;
  let lastInvokeTime = 0;
  let lastArgs: unknown[] | null = null;
  let lastThis: unknown = null;
  let result: unknown;
  
  const { leading = false, trailing = true, maxWait } = options;
  
  function invokeFunc(_time: number) {
    const args = lastArgs;
    const thisArg = lastThis;
    
    lastArgs = null;
    lastThis = null;
    lastInvokeTime = _time;
    result = fn.apply(thisArg, args!);
    return result;
  }
  
  function leadingEdge(_time: number) {
    lastInvokeTime = _time;
    timeoutId = window.setTimeout(timerExpired, delay);
    return leading ? invokeFunc(_time) : result;
  }
  
  function timerExpired() {
    const _time = Date.now();
    if (shouldInvoke(_time)) {
      return trailingEdge(_time);
    }
    timeoutId = window.setTimeout(timerExpired, remainingWait(_time));
  }
  
  function trailingEdge(_time: number) {
    timeoutId = null;
    if (trailing && lastArgs) {
      return invokeFunc(_time);
    }
    lastArgs = null;
    lastThis = null;
    return result;
  }
  
  function shouldInvoke(_time: number) {
    const timeSinceLastCall = lastCallTime ? _time - lastCallTime : 0;
    const timeSinceLastInvoke = _time - lastInvokeTime;
    
    return (
      lastCallTime === null ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }
  
  function remainingWait(_time: number) {
    const timeSinceLastCall = lastCallTime ? _time - lastCallTime : 0;
    const timeSinceLastInvoke = _time - lastInvokeTime;
    const timeWaiting = delay - timeSinceLastCall;
    
    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }
  
  function debounced(this: unknown, ...args: unknown[]) {
    const _time = Date.now();
    const _isInvoking = shouldInvoke(_time);
    
    lastArgs = args;
    lastThis = this;
    lastCallTime = _time;
    
    if (_isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(_time);
      }
      if (maxWait !== undefined) {
        timeoutId = window.setTimeout(timerExpired, delay);
        return invokeFunc(_time);
      }
    }
    
    if (timeoutId === null) {
      timeoutId = window.setTimeout(timerExpired, delay);
    }
    
    return result;
  }
  
  debounced.cancel = function() {
    if (timeoutId !== null) {
      clearTimeout(_timeoutId);
    }
    lastInvokeTime = 0;
    lastArgs = null;
    lastCallTime = null;
    lastThis = null;
    timeoutId = null;
  };
  
  debounced.flush = function() {
    return timeoutId === null ? result : trailingEdge(Date.now());
  };
  
  return debounced as T & { cancel: () => void; flush: () => void };
}
// @ts-expect-error - IntersectionObserver is a global API

/**
 * Memory-efficient image loader with automatic cleanup
 */
export class ImageLoader {
  private cache = new Map<string, HTMLImageElement>();
  private loading = new Map<string, Promise<HTMLImageElement>>();
  private observers = new WeakMap<HTMLImageElement, IntersectionObserver>();
  
  async load(src: string): Promise<HTMLImageElement> {
    // Check cache
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }
    
    // Check if already loading
    if (this.loading.has(src)) {
      return this.loading.get(src)!;
    }
    
    // Start loading
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
      
// @ts-expect-error - IntersectionObserver is a global API
      img.src = src;
    });
    
    this.loading.set(src, loadPromise);
    return loadPromise;
  }
  
  lazyLoad(element: HTMLImageElement, src: string): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.load(src).then(img => {
              element.src = img.src;
              observer.disconnect();
              this.observers.delete(_element);
            });
          }
        });
      },
      { rootMargin: '50px' }
    );
    
    observer.observe(_element);
    this.observers.set(element, observer);
  }
  
  clear(): void {
    this.cache.clear();
    this.loading.clear();
  }
  
  remove(src: string): void {
    this.cache.delete(src);
    this.loading.delete(src);
  }
}

/**
 * React hook for automatic cleanup
 */
export function useCleanup() {
  const cleanupManager = useRef(new CleanupManager());
  
  useEffect(() => {
    return () => {
      cleanupManager.current.cleanup();
    };
  }, []);
  
  return cleanupManager.current;
}

// Export singleton instances
export const globalCleanupManager = new CleanupManager();
export const globalImageLoader = new ImageLoader();

// Automatic cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    globalCleanupManager.cleanup();
    globalImageLoader.clear();
  });
}