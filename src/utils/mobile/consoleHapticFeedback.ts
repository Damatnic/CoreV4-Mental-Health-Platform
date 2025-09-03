/**
 * Console Haptic Feedback System
 * PlayStation/Xbox/Switch-inspired haptic feedback for mobile browsers
 */

type ConsoleType = 'playstation' | 'xbox' | 'switch';
type HapticIntensity = 'light' | 'medium' | 'heavy' | 'custom';
type ActionType = 'tap' | 'swipe' | 'longPress' | 'success' | 'error' | 'warning' | 'navigation' | 'selection' | 'activation' | 'gaming';

interface HapticPattern {
  pattern: number | number[];
  intensity: HapticIntensity;
  description: string;
}

interface HapticSettings {
  enabled: boolean;
  consoleType: ConsoleType;
  masterIntensity: number; // 0-1 scale
  respectSystemSettings: boolean;
  adaptToPerformance: boolean;
}

class ConsoleHapticFeedbackSystem {
  private settings: HapticSettings;
  private isSupported: boolean;
  private performanceMode: boolean = false;
  private lastHapticTime: number = 0;
  private hapticQueue: Array<{ pattern: number[], delay: number }> = [];
  private isProcessingQueue: boolean = false;

  // Console-specific haptic patterns
  private readonly hapticPatterns: Record<ConsoleType, Record<ActionType, HapticPattern>> = {
    playstation: {
      tap: { pattern: [25], intensity: 'light', description: 'Light DualSense tap' },
      swipe: { pattern: [40, 20, 40], intensity: 'medium', description: 'DualSense swipe gesture' },
      longPress: { pattern: [80, 40, 80, 40, 80], intensity: 'heavy', description: 'DualSense long press confirmation' },
      success: { pattern: [50, 30, 50], intensity: 'medium', description: 'Achievement unlocked feel' },
      error: { pattern: [100, 50, 100, 50], intensity: 'heavy', description: 'Error notification' },
      warning: { pattern: [60, 20, 60], intensity: 'medium', description: 'Caution alert' },
      navigation: { pattern: [30], intensity: 'light', description: 'Menu navigation' },
      selection: { pattern: [40, 20], intensity: 'medium', description: 'Option selection' },
      activation: { pattern: [70, 30, 70], intensity: 'heavy', description: 'Button activation' },
      gaming: { pattern: [25, 10, 25, 10, 60], intensity: 'custom', description: 'Gaming action feedback' }
    },
    xbox: {
      tap: { pattern: [30], intensity: 'light', description: 'Xbox controller tap' },
      swipe: { pattern: [50, 30], intensity: 'medium', description: 'Xbox controller swipe' },
      longPress: { pattern: [100, 50, 100], intensity: 'heavy', description: 'Xbox controller long press' },
      success: { pattern: [60, 40, 60], intensity: 'medium', description: 'Achievement notification' },
      error: { pattern: [120, 60], intensity: 'heavy', description: 'Error buzz' },
      warning: { pattern: [80, 40], intensity: 'medium', description: 'Warning notification' },
      navigation: { pattern: [35], intensity: 'light', description: 'Menu navigation' },
      selection: { pattern: [50], intensity: 'medium', description: 'Selection confirmation' },
      activation: { pattern: [90, 45], intensity: 'heavy', description: 'Action activation' },
      gaming: { pattern: [40, 20, 40, 20, 80], intensity: 'custom', description: 'Gaming feedback' }
    },
    switch: {
      tap: { pattern: [20], intensity: 'light', description: 'Joy-Con light tap' },
      swipe: { pattern: [35, 15, 35, 15, 35], intensity: 'medium', description: 'Joy-Con gesture' },
      longPress: { pattern: [60, 30, 60, 30, 60, 30], intensity: 'heavy', description: 'Joy-Con long press' },
      success: { pattern: [45, 25, 45], intensity: 'medium', description: 'Success chime feel' },
      error: { pattern: [80, 40, 80], intensity: 'heavy', description: 'Error notification' },
      warning: { pattern: [50, 25, 50], intensity: 'medium', description: 'Warning alert' },
      navigation: { pattern: [25], intensity: 'light', description: 'Menu navigation' },
      selection: { pattern: [35, 15], intensity: 'medium', description: 'Item selection' },
      activation: { pattern: [65, 35, 65], intensity: 'heavy', description: 'Button press' },
      gaming: { pattern: [30, 15, 30, 15, 50], intensity: 'custom', description: 'Gaming action' }
    }
  };

  constructor() {
    this.isSupported = 'vibrate' in navigator;
    this.settings = this.loadSettings();
    this.initializeSystem();
  }

  private loadSettings(): HapticSettings {
    try {
      const _stored = localStorage.getItem('consoleHapticSettings');
      if (_stored) {
        return { ...this.getDefaultSettings(), ...JSON.parse(_stored) };
      }
    } catch (_error) {
      logger.warn('Failed to load haptic settings:');
    }
    return this.getDefaultSettings();
  }

  private getDefaultSettings(): HapticSettings {
    return {
      enabled: true,
      consoleType: 'playstation',
      masterIntensity: 0.8,
      respectSystemSettings: true,
      adaptToPerformance: true,
    };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('consoleHapticSettings', JSON.stringify(this.settings));
    } catch (_error) {
      logger.warn('Failed to save haptic settings:');
    }
  }

  private initializeSystem(): void {
    // Check for system haptic preferences
    if (this.settings.respectSystemSettings) {
      // Check for reduced motion preference as a proxy for haptic sensitivity
      const _prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (_prefersReducedMotion) {
        this.settings.masterIntensity *= 0.5;
      }
    }

    // Listen for performance mode changes
    window.addEventListener('consolePerformanceModeEnabled', () => {
      this.performanceMode = true;
    });

    window.addEventListener('consolePerformanceModeDisabled', () => {
      this.performanceMode = false;
    });

    // Listen for battery status changes
    if ('getBattery' in navigator) {
      (navigator as unknown).getBattery().then((battery: unknown) => {
        const updateBatteryMode = () => {
          if (battery.level < 0.2) {
            this.settings.masterIntensity = Math.min(this.settings.masterIntensity, 0.3);
          }
        };
        
        updateBatteryMode();
        battery.addEventListener('levelchange', updateBatteryMode);
      });
    }
  }

  public setConsoleType(consoleType: ConsoleType): void {
    this.settings.consoleType = consoleType;
    this.saveSettings();
  }

  public setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled;
    this.saveSettings();
  }

  public setMasterIntensity(intensity: number): void {
    this.settings.masterIntensity = Math.max(0, Math.min(1, intensity));
    this.saveSettings();
  }

  private adjustPatternForIntensity(pattern: number | number[], intensity: number): number[] {
    const patternArray = Array.isArray(pattern) ? pattern : [pattern];
    return patternArray.map(duration => Math.round(duration * intensity));
  }

  private adjustPatternForPerformance(pattern: number[]): number[] {
    if (!this.performanceMode) return pattern;
    
    // Reduce pattern complexity for performance mode
    if (pattern.length > 3) {
      return pattern.slice(0, 3);
    }
    
    return pattern.map(duration => Math.min(duration, 50));
  }

  private canTriggerHaptic(): boolean {
    if (!this.isSupported || !this.settings.enabled) return false;
    
    const now = Date.now();
    const timeSinceLastHaptic = now - this.lastHapticTime;
    
    // Prevent haptic spam (minimum 50ms between haptics)
    return timeSinceLastHaptic >= 50;
  }

  public triggerHaptic(actionType: ActionType, customPattern?: number | number[]): void {
    if (!this.canTriggerHaptic()) return;

    let pattern: number | number[];
    
    if (_customPattern) {
      pattern = customPattern;
    } else {
      const _consolePatterns = this.hapticPatterns[this.settings.consoleType];
      pattern = _consolePatterns[actionType]?.pattern || _consolePatterns.tap.pattern;
    }

    const _adjustedPattern = this.adjustPatternForIntensity(pattern, this.settings.masterIntensity);
    const _optimizedPattern = this.adjustPatternForPerformance(_adjustedPattern);

    this.executeHaptic(_optimizedPattern);
    this.lastHapticTime = Date.now();
  }

  private executeHaptic(pattern: number[]): void {
    try {
      navigator.vibrate(pattern);
    } catch (_error) {
      logger.warn('Haptic feedback failed:');
    }
  }

  public queueHaptic(actionType: ActionType, delay: number = 0): void {
    if (!this.settings.enabled) return;

    const _consolePatterns = this.hapticPatterns[this.settings.consoleType];
    const pattern = _consolePatterns[actionType]?.pattern || _consolePatterns.tap.pattern;
    const _adjustedPattern = this.adjustPatternForIntensity(pattern, this.settings.masterIntensity);
    const _optimizedPattern = this.adjustPatternForPerformance(_adjustedPattern);

    this.hapticQueue.push({ pattern: _optimizedPattern, delay });
    
    if (!this.isProcessingQueue) {
      this.processHapticQueue();
    }
  }

  private async processHapticQueue(): Promise<void> {
    this.isProcessingQueue = true;

    while (this.hapticQueue.length > 0) {
      const haptic = this.hapticQueue.shift();
      if (!haptic) continue;

      if (haptic.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, haptic.delay));
      }

      if (this.canTriggerHaptic()) {
        this.executeHaptic(haptic.pattern);
        this.lastHapticTime = Date.now();
      }

      // Small delay between queued haptics
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessingQueue = false;
  }

  public triggerSequence(_sequence: Array<{ action: ActionType; delay?: number }>): void {
    _sequence.forEach(({ _action, delay = 0 }, index) => {
      setTimeout(() => {
        this.triggerHaptic(action);
      }, delay + (index * 150)); // 150ms base delay between sequence items
    });
  }

  // Gaming-specific haptic patterns
  public triggerGamingFeedback(type: 'hit' | 'reload' | 'powerup' | 'damage' | 'victory' | 'defeat'): void {
    const gamingPatterns: Record<string, number[]> = {
      hit: [30, 10, 30],
      reload: [40, 20, 40, 20],
      powerup: [25, 10, 25, 10, 25, 10, 60],
      damage: [80, 40],
      victory: [50, 30, 50, 30, 100],
      defeat: [100, 50, 100, 50, 100]
    };

    this.triggerHaptic('gaming', gamingPatterns[type]);
  }

  // Console-specific action feedback
  public triggerConsoleAction(action: 'menu' | 'back' | 'select' | 'activate' | 'navigate'): void {
    const actionMap: Record<string, ActionType> = {
      menu: 'navigation',
      back: 'navigation',
      select: 'selection',
      activate: 'activation',
      navigate: 'navigation'
    };

    this.triggerHaptic(actionMap[action] || 'tap');
  }

  // Crisis/emergency haptic feedback
  public triggerEmergencyFeedback(): void {
    const emergencyPattern = [100, 50, 100, 50, 100, 50];
    this.executeHaptic(this.adjustPatternForIntensity(emergencyPattern, 1.0));
  }

  // Accessibility feedback
  public triggerAccessibilityFeedback(type: 'focus' | 'error' | 'success' | 'navigation'): void {
    const accessibilityPatterns: Record<string, number[]> = {
      focus: [15],
      error: [80, 40, 80],
      success: [40, 20, 40],
      navigation: [20]
    };

    this.triggerHaptic('tap', accessibilityPatterns[type]);
  }

  public getAvailablePatterns(): Record<ActionType, string> {
    const _consolePatterns = this.hapticPatterns[this.settings.consoleType];
    const result: Record<ActionType, string> = {} as unknown;
    
    Object.entries(_consolePatterns).forEach(([action, _pattern]) => {
      result[action as ActionType] = pattern.description;
    });
    
    return result;
  }

  public testHaptic(_pattern?: number | number[]): void {
    if (pattern) {
      this.executeHaptic(Array.isArray(pattern) ? pattern : [pattern]);
    } else {
      this.triggerHaptic('tap');
    }
  }

  public getSettings(): HapticSettings {
    return { ...this.settings };
  }

  public isHapticSupported(): boolean {
    return this.isSupported;
  }

  public destroy(): void {
    // Clear any pending haptics
    navigator.vibrate(0);
    this.hapticQueue = [];
    this.isProcessingQueue = false;
  }
}

// Global instance
export const consoleHapticFeedback = new ConsoleHapticFeedbackSystem();

// React hook for using console haptic feedback
export function useConsoleHaptic() {
  const [settings, setSettingsState] = React.useState(consoleHapticFeedback.getSettings());

  const updateSettings = React.useCallback((newSettings: Partial<HapticSettings>) => {
    if (newSettings.enabled !== undefined) {
      consoleHapticFeedback.setEnabled(newSettings.enabled);
    }
    if (newSettings.consoleType) {
      consoleHapticFeedback.setConsoleType(newSettings.consoleType);
    }
    if (newSettings.masterIntensity !== undefined) {
      consoleHapticFeedback.setMasterIntensity(newSettings.masterIntensity);
    }
    
    setSettingsState(consoleHapticFeedback.getSettings());
  }, []);

  const haptic = React.useMemo(() => ({
    trigger: (action: ActionType, pattern?: number | number[]) => 
      consoleHapticFeedback.triggerHaptic(action, pattern),
    
    queue: (action: ActionType, delay?: number) => 
      consoleHapticFeedback.queueHaptic(action, delay),
    
    _sequence: (_sequence: Array<{ action: ActionType; delay?: number }>) => 
      consoleHapticFeedback.triggerSequence(_sequence),
    
    gaming: (type: 'hit' | 'reload' | 'powerup' | 'damage' | 'victory' | 'defeat') => 
      consoleHapticFeedback.triggerGamingFeedback(type),
    
    console: (action: 'menu' | 'back' | 'select' | 'activate' | 'navigate') => 
      consoleHapticFeedback.triggerConsoleAction(action),
    
    emergency: () => consoleHapticFeedback.triggerEmergencyFeedback(),
    
    accessibility: (type: 'focus' | 'error' | 'success' | 'navigation') => 
      consoleHapticFeedback.triggerAccessibilityFeedback(type),
    
    test: (_pattern?: number | number[]) => consoleHapticFeedback.testHaptic(pattern)
  }), []);

  return {
    haptic,
    settings,
    updateSettings,
    isSupported: consoleHapticFeedback.isHapticSupported(),
    availablePatterns: consoleHapticFeedback.getAvailablePatterns(),
  };
}

// Additional React import for the hook
import React from 'react';
import { logger } from '../logger';

// Export types for use in other components
export type { ConsoleType, ActionType, HapticIntensity, HapticSettings };