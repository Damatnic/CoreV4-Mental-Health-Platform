import React, { useRef, useCallback } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { useTouchGestures, useMobileFeatures } from '../../hooks/useMobileFeatures';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

interface MobileGesturesProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  enableNavigation?: boolean;
}

export function MobileGestures({ 
  children, 
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  enableNavigation = true 
}: MobileGesturesProps) {
  const navigate = useNavigate();
  const { canVibrate } = useMobileFeatures();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Motion values for gesture feedback
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useTransform(x, [-100, 0, 100], [0.95, 1, 0.95]);
  const opacity = useTransform(x, [-100, 0, 100], [0.8, 1, 0.8]);
  
  // Navigation history for swipe gestures
  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
      if (canVibrate) navigator.vibrate(50);
    }
  }, [navigate, canVibrate]);

  const goForward = useCallback(() => {
    navigate(1);
    if (canVibrate) navigator.vibrate(50);
  }, [navigate, canVibrate]);

  // Touch gesture handlers
  useTouchGestures(containerRef, {
    onSwipe: (direction, distance) => {
      if (canVibrate) navigator.vibrate(30);
      
      switch (direction) {
        case 'left':
          if (distance > 100) {
            onSwipeLeft?.() || (enableNavigation && goForward());
          }
          break;
        case 'right':
          if (distance > 100) {
            onSwipeRight?.() || (enableNavigation && goBack());
          }
          break;
        case 'up':
          if (distance > 80) {
            onSwipeUp?.();
          }
          break;
        case 'down':
          if (distance > 80) {
            onSwipeDown?.();
          }
          break;
      }
    },
    onLongPress: (x, y) => {
      if (canVibrate) navigator.vibrate([50, 50, 100]);
      // Could trigger context menu or action sheet
    }
  });

  const handlePan = (event: any, info: PanInfo) => {
    x.set(info.offset.x);
    y.set(info.offset.y);
  };

  const handlePanEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 100;
    const { offset, velocity } = info;
    
    if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > 500) {
      if (offset.x > 0) {
        onSwipeRight?.() || (enableNavigation && goBack());
      } else {
        onSwipeLeft?.() || (enableNavigation && goForward());
      }
    }
    
    if (Math.abs(offset.y) > swipeThreshold || Math.abs(velocity.y) > 500) {
      if (offset.y > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }
    
    // Reset motion values
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={containerRef}
      className="relative min-h-screen overflow-hidden"
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.2}
      onPan={handlePan}
      onPanEnd={handlePanEnd}
      style={{ 
        x, 
        y, 
        scale,
        opacity,
        touchAction: 'pan-y' // Allow vertical scrolling
      }}
      whileDrag={{ cursor: 'grabbing' }}
    >
      {/* Gesture indicators */}
      <motion.div
        className="fixed top-1/2 left-4 z-50 pointer-events-none"
        initial={{ opacity: 0, x: -20 }}
        animate={{ 
          opacity: useTransform(x, [50, 100], [0, 1]),
          x: useTransform(x, [50, 100], [-20, 0])
        }}
      >
        <div className="bg-black/50 backdrop-blur-md rounded-full p-3">
          <ArrowLeft className="w-6 h-6 text-white" />
        </div>
      </motion.div>

      <motion.div
        className="fixed top-1/2 right-4 z-50 pointer-events-none"
        initial={{ opacity: 0, x: 20 }}
        animate={{ 
          opacity: useTransform(x, [-100, -50], [1, 0]),
          x: useTransform(x, [-100, -50], [0, 20])
        }}
      >
        <div className="bg-black/50 backdrop-blur-md rounded-full p-3">
          <ArrowRight className="w-6 h-6 text-white" />
        </div>
      </motion.div>

      {/* Pull to refresh indicator */}
      <motion.div
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: useTransform(y, [60, 100], [0, 1]),
          y: useTransform(y, [60, 100], [-20, 0])
        }}
      >
        <div className="bg-black/50 backdrop-blur-md rounded-full p-3">
          <RotateCcw className="w-6 h-6 text-white" />
        </div>
      </motion.div>

      {children}
    </motion.div>
  );
}

export default MobileGestures;