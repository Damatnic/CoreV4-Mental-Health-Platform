/**
 * Performance API type extensions
 * Extends browser Performance API with additional properties and methods
 */

// Extend PerformanceEntry with additional properties used in the app
interface PerformanceEntry {
  transferSize?: number;
  encodedBodySize?: number;
  decodedBodySize?: number;
  renderTime?: number;
  loadTime?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
}

// Extend PerformanceResourceTiming for network metrics
interface PerformanceResourceTiming extends PerformanceEntry {
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
}

// Navigation Timing API v2
interface PerformanceNavigationTiming extends PerformanceResourceTiming {
  unloadEventStart: number;
  unloadEventEnd: number;
  domInteractive: number;
  domContentLoadedEventStart: number;
  domContentLoadedEventEnd: number;
  domComplete: number;
  loadEventStart: number;
  loadEventEnd: number;
  type: NavigationType;
  redirectCount: number;
}

type NavigationType = 'navigate' | 'reload' | 'back_forward' | 'prerender';

// Paint Timing API
interface PerformancePaintTiming extends PerformanceEntry {
  entryType: 'paint';
  name: 'first-paint' | 'first-contentful-paint';
}

// Long Task API
interface PerformanceLongTaskTiming extends PerformanceEntry {
  entryType: 'longtask';
  attribution: TaskAttributionTiming[];
}

interface TaskAttributionTiming extends PerformanceEntry {
  containerType: 'iframe' | 'embed' | 'object';
  containerSrc?: string;
  containerId?: string;
  containerName?: string;
}

// Layout Instability API
interface LayoutShift extends PerformanceEntry {
  entryType: 'layout-shift';
  value: number;
  hadRecentInput: boolean;
  lastInputTime: number;
  sources: LayoutShiftAttribution[];
}

interface LayoutShiftAttribution {
  node?: Node;
  previousRect: DOMRectReadOnly;
  currentRect: DOMRectReadOnly;
}

// Largest Contentful Paint API
interface LargestContentfulPaint extends PerformanceEntry {
  entryType: 'largest-contentful-paint';
  renderTime: number;
  loadTime: number;
  size: number;
  id: string;
  url?: string;
  element?: Element | null;
}

// First Input Delay API
interface PerformanceEventTiming extends PerformanceEntry {
  entryType: 'event' | 'first-input' | 'input';
  processingStart: number;
  processingEnd: number;
  cancelable: boolean;
  target?: Node | null;
}

// Memory API (Chrome only)
interface PerformanceMemory {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

// Performance Observer extensions
interface PerformanceObserverInit {
  entryTypes?: string[];
  type?: string;
  buffered?: boolean;
}

// Extend the global Performance interface
interface Performance {
  memory?: PerformanceMemory;
  measureUserAgentSpecificMemory?: () => Promise<{
    bytes: number;
    breakdown: Array<{
      bytes: number;
      attribution: Array<{
        url: string;
        scope: string;
      }>;
      types: string[];
    }>;
  }>;
}

// Performance Monitor interface used in the app
interface PerformanceMonitor {
  start: (name: string) => void;
  getFPS: () => number;
  measureStart: (name: string) => void;
  measureEnd: (name: string) => number;
  recordMetric: (name: string, value: number, metadata?: Record<string, any>) => void;
  getMetrics: () => Record<string, any>;
  reset: () => void;
}

// Web Vitals types
interface Metric {
  name: string;
  value: number;
  delta: number;
  entries: (PerformanceEntry | LayoutShift | LargestContentfulPaint | PerformanceEventTiming)[];
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

interface ReportHandler {
  (metric: Metric): void;
}

// Declare global performance extensions
declare global {
  interface Window {
    webkitPerformance?: Performance;
    mozPerformance?: Performance;
    msPerformance?: Performance;
  }
  
  interface WorkerGlobalScope {
    performance: Performance;
  }
}

// Module declarations for performance utilities
declare module '../../utils/performance/performanceMonitor' {
  export const performanceMonitor: PerformanceMonitor;
  export default performanceMonitor;
}

declare module '../../utils/performance/index' {
  export const performanceMonitor: PerformanceMonitor;
  export * from './performanceMonitor';
}

export {
  PerformanceMonitor,
  Metric,
  ReportHandler,
  LayoutShift,
  LargestContentfulPaint,
  PerformanceEventTiming,
  PerformanceMemory
};