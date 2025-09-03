import { useState, useEffect } from 'react';
import { secureStorage } from '../services/security/SecureLocalStorage';

interface BatteryStatus {
  level: number | null;
  charging: boolean;
  chargingTime: number | null;
  dischargingTime: number | null;
}

export function useBatteryStatus(): BatteryStatus {
  const [_batteryStatus, _setBatteryStatus] = useState<BatteryStatus>({
    level: null,
    charging: false,
    chargingTime: null,
    dischargingTime: null,
  });

  useEffect(() => {
    let battery: unknown = null;

    const updateBatteryStatus = (batteryManager: unknown) => {
      setBatteryStatus({
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
          battery = await (navigator as unknown).getBattery();
          
          // Initial update
          updateBatteryStatus(battery);

          // Set up event listeners
          battery.addEventListener('levelchange', () => updateBatteryStatus(battery));
          battery.addEventListener('chargingchange', () => updateBatteryStatus(battery));
          battery.addEventListener('chargingtimechange', () => updateBatteryStatus(battery));
          battery.addEventListener('dischargingtimechange', () => updateBatteryStatus(battery));
        }
      } catch {
        console.error('Battery API not available:');
      }
    };

    initBattery();

    // Cleanup
    return () => {
      if (battery) {
        battery.removeEventListener('levelchange', () => updateBatteryStatus(battery));
        battery.removeEventListener('chargingchange', () => updateBatteryStatus(battery));
        battery.removeEventListener('chargingtimechange', () => updateBatteryStatus(battery));
        battery.removeEventListener('dischargingtimechange', () => updateBatteryStatus(battery));
      }
    };
  }, []);

  return batteryStatus;
}