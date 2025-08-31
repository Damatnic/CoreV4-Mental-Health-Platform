// Performance Monitoring for Mental Health App
import { onCLS, onFID, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

interface PerformanceMetrics {
  cls: number | null;
  fid: number | null;
  fcp: number | null;
  lcp: number | null;
  ttfb: number | null;
  customMetrics: Record<string, number>;
}

interface CrisisPerformanceMetrics {
  timeToFirstInteraction: number;
  emergencyButtonRenderTime: number;
  offlineResourceLoadTime: number;
  crisisPageLoadTime: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    cls: null,
    fid: null,
    fcp: null,
    lcp: null,
    ttfb: null,
    customMetrics: {}
  };

  private crisisMetrics: CrisisPerformanceMetrics = {
    timeToFirstInteraction: 0,
    emergencyButtonRenderTime: 0,
    offlineResourceLoadTime: 0,
    crisisPageLoadTime: 0
  };

  private observers: Map<string, PerformanceObserver> = new Map();

  init() {
    // Core Web Vitals
    this.measureCoreWebVitals();
    
    // Custom metrics for mental health features
    this.measureCustomMetrics();
    
    // Crisis-specific performance monitoring
    this.measureCrisisPerformance();
    
    // Monitor long tasks that might impact crisis response
    this.monitorLongTasks();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
    
    // Network monitoring for offline detection
    this.monitorNetworkPerformance();
  }

  private measureCoreWebVitals() {
    // Cumulative Layout Shift
    onCLS((metric: Metric) => {
      this.metrics.cls = metric.value;
      this.reportMetric('cls', metric.value);
    });

    // First Input Delay
    onFID((metric: Metric) => {
      this.metrics.fid = metric.value;
      this.reportMetric('fid', metric.value);
      
      // Alert if FID is too high for crisis features
      if (metric.value > 100) {
        console.warn('High First Input Delay detected - may impact crisis response');
      }
    });

    // First Contentful Paint
    onFCP((metric: Metric) => {
      this.metrics.fcp = metric.value;
      this.reportMetric('fcp', metric.value);
    });

    // Largest Contentful Paint
    onLCP((metric: Metric) => {
      this.metrics.lcp = metric.value;
      this.reportMetric('lcp', metric.value);
    });

    // Time to First Byte
    onTTFB((metric: Metric) => {
      this.metrics.ttfb = metric.value;
      this.reportMetric('ttfb', metric.value);
    });
  }

  private measureCustomMetrics() {
    // Time to Interactive for Crisis Button
    this.measureTimeToInteractive();
    
    // Measure component render times
    this.measureComponentPerformance();
    
    // Measure API response times
    this.measureAPIPerformance();
  }

  private measureCrisisPerformance() {
    // Measure crisis page load time
    if (window.location.pathname.includes('/crisis')) {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigationEntry) {
        this.crisisMetrics.crisisPageLoadTime = navigationEntry.loadEventEnd - navigationEntry.fetchStart;
        
        // Report if crisis page loads too slowly
        if (this.crisisMetrics.crisisPageLoadTime > 3000) {
          this.reportCriticalMetric('crisis_page_slow', this.crisisMetrics.crisisPageLoadTime);
        }
      }
    }

    // Measure emergency button render time
    this.measureElementRenderTime('.btn-crisis, [aria-label*="emergency"]', (time) => {
      this.crisisMetrics.emergencyButtonRenderTime = time;
      
      if (time > 1000) {
        this.reportCriticalMetric('emergency_button_slow', time);
      }
    });
  }

  private measureTimeToInteractive() {
    // Use Long Task API to determine when page is interactive
    const observer = new PerformanceObserver((list) => {
      const perfEntries = list.getEntries();
      
      for (const entry of perfEntries) {
        if (entry.duration > 50) {
          // Long task detected
          this.metrics.customMetrics.longTaskCount = 
            (this.metrics.customMetrics.longTaskCount || 0) + 1;
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', observer);
    } catch (e) {
      console.warn('Long Task API not supported');
    }
  }

  private measureComponentPerformance() {
    // Measure React component render times
    if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      
      const originalCommitFiberRoot = hook.onCommitFiberRoot;
      hook.onCommitFiberRoot = (id: any, root: any, priorityLevel: any) => {
        // Measure render time
        const renderTime = performance.now();
        
        // Check for crisis components
        if (root?.elementType?.name?.includes('Crisis')) {
          this.metrics.customMetrics.crisisComponentRender = renderTime;
        }
        
        if (originalCommitFiberRoot) {
          originalCommitFiberRoot(id, root, priorityLevel);
        }
      };
    }
  }

  private measureAPIPerformance() {
    // Intercept fetch to measure API performance
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0] as string;
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Track crisis API calls specifically
        if (url.includes('/crisis') || url.includes('/emergency')) {
          this.metrics.customMetrics.crisisAPITime = duration;
          
          if (duration > 2000) {
            this.reportCriticalMetric('crisis_api_slow', duration);
          }
        }
        
        // Track general API performance
        this.metrics.customMetrics.avgAPITime = 
          ((this.metrics.customMetrics.avgAPITime || 0) + duration) / 2;
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Report failed crisis API calls
        if (url.includes('/crisis')) {
          this.reportCriticalMetric('crisis_api_failed', duration);
        }
        
        throw error;
      }
    };
  }

  private monitorLongTasks() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              // Report long tasks that might block crisis features
              if (window.location.pathname.includes('/crisis')) {
                this.reportCriticalMetric('crisis_long_task', entry.duration);
              }
            }
          }
        });
        
        observer.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask-monitor', observer);
      } catch (e) {
        console.warn('Long Task monitoring not available');
      }
    }
  }

  private monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        
        const usedMemoryMB = memory.usedJSHeapSize / 1048576;
        const limitMemoryMB = memory.jsHeapSizeLimit / 1048576;
        const usagePercent = (usedMemoryMB / limitMemoryMB) * 100;
        
        this.metrics.customMetrics.memoryUsageMB = usedMemoryMB;
        this.metrics.customMetrics.memoryUsagePercent = usagePercent;
        
        // Warn if memory usage is high
        if (usagePercent > 80) {
          console.warn(`High memory usage: ${usagePercent.toFixed(2)}%`);
          this.reportCriticalMetric('high_memory_usage', usagePercent);
        }
      }, 30000); // Check every 30 seconds
    }
  }

  private monitorNetworkPerformance() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      // Monitor connection changes
      connection.addEventListener('change', () => {
        const effectiveType = connection.effectiveType;
        const downlink = connection.downlink;
        
        // Warn about slow connections that might impact crisis features
        if (effectiveType === '2g' || effectiveType === 'slow-2g') {
          this.reportCriticalMetric('slow_connection', { effectiveType, downlink });
        }
        
        this.metrics.customMetrics.connectionType = effectiveType;
        this.metrics.customMetrics.downlinkSpeed = downlink;
      });
    }
  }

  private measureElementRenderTime(selector: string, callback: (time: number) => void) {
    const startTime = performance.now();
    
    const checkElement = () => {
      const element = document.querySelector(selector);
      
      if (element) {
        const renderTime = performance.now() - startTime;
        callback(renderTime);
      } else if (performance.now() - startTime < 5000) {
        // Keep checking for up to 5 seconds
        requestAnimationFrame(checkElement);
      }
    };
    
    checkElement();
  }

  private reportMetric(name: string, value: number) {
    // Send to analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance', {
        event_category: 'Web Vitals',
        event_label: name,
        value: Math.round(value),
        non_interaction: true
      });
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance metric - ${name}: ${value}`);
    }
  }

  private reportCriticalMetric(name: string, value: any) {
    // Critical metrics that affect crisis features
    console.error(`CRITICAL PERFORMANCE ISSUE - ${name}:`, value);
    
    // Send to monitoring service
    if (typeof window !== 'undefined') {
      // Send to Sentry or similar service
      if ((window as any).Sentry) {
        (window as any).Sentry.captureMessage(`Performance Issue: ${name}`, {
          level: 'warning',
          extra: { value }
        });
      }
      
      // Store for later analysis
      localStorage.setItem(`perf_critical_${Date.now()}`, JSON.stringify({
        name,
        value,
        timestamp: new Date().toISOString(),
        url: window.location.href
      }));
    }
  }

  // Public methods
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getCrisisMetrics(): CrisisPerformanceMetrics {
    return { ...this.crisisMetrics };
  }

  markCustomMetric(name: string, value: number) {
    this.metrics.customMetrics[name] = value;
    this.reportMetric(name, value);
  }

  startMeasure(name: string) {
    performance.mark(`${name}-start`);
  }

  endMeasure(name: string) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    if (measure) {
      this.markCustomMetric(name, measure.duration);
    }
  }

  cleanup() {
    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  performanceMonitor.init();
}