/**
 * Performance API global augmentations
 * Extends built-in Performance APIs with additional properties
 */

// Extend the global PerformanceEntry interface
declare global {
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

  interface PerformanceResourceTiming {
    transferSize: number;
    encodedBodySize: number;
    decodedBodySize: number;
  }

  interface Performance {
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
  }

  interface Window {
    webkitPerformance?: Performance;
    mozPerformance?: Performance;
    msPerformance?: Performance;
  }
}