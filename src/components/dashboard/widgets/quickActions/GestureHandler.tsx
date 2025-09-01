import React, { useEffect, useRef, useCallback } from 'react';

interface GestureHandlerProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onPinch?: (scale: number) => void;
  onRotate?: (angle: number) => void;
  threshold?: number;
  longPressDelay?: number;
  children?: React.ReactNode;
}

export function GestureHandler({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onDoubleTap,
  onLongPress,
  onPinch,
  onRotate,
  threshold = 50,
  longPressDelay = 500,
  children
}: GestureHandlerProps) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pinchStartRef = useRef<number | null>(null);
  const rotateStartRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    // Handle multi-touch gestures
    if (e.touches.length === 2 && e.touches[0] && e.touches[1]) {
      // Calculate initial pinch distance
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartRef.current = Math.sqrt(dx * dx + dy * dy);

      // Calculate initial rotation angle
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      rotateStartRef.current = angle;
    }

    // Start long press timer
    if (onLongPress && e.touches.length === 1) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress();
        // Haptic feedback for mobile devices
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }, longPressDelay);
    }
  }, [onLongPress, longPressDelay]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Cancel long press if user moves
    if (longPressTimerRef.current) {
      const touch = e.touches[0];
      const startPos = touchStartRef.current;
      
      if (startPos && touch) {
        const dx = Math.abs(touch.clientX - startPos.x);
        const dy = Math.abs(touch.clientY - startPos.y);
        
        if (dx > 10 || dy > 10) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
    }

    // Handle pinch gesture
    if (e.touches.length === 2 && e.touches[0] && e.touches[1] && pinchStartRef.current !== null && onPinch) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const scale = distance / pinchStartRef.current;
      onPinch(scale);
    }

    // Handle rotate gesture
    if (e.touches.length === 2 && e.touches[0] && e.touches[1] && rotateStartRef.current !== null && onRotate) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const rotation = angle - rotateStartRef.current;
      onRotate(rotation);
    }
  }, [onPinch, onRotate]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Reset multi-touch gesture tracking
    if (e.touches.length === 0) {
      pinchStartRef.current = null;
      rotateStartRef.current = null;
    }

    const touch = e.changedTouches[0];
    if (!touch) return;
    
    const endTime = Date.now();
    
    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: endTime
    };

    const startPos = touchStartRef.current;
    if (!startPos) return;

    const deltaX = touch.clientX - startPos.x;
    const deltaY = touch.clientY - startPos.y;
    const deltaTime = endTime - startPos.time;

    // Detect swipe gestures
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const velocity = Math.sqrt(absX * absX + absY * absY) / deltaTime;

    // Only trigger swipe if movement exceeds threshold and velocity is sufficient
    if (velocity > 0.3) {
      if (absX > threshold && absX > absY) {
        // Horizontal swipe
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      } else if (absY > threshold && absY > absX) {
        // Vertical swipe
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }

    // Detect double tap
    if (onDoubleTap && absX < 10 && absY < 10 && deltaTime < 300) {
      const timeSinceLastTap = endTime - lastTapRef.current;
      
      if (timeSinceLastTap < 300) {
        onDoubleTap();
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([30, 30]);
        }
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = endTime;
      }
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onDoubleTap, threshold]);

  // Handle touch cancel
  const handleTouchCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartRef.current = null;
    touchEndRef.current = null;
    pinchStartRef.current = null;
    rotateStartRef.current = null;
  }, []);

  // Add touch event listeners
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Passive event listeners for better performance
    const options = { passive: true };
    
    element.addEventListener('touchstart', handleTouchStart, options);
    element.addEventListener('touchmove', handleTouchMove, options);
    element.addEventListener('touchend', handleTouchEnd, options);
    element.addEventListener('touchcancel', handleTouchCancel, options);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);

  return (
    <div 
      ref={containerRef}
      className="touch-manipulation"
      style={{ touchAction: 'manipulation' }}
    >
      {children}
    </div>
  );
}