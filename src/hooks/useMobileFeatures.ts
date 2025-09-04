/**
 * Comprehensive mobile features hook for enhanced mobile experience
 * Provides device detection, touch gestures, and mobile-specific utilities
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../utils/logger';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isPWA: boolean;
  hasTouch: boolean;
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  orientation: 'portrait' | 'landscape';
  devicePixelRatio: number;
}

interface TouchGesture {
  type: 'swipe' | 'pinch' | 'tap' | 'longPress' | 'doubleTap';
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  scale?: number;
  duration?: number;
}

export function useMobileFeatures() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => getDeviceInfo());
  const [isAppInstallable, setIsAppInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Update device info on resize and orientation change
  useEffect(() => {
    const updateDeviceInfo = () => {
      setDeviceInfo(getDeviceInfo());
    };

    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  // Handle PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsAppInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Install PWA
  const installApp = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      (deferredPrompt as any).prompt();
      const { outcome } = await (deferredPrompt as any).userChoice;
      
      if (outcome === 'accepted') {
        setIsAppInstallable(false);
        setDeferredPrompt(null);
        
        // Track installation
        if ('gtag' in window) {
          (window as any).gtag('event', 'pwainstall', {
            event_category: 'engagement',
            event_label: 'success'
          });
        }
        
        return true;
      }
    } catch (error) {
      logger.error('PWA installation failed:');
    }
    
    return false;
  }, [deferredPrompt]);

  // Request persistent storage for offline data
  const requestPersistentStorage = useCallback(async () => {
    if ('storage' in navigator && navigator.storage && 'persist' in navigator.storage) {
      try {
        const granted = await navigator.storage.persist();
        return granted;
      } catch (error) {
        logger.error('Persistent storage request failed:');
        return false;
      }
    }
    return false;
  }, []);

  // Share functionality
  const share = useCallback(async (data: ShareData) => {
    if ('share' in navigator && navigator.share && deviceInfo.isMobile) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          logger.error('Share failed:', String(error));
        }
        return false;
      }
    }
    
    // Fallback to clipboard
    if (data.url) {
      try {
        await navigator.clipboard.writeText(data.url);
        return true;
      } catch (error) {
        logger.error('Clipboard write failed:');
        return false;
      }
    }
    
    return false;
  }, [deviceInfo.isMobile]);

  // Wake lock for keeping screen on during crisis situations
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        const wakeLock = await (navigator as any).wakeLock.request('screen');
        return wakeLock;
      } catch (error) {
        logger.error('Wake lock request failed:');
        return null;
      }
    }
    return null;
  }, []);

  return {
    deviceInfo,
    isAppInstallable,
    installApp,
    requestPersistentStorage,
    share,
    requestWakeLock,
    // Utility functions
    isMobileDevice: deviceInfo.isMobile || deviceInfo.isTablet,
    isSmallScreen: deviceInfo.screenSize === 'xs' || deviceInfo.screenSize === 'sm',
    canVibrate: 'vibrate' in navigator,
    canShare: 'share' in navigator,
    canInstall: isAppInstallable,
    supportsTouch: deviceInfo.hasTouch,
    supportsPWA: deviceInfo.isPWA
  };
}

// Touch gesture detection hook
export function useTouchGestures(
  element: React.RefObject<HTMLElement>,
  handlers: {
    onSwipe?: (direction: 'up' | 'down' | 'left' | 'right', distance: number) => void;
    onPinch?: (scale: number) => void;
    onTap?: (x: number, y: number) => void;
    onDoubleTap?: (x: number, y: number) => void;
    onLongPress?: (x: number, y: number) => void;
  }
) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPinchingRef = useRef(false);
  const initialPinchDistanceRef = useRef(0);

  useEffect(() => {
    const el = element.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        if (!touch) return;
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now()
        };

        // Long press detection
        if (handlers.onLongPress) {
          longPressTimerRef.current = setTimeout(() => {
            if (touchStartRef.current) {
              handlers.onLongPress!(touch?.clientX || 0, touch?.clientY || 0);
              touchStartRef.current = null; // Prevent swipe after long press
            }
          }, 500);
        }
      } else if (e.touches.length === 2 && handlers.onPinch && e.touches[0] && e.touches[1]) {
        // Pinch gesture
        isPinchingRef.current = true;
        const distance = getDistance(e.touches[0], e.touches[1]);
        initialPinchDistanceRef.current = distance;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Clear long press timer on move
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      // Handle pinch
      if (isPinchingRef.current && e.touches.length === 2 && handlers.onPinch && e.touches[0] && e.touches[1]) {
        const distance = getDistance(e.touches[0], e.touches[1]);
        const scale = distance / initialPinchDistanceRef.current;
        handlers.onPinch(scale);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (isPinchingRef.current) {
        isPinchingRef.current = false;
        return;
      }

      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      if (!touch) return;
      const endTime = Date.now();
      const duration = endTime - touchStartRef.current.time;
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Tap detection (short duration, small movement)
      if (duration < 200 && distance < 10) {
        // Double tap detection
        if (handlers.onDoubleTap && endTime - lastTapRef.current < 300) {
          handlers.onDoubleTap(touch?.clientX || 0, touch?.clientY || 0);
          lastTapRef.current = 0;
        } else if (handlers.onTap) {
          handlers.onTap(touch?.clientX || 0, touch?.clientY || 0);
          lastTapRef.current = endTime;
        }
      }
      // Swipe detection
      else if (handlers.onSwipe && distance > 50 && duration < 500) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX > absY) {
          handlers.onSwipe(deltaX > 0 ? 'right' : 'left', absX);
        } else {
          handlers.onSwipe(deltaY > 0 ? 'down' : 'up', absY);
        }
      }

      touchStartRef.current = null;
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [element, handlers]);
}

// Helper functions
function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;
  const height = window.innerHeight;

  return {
    isMobile: /iphone|ipod|android|blackberry|windows phone/.test(userAgent) || width < 768,
    isTablet: /ipad|android/.test(userAgent) && width >= 768 && width < 1024,
    isIOS: /iphone|ipad|ipod/.test(userAgent),
    isAndroid: /android/.test(userAgent),
    isPWA: window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true,
    hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    screenSize: getScreenSize(width),
    orientation: width > height ? 'landscape' : 'portrait',
    devicePixelRatio: window.devicePixelRatio || 1
  };
}

function getScreenSize(width: number): 'xs' | 'sm' | 'md' | 'lg' | 'xl' {
  if (width < 640) return 'xs';
  if (width < 768) return 'sm';
  if (width < 1024) return 'md';
  if (width < 1280) return 'lg';
  return 'xl';
}

function getDistance(touch1: Touch, touch2: Touch): number {
  const deltaX = touch2.clientX - touch1.clientX;
  const deltaY = touch2.clientY - touch1.clientY;
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

// Mobile-optimized scroll lock for modals
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    const scrollY = window.scrollY;

    // Lock scroll
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      // Restore scroll
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = originalStyle;
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}

// Pull-to-refresh hook
export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  options: {
    threshold?: number;
    disabled?: boolean;
  } = {}
) {
  const { threshold = 80, disabled = false } = options;
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(0);

  useEffect(() => {
    if (disabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        const touch = e.touches[0];
        if (!touch) return;
        startYRef.current = touch.clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startYRef.current === 0) return;

      const touch = e.touches[0];
      if (!touch) return;
      const currentY = touch.clientY;
      const distance = currentY - startYRef.current;

      if (distance > 0 && window.scrollY === 0) {
        e.preventDefault();
        setIsPulling(true);
        setPullDistance(Math.min(distance, threshold * 1.5));
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance > threshold) {
        try {
          await onRefresh();
        } catch (error) {
          logger.error('Pull to refresh failed:');
        }
      }

      setIsPulling(false);
      setPullDistance(0);
      startYRef.current = 0;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, onRefresh, pullDistance, threshold]);

  return {
    isPulling,
    pullDistance,
    pullProgress: Math.min(pullDistance / threshold, 1)
  };
}