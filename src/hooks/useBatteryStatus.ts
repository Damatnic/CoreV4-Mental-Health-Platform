import { useState, useEffect } from 'react';
import { secureStorage } from '../services/security/SecureLocalStorage';

// Battery Manager API interface
interface BatteryManager extends EventTarget {
  level: number;
  charging: boolean;
  chargingTime: number | null;
  dischargingTime: number | null;
}

interface BatteryStatus {
  level: number | null;
  charging: boolean;
  chargingTime: number | null;
  dischargingTime: number | null;
}

export function useBatteryStatus(): BatteryStatus {
  const [_batteryStatus, __setBatteryStatus] = useState<BatteryStatus>({
    level: null,
    charging: false,
    chargingTime: null,
    dischargingTime: null,
  });

  useEffect(() => {
    let battery: BatteryManager | null = null;
    const eventHandlers: Array<{ event: string; handler: EventListener }> = [];

    const updateBatteryStatus = (batteryManager: BatteryManager) => {
      __setBatteryStatus({
        level: batteryManager.level,
        charging: batteryManager.charging,
        chargingTime: batteryManager.chargingTime,
        dischargingTime: batteryManager.dischargingTime,
      });

      // Alert user if battery is critically low during crisis usage
      if (batteryManager.level < 0.1 && !batteryManager.charging) {
        // Store critical battery warning
        if ('localStorage' in window) {
          secureStorage.setItem('lowBatteryWarning', new Date().toISOString());
        }
        
        // Show notification if permissions granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Low Battery Warning', {
            body: 'Your battery is critically low. Consider charging your device to maintain access to crisis resources.',
            icon: '/icons/battery-low.png',
            badge: '/icons/badge-72x72.png',
            tag: 'battery-warning',
            requireInteraction: true,
          });
        }
      }
    };

    const initBattery = async () => {
      try {
        // Check if Battery API is available
        if ('getBattery' in navigator) {
          battery = await (navigator as any).getBattery() as BatteryManager;
          
          // Initial update
          updateBatteryStatus(battery);

          // Create bound event handlers
          const createHandler = () => {
            if (battery) {
              updateBatteryStatus(battery);
            }
          };

          // Set up event listeners with stored references
          const events = ['levelchange', 'chargingchange', 'chargingtimechange', 'dischargingtimechange'];
          events.forEach(eventName => {
            const handler = createHandler;
            battery?.addEventListener(eventName, handler);
            eventHandlers.push({ event: eventName, handler });
          });
        }
      } catch (error) {
        console.error('Battery API not available:');
      }
    };

    initBattery();

    // Cleanup
    return () => {
      if (battery) {
        eventHandlers.forEach(({ event, handler }) => {
          battery?.removeEventListener(event, handler);
        });
      }
    };
  }, []);

  return _batteryStatus;
}