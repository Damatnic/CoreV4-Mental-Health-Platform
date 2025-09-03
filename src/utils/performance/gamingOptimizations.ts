/**
 * Gaming-Grade Performance Optimizations
 * Implements console-quality 60fps optimizations for the mental health platform
 */

import { performanceMonitor } from './performanceMonitor';
import { logger } from '../logger';

interface GamePerformanceConfig {
  targetFPS: number;
  enableGPUAcceleration: boolean;
  enableMemoryOptimization: boolean;
  enableNetworkOptimization: boolean;
  prioritizeCrisisFeatures: boolean;
  adaptiveQuality: boolean;
}

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  frameTime: number;
  renderTime: number;
  lastFrameTimestamp: number;
}

class GamePerformanceOptimizer {
  private config: GamePerformanceConfig;
  private metrics: PerformanceMetrics;
  private rafId: number | null = null;
  private frameHistory: number[] = [];
  private lastOptimizationCheck: number = 0;
  private performanceLevel: 'high' | 'medium' | 'low' = 'high';
  private observers: Map<string, PerformanceObserver> = new Map();
  
  constructor() {
    this.config = {
      targetFPS: 60,
      enableGPUAcceleration: true,
      enableMemoryOptimization: true,
      enableNetworkOptimization: true,
      prioritizeCrisisFeatures: true,
      adaptiveQuality: true,
    };
    
    this.metrics = {
      fps: 60,
      memoryUsage: 0,
      frameTime: 16.67, // 60fps = 16.67ms per frame
      renderTime: 0,
      lastFrameTimestamp: performance.now(),
    };
    
    this.initialize();
  }
  
  private initialize(): void {
    this.detectDeviceCapabilities();
    this.setupPerformanceMonitoring();
    this.enableGPUOptimizations();
    this.optimizeNetworking();
    this.startFrameRateMonitoring();
    this.setupMemoryManagement();
    this.enableConsoleOptimizations();
    
    logger.info(`Initialized with ${this.performanceLevel} performance profile`, 'GamingOptimizations');
  }
  
  private detectDeviceCapabilities(): void {
    const memory = (navigator as unknown).deviceMemory;
    const cores = navigator.hardwareConcurrency;
    const connection = (navigator as unknown).connection;
    
    // Determine performance level based on device capabilities
    if (memory <= 4 || cores <= 2 || connection?.effectiveType === '2g') {
      this.performanceLevel = 'low';
      this.config.targetFPS = 30;
      this.config.enableGPUAcceleration = false;
    } else if (memory <= 8 || cores <= 4 || connection?.effectiveType === '3g') {
      this.performanceLevel = 'medium';
      this.config.targetFPS = 45;
    } else {
      this.performanceLevel = 'high';
      this.config.targetFPS = 60;
    }
    
    performanceMonitor.recordMetric('device_performance_level', 1, {
      level: this.performanceLevel,
      memory,
      cores,
      networkType: connection?.effectiveType
    });
  }
  
  private setupPerformanceMonitoring(): void {
    // Long task monitoring for detecting blocking operations
    if ('PerformanceObserver' in window && PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const longTask = entry as PerformanceEntry;
          if (longTask.duration > 16.67) { // Longer than one frame at 60fps
            this.handleLongTask(longTask);
          }
        }
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', longTaskObserver);
    }
    
    // Layout shift monitoring
    if ('PerformanceObserver' in window && PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) {
      const layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as PerformanceEntry & { value?: number };
          if (layoutShift.value && layoutShift.value > 0.1) { // Significant layout shift
            this.optimizeLayoutStability();
          }
        }
      });
      
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('layout-shift', layoutShiftObserver);
    }
    
    // Resource timing for bundle optimization
    if ('PerformanceObserver' in window && PerformanceObserver.supportedEntryTypes?.includes('resource')) {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.analyzeResourceTiming(entry as PerformanceResourceTiming);
        }
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    }
  }
  
  private enableGPUOptimizations(): void {
    if (!this.config.enableGPUAcceleration) return;
    
    // Apply GPU acceleration to critical elements
    const applyGPUAcceleration = () => {
      const criticalElements = [
        '[data-console-group]',
        '[role="navigation"]',
        '.console-focusable',
        '.animate-',
        '[data-testid*="crisis"]'
      ];
      
      criticalElements.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
          const el = element as HTMLElement;
          el.style.transform = 'translate3d(0, 0, 0)';
          el.style.backfaceVisibility = 'hidden';
          el.style.perspective = '1000px';
          el.style.willChange = 'transform, opacity';
        });
      });
    };
    
    // Apply GPU acceleration after DOM is ready and on route changes
    if (document.readyState === 'complete') {
      applyGPUAcceleration();
    } else {
      window.addEventListener('load', applyGPUAcceleration);
    }
    
    // Apply on navigation changes
    window.addEventListener('popstate', () => {
      setTimeout(applyGPUAcceleration, 100);
    });
    
    // Monitor for new elements
// @ts-expect-error - MutationObserver is a global API
    const observer = new MutationObserver((mutations) => {
      let _shouldOptimize = false;
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          _shouldOptimize = true;
        }
      });
      
// @ts-expect-error - requestIdleCallback is a global API
      if (_shouldOptimize) {
        requestIdleCallback(applyGPUAcceleration, { timeout: 1000 });
      }
    });
    
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  }
  
  private startFrameRateMonitoring(): void {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const _measureFrame = (timestamp: number) => {
      frameCount++;
      const deltaTime = timestamp - this.metrics.lastFrameTimestamp;
      this.metrics.frameTime = deltaTime;
      this.metrics.lastFrameTimestamp = timestamp;
      
      // Calculate FPS every second
      if (timestamp - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (timestamp - lastTime));
        this.metrics.fps = fps;
        this.frameHistory.push(fps);
        
        // Keep only last 10 seconds of history
        if (this.frameHistory.length > 10) {
          this.frameHistory.shift();
        }
        
        // Adaptive quality based on performance
        if (this.config.adaptiveQuality) {
          this.adaptQualityBasedOnPerformance(fps);
        }
        
        frameCount = 0;
        lastTime = timestamp;
        
        performanceMonitor.recordMetric('gaming_fps', fps, {
          frameTime: this.metrics.frameTime,
          performanceLevel: this.performanceLevel
        });
      }
      
      this.rafId = requestAnimationFrame(_measureFrame);
    };
    
    this.rafId = requestAnimationFrame(_measureFrame);
  }
  
  private adaptQualityBasedOnPerformance(_currentFPS: number): void {
    const now = Date.now();
    if (now - this.lastOptimizationCheck < 2000) return; // Check every 2 seconds
    
    this.lastOptimizationCheck = now;
    
    const avgFPS = this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length;
    
    if (avgFPS < this.config.targetFPS * 0.8) {
      // Performance is poor, reduce quality
      this.reduceQuality();
    } else if (avgFPS > this.config.targetFPS * 0.95 && this.performanceLevel !== 'high') {
      // Performance is good, can increase quality
      this.increaseQuality();
    }
  }
  
  private reduceQuality(): void {
    logger.info('Reducing quality due to low FPS', 'GamingOptimizations');
    
    // Disable expensive animations
    document.documentElement.classList.add('performance-mode');
    
    // Reduce animation durations
    document.documentElement.style.setProperty('--animation-duration', '0.1s');
    
    // Disable blur effects
    document.querySelectorAll('[style*="backdrop-filter"], [class*="backdrop-blur"]').forEach(el => {
      (el as HTMLElement).style.backdropFilter = 'none';
    });
    
    // Simplify shadows
    document.documentElement.style.setProperty('--box-shadow-intensity', '0.5');
    
    performanceMonitor.recordMetric('quality_reduced', 1, {
      reason: 'low_fps',
      currentFPS: this.metrics.fps
    });
  }
  
  private increaseQuality(): void {
    logger.info('Increasing quality due to good FPS', 'GamingOptimizations');
    
    // Re-enable animations gradually
    document.documentElement.classList.remove('performance-mode');
    document.documentElement.style.removeProperty('--animation-duration');
    document.documentElement.style.removeProperty('--box-shadow-intensity');
    
    performanceMonitor.recordMetric('quality_increased', 1, {
      reason: 'good_fps',
      currentFPS: this.metrics.fps
    });
  }
  
  private handleLongTask(task: PerformanceEntry): void {
    logger.warn(`[Gaming Performance] Long task detected: ${task.duration}ms`);
    
    // If we're in crisis mode, this is critical
    const inCrisisMode = window.location.pathname.includes('crisis') || 
                        document.querySelector('[data-crisis-active="true"]');
    
    if (inCrisisMode && task.duration > 50) {
      // Emergency performance mode for crisis features
      document.documentElement.classList.add('performance-emergency');
      setTimeout(() => {
        document.documentElement.classList.remove('performance-emergency');
      }, 5000);
    }
    
    performanceMonitor.recordMetric('long_task', task.duration, {
      inCrisisMode,
      taskName: task.name,
      startTime: task.startTime
    });
  }
  
  private optimizeLayoutStability(): void {
    logger.info('Optimizing layout stability', 'GamingOptimizations');
    
    // Add contain properties to isolate layouts
    document.querySelectorAll('.console-focusable, [data-console-group]').forEach(el => {
      (el as HTMLElement).style.contain = 'layout style paint';
    });
    
    performanceMonitor.recordMetric('layout_optimized', 1);
  }
  
  private analyzeResourceTiming(entry: PerformanceResourceTiming): void {
    const isCritical = entry.name.includes('crisis') || 
                      entry.name.includes('emergency') || 
                      entry.name.includes('console');
    
    if (isCritical && entry.duration > 200) {
      logger.warn(`[Gaming Performance] Critical resource slow: ${entry.name}`);
      performanceMonitor.recordMetric('critical_resource_slow', entry.duration, {
        resourceName: entry.name,
        size: entry.encodedBodySize
      });
    }
  }
  
  private setupMemoryManagement(): void {
    if (!this.config.enableMemoryOptimization) return;
    
    // Monitor memory usage
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as unknown).memory;
        const usedMB = memory.usedJSHeapSize / 1048576;
        this.metrics.memoryUsage = usedMB;
        
        if (usedMB > 100) { // Over 100MB
          this.triggerGarbageCollection();
        }
        
        performanceMonitor.recordMetric('memory_usage_gaming', usedMB, {
          total: memory.totalJSHeapSize / 1048576,
          limit: memory.jsHeapSizeLimit / 1048576
        });
      }
    };
    
    setInterval(checkMemory, 5000);
    
    // Clean up unused event listeners and observers
    this.setupCleanupScheduler();
  }
  
  private triggerGarbageCollection(): void {
    logger.info('Triggering garbage collection optimizations', 'GamingOptimizations');
    
    // Force garbage collection if available (development only)
    if ('gc' in window && process.env.NODE_ENV === 'development') {
      (window as unknown).gc();
    }
    
    // Clean up performance entries
    if ('clearResourceTimings' in performance) {
      performance.clearResourceTimings();
    }
    
    // Clear old performance marks and measures
    performance.clearMarks();
    performance.clearMeasures();
    
    performanceMonitor.recordMetric('gc_triggered', 1, {
      memoryUsage: this.metrics.memoryUsage
    });
  }
  
  private setupCleanupScheduler(): void {
    // Clean up stale DOM references and event listeners
    setInterval(() => {
      // Remove stale event listeners from removed elements
      document.querySelectorAll('[data-cleanup-scheduled]').forEach(el => {
        if (!document.body.contains(el)) {
          el.remove();
        }
      });
      
      // Clean up intersection observers for elements no longer in viewport
      if ('IntersectionObserver' in window) {
        // This would be implemented based on specific observer usage
      }
    }, 30000); // Every 30 seconds
  }
  
  private optimizeNetworking(): void {
    if (!this.config.enableNetworkOptimization) return;
    
    // Preconnect to critical domains
    const criticalDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ];
    
    criticalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
    
    // Optimize resource hints for critical resources
    this.setupResourceHints();
  }
  
  private setupResourceHints(): void {
    // Prefetch likely next pages based on user behavior
    const prefetchCandidates = [
      '/wellness',
      '/crisis',
      '/community'
    ];
    
    prefetchCandidates.forEach(path => {
      if (window.location.pathname !== path) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = path;
        document.head.appendChild(link);
      }
    });
  }
  
  private enableConsoleOptimizations(): void {
    // Optimize console navigation for 60fps
    document.addEventListener('keydown', this.optimizeKeyboardInput.bind(this), { 
      passive: true 
    });
    
    // Optimize mouse interactions
    document.addEventListener('mousemove', this.throttleMouseMove.bind(this), { 
      passive: true 
    });
    
    // Optimize scroll performance
    document.addEventListener('scroll', this.optimizeScrolling.bind(this), { 
      passive: true 
    });
  }
  
  private optimizeKeyboardInput = (() => {
    let lastInputTime = 0;
    return (event: KeyboardEvent) => {
      const now = performance.now();
      const timeSinceLastInput = now - lastInputTime;
      
      // Throttle rapid key inputs to maintain 60fps
      if (timeSinceLastInput < 16.67) {
        event.preventDefault();
        return;
      }
      
      lastInputTime = now;
    };
  })();
  
  private throttleMouseMove = (() => {
    let lastMoveTime = 0;
    return (_event: MouseEvent) => {
      const now = performance.now();
      const timeSinceLastMove = now - lastMoveTime;
      
      // Throttle mouse events to 60fps
      if (timeSinceLastMove < 16.67) {
        return;
      }
      
      lastMoveTime = now;
      
      // Update console navigation state efficiently
      document.documentElement.classList.add('console-navigation-mouse');
      document.documentElement.classList.remove('console-navigation-keyboard', 'console-navigation-gamepad');
    };
  })();
  
  private optimizeScrolling = (() => {
    let scrollTimeout: number;
    return () => {
      // Use passive scrolling for better performance
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        // Trigger any scroll-dependent optimizations
        this.updateVisibleElements();
      }, 100);
    };
  })();
  
  private updateVisibleElements(): void {
    // Optimize rendering of off-screen elements
    const viewportHeight = window.innerHeight;
    const buffer = 200; // 200px buffer for smooth scrolling
    
    document.querySelectorAll('.console-focusable').forEach(el => {
      const rect = el.getBoundingClientRect();
      const isVisible = rect.top < viewportHeight + buffer && rect.bottom > -buffer;
      
      if (isVisible) {
        (el as HTMLElement).style.visibility = 'visible';
      } else {
        (el as HTMLElement).style.visibility = 'hidden';
      }
    });
  }
  
  // Public API
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  public getConfig(): GamePerformanceConfig {
    return { ...this.config };
  }
  
  public setConfig(newConfig: Partial<GamePerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Configuration updated', 'GamingOptimizations', newConfig);
  }
  
  public enableCrisisMode(): void {
    logger.crisis('Crisis mode enabled - maximum performance', 'high', 'GamingOptimizations');
    
    // Highest priority for crisis features
    document.documentElement.classList.add('crisis-performance-mode');
    
    // Disable all non-essential animations
    document.documentElement.style.setProperty('--animation-duration', '0s');
    
    // Force highest performance mode
    this.performanceLevel = 'high';
    this.config.targetFPS = 60;
    
    performanceMonitor.recordMetric('crisis_mode_enabled', 1);
  }
  
  public disableCrisisMode(): void {
    logger.info('Crisis mode disabled - restoring normal performance', 'GamingOptimizations');
    
    document.documentElement.classList.remove('crisis-performance-mode');
    document.documentElement.style.removeProperty('--animation-duration');
    
    this.detectDeviceCapabilities(); // Restore appropriate performance level
    
    performanceMonitor.recordMetric('crisis_mode_disabled', 1);
  }
  
  public generatePerformanceReport(): Record<string, any> {
    const avgFPS = this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length || 0;
    
    return {
      averageFPS: Math.round(avgFPS),
      currentFPS: this.metrics.fps,
      frameTime: this.metrics.frameTime,
      memoryUsage: this.metrics.memoryUsage,
      performanceLevel: this.performanceLevel,
      targetFPS: this.config.targetFPS,
      optimizationsActive: {
        gpuAcceleration: this.config.enableGPUAcceleration,
        memoryOptimization: this.config.enableMemoryOptimization,
        networkOptimization: this.config.enableNetworkOptimization,
        adaptiveQuality: this.config.adaptiveQuality
      },
      frameHistory: [...this.frameHistory]
    };
  }
  
  public destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    
    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    logger.info('Performance optimizer destroyed', 'GamingOptimizations');
  }
}

// Export singleton instance
export const gamePerformanceOptimizer = new GamePerformanceOptimizer();

// React hook for accessing gaming performance features
export function useGamePerformance() {
  return {
    getMetrics: gamePerformanceOptimizer.getMetrics.bind(gamePerformanceOptimizer),
    getConfig: gamePerformanceOptimizer.getConfig.bind(gamePerformanceOptimizer),
    setConfig: gamePerformanceOptimizer.setConfig.bind(gamePerformanceOptimizer),
    enableCrisisMode: gamePerformanceOptimizer.enableCrisisMode.bind(gamePerformanceOptimizer),
    disableCrisisMode: gamePerformanceOptimizer.disableCrisisMode.bind(gamePerformanceOptimizer),
    generateReport: gamePerformanceOptimizer.generatePerformanceReport.bind(gamePerformanceOptimizer)
  };
}

// Initialize on import
export function initializeGamingPerformance(): void {
  logger.info('Gaming-grade optimizations initialized', 'GamingOptimizations');
}