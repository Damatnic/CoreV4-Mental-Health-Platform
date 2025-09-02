import { useCallback } from 'react';
import { secureStorage } from '../services/security/SecureLocalStorage';
import { consoleHapticFeedback, ActionType } from '../utils/mobile/consoleHapticFeedback';

// Enhanced vibration hook with console haptic integration
export function useVibration() {
  const vibrate = useCallback((pattern: number | number[]) => {
    // Check if Vibration API is supported
    if ('vibrate' in navigator) {
      // Respect user preferences for haptic feedback
      const hapticEnabled = secureStorage.getItem('hapticFeedback') !== 'false';
      
      if (hapticEnabled) {
        try {
          navigator.vibrate(pattern);
        } catch (error) {
          console.error('Vibration failed:', error);
        }
      }
    }
  }, []);

  // Console-enhanced vibration with haptic feedback integration
  const consoleVibrate = useCallback((action: ActionType, customPattern?: number | number[]) => {
    const hapticEnabled = secureStorage.getItem('hapticFeedback') !== 'false';
    
    if (hapticEnabled && consoleHapticFeedback.isHapticSupported()) {
      if (customPattern) {
        consoleHapticFeedback.triggerHaptic(action, customPattern);
      } else {
        consoleHapticFeedback.triggerHaptic(action);
      }
    } else {
      // Fallback to basic vibration
      vibrate(customPattern || [30]);
    }
  }, [vibrate]);

  return {
    vibrate, // Basic vibration function (legacy compatibility)
    consoleVibrate, // Enhanced console haptic feedback
    // Convenience methods
    tap: () => consoleVibrate('tap'),
    swipe: () => consoleVibrate('swipe'),
    longPress: () => consoleVibrate('longPress'),
    success: () => consoleVibrate('success'),
    error: () => consoleVibrate('error'),
    warning: () => consoleVibrate('warning'),
    navigation: () => consoleVibrate('navigation'),
    selection: () => consoleVibrate('selection'),
    activation: () => consoleVibrate('activation'),
  };
}

// For backward compatibility, also export the basic vibrate function
export function useBasicVibration() {
  const { vibrate } = useVibration();
  return vibrate;
}