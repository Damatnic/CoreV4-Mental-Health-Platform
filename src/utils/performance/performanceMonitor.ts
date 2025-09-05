/**
 * Comprehensive Performance Monitoring System for CoreV4
 * Tracks critical metrics including crisis response times, Core Web Vitals, and custom metrics
 */

import { onCLS, onFCP, onFID, onLCP, onTTFB, type Metric } from 'web-vitals';
import { logger } from '../logger';

// Performance thresholds for mental health app
const PERFORMANCE_THRESHOLDS = {
  // Critical crisis response times
  CRISIS_PAGE_LOAD: 200, // ms - Crisis pages must load in <200ms
  CRISIS_HOTLINE_ACCESS: 50, // ms - 988 access must be <50ms
  SAFETY_PLAN_ACCESS: 100, // ms - Safety plan must load in <100ms
  EMERGENCY_CONTACT_DISPLAY: 50, // ms - Emergency contacts must show in <50ms
  CRISIS_CHAT_CONNECTION: 500, // ms - Crisis chat must connect in <500ms
  
  // Core Web Vitals targets
  LCP: 2500, // Largest Contentful Paint
  FID: 100, // First Input Delay
  CLS: 0.1, // Cumulative Layout Shift
  FCP: 1800, // First Contentful Paint
  TTFB: 600, // Time to First Byte
  TTI: 3500, // Time to Interactive
  
  // Mental health specific metrics
  MOOD_LOG_RESPONSE: 200, // ms
  DASHBOARD_WIDGET_LOAD: 300, // ms per widget
  THERAPY_SESSION_LOAD: 500, // ms
  COMMUNITY_POST_LOAD: 400, // ms
  PROFESSIONAL_SEARCH: 600, // ms
  
  // Memory thresholds
  MAX_MEMORY_MB: 150, // Maximum memory usage in MB
  MEMORY_WARNING_MB: 100, // Warning threshold
  
  // Bundle size limits (_KB)
  CRITICAL_BUNDLE_SIZE: 300, // Crisis features bundle
  MAIN_BUNDLE_SIZE: 500, // Main app bundle
  VENDOR_BUNDLE_SIZE: 800, // Vendor dependencies
};

// Performance metrics storage
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  private reportQueue: PerformanceMetric[] = [];
  private reportTimer: number | null = null;
  private sessionId: string;
  private userId: string | null = null;
  private isLowEndDevice: boolean = false;
  private networkType: string = 'unknown';
  
  constructor() {
    this.sessionId = this.generateSessionId();
    this.detectDeviceCapabilities();
    this.detectNetworkType();
    this.initializeWebVitals();
    this.initializePerformanceObservers();
    this.initializeMemoryMonitoring();
    this.initializeCrisisMetrics();
  }
  
  /**
   * Initialize Core Web Vitals monitoring
   */
  private initializeWebVitals(): void {
    // Largest Contentful Paint
    onLCP((metric: Metric) => this.handleWebVital('LCP', metric));
    
    // First Input Delay
    onFID((metric: Metric) => this.handleWebVital('FID', metric));
    
    // Cumulative Layout Shift
    onCLS((metric: Metric) => this.handleWebVital('CLS', metric));
    
    // First Contentful Paint
    onFCP((metric: Metric) => this.handleWebVital('FCP', metric));
    
    // Time to First Byte
    onTTFB((metric: Metric) => this.handleWebVital('TTFB', metric));
  }
  
  /**
   * Handle Web Vital metrics
   */
  private handleWebVital(name: string, metric: Metric): void {
    const threshold = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS];
    const isGood = metric.value <= threshold;
    
    this.recordMetric(name, metric.value, {
      rating: metric.rating,
      isGood,
      threshold,
      delta: metric.delta,
      navigationType: metric.navigationType,
    });
    
    // Alert if critical metrics exceed thresholds
    if (!isGood && ['LCP', 'FID'].includes(name)) {
      this.alertPerformanceIssue(name, metric.value, threshold);
    }
  }
  
  /**
   * Initialize Performance Observers for detailed monitoring
   */
  private initializePerformanceObservers(): void {
    // Long Task Observer - detect blocking tasks
    if ('PerformanceObserver' in window && PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of (list as any).getEntries()) {
          // Type for long task performance entries
          interface LongTaskEntry {
            duration: number;
            name: string;
            startTime: number;
            attribution?: any;
          }
          const longTask = entry as LongTaskEntry;
          this.recordMetric('long_task', longTask.duration, {
            name: longTask.name,
            startTime: longTask.startTime,
            attribution: longTask.attribution,
          });
          
          // Alert if long task blocks crisis features
          if (longTask.duration > 50 && this.isInCrisisFlow()) {
            this.alertPerformanceIssue('long_taskin_crisis', longTask.duration, 50);
          }
        }
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', longTaskObserver);
    }
    
    // Navigation timing
    if ('PerformanceObserver' in window && PerformanceObserver.supportedEntryTypes?.includes('navigation')) {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of (list as any).getEntries()) {
          const navEntry = entry as PerformanceNavigationTiming;
          this.recordNavigationMetrics(navEntry);
        }
      });
      
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', navObserver);
    }
    
    // Resource timing for bundle monitoring
    if ('PerformanceObserver' in window && PerformanceObserver.supportedEntryTypes?.includes('resource')) {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of (list as any).getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.analyzeResourceLoading(resourceEntry);
        }
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    }
  }
  
  /**
   * Initialize memory monitoring for leak detection
   */
  private initializeMemoryMonitoring(): void {
    if ('memory' in performance) {
      // Monitor memory usage every 10 seconds
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedMemoryMB = memory.usedJSHeapSize / 1048576;
        const totalMemoryMB = memory.totalJSHeapSize / 1048576;
        const limitMemoryMB = memory.jsHeapSizeLimit / 1048576;
        
        this.recordMetric('memory_usage', usedMemoryMB, {
          total: totalMemoryMB,
          limit: limitMemoryMB,
          percentage: (usedMemoryMB / limitMemoryMB) * 100,
        });
        
        // Detect potential memory leaks
        if (usedMemoryMB > PERFORMANCE_THRESHOLDS.MAX_MEMORY_MB) {
          this.alertMemoryIssue(usedMemoryMB);
        }
        
        // Track memory growth rate
        this.detectMemoryLeaks(usedMemoryMB);
      }, 10000);
    }
  }
  
  /**
   * Initialize crisis-specific performance metrics
   */
  private initializeCrisisMetrics(): void {
    // Monitor crisis button response time
    this.measureCrisisButtonPerformance();
    
    // Monitor 988 hotline access speed
    this.measure988AccessTime();
    
    // Monitor safety plan loading
    this.measureSafetyPlanAccess();
    
    // Monitor emergency contacts display
    this.measureEmergencyContactsDisplay();
  }
  
  /**
   * Measure crisis button click to modal display time
   */
  private measureCrisisButtonPerformance(): void {
    // Override crisis button click handler to measure performance
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.closest('[aria-label*="Crisis"]')) {
        performance.mark('crisis_button_clicked');
        
        // Use MutationObserver to detect when modal appears
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.type === 'childList') {
              const modal = document.querySelector('[role="dialog"][aria-labelledby*="crisis"]');
              if (modal) {
                performance.mark('crisis_modal_displayed');
                performance.measure('crisis_response_time', 'crisis_button_clicked', 'crisis_modal_displayed');
                
                const measure = performance.getEntriesByName('crisis_response_time')[0];
                if (!measure) continue;
                this.recordMetric('crisis_response_time', measure.duration, {
                  timestamp: Date.now(),
                  userAgent: navigator.userAgent,
                });
                
                // Alert if response time exceeds threshold
                if (measure?.duration && measure.duration > PERFORMANCE_THRESHOLDS.CRISIS_PAGE_LOAD) {
                  this.alertCriticalPerformanceIssue('crisis_response_slow', measure.duration);
                }
                
                observer.disconnect();
                break;
              }
            }
          }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Cleanup observer after 5 seconds
        setTimeout(() => observer.disconnect(), 5000);
      }
    });
  }
  
  /**
   * Measure 988 hotline access time
   */
  private measure988AccessTime(): void {
    // Monitor tel:988 link clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const telLink = target.closest('a[href^="tel:988"]');
      
      if (telLink) {
        const clickTime = performance.now();
        this.recordMetric('988_access_time', clickTime, {
          immediate: clickTime < PERFORMANCE_THRESHOLDS.CRISIS_HOTLINE_ACCESS,
        });
      }
    });
  }
  
  /**
   * Measure safety plan access time
   */
  private measureSafetyPlanAccess(): void {
    // Monitor safety plan component loading
    const measureSafetyPlan = (startMark: string) => {
      performance.mark(startMark);
      
      const checkSafetyPlan = () => {
        const safetyPlanElement = document.querySelector('[data-testid="safety-plan"]');
        if (safetyPlanElement) {
          performance.mark('safety_plan_loaded');
          performance.measure('safety_plan_load_time', startMark, 'safety_plan_loaded');
          
          const measure = performance.getEntriesByName('safety_plan_load_time')[0];
          if (!measure) return;
          this.recordMetric('safety_plan_access', measure.duration, {
            withinThreshold: measure.duration < PERFORMANCE_THRESHOLDS.SAFETY_PLAN_ACCESS,
          });
        } else {
          requestAnimationFrame(checkSafetyPlan);
        }
      };
      
      checkSafetyPlan();
    };
    
    // Hook into router navigation to safety plan
    window.addEventListener('popstate', () => {
      if (window.location.pathname.includes('safety-plan')) {
        measureSafetyPlan('safety_plan_navigation_start');
      }
    });
  }
  
  /**
   * Measure emergency contacts display time
   */
  private measureEmergencyContactsDisplay(): void {
    const measureContacts = () => {
      performance.mark('emergency_contacts_start');
      
      const checkContacts = () => {
        const contactsElement = document.querySelector('[data-testid="emergency-contacts"]');
        if (contactsElement && contactsElement.children.length > 0) {
          performance.mark('emergency_contacts_displayed');
          performance.measure('emergency_contacts_time', 'emergency_contacts_start', 'emergency_contacts_displayed');
          
          const measure = performance.getEntriesByName('emergency_contacts_time')[0];
          if (!measure) return;
          this.recordMetric('emergency_contacts_display', measure.duration, {
            count: contactsElement.children.length,
            fast: measure.duration < PERFORMANCE_THRESHOLDS.EMERGENCY_CONTACT_DISPLAY,
          });
        }
      };
      
      // Check periodically
      const interval = setInterval(() => {
        checkContacts();
        if (document.querySelector('[data-testid="emergency-contacts"]')) {
          clearInterval(interval);
        }
      }, 100);
      
      // Stop checking after 5 seconds
      setTimeout(() => clearInterval(interval), 5000);
    };
    
    // Monitor emergency contacts section
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.textContent?.includes('Emergency Contacts')) {
        measureContacts();
      }
    });
  }
  
  /**
   * Record navigation timing metrics
   */
  private recordNavigationMetrics(entry: PerformanceNavigationTiming): void {
    const metrics = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ttfb: entry.responseStart - entry.requestStart,
      download: entry.responseEnd - entry.responseStart,
      domInteractive: entry.domInteractive - entry.fetchStart,
      domComplete: entry.domComplete - entry.fetchStart,
      loadComplete: entry.loadEventEnd - entry.fetchStart,
    };
    
    this.recordMetric('navigation_timing', metrics.loadComplete, metrics);
    
    // Check if page load is too slow
    if (metrics.loadComplete > 3000) {
      this.alertPerformanceIssue('slow_page_load', metrics.loadComplete, 3000);
    }
  }
  
  /**
   * Analyze resource loading for bundle optimization
   */
  private analyzeResourceLoading(entry: PerformanceResourceTiming): void {
    const isJavaScript = entry.name.endsWith('.js');
    const isCSS = entry.name.endsWith('.css');
    const isCriticalResource = entry.name.includes('crisis') || entry.name.includes('emergency');
    
    if (isJavaScript || isCSS) {
      const loadTime = entry.responseEnd - entry.startTime;
      const size = entry.encodedBodySize;
      
      this.recordMetric('resource_load', loadTime, {
        name: entry.name,
        type: isJavaScript ? 'js' : 'css',
        size: size / 1024, // KB
        critical: isCriticalResource,
        cached: entry.transferSize === 0,
      });
      
      // Alert if critical resources are slow
      if (isCriticalResource && loadTime > 200) {
        this.alertCriticalPerformanceIssue('slow_critical_resource', loadTime);
      }
      
      // Alert if bundles are too large
      if (isJavaScript && size > PERFORMANCE_THRESHOLDS.CRITICAL_BUNDLE_SIZE * 1024) {
        this.alertBundleSizeIssue(entry.name, size / 1024);
      }
    }
  }
  
  /**
   * Detect potential memory leaks
   */
  private memoryHistory: number[] = [];
  private detectMemoryLeaks(currentMemoryMB: number): void {
    this.memoryHistory.push(currentMemoryMB);
    
    // Keep only last 6 measurements (1 minute of data)
    if (this.memoryHistory.length > 6) {
      this.memoryHistory.shift();
    }
    
    // Check for consistent memory growth
    if (this.memoryHistory.length === 6) {
      let isGrowing = true;
      for (let i = 1; i < this.memoryHistory.length; i++) {
        const current = this.memoryHistory[i];
        const previous = this.memoryHistory[i - 1];
        if (current != null && previous != null && current <= previous) {
          isGrowing = false;
          break;
        }
      }
      
      if (isGrowing) {
        const recent = this.memoryHistory[5];
        const initial = this.memoryHistory[0];
        if (recent == null || initial == null) return;
        const growthRate = recent - initial;
        this.alertMemoryLeak(growthRate);
      }
    }
  }
  
  /**
   * Detect device capabilities for optimization decisions
   */
  private detectDeviceCapabilities(): void {
    // Check for low-end device indicators
    const memory = (navigator as any).deviceMemory;
    const cpuCores = navigator.hardwareConcurrency;
    
    this.isLowEndDevice = (
      (memory && memory <= 4) || // 4GB RAM or less
      (cpuCores && cpuCores <= 2) || // 2 cores or less
      /Android.*(Mobile|Tablet).*Chrome\/[.0-9]* (?!Mobile)/i.test(navigator.userAgent) || // Older Android
      /iPhone OS [6-9]_/i.test(navigator.userAgent) // Older iPhone
    );
    
    if (this.isLowEndDevice) {
      logger.info('Low-end device detected, enabling optimizations', 'PerformanceMonitor');
      this.enableLowEndOptimizations();
    }
  }
  
  /**
   * Detect network type for adaptive loading
   */
  private detectNetworkType(): void {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      this.networkType = connection.effectiveType || 'unknown';
      
      // Monitor network changes
      connection.addEventListener('change', () => {
        this.networkType = connection.effectiveType || 'unknown';
        this.recordMetric('network_change', 0, {
          type: this.networkType,
          downlink: connection.downlink,
          rtt: connection.rtt,
        });
      });
    }
  }
  
  /**
   * Enable optimizations for low-end devices
   */
  private enableLowEndOptimizations(): void {
    // Reduce animation complexity
    document.documentElement.classList.add('reduce-motion');
    
    // Disable non-critical features
    localStorage.setItem('performance_mode', 'low');
    
    // Reduce image quality
    document.documentElement.style.setProperty('--image-quality', 'low');
    
    // Record optimization activation
    this.recordMetric('low_end_optimizations', 1, {
      memory: (navigator as any).deviceMemory,
      cores: navigator.hardwareConcurrency,
    });
  }
  
  /**
   * Check if user is in crisis flow
   */
  private isInCrisisFlow(): boolean {
    return (
      window.location.pathname.includes('crisis') ||
      document.querySelector('[role="dialog"][aria-labelledby*="crisis"]') !== null ||
      document.querySelector('[data-crisis-active="true"]') !== null
    );
  }
  
  /**
   * Alert for performance issues
   */
  private alertPerformanceIssue(metric: string, value: number, threshold: number): void {
    logger.warn(`[Performance] ${metric} exceeded threshold: ${value}ms (threshold: ${threshold}ms)`);
    
    // Send to analytics
    this.reportMetric({
      name: 'performanceissue',
      value,
      timestamp: Date.now(),
      context: {
        metric,
        threshold,
        severity: 'warning',
      },
    });
  }
  
  /**
   * Alert for critical performance issues (crisis features)
   */
  private alertCriticalPerformanceIssue(metric: string, value: number): void {
    logger.error(`[Performance Critical] ${metric}: ${value}ms - Crisis feature performance degraded!`);
    
    // Immediately report critical issues
    this.reportMetric({
      name: 'critical_performanceissue',
      value,
      timestamp: Date.now(),
      context: {
        metric,
        severity: 'critical',
        inCrisisFlow: this.isInCrisisFlow(),
      },
    });
    
    // Trigger immediate optimizations
    this.triggerEmergencyOptimizations();
  }
  
  /**
   * Trigger emergency optimizations for critical performance issues
   */
  private triggerEmergencyOptimizations(): void {
    // Pause non-critical operations
    document.documentElement.classList.add('crisis-performance-mode');
    
    // Stop animations
    document.documentElement.style.setProperty('--animation-duration', '0');
    
    // Defer non-critical network requests
    window.dispatchEvent(new CustomEvent('performance:emergency'));
    
    logger.warn('Emergency performance optimizations activated', 'PerformanceMonitor');
  }
  
  /**
   * Alert for memory issues
   */
  private alertMemoryIssue(memoryMB: number): void {
    logger.warn(`[Memory] High memory usage: ${memoryMB.toFixed(2)}MB`);
    
    // Trigger garbage collection hint
    if ('gc' in window) {
      (window as any).gc();
    }
    
    // Report memory issue
    this.reportMetric({
      name: 'memory_warning',
      value: memoryMB,
      timestamp: Date.now(),
      context: {
        threshold: PERFORMANCE_THRESHOLDS.MAX_MEMORY_MB,
      },
    });
  }
  
  /**
   * Alert for potential memory leak
   */
  private alertMemoryLeak(growthRateMB: number): void {
    logger.error(`[Memory] Potential memory leak detected! Growth rate: ${growthRateMB.toFixed(2)}MB/minute`);
    
    this.reportMetric({
      name: 'memory_leak_detected',
      value: growthRateMB,
      timestamp: Date.now(),
      context: {
        history: this.memoryHistory,
      },
    });
  }
  
  /**
   * Alert for bundle size issues
   */
  private alertBundleSizeIssue(bundleName: string, sizeKB: number): void {
    logger.warn(`[Bundle] Large bundle detected: ${bundleName} (${sizeKB.toFixed(2)}KB)`);
    
    this.reportMetric({
      name: 'bundle_size_warning',
      value: sizeKB,
      timestamp: Date.now(),
      context: {
        bundle: bundleName,
        threshold: PERFORMANCE_THRESHOLDS.CRITICAL_BUNDLE_SIZE,
      },
    });
  }
  
  /**
   * Record a performance metric
   */
  public recordMetric(name: string, value: number, context?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      context: {
        ...context,
        sessionId: this.sessionId,
        userId: this.userId,
        isLowEndDevice: this.isLowEndDevice,
        networkType: this.networkType,
        url: window.location.pathname,
      },
    };
    
    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(metric);
    
    // Add to report queue
    this.reportQueue.push(metric);
    
    // Schedule batch reporting
    this.scheduleReport();
  }
  
  /**
   * Report metric to analytics service
   */
  private reportMetric(metric: PerformanceMetric): void {
    // Immediate reporting for critical metrics
    if (metric.context?.severity === 'critical') {
      this.sendMetrics([metric]);
    } else {
      this.reportQueue.push(metric);
      this.scheduleReport();
    }
  }
  
  /**
   * Schedule batch reporting of metrics
   */
  private scheduleReport(): void {
    if (this.reportTimer) return;
    
    this.reportTimer = window.setTimeout(() => {
      this.sendMetrics(this.reportQueue);
      this.reportQueue = [];
      this.reportTimer = null;
    }, 5000); // Batch report every 5 seconds
  }
  
  /**
   * Send metrics to analytics service
   */
  private async sendMetrics(metrics: PerformanceMetric[]): Promise<void> {
    // DISABLED: No external API calls - only local storage in production
    if (metrics.length === 0) return;
    
    try {
      // Production: Store locally only, no network calls
      if (process.env.NODE_ENV === 'production') {
        try {
          const storedMetrics = localStorage.getItem('performance_metrics') || '[]';
          const existingMetrics = JSON.parse(storedMetrics);
          const updatedMetrics = [...existingMetrics, ...metrics].slice(-100);
          localStorage.setItem('performance_metrics', JSON.stringify(updatedMetrics));
          logger.debug('Metrics stored locally', 'PerformanceMonitor', { count: metrics.length });
        } catch (localError) {
          logger.debug('LocalStorage unavailable', 'PerformanceMonitor', { error: localError });
        }
        return; // Exit early - no network calls
      }
      
      // Development: Console logging only
      if (process.env.NODE_ENV === 'development') {
        logger.info('Performance Metrics', 'PerformanceMonitor', metrics);
      }
    } catch (error) {
      logger.error('[Performance] Failed to process metrics:');
    }
  }
  
  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Set user ID for metric tracking
   */
  public setUserId(userId: string): void {
    this.userId = userId;
  }
  
  /**
   * Get performance summary
   */
  public getPerformanceSummary(): Record<string, any> {
    const summary: Record<string, any> = {};
    
    for (const [name, metrics] of this.metrics.entries()) {
      const values = metrics.map(m => m.value);
      summary[name] = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        latest: values[values.length - 1],
      };
    }
    
    return summary;
  }
  
  /**
   * Clean up observers and timers
   */
  public destroy(): void {
    // Clean up observers
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
    
    // Clear timers
    if (this.reportTimer) {
      clearTimeout(this.reportTimer);
    }
    
    // Send remaining metrics
    this.sendMetrics(this.reportQueue);
  }

  /**
   * Get performance metrics for analysis
   */
  public getMetrics(): Map<string, PerformanceMetric[]> {
    return new Map(this.metrics);
  }

  /**
   * Start performance measurement
   */
  public measureStart(label: string): void {
    performance.mark(`${label}-start`);
  }

  /**
   * End performance measurement
   */
  public measureEnd(label: string): number | undefined {
    const endMark = `${label}-end`;
    const startMark = `${label}-start`;
    
    try {
      performance.mark(endMark);
      performance.measure(label, startMark, endMark);
      
      const measure = performance.getEntriesByName(label, 'measure')[0];
      if (measure) {
        this.recordMetric(label, measure.duration);
        return measure.duration;
      }
    } catch (error) {
    logger.warn(`Failed to measure ${label}:`, error as string);
    }
    
    return undefined;
  }

  /**
   * Cleanup method for compatibility
   */
  public cleanup(): void {
    this.destroy();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export additional instances for compatibility
export const __memoryMonitor = performanceMonitor;
export const __frameRateMonitor = performanceMonitor;

// Export class for direct instantiation if needed
export { PerformanceMonitor };

// Export types
export type { PerformanceMetric };
export { PERFORMANCE_THRESHOLDS };