/**
 * Progressive Web App (PWA) Management System
 * Coordinates all PWA features including offline support, push notifications, and app installation
 */

import { pushNotifications } from '../../services/pushNotifications';
import { initCrisisDB, precacheCrisisResources } from '../../service-worker/crisis-offline';
import { performanceMonitor } from '../performance/performanceMonitor';
import { ComponentPreloader, initializeBundleOptimization } from '../bundleOptimization/lazyLoading';

interface PWAInstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWACapabilities {
  isInstallable: boolean;
  isInstalled: boolean;
  supportsNotifications: boolean;
  supportsOffline: boolean;
  supportsPushMessages: boolean;
  supportsBackgroundSync: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionType: string;
  isLowEndDevice: boolean;
}

export class PWAManager {
  private static instance: PWAManager;
  private installPrompt: PWAInstallEvent | null = null;
  private capabilities: PWACapabilities | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  /**
   * Initialize PWA features
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      performanceMonitor.measureStart('pwa_initialization');

      // Detect PWA capabilities
      this.capabilities = await this.detectCapabilities();
      
      // Initialize core PWA features
      await this.initializeServiceWorker();
      await this.initializePushNotifications();
      await this.initializeOfflineSupport();
      await this.setupInstallPrompt();
      await this.initializePerformanceOptimizations();
      
      // Setup event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      
      const initTime = performanceMonitor.measureEnd('pwa_initialization');
      console.log(`PWA initialized successfully in ${initTime?.toFixed(2)}ms`);
      
    } catch (error) {
      console.error('Failed to initialize PWA:', error);
      performanceMonitor.recordMetric('pwa_init_error', 1, { error: String(error) });
      throw error;
    }
  }

  /**
   * Detect PWA capabilities
   */
  private async detectCapabilities(): Promise<PWACapabilities> {
    const userAgent = navigator.userAgent.toLowerCase();
    const connection = (navigator as any).connection || {};
    
    // Device type detection
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (/mobile|phone|android|iphone/.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/tablet|ipad/.test(userAgent)) {
      deviceType = 'tablet';
    }

    // Low-end device detection
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const isLowEndDevice = deviceMemory <= 2 || hardwareConcurrency <= 2;

    const capabilities: PWACapabilities = {
      isInstallable: false, // Will be updated when beforeinstallprompt fires
      isInstalled: window.matchMedia('(display-mode: standalone)').matches || 
                   (window.navigator as any).standalone === true,
      supportsNotifications: 'Notification' in window && 'serviceWorker' in navigator,
      supportsOffline: 'serviceWorker' in navigator && 'caches' in window,
      supportsPushMessages: 'PushManager' in window,
      supportsBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      deviceType,
      connectionType: connection.effectiveType || 'unknown',
      isLowEndDevice,
    };

    performanceMonitor.recordMetric('pwa_capabilities_detected', 1, capabilities);
    return capabilities;
  }

  /**
   * Initialize Service Worker
   */
  private async initializeServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('Service Worker registered:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New service worker available
                this.showUpdateAvailable();
              }
            }
          });
        }
      });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));

      performanceMonitor.recordMetric('service_worker_registered', 1);

    } catch (error) {
      console.error('Service Worker registration failed:', error);
      performanceMonitor.recordMetric('service_worker_error', 1, { error: String(error) });
    }
  }

  /**
   * Initialize push notifications
   */
  private async initializePushNotifications(): Promise<void> {
    if (!this.capabilities?.supportsNotifications) {
      console.warn('Push notifications not supported');
      return;
    }

    try {
      const initialized = await pushNotifications.init();
      if (initialized) {
        console.log('Push notifications initialized');
        
        // Schedule wellness reminders based on device type
        if (this.capabilities.deviceType === 'mobile') {
          await this.scheduleMobileNotifications();
        }
        
        performanceMonitor.recordMetric('push_notifications_initialized', 1);
      }
    } catch (error) {
      console.error('Push notifications initialization failed:', error);
      performanceMonitor.recordMetric('push_notifications_error', 1, { error: String(error) });
    }
  }

  /**
   * Initialize offline support
   */
  private async initializeOfflineSupport(): Promise<void> {
    if (!this.capabilities?.supportsOffline) {
      console.warn('Offline support not available');
      return;
    }

    try {
      // Initialize crisis database
      await initCrisisDB();
      
      // Precache critical resources
      await precacheCrisisResources();
      
      // Setup offline event handlers
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
      
      console.log('Offline support initialized');
      performanceMonitor.recordMetric('offline_support_initialized', 1);
      
    } catch (error) {
      console.error('Offline support initialization failed:', error);
      performanceMonitor.recordMetric('offline_support_error', 1, { error: String(error) });
    }
  }

  /**
   * Setup app install prompt
   */
  private async setupInstallPrompt(): Promise<void> {
    window.addEventListener('beforeinstallprompt', (event: Event) => {
      event.preventDefault();
      this.installPrompt = event as PWAInstallEvent;
      
      if (this.capabilities) {
        this.capabilities.isInstallable = true;
      }
      
      // Dispatch custom event for UI components
      window.dispatchEvent(new CustomEvent('pwa:installable', {
        detail: { canInstall: true }
      }));
      
      performanceMonitor.recordMetric('install_prompt_available', 1);
    });

    // Handle app installation
    window.addEventListener('appinstalled', () => {
      if (this.capabilities) {
        this.capabilities.isInstalled = true;
      }
      
      this.installPrompt = null;
      
      // Show welcome notification
      if (pushNotifications.isEnabled()) {
        pushNotifications.showWelcomeNotification();
      }
      
      window.dispatchEvent(new CustomEvent('pwa:installed'));
      performanceMonitor.recordMetric('app_installed', 1);
    });
  }

  /**
   * Initialize performance optimizations
   */
  private async initializePerformanceOptimizations(): Promise<void> {
    try {
      // Initialize bundle optimization
      initializeBundleOptimization();
      
      // Adjust optimizations based on device capabilities
      if (this.capabilities?.isLowEndDevice) {
        await this.enableLowEndDeviceOptimizations();
      }
      
      if (this.capabilities?.connectionType === 'slow-2g' || this.capabilities?.connectionType === '2g') {
        await this.enableSlowConnectionOptimizations();
      }
      
      performanceMonitor.recordMetric('performance_optimizations_initialized', 1);
      
    } catch (error) {
      console.error('Performance optimizations failed:', error);
      performanceMonitor.recordMetric('performance_optimizations_error', 1);
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Visibility change handler for background/foreground transitions
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handleAppForeground();
      } else {
        this.handleAppBackground();
      }
    });

    // Network status changes
    window.addEventListener('online', () => {
      window.dispatchEvent(new CustomEvent('pwa:online'));
    });

    window.addEventListener('offline', () => {
      window.dispatchEvent(new CustomEvent('pwa:offline'));
    });
  }

  /**
   * Handle app coming to foreground
   */
  private handleAppForeground(): void {
    performanceMonitor.recordMetric('app_foreground', 1);
    
    // Sync offline data if online
    if (navigator.onLine) {
      this.syncOfflineData();
    }
    
    // Update push notification permissions
    if (pushNotifications.getPermissionStatus() === 'granted') {
      // Schedule any pending notifications
      this.schedulePendingNotifications();
    }
  }

  /**
   * Handle app going to background
   */
  private handleAppBackground(): void {
    performanceMonitor.recordMetric('app_background', 1);
    
    // Clean up unnecessary resources
    this.cleanupResources();
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    console.log('App came online');
    
    // Sync offline data
    this.syncOfflineData();
    
    // Preload components if needed
    ComponentPreloader.preloadDuringIdle();
    
    window.dispatchEvent(new CustomEvent('pwa:sync-start'));
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    console.log('App went offline');
    
    // Show offline indicator
    window.dispatchEvent(new CustomEvent('pwa:offline-mode', {
      detail: { message: 'Working offline - Crisis resources remain available' }
    }));
  }

  /**
   * Handle service worker messages
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;
    
    switch (type) {
      case 'SYNC_COMPLETE':
        window.dispatchEvent(new CustomEvent('pwa:sync-complete', { detail: data }));
        break;
        
      case 'CACHE_UPDATED':
        console.log('Cache updated:', data);
        break;
        
      case 'NOTIFICATION_CLICKED':
        this.handleNotificationClick(data);
        break;
    }
  }

  /**
   * Handle notification clicks
   */
  private handleNotificationClick(data: any): void {
    // Forward to push notification service
    pushNotifications.handleNotificationClick(data.action, data.data);
  }

  /**
   * Install the app
   */
  async installApp(): Promise<boolean> {
    if (!this.installPrompt) {
      console.warn('No install prompt available');
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const choice = await this.installPrompt.userChoice;
      
      performanceMonitor.recordMetric('install_prompt_result', 1, {
        outcome: choice.outcome
      });
      
      return choice.outcome === 'accepted';
      
    } catch (error) {
      console.error('Install failed:', error);
      performanceMonitor.recordMetric('install_error', 1, { error: String(error) });
      return false;
    }
  }

  /**
   * Show update available notification
   */
  private showUpdateAvailable(): void {
    window.dispatchEvent(new CustomEvent('pwa:update-available', {
      detail: {
        message: 'A new version is available. Refresh to update.',
        action: () => window.location.reload()
      }
    }));
  }

  /**
   * Schedule mobile-specific notifications
   */
  private async scheduleMobileNotifications(): Promise<void> {
    // Morning wellness check-in
    await pushNotifications.scheduleWellnessReminder({
      id: 'morning-checkin',
      type: 'check-in',
      title: 'Morning Wellness Check',
      body: 'How are you feeling this morning?',
      time: '09:00',
      days: [1, 2, 3, 4, 5, 6, 7], // Every day
      enabled: true
    });

    // Evening reflection
    await pushNotifications.scheduleWellnessReminder({
      id: 'evening-reflection',
      type: 'check-in',
      title: 'Evening Reflection',
      body: 'Take a moment to reflect on your day',
      time: '20:00',
      days: [1, 2, 3, 4, 5, 6, 7], // Every day
      enabled: true
    });

    // Midday breathing break
    await pushNotifications.scheduleWellnessReminder({
      id: 'midday-breathing',
      type: 'mindfulness',
      title: 'Mindfulness Break',
      body: 'Take 2 minutes for a breathing exercise',
      time: '14:00',
      days: [1, 2, 3, 4, 5], // Weekdays only
      enabled: true
    });
  }

  /**
   * Schedule pending notifications
   */
  private async schedulePendingNotifications(): Promise<void> {
    // Implementation depends on your notification scheduling system
    console.log('Scheduling pending notifications...');
  }

  /**
   * Sync offline data
   */
  private async syncOfflineData(): Promise<void> {
    try {
      // Trigger background sync via service worker
      const registration = await navigator.serviceWorker.ready;
      if ('sync' in registration) {
        await (registration as any).sync.register('sync-data');
      }
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }

  /**
   * Enable low-end device optimizations
   */
  private async enableLowEndDeviceOptimizations(): Promise<void> {
    console.log('Enabling low-end device optimizations...');
    
    // Reduce animation complexity
    document.documentElement.classList.add('low-end-device');
    
    // Disable non-essential features
    localStorage.setItem('performance_mode', 'low');
    
    // Reduce image quality
    document.documentElement.style.setProperty('--image-quality', '0.8');
    
    // Limit concurrent network requests
    // This would be implemented in your API layer
  }

  /**
   * Enable slow connection optimizations
   */
  private async enableSlowConnectionOptimizations(): Promise<void> {
    console.log('Enabling slow connection optimizations...');
    
    // Reduce data usage
    document.documentElement.classList.add('slow-connection');
    
    // Disable auto-loading media
    localStorage.setItem('autoload_media', 'false');
    
    // Implement aggressive caching
    // This would be handled by the service worker
  }

  /**
   * Clean up resources when app goes to background
   */
  private cleanupResources(): void {
    // Clear unused caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName.includes('temp'))
            .map(cacheName => caches.delete(cacheName))
        );
      });
    }
    
    // Clear performance data older than 1 hour
    performanceMonitor.cleanup?.();
  }

  /**
   * Get PWA capabilities
   */
  getCapabilities(): PWACapabilities | null {
    return this.capabilities;
  }

  /**
   * Check if app is installable
   */
  isInstallable(): boolean {
    return this.capabilities?.isInstallable ?? false;
  }

  /**
   * Check if app is installed
   */
  isInstalled(): boolean {
    return this.capabilities?.isInstalled ?? false;
  }

  /**
   * Get installation prompt
   */
  getInstallPrompt(): PWAInstallEvent | null {
    return this.installPrompt;
  }
}

// Export singleton instance
export const pwaManager = PWAManager.getInstance();

// Convenience function for initialization
export async function initializePWA(): Promise<void> {
  await pwaManager.initialize();
}

// Export types
export type { PWACapabilities, PWAInstallEvent };