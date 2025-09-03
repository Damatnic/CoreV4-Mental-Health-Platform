/**
 * Console Mobile Performance Optimization Utilities
 * Optimizes console animations and effects for mobile gaming performance
 */

import React from 'react';

interface MobilePerformanceSettings {
  reduceMotion: boolean;
  enableHardwareAcceleration: boolean;
  optimizeAnimations: boolean;
  frameRateLimit: number;
  batterySavingMode: boolean;
}

interface DeviceCapabilities {
  isLowEndDevice: boolean;
  supportsHardwareAcceleration: boolean;
  screenRefreshRate: number;
  deviceMemory: number;
  hardwareConcurrency: number;
}

class ConsoleMobilePerformance {
  private settings: MobilePerformanceSettings;
  private deviceCapabilities: DeviceCapabilities;
  private performanceObserver: PerformanceObserver | null = null;
  private frameRateMonitor: number | null = null;
  private currentFPS = 60;
  private animationFrameId: number | null = null;

  constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.settings = this.getOptimalSettings();
    this.initializePerformanceMonitoring();
    this.applyGlobalOptimizations();
  }

  private detectDeviceCapabilities(): DeviceCapabilities {
    const deviceMemory = (navigator as unknown).deviceMemory || 4;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    
    return {
      isLowEndDevice: deviceMemory <= 4 || hardwareConcurrency <= 2,
      supportsHardwareAcceleration: this.testHardwareAcceleration(),
      screenRefreshRate: this.detectRefreshRate(),
      deviceMemory,
      hardwareConcurrency,
    };
  }

  private testHardwareAcceleration(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (error) {
      return false;
    }
  }

  private detectRefreshRate(): number {
    // Estimate refresh rate - default to 60fps for mobile
    return 60;
  }

  private getOptimalSettings(): MobilePerformanceSettings {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isLowBattery = (navigator as unknown).getBattery?.()?.then?.((battery: unknown) => battery.level < 0.2);
    
    return {
      reduceMotion: prefersReducedMotion || this.deviceCapabilities.isLowEndDevice,
      enableHardwareAcceleration: this.deviceCapabilities.supportsHardwareAcceleration,
      optimizeAnimations: this.deviceCapabilities.isLowEndDevice,
      frameRateLimit: this.deviceCapabilities.isLowEndDevice ? 30 : 60,
      batterySavingMode: false, // Will be updated when battery API is available
    };
  }

  private initializePerformanceMonitoring(): void {
    // Monitor frame rate
    this.monitorFrameRate();

    // Monitor battery if available
    if ('getBattery' in navigator) {
      (navigator as unknown).getBattery().then((battery: unknown) => {
        this.settings.batterySavingMode = battery.level < 0.2;
        
        battery.addEventListener('levelchange', () => {
          this.settings.batterySavingMode = battery.level < 0.2;
          this.updatePerformanceMode();
        });
      });
    }

    // Monitor performance entries
    if ('PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'measure' && entry.duration > 16.67) {
              // Frame took longer than 60fps threshold
              this.handleSlowFrame(entry.duration);
            }
          });
        });
        
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (error) {
        console.warn('Performance Observer not supported:');
      }
    }
  }

  private monitorFrameRate(): void {
    let frames = 0;
    let lastTime = performance.now();

    const _measureFPS = (currentTime: number) => {
      frames++;
      
      if (currentTime - lastTime >= 1000) {
        this.currentFPS = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
        
        // Adjust settings based on current FPS
        if (this.currentFPS < 45) {
          this.enablePerformanceMode();
        } else if (this.currentFPS > 55 && this.settings.optimizeAnimations) {
          this.disablePerformanceMode();
        }
      }
      
      this.frameRateMonitor = requestAnimationFrame(_measureFPS);
    };

    this.frameRateMonitor = requestAnimationFrame(_measureFPS);
  }

  private handleSlowFrame(duration: number): void {
    if (duration > 33.33) { // Slower than 30fps
      this.enablePerformanceMode();
    }
  }

  private applyGlobalOptimizations(): void {
    const style = document.createElement('style');
    style.id = 'console-mobile-performance';
    
    style.textContent = `
      /* Hardware acceleration for console elements */
      .console-hw-accelerated {
        will-change: transform;
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;
      }
      
      /* Performance mode animations */
      .console-performance-mode {
        --animation-duration: 0.1s;
        --transition-duration: 0.1s;
      }
      
      .console-performance-mode * {
        animation-duration: var(--animation-duration) !important;
        transition-duration: var(--transition-duration) !important;
      }
      
      /* Reduced motion animations */
      .console-reduced-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
      
      /* Battery saving mode */
      .console-battery-saving {
        --glow-intensity: 0.1;
        --shadow-blur: 5px;
      }
      
      .console-battery-saving .console-glow {
        opacity: var(--glow-intensity);
      }
      
      .console-battery-saving .console-shadow {
        filter: blur(var(--shadow-blur));
      }
      
      /* Touch optimization */
      .console-touch-optimized {
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
        user-select: none;
      }
      
      /* 60fps optimizations */
      .console-60fps-optimized {
        contain: layout style paint;
      }
      
      /* GPU layers for smooth animations */
      .console-gpu-layer {
        transform: translateZ(0);
        will-change: transform, opacity;
      }
      
      /* Mobile-specific console effects */
      @media (max-width: 768px) {
        .console-mobile-effect {
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .console-mobile-glow {
          filter: drop-shadow(0 0 ${this.settings.optimizeAnimations ? '5px' : '10px'} currentColor);
        }
      }
      
      /* Adaptive quality based on device capabilities */
      ${this.deviceCapabilities.isLowEndDevice ? `
        .console-adaptive-quality {
          filter: none !important;
          backdrop-filter: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
        }
      ` : ''}
    `;
    
    document.head.appendChild(_style);
  }

  public enablePerformanceMode(): void {
    this.settings.optimizeAnimations = true;
    this.settings.frameRateLimit = 30;
    
    document.body.classList.add('console-performance-mode');
    document.body.classList.add('console-hw-accelerated');
    
    // Reduce animation complexity
    this.updateAnimationComplexity('low');
    
    // Dispatch custom event for components to react
    window.dispatchEvent(new CustomEvent('consolePerformanceModeEnabled', {
      detail: { settings: this.settings }
    }));
  }

  public disablePerformanceMode(): void {
    this.settings.optimizeAnimations = false;
    this.settings.frameRateLimit = 60;
    
    document.body.classList.remove('console-performance-mode');
    
    // Restore animation complexity
    this.updateAnimationComplexity('high');
    
    window.dispatchEvent(new CustomEvent('consolePerformanceModeDisabled', {
      detail: { settings: this.settings }
    }));
  }

  private updatePerformanceMode(): void {
    if (this.settings.batterySavingMode) {
      this.enableBatterySavingMode();
    } else {
      this.disableBatterySavingMode();
    }
  }

  public enableBatterySavingMode(): void {
    this.settings.batterySavingMode = true;
    document.body.classList.add('console-battery-saving');
    this.enablePerformanceMode();
  }

  public disableBatterySavingMode(): void {
    this.settings.batterySavingMode = false;
    document.body.classList.remove('console-battery-saving');
  }

  private updateAnimationComplexity(level: 'low' | 'medium' | 'high'): void {
    const consoleElements = document.querySelectorAll('.console-focusable, .console-tile, .console-nav');
    
    consoleElements.forEach((element) => {
      element.classList.remove('console-animation-low', 'console-animation-medium', 'console-animation-high');
      element.classList.add(`console-animation-${level}`);
    });
  }

  public optimizeConsoleElement(element: HTMLElement): void {
    if (this.settings.enableHardwareAcceleration) {
      element.classList.add('console-hw-accelerated');
    }
    
    element.classList.add('console-touch-optimized');
    element.classList.add('console-60fps-optimized');
    
    if (this.deviceCapabilities.isLowEndDevice) {
      element.classList.add('console-adaptive-quality');
    }
  }

  public getOptimizedAnimationConfig(baseConfig: unknown): unknown {
    if (this.settings.reduceMotion) {
      return {
        ...baseConfig,
        duration: 0.01,
        ease: 'linear',
      };
    }
    
    if (this.settings.optimizeAnimations) {
      return {
        ...baseConfig,
        duration: (baseConfig.duration || 0.3) * 0.5,
        ease: 'easeOut',
      };
    }
    
    return baseConfig;
  }

  public getCurrentFPS(): number {
    return this.currentFPS;
  }

  public getDeviceCapabilities(): DeviceCapabilities {
    return { ...this.deviceCapabilities };
  }

  public getSettings(): MobilePerformanceSettings {
    return { ...this.settings };
  }

  public measurePerformance<T>(name: string, fn: () => T): T {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    
    performance.mark(`${name}-start`);
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    if (endTime - startTime > 16.67) {
      console.warn(`Console operation "${name}" took ${endTime - startTime}ms (>16.67ms threshold)`);
    }
    
    return result;
  }

  public destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    if (this.frameRateMonitor) {
      cancelAnimationFrame(this.frameRateMonitor);
    }
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    const styleElement = document.getElementById('console-mobile-performance');
    if (styleElement) {
      styleElement.remove();
    }
  }
}

// Global instance
export const consoleMobilePerformance = new ConsoleMobilePerformance();

// React hook for using console mobile performance
export function useConsoleMobilePerformance() {
  const [currentFPS, setCurrentFPS] = React.useState(consoleMobilePerformance.getCurrentFPS());
  const [settings, setSettings] = React.useState(consoleMobilePerformance.getSettings());

  React.useEffect(() => {
    const handlePerformanceChange = () => {
      setCurrentFPS(consoleMobilePerformance.getCurrentFPS());
      setSettings(consoleMobilePerformance.getSettings());
    };

    window.addEventListener('consolePerformanceModeEnabled', handlePerformanceChange);
    window.addEventListener('consolePerformanceModeDisabled', handlePerformanceChange);

    return () => {
      window.removeEventListener('consolePerformanceModeEnabled', handlePerformanceChange);
      window.removeEventListener('consolePerformanceModeDisabled', handlePerformanceChange);
    };
  }, []);

  return {
    currentFPS,
    settings,
    deviceCapabilities: consoleMobilePerformance.getDeviceCapabilities(),
    enablePerformanceMode: () => consoleMobilePerformance.enablePerformanceMode(),
    disablePerformanceMode: () => consoleMobilePerformance.disablePerformanceMode(),
    optimizeElement: (element: HTMLElement) => consoleMobilePerformance.optimizeConsoleElement(element),
    getOptimizedConfig: (config: unknown) => consoleMobilePerformance.getOptimizedAnimationConfig(config),
    measurePerformance: <T>(name: string, fn: () => T) => consoleMobilePerformance.measurePerformance(name, fn),
  };
}

