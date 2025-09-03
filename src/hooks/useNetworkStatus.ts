import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
  saveData: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, _setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    effectiveType: null,
    downlink: null,
    rtt: null,
    saveData: false,
  });

  useEffect(() => {
    // Update network status
    const updateNetworkStatus = () => {
      const connection = (navigator as unknown).connection || 
                        (navigator as unknown).mozConnection || 
                        (navigator as unknown).webkitConnection;

      setStatus({
        isOnline: navigator.onLine,
        effectiveType: connection?.effectiveType || null,
        downlink: connection?.downlink || null,
        rtt: connection?.rtt || null,
        saveData: connection?.saveData || false,
      });
    };

    // Initial update
    updateNetworkStatus();

    // Event listeners for network changes
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      // Trigger sync of offline data
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_OFFLINE_DATA'
        });
      }
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
      // Show notification about offline mode
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Offline Mode', {
          body: 'You are now offline. Emergency features are still available.',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: 'offline-mode',
          requireInteraction: false,
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes if available
    const connection = (navigator as unknown).connection || 
                      (navigator as unknown).mozConnection || 
                      (navigator as unknown).webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return status;
}