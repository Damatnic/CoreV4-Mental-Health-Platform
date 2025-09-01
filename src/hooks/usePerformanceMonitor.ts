import { useCallback, useEffect, useRef } from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceMonitorConfig {
  enableLogging?: boolean;
  enableReporting?: boolean;
  reportingEndpoint?: string;
  sampleRate?: number; // 0-1, percentage of metrics to report
  bufferSize?: number; // Max number of metrics to buffer
}

/**
 * Hook for monitoring and reporting performance metrics
 * Tracks Core Web Vitals and custom metrics
 */
export function usePerformanceMonitor(config: PerformanceMonitorConfig = {}) {
  const {
    enableLogging = process.env.NODE_ENV === 'development',
    enableReporting = process.env.NODE_ENV === 'production',
    reportingEndpoint = '/api/metrics',
    sampleRate = 1.0,
    bufferSize = 100
  } = config;

  const metricsBuffer = useRef<PerformanceMetric[]>([]);
  const reportingTimer = useRef<NodeJS.Timeout>();

  // Record a custom metric
  const recordMetric = useCallback((name: string, value: number, metadata?: Record<string, any>) => {
    // Sample rate check
    if (Math.random() > sampleRate) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    if (enableLogging) {
      console.log(`[Performance] ${name}:`, value, metadata);
    }

    // Add to buffer
    metricsBuffer.current.push(metric);

    // Trim buffer if needed
    if (metricsBuffer.current.length > bufferSize) {
      metricsBuffer.current = metricsBuffer.current.slice(-bufferSize);
    }

    // Schedule reporting
    if (enableReporting && !reportingTimer.current) {
      reportingTimer.current = setTimeout(() => {
        flushMetrics();
        reportingTimer.current = undefined;
      }, 5000); // Batch report every 5 seconds
    }
  }, [enableLogging, enableReporting, sampleRate, bufferSize]);

  // Flush metrics to server
  const flushMetrics = useCallback(async () => {
    if (metricsBuffer.current.length === 0) return;

    const metrics = [...metricsBuffer.current];
    metricsBuffer.current = [];

    if (enableReporting) {
      try {
        await fetch(reportingEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metrics,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            sessionId: getSessionId()
          })
        });
      } catch (error) {
        console.error('Failed to report metrics:', error);
        // Re-add metrics to buffer for retry
        metricsBuffer.current = [...metrics, ...metricsBuffer.current];
      }
    }
  }, [enableReporting, reportingEndpoint]);

  // Monitor Core Web Vitals
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // First Contentful Paint (FCP)
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          recordMetric('fcp', entry.startTime, {
            type: 'web-vital'
          });
        }
      }
    });

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      recordMetric('lcp', lastEntry.startTime, {
        type: 'web-vital',
        element: (lastEntry as any).element?.tagName
      });
    });

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceEventTiming[]) {
        recordMetric('fid', entry.processingStart - entry.startTime, {
          type: 'web-vital',
          eventType: entry.name
        });
      }
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          recordMetric('cls', clsValue, {
            type: 'web-vital'
          });
        }
      }
    });

    // Time to First Byte (TTFB)
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      recordMetric('ttfb', navigationEntry.responseStart - navigationEntry.requestStart, {
        type: 'web-vital'
      });
    }

    // Start observing
    try {
      fcpObserver.observe({ entryTypes: ['paint'] });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      fidObserver.observe({ entryTypes: ['first-input'] });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('Performance monitoring not fully supported:', error);
    }

    // Monitor long tasks
    if ('PerformanceObserver' in window && PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          recordMetric('long_task', entry.duration, {
            type: 'performance',
            startTime: entry.startTime
          });
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    }

    // Monitor memory usage (Chrome only)
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        recordMetric('memory_usage', memory.usedJSHeapSize, {
          type: 'resource',
          limit: memory.jsHeapSizeLimit,
          total: memory.totalJSHeapSize
        });
      };
      const memoryInterval = setInterval(checkMemory, 30000); // Check every 30 seconds
      
      return () => {
        clearInterval(memoryInterval);
      };
    }

    // Cleanup on unmount
    return () => {
      fcpObserver.disconnect();
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
      flushMetrics();
    };
  }, [recordMetric, flushMetrics]);

  // Flush metrics on page unload
  useEffect(() => {
    const handleUnload = () => {
      flushMetrics();
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushMetrics();
      }
    });

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [flushMetrics]);

  return {
    recordMetric,
    flushMetrics,
    getMetrics: () => [...metricsBuffer.current]
  };
}

// Helper to get or create session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('perf_session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('perf_session_id', sessionId);
  }
  return sessionId;
}

// Performance observer types
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  processingEnd: number;
  duration: number;
  cancelable: boolean;
}