import { logger } from '../logger';

/**
 * Mobile Touch Optimization Utilities
 * Provides enhanced touch interactions, gestures, and mobile-specific optimizations
 */

// Touch event interfaces for better type safety
interface TouchPoint {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

interface TouchGesture {
  type: 'tap' | 'doubleTap' | 'longPress' | 'swipe' | 'pinch' | 'rotate';
  startTime: number;
  duration: number;
  distance?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  scale?: number;
  rotation?: number;
  velocity?: number;
  points: TouchPoint[];
}

interface TouchOptimizationOptions {
  enableFastClick?: boolean;
  enableSwipeGestures?: boolean;
  enablePinchZoom?: boolean;
  enableRotation?: boolean;
  enableVibration?: boolean;
  doubleTapDelay?: number;
  longPressDelay?: number;
  swipeThreshold?: number;
  pinchThreshold?: number;
  rotationThreshold?: number;
}

class TouchOptimizationManager {
  private options: Required<TouchOptimizationOptions>;
  private activeGestures: Map<string, TouchGesture> = new Map();
  private touchHistory: TouchPoint[][] = [];
  private lastTap: { x: number; y: number; timestamp: number } | null = null;
  private longPressTimer: number | null = null;
  private gestureListeners: Map<string, Set<(gesture: TouchGesture) => void>> = new Map();
  private element: HTMLElement;
  private rafId: number | null = null;

  private readonly defaultOptions: Required<TouchOptimizationOptions> = {
    enableFastClick: true,
    enableSwipeGestures: true,
    enablePinchZoom: true,
    enableRotation: true,
    enableVibration: true,
    doubleTapDelay: 300,
    longPressDelay: 500,
    swipeThreshold: 50,
    pinchThreshold: 1.2,
    rotationThreshold: 15,
  };

  constructor(element: HTMLElement, options: TouchOptimizationOptions = {}) {
    this.element = element;
    this.options = { ...this.defaultOptions, ...options };
    this.initializeEventListeners();
    this.initializeMobileOptimizations();
  }

  private initializeEventListeners(): void {
    // Use passive listeners for better performance
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: true });

    // Prevent default touch behaviors that interfere with custom gestures
    this.element.addEventListener('gesturestart', this.preventDefault, { passive: false });
    this.element.addEventListener('gesturechange', this.preventDefault, { passive: false });
    this.element.addEventListener('gestureend', this.preventDefault, { passive: false });
  }

  private initializeMobileOptimizations(): void {
    // Optimize touch targets for accessibility
    this.optimizeTouchTargets();
    
    // Enable hardware acceleration for smooth animations
    this.enableHardwareAcceleration();
    
    // Optimize scrolling performance
    this.optimizeScrolling();
    
    // Implement iOS momentum scrolling fix
    this.implementMomentumScrolling();
    
    // Add visual touch feedback
    this.addTouchFeedback();
  }

  private handleTouchStart(event: TouchEvent): void {
    const touches = Array.from(event.touches);
    const timestamp = performance.now();

    // Store touch history for gesture recognition
    const _touchPoints: TouchPoint[] = touches.map((touch, index) => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      timestamp,
    }));

    this.touchHistory.push(_touchPoints);

    // Handle single touch
    if (touches.length === 1 && touches[0]) {
      const touch = touches[0];
      this.handleSingleTouchStart(touch, timestamp);
    }

    // Handle multi-touch gestures
    if (touches.length === 2) {
      this.handleMultiTouchStart(touches, timestamp);
    }

    // Limit touch history to prevent memory leaks
    if (this.touchHistory.length > 10) {
      this.touchHistory.shift();
    }
  }

  private handleSingleTouchStart(touch: Touch, timestamp: number): void {
    // Setup long press detection
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }

    this.longPressTimer = window.setTimeout(() => {
      this.triggerGesture({
        type: 'longPress',
        startTime: timestamp,
        duration: this.options.longPressDelay,
        points: [{
          id: touch.identifier,
          x: touch.clientX,
          y: touch.clientY,
          timestamp,
        }],
      });

      // Provide haptic feedback for long press
      if (this.options.enableVibration) {
        this.vibrate([50]);
      }
    }, this.options.longPressDelay);
  }

  private handleMultiTouchStart(touches: Touch[], timestamp: number): void {
    if (touches.length === 2 && touches[0] && touches[1]) {
      // Initialize pinch/zoom gesture
      const __distance = this.calculateDistance(touches[0], touches[1]);
      const __angle = this.calculateAngle(touches[0], touches[1]);
      
      const gesture: TouchGesture = {
        type: 'pinch',
        startTime: timestamp,
        duration: 0,
        scale: 1,
        rotation: 0,
        points: touches.map((touch) => ({
          id: touch.identifier,
          x: touch.clientX,
          y: touch.clientY,
          timestamp,
        })),
      };

      this.activeGestures.set('pinch', gesture);
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    const touches = Array.from(event.touches);
    const timestamp = performance.now();

    // Cancel long press if touch moves too much
    if (this.longPressTimer && touches.length === 1 && touches[0]) {
      const initialTouch = this.touchHistory[0]?.[0];
      if (initialTouch) {
        const distance = this.calculateDistance(
          { clientX: initialTouch.x, clientY: initialTouch.y } as Touch,
          touches[0]
        );
        
        if (distance > 10) {
          clearTimeout(this.longPressTimer);
          this.longPressTimer = null;
        }
      }
    }

    // Handle single touch move (potential swipe)
    if (touches.length === 1 && touches[0]) {
      this.handleSwipeGesture(touches[0], timestamp);
    }

    // Handle multi-touch move (pinch/zoom/rotate)
    if (touches.length === 2) {
      this.handleMultiTouchMove(touches, timestamp);
    }

    // Prevent default behavior for custom gestures
    if (touches.length > 1) {
      event.preventDefault();
    }
  }

  private handleSwipeGesture(touch: Touch, timestamp: number): void {
    if (!this.options.enableSwipeGestures) return;

    const initialTouch = this.touchHistory[0]?.[0];
    if (!initialTouch) return;

    const deltaX = touch.clientX - initialTouch.x;
    const deltaY = touch.clientY - initialTouch.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = timestamp - initialTouch.timestamp;

    // Only trigger swipe if distance exceeds threshold
    if (distance > this.options.swipeThreshold && duration < 1000) {
      const velocity = distance / duration;
      let direction: 'up' | 'down' | 'left' | 'right';

      if (Math.abs(_deltaX) > Math.abs(_deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      // Use RAF for smooth gesture handling
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
      }

      this.rafId = requestAnimationFrame(() => {
        this.triggerGesture({
          type: 'swipe',
          startTime: initialTouch.timestamp,
          duration,
          distance,
          direction,
          velocity,
          points: [initialTouch, {
            id: touch.identifier,
            x: touch.clientX,
            y: touch.clientY,
            timestamp,
          }],
        });
      });
    }
  }

  private handleMultiTouchMove(touches: Touch[], timestamp: number): void {
    if (!this.options.enablePinchZoom && !this.options.enableRotation) return;

    const pinchGesture = this.activeGestures.get('pinch');
    if (!pinchGesture || touches.length !== 2 || !touches[0] || !touches[1]) return;

    const currentDistance = this.calculateDistance(touches[0], touches[1]);
    const currentAngle = this.calculateAngle(touches[0], touches[1]);
    
    const point0 = pinchGesture.points[0];
    const point1 = pinchGesture.points[1];
    if (!point0 || !point1) return;
    
    const initialDistance = this.calculateDistance(
      { clientX: point0.x, clientY: point0.y } as Touch,
      { clientX: point1.x, clientY: point1.y } as Touch
    );
    
    const initialAngle = this.calculateAngle(
      { clientX: point0.x, clientY: point0.y } as Touch,
      { clientX: point1.x, clientY: point1.y } as Touch
    );

    const scale = currentDistance / initialDistance;
    const rotation = currentAngle - initialAngle;

    // Update gesture data
    pinchGesture.scale = scale;
    pinchGesture.rotation = rotation;
    pinchGesture.duration = timestamp - pinchGesture.startTime;

    // Trigger pinch gesture if scale threshold is exceeded
    if (this.options.enablePinchZoom && Math.abs(scale - 1) > (this.options.pinchThreshold - 1)) {
      this.triggerGesture({ ...pinchGesture });
    }

    // Trigger rotation gesture if rotation threshold is exceeded
    if (this.options.enableRotation && Math.abs(_rotation) > this.options.rotationThreshold) {
      this.triggerGesture({ ...pinchGesture, type: 'rotate' });
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    const touches = Array.from(event.touches);
    const timestamp = performance.now();

    // Clear long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    // Handle tap gestures
    if (touches.length === 0 && event.changedTouches.length === 1 && event.changedTouches[0]) {
      this.handleTapGesture(event.changedTouches[0], timestamp);
    }

    // Clean up multi-touch gestures
    if (touches.length < 2) {
      this.activeGestures.delete('pinch');
    }
  }

  private handleTapGesture(touch: Touch, timestamp: number): void {
    const initialTouch = this.touchHistory[0]?.[0];
    if (!initialTouch) return;

    const distance = this.calculateDistance(
      { clientX: initialTouch.x, clientY: initialTouch.y } as Touch,
      touch
    );
    
    const duration = timestamp - initialTouch.timestamp;

    // Only register as tap if movement is minimal and duration is short
    if (distance < 10 && duration < 1000) {
      // Check for double tap
      if (this.lastTap && 
          timestamp - this.lastTap.timestamp < this.options.doubleTapDelay &&
          this.calculateDistance(
            { clientX: this.lastTap.x, clientY: this.lastTap.y } as Touch,
            touch
          ) < 50) {
        
        this.triggerGesture({
          type: 'doubleTap',
          startTime: this.lastTap.timestamp,
          duration: timestamp - this.lastTap.timestamp,
          points: [
            { id: 0, x: this.lastTap.x, y: this.lastTap.y, timestamp: this.lastTap.timestamp },
            { id: touch.identifier, x: touch.clientX, y: touch.clientY, timestamp },
          ],
        });

        this.lastTap = null;
      } else {
        // Single tap
        this.triggerGesture({
          type: 'tap',
          startTime: initialTouch.timestamp,
          duration,
          points: [initialTouch, {
            id: touch.identifier,
            x: touch.clientX,
            y: touch.clientY,
            timestamp,
          }],
        });

        this.lastTap = {
          x: touch.clientX,
          y: touch.clientY,
          timestamp,
        };
      }

      // Provide haptic feedback for taps
      if (this.options.enableVibration) {
        this.vibrate([25]);
      }
    }
  }

  private handleTouchCancel(): void {
    // Clean up all active gestures
    this.activeGestures.clear();
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private calculateDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateAngle(touch1: Touch, touch2: Touch): number {
    return Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX) * 180 / Math.PI;
  }

  private triggerGesture(gesture: TouchGesture): void {
    const listeners = this.gestureListeners.get(gesture.type);
    if (listeners) {
      listeners.forEach(_callback => {
        try {
          _callback(_gesture);
        } catch (error) {
          logger.error(`Error in gesture listener for ${gesture.type}:`, error);
        }
      });
    }

    // Also trigger generic gesture listener
    const genericListeners = this.gestureListeners.get('*');
    if (genericListeners) {
      genericListeners.forEach(_callback => {
        try {
          _callback(_gesture);
        } catch (error) {
          logger.error('Error in generic gesture listener:');
        }
      });
    }
  }

  private preventDefault(event: Event): void {
    event.preventDefault();
  }

  private vibrate(_pattern: number | number[]): void {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(_pattern);
      } catch (error) {
    logger.warn('Vibration not supported or failed:');
      }
    }
  }

  private optimizeTouchTargets(): void {
    // Ensure minimum touch target size for accessibility
    const minTouchTarget = 44; // 44px minimum as per WCAG guidelines
    
    const clickableElements = this.element.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [tabindex]'
    );

    clickableElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width < minTouchTarget || rect.height < minTouchTarget) {
        (element as HTMLElement).style.minWidth = `${minTouchTarget}px`;
        (element as HTMLElement).style.minHeight = `${minTouchTarget}px`;
      }
    });
  }

  private enableHardwareAcceleration(): void {
    // Enable hardware acceleration for smooth animations
    this.element.style.transform = 'translateZ(0)';
    this.element.style.backfaceVisibility = 'hidden';
    this.element.style.perspective = '1000px';
  }

  private optimizeScrolling(): void {
    // Enable smooth scrolling and optimize scroll performance
    this.element.style.scrollBehavior = 'smooth';
    (this.element.style as unknown).webkitOverflowScrolling = 'touch';
    
    // Optimize scroll handling
    this.element.addEventListener('scroll', this.throttleScroll(this.handleScroll.bind(this), 16), { passive: true });
  }

  private implementMomentumScrolling(): void {
    // Fix iOS momentum scrolling issues
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      (this.element.style as unknown).webkitOverflowScrolling = 'touch';
      (this.element.style as unknown).overflowScrolling = 'touch';
    }
  }

  private addTouchFeedback(): void {
    // Add visual feedback for touch interactions
    const style = document.createElement('style');
    style.textContent = `
      .touch-feedback {
        position: relative;
        overflow: hidden;
      }
      
      .touch-feedback::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
        transform: scale(0);
        transition: transform 0.3s ease-out;
        pointer-events: none;
      }
      
      .touch-feedback.active::before {
        transform: scale(1);
      }
      
      .touch-feedback:active {
        transform: scale(0.98);
        transition: transform 0.1s ease-out;
      }
    `;
    document.head.appendChild(style);

    // Apply touch feedback to interactive elements
    const interactiveElements = this.element.querySelectorAll(
      'button, a, [role="button"], .touch-target'
    );

    interactiveElements.forEach((element) => {
      element.classList.add('touch-feedback');
    });
  }

  private throttleScroll<T extends (...args: unknown[]) => any>(func: T, delay: number): T {
    let timeoutId: number | null = null;
    let lastExecTime = 0;
    
    return ((...args: Parameters<T>) => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func(...args);
        lastExecTime = currentTime;
      } else {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        timeoutId = window.setTimeout(() => {
          func(...args);
          lastExecTime = Date.now();
        }, delay);
      }
    }) as T;
  }

  private handleScroll(): void {
    // Optimize scroll performance by reducing expensive operations during scroll
    document.documentElement.classList.add('is-scrolling');
    
    // Remove class after scrolling stops
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = window.setTimeout(() => {
      document.documentElement.classList.remove('is-scrolling');
    }, 150);
  }

  private scrollTimeout: number = 0;

  // Public API methods
  public on(_gestureType: string, _callback: (gesture: TouchGesture) => void): void {
    if (!this.gestureListeners.has(_gestureType)) {
      this.gestureListeners.set(_gestureType, new Set());
    }
    this.gestureListeners.get(_gestureType)!.add(_callback);
  }

  public off(_gestureType: string, _callback: (gesture: TouchGesture) => void): void {
    const listeners = this.gestureListeners.get(_gestureType);
    if (listeners) {
      listeners.delete(_callback);
    }
  }

  public destroy(): void {
    // Clean up event listeners
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);
    
    // Clear timers
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    
    // Clear data structures
    this.activeGestures.clear();
    this.gestureListeners.clear();
    this.touchHistory = [];
    this.lastTap = null;
  }
}

// Export factory function for easy initialization
export function initializeTouchOptimization(
  element: HTMLElement, 
  options?: TouchOptimizationOptions
): TouchOptimizationManager {
  return new TouchOptimizationManager(element, options);
}

// Export types
export type { TouchGesture, TouchOptimizationOptions, TouchPoint };
export { TouchOptimizationManager };

// Additional mobile optimization utilities
export const __MobileOptimizationUtils = {
  // Prevent zoom on double-tap
  preventDoubleTapZoom(element: HTMLElement): void {
    element.addEventListener('touchend', (event) => {
      const touch = event.changedTouches[0];
      if (!touch?.target) return;
      const element = touch.target as HTMLElement;
      
      // Prevent zoom on form inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)) {
        event.preventDefault();
      }
    });
  },

  // Optimize input focus for iOS
  optimizeIOSInputFocus(): void {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      const inputs = document.querySelectorAll('input, textarea');
      
      inputs.forEach((input) => {
        input.addEventListener('focus', () => {
          // Prevent viewport zoom on input focus
          const viewport = document.querySelector('meta[name="viewport"]');
          if (viewport) {
            const currentContent = viewport.getAttribute('content') || '';
            viewport.setAttribute('content', `${currentContent  }, user-scalable=no`);
            
            // Restore after blur
            input.addEventListener('blur', () => {
              viewport.setAttribute('content', currentContent);
            }, { once: true });
          }
        });
      });
    }
  },

  // Add safe area padding for notched devices
  addSafeAreaSupport(): void {
    const style = document.createElement('style');
    style.textContent = `
      .safe-area-top {
        padding-top: env(safe-area-inset-top);
      }
      
      .safe-area-bottom {
        padding-bottom: env(safe-area-inset-bottom);
      }
      
      .safe-area-left {
        padding-left: env(safe-area-inset-left);
      }
      
      .safe-area-right {
        padding-right: env(safe-area-inset-right);
      }
      
      .safe-area-all {
        padding: 
          env(safe-area-inset-top) 
          env(safe-area-inset-right) 
          env(safe-area-inset-bottom) 
          env(safe-area-inset-left);
      }
    `;
    document.head.appendChild(style);
  },

  // Enable performance optimizations for mobile
  enableMobilePerformanceMode(): void {
    // Reduce motion for better performance
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('reduce-motion');
    }

    // Add CSS for performance optimizations
    const style = document.createElement('style');
    style.textContent = `
      .reduce-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
      
      .performance-mode .not-critical {
        display: none;
      }
      
      .performance-mode img:not(.critical) {
        visibility: hidden;
      }
    `;
    document.head.appendChild(style);
  }
};