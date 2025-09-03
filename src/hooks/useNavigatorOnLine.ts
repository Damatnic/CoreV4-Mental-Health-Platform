import { useState, useEffect } from 'react';

/**
 * Hook to track online/offline status
 * Provides real-time network connectivity status
 */
export function useNavigatorOnLine() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== 'undefined' && 'navigator' in window) {
      return navigator.onLine;
    }
    return true; // Default to online in SSR
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      // Trigger data sync when coming back online
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          if (registration.sync) {
            registration.sync.register('sync-data');
          }
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook to detect slow network connections
 */
export function useNetworkQuality() {
  const [__quality, setQuality] = useState<'fast' | 'slow' | 'offline'>('fast');
  const isOnline = useNavigatorOnLine();

  useEffect(() => {
    if (!isOnline) {
      setQuality('offline');
      return;
    }

    if ('connection' in navigator) {
      const connection = (navigator as unknown).connection;
      
      const updateConnectionQuality = () => {
        if (!connection) return;
        
        // Check effective type (slow-2g, 2g, 3g, 4g)
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          setQuality('slow');
        } else {
          setQuality('fast');
        }
        
        // Also check downlink speed if available
        if (connection.downlink && connection.downlink < 1) {
          setQuality('slow');
        }
      };

      updateConnectionQuality();
      connection.addEventListener('change', updateConnectionQuality);
      
      return () => {
        connection.removeEventListener('change', updateConnectionQuality);
      };
    }
  }, [isOnline]);

  return quality;
}