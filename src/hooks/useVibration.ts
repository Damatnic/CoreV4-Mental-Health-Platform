import { useCallback } from 'react';
import { secureStorage } from '../services/security/SecureLocalStorage';

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

  return vibrate;
}