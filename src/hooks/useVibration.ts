import { useCallback } from 'react';
import { secureStorage } from '../services/security/SecureLocalStorage';
import { consoleHapticFeedback, ActionType } from '../utils/mobile/consoleHapticFeedback';

// Enhanced vibration hook with console haptic integration
export function useVibration() {
  const vibrate = useCallback((_pattern: number | number[]) => {
    // Check if Vibration API is supported
    if ('vibrate' in navigator) {
      // Respect user preferences for haptic feedback
      const _hapticEnabled = secureStorage.getItem('hapticFeedback') !== 'false';
      
      if (_hapticEnabled) {
        try {
          navigator.vibrate(_pattern);
        } catch (error) {
          console.error('Vibration failed:');
        }
      }
    }
  }, []);

  // Console-enhanced vibration with haptic feedback integration
  const consoleVibrate = useCallback((action: ActionType, customPattern?: number | number[]) => {
    const _hapticEnabled = secureStorage.getItem('hapticFeedback') !== 'false';
    
    if (_hapticEnabled && consoleHapticFeedback.isHapticSupported()) {
      if (customPattern) {
        consoleHapticFeedback.triggerHaptic(action, customPattern);
      } else {
        consoleHapticFeedback.triggerHaptic(_action);
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