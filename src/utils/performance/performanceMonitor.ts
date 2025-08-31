/**
 * Performance Monitoring and Optimization Utilities
 * Provides comprehensive performance tracking, profiling, and optimization helpers
 */

import { onCLS, onFCP, onFID, onLCP, onTTFB, Metric } from 'web-vitals';

// Performance thresholds for mental health app
export const PERFORMANCE_THRESHOLDS = {
  FCP: 1500, // First Contentful Paint target: <1.5s
  LCP: 2500, // Largest Contentful Paint target: <2.5s
  FID: 100,  // First Input Delay target: <100ms
  CLS: 0.1,  // Cumulative Layout Shift target: <0.1
  TTI: 3500, // Time to Interactive target: <3.5s
  CRISIS_RESPONSE: 200, // Crisis intervention response target: <200ms
  CHART_RENDER: 500, // Chart rendering target: <500ms
  LIST_SCROLL: 16, // Smooth scrolling target: 60fps (16ms per frame)
};

// Performance metrics storage
interface PerformanceMetrics {
  FCP?: number;
  LCP?: number;
  FID?: number;
  CLS?: number;
  TTFB?: number;
  customMetrics: Map<string, number>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    customMetrics: new Map(),
  };
  private observers: Map<string, PerformanceObserver> = new Map();
  private isProduction = import.meta.env.PROD;

  constructor() {
    this.initWebVitals();
    this.initPerformanceObservers();
  }

  /**
   * Initialize Core Web Vitals monitoring
   */
  private initWebVitals() {
    // Only track in production or when explicitly enabled
    if (!this.isProduction && !import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING) {
      return;
    }

    const handleMetric = (metric: Metric) => {
      console.log(`[Performance] ${metric.name}: ${metric.value.toFixed(2)}ms`);
      this.reportMetric(metric.name, metric.value);
      
      // Alert on threshold violations
      this.checkThreshold(metric.name, metric.value);
    };

    onCLS(handleMetric);
    onFCP(handleMetric);
    onFID(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
  }

  /**
   * Initialize performance observers for custom metrics
   */
  private initPerformanceObservers() {
    // Long Task Observer - detect tasks blocking main thread
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn(`[Performance] Long task detected: ${entry.duration.toFixed(2)}ms`);
              this.reportMetric('longTask', entry.duration);
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (e) {
        // Long task observer not supported
      }

      // Layout Shift Observer
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ('value' in entry && (entry as any).value > 0) {
              this.reportMetric('layoutShift', (entry as any).value);
            }
          }
        });
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('layout-shift', layoutShiftObserver);
      } catch (e) {
        // Layout shift observer not supported
      }
    }
  }

  /**
   * Check if metric violates threshold
   */
  private checkThreshold(metricName: string, value: number) {
    const threshold = PERFORMANCE_THRESHOLDS[metricName as keyof typeof PERFORMANCE_THRESHOLDS];
    if (threshold && value > threshold) {
      console.warn(
        `[Performance Warning] ${metricName} exceeded threshold: ${value.toFixed(2)}ms > ${threshold}ms`
      );
      
      // Send to monitoring service in production
      if (this.isProduction) {
        this.sendToMonitoring(metricName, value, threshold);
      }
    }
  }

  /**
   * Report metric to monitoring service
   */
  public reportMetric(name: string, value: number) {
    // Store locally
    if (name in this.metrics) {
      (this.metrics as any)[name] = value;
    } else {
      this.metrics.customMetrics.set(name, value);
    }

    // Send to analytics in production
    if (this.isProduction && window.gtag) {
      window.gtag('event', 'performance', {
        event_category: 'Web Vitals',
        event_label: name,
        value: Math.round(value),
        non_interaction: true,
      });
    }
  }

  /**
   * Send threshold violation to monitoring service
   */
  private sendToMonitoring(metric: string, value: number, threshold: number) {
    // Integration with Sentry or other monitoring service
    if (window.Sentry) {
      window.Sentry.captureMessage(`Performance threshold exceeded: ${metric}`, {
        level: 'warning',
        extra: {
          metric,
          value,
          threshold,
          violation: value - threshold,
        },
      });
    }
  }

  /**
   * Measure custom performance metric
   */
  measureStart(label: string) {
    performance.mark(`${label}-start`);
  }

  measureEnd(label: string) {
    performance.mark(`${label}-end`);
    try {
      performance.measure(label, `${label}-start`, `${label}-end`);
      const measure = performance.getEntriesByName(label)[0];
      if (measure) {
        this.reportMetric(label, measure.duration);
        return measure.duration;
      }
    } catch (e) {
      console.error(`Failed to measure ${label}:`, e);
    }
    return null;
  }

  /**
   * Profile function execution
   */
  async profile<T>(fn: () => Promise<T>, label: string): Promise<T> {
    this.measureStart(label);
    try {
      const result = await fn();
      return result;
    } finally {
      this.measureEnd(label);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics.customMetrics.clear();
  }

  /**
   * Cleanup observers
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor(componentName: string) {
  const measureRender = () => {
    performanceMonitor.measureStart(`${componentName}-render`);
    return () => performanceMonitor.measureEnd(`${componentName}-render`);
  };

  const measureEffect = (effectName: string) => {
    performanceMonitor.measureStart(`${componentName}-${effectName}`);
    return () => performanceMonitor.measureEnd(`${componentName}-${effectName}`);
  };

  return {
    measureRender,
    measureEffect,
    profile: (fn: () => Promise<any>, label: string) => 
      performanceMonitor.profile(fn, `${componentName}-${label}`),
  };
}

/**
 * Memory monitoring utilities
 */
export class MemoryMonitor {
  private checkInterval: number | null = null;
  private threshold = 100 * 1024 * 1024; // 100MB threshold

  start(intervalMs = 10000) {
    if (!('memory' in performance)) {
      console.warn('[Memory Monitor] Performance.memory not available');
      return;
    }

    this.checkInterval = window.setInterval(() => {
      const memory = (performance as any).memory;
      const usedMemory = memory.usedJSHeapSize;
      const totalMemory = memory.totalJSHeapSize;
      const limit = memory.jsHeapSizeLimit;

      const usage = (usedMemory / limit) * 100;
      
      if (usedMemory > this.threshold) {
        console.warn(
          `[Memory Warning] High memory usage: ${(usedMemory / 1024 / 1024).toFixed(2)}MB (${usage.toFixed(1)}%)`
        );
      }

      // Report memory metrics
      performanceMonitor.reportMetric('memoryUsed', usedMemory);
      performanceMonitor.reportMetric('memoryTotal', totalMemory);
      performanceMonitor.reportMetric('memoryUsagePercent', usage);
    }, intervalMs);
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Force garbage collection if available (development only)
   */
  forceGC() {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
      console.log('[Memory] Garbage collection triggered');
    }
  }
}

export const memoryMonitor = new MemoryMonitor();

/**
 * Frame rate monitoring for smooth animations
 */
export class FrameRateMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  private rafId: number | null = null;

  start(callback?: (fps: number) => void) {
    const measure = () => {
      const now = performance.now();
      const delta = now - this.lastTime;
      
      if (delta >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / delta);
        this.frameCount = 0;
        this.lastTime = now;
        
        if (this.fps < 30) {
          console.warn(`[Performance] Low frame rate detected: ${this.fps} FPS`);
        }
        
        if (callback) {
          callback(this.fps);
        }
      }
      
      this.frameCount++;
      this.rafId = requestAnimationFrame(measure);
    };
    
    this.rafId = requestAnimationFrame(measure);
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getFPS() {
    return this.fps;
  }
}

export const frameRateMonitor = new FrameRateMonitor();

// Export types for global usage
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    Sentry?: any;
  }
}