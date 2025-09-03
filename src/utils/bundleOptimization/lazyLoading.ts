import { logger } from '../logger';
/**
 * Bundle Splitting and Lazy Loading Configuration
 * Optimizes bundle size and loading performance for better mobile experience
 */

/// <reference path="../../types/performance-api.d.ts" />

import { lazy, ComponentType } from 'react';
import { performanceMonitor } from '../performance/performanceMonitor';

// Component loader with performance monitoring
export function createLazyComponent<T extends ComponentType<unknown>>(
  importFunc: () => Promise<{ default: T }>,
  chunkName?: string
): T {
  const LazyComponent = lazy(async () => {
    const startTime = performance.now();
    
    try {
      // Start performance measurement
      if (chunkName) {
        performanceMonitor.measureStart(`lazy_load_${chunkName}`);
      }
      
      const module = await importFunc();
      
      // Record load time
      const loadTime = performance.now() - startTime;
      performanceMonitor.recordMetric(
        chunkName ? `lazy_load_${chunkName}` : 'lazy_load_component',
        loadTime,
        { chunkName }
      );
      
      return module;
    } catch {
      logger.error(`Failed to load lazy component ${chunkName || 'unknown'}:`, error);
      
      // Record error
      performanceMonitor.recordMetric('lazy_load_error', 1, {
        chunkName,
        error: 'Processing error'
      });
      
      throw error;
    }
  });

  // Add display name for debugging (cast to any to avoid type error)
  (LazyComponent as unknown).displayName = chunkName ? `Lazy(${chunkName})` : 'LazyComponent';
  
  return LazyComponent as unknown as T;
}

// Crisis-related components (highest priority)
export const __CrisisInterventionLazy = createLazyComponent(
  () => import('../../components/crisis/CrisisInterventionSystem').then(m => ({ default: m.CrisisInterventionSystem })),
  'CrisisInterventionSystem'
);

export const _SafetyPlanLazy = createLazyComponent(
  () => import('../../components/crisis/SafetyPlan').then(m => ({ default: m.SafetyPlan })),
  'SafetyPlan'
);

export const _EmergencyContactsLazy = createLazyComponent(
  () => import('../../components/crisis/EmergencyContacts').then(m => ({ default: m.EmergencyContacts })),
  'EmergencyContacts'
);

export const _CrisisChatLazy = createLazyComponent(
  () => import('../../components/crisis/CrisisChat').then(m => ({ default: m.CrisisChat })),
  'CrisisChat'
);

// Wellness components (medium priority)
export const __MoodTrackerLazy = createLazyComponent(
  () => import('../../components/wellness/MoodTracker'),
  'MoodTracker'
);

export const __BreathingExerciseLazy = createLazyComponent(
  () => import('../../components/wellness/BreathingExercises').then(m => ({ default: m.BreathingExercises })),
  'BreathingExercises'
);

export const __MeditationLazy = createLazyComponent(
  () => import('../../components/wellness/MeditationTimer').then(m => ({ default: m.MeditationTimer })),
  'MeditationTimer'
);

export const __JournalLazy = createLazyComponent(
  () => import('../../components/wellness/TherapeuticJournal').then(m => ({ default: m.TherapeuticJournal })),
  'TherapeuticJournal'
);

// Community components (lower priority)
export const __CommunityFeedLazy = createLazyComponent(
  () => import('../../components/community/CommunityFeed'),
  'CommunityFeed'
);

export const __SupportGroupsLazy = createLazyComponent(
  () => import('../../components/community/SupportGroups').then(m => ({ default: m.SupportGroups })),
  'SupportGroups'
);

export const __ForumsLazy = createLazyComponent(
  () => import('../../components/community/Forums'),
  'Forums'
);

// Professional components
export const __TherapistFinderLazy = createLazyComponent(
  () => import('../../components/professional/TherapistFinder'),
  'TherapistFinder'
);

export const __AppointmentBookingLazy = createLazyComponent(
  () => import('../../components/professional/AppointmentBooking').then(m => ({ default: m.AppointmentBooking })),
  'AppointmentBooking'
);

// Settings and administrative components (lowest priority)
export const __SettingsLazy = createLazyComponent(
  () => import('../../components/settings/Settings'),
  'Settings'
);

export const __ProfileLazy = createLazyComponent(
  () => import('../../components/profile/Profile'),
  'Profile'
);

export const __PerformanceDashboardLazy = createLazyComponent(
  () => import('../../components/performance/PerformanceDashboard').then(m => ({ default: m.PerformanceDashboard })),
  'PerformanceDashboard'
);

// Preloading utilities
export class ComponentPreloader {
  private static preloadedComponents = new Set<string>();
  private static preloadPromises = new Map<string, Promise<void>>();

  /**
   * Preload critical components based on user behavior and device capabilities
   */
  static async preloadCriticalComponents(): Promise<void> {
    const promises: Promise<void>[] = [];

    // Always preload crisis components (highest priority)
    promises.push(
      this.preloadComponent('CrisisIntervention', () => import('../../components/crisis/CrisisInterventionSystem').then(m => ({ default: m.CrisisInterventionSystem }))),
      this.preloadComponent('SafetyPlan', () => import('../../components/crisis/SafetyPlan')),
      this.preloadComponent('EmergencyContacts', () => import('../../components/crisis/EmergencyContacts'))
    );

    // Preload based on time of day
    const currentHour = new Date().getHours();
    if (currentHour >= 22 || currentHour <= 6) {
      // Late night/early morning - preload crisis support
      promises.push(
        this.preloadComponent('CrisisChat', () => import('../../components/crisis/CrisisChat')),
        this.preloadComponent('BreathingExercise', () => import('../../components/wellness/BreathingExercises').then(m => ({ default: m.BreathingExercises })))
      );
    } else {
      // Regular hours - preload wellness components
      promises.push(
        this.preloadComponent('MoodTracker', () => import('../../components/wellness/MoodTracker')),
        this.preloadComponent('Journal', () => import('../../components/wellness/TherapeuticJournal').then(m => ({ default: m.TherapeuticJournal })))
      );
    }

    await Promise.allSettled(_promises);
  }

  /**
   * Preload components based on user interaction patterns
   */
  static async preloadBasedOnUserBehavior(userPreferences: {
    frequentlyUsedFeatures?: string[];
    lastUsedFeatures?: string[];
    timeSpentInSections?: Record<string, number>;
  }): Promise<void> {
    const promises: Promise<void>[] = [];

    // Preload frequently used features
    if (userPreferences.frequentlyUsedFeatures) {
      for (const feature of userPreferences.frequentlyUsedFeatures) {
        promises.push(this.preloadComponentByFeatureName(feature));
      }
    }

    // Preload recently used features
    if (userPreferences.lastUsedFeatures) {
      for (const feature of userPreferences.lastUsedFeatures.slice(0, 3)) {
        promises.push(this.preloadComponentByFeatureName(feature));
      }
    }

    await Promise.allSettled(_promises);
  }

  /**
   * Preload components during idle time
   */
  static preloadDuringIdle(): void {
    if ('requestIdleCallback' in window) {
// @ts-expect-error - requestIdleCallback is a global API
      requestIdleCallback(() => {
        this.preloadLowPriorityComponents();
      }, { timeout: 5000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.preloadLowPriorityComponents();
      }, 2000);
    }
  }

  private static async preloadComponent(
    name: string,
    importFunc: () => Promise<unknown>
  ): Promise<void> {
    if (this.preloadedComponents.has(name)) {
      return this.preloadPromises.get(name);
    }

    const preloadPromise = this.performPreload(name, importFunc);
    this.preloadPromises.set(name, preloadPromise);
    
    return preloadPromise;
  }

  private static async performPreload(
    name: string,
    importFunc: () => Promise<unknown>
  ): Promise<void> {
    try {
      const startTime = performance.now();
      
      await importFunc();
      
      const loadTime = performance.now() - startTime;
      performanceMonitor.recordMetric(`preload_${name}`, loadTime, { preloaded: true });
      
      this.preloadedComponents.add(name);
    } catch {
    logger.warn(`Failed to preload component ${name}:`, error);
      performanceMonitor.recordMetric('preload_error', 1, { componentName: name });
    }
  }

  private static async preloadComponentByFeatureName(feature: string): Promise<void> {
    const componentMap: Record<string, () => Promise<unknown>> = {
      'mood-tracker': () => import('../../components/wellness/MoodTracker'),
      'breathing': () => import('../../components/wellness/BreathingExercises').then(m => ({ default: m.BreathingExercises })),
      'meditation': () => import('../../components/wellness/MeditationTimer').then(m => ({ default: m.MeditationTimer })),
      'journal': () => import('../../components/wellness/TherapeuticJournal').then(m => ({ default: m.TherapeuticJournal })),
      'crisis': () => import('../../components/crisis/CrisisInterventionSystem').then(m => ({ default: m.CrisisInterventionSystem })),
      'safety-plan': () => import('../../components/crisis/SafetyPlan'),
      'community': () => import('../../components/community/CommunityFeed'),
      'therapist': () => import('../../components/professional/TherapistFinder'),
      'settings': () => import('../../components/settings/Settings'),
    };

    const importFunc = componentMap[feature];
    if (importFunc) {
      await this.preloadComponent(feature, importFunc);
    }
  }

  private static async preloadLowPriorityComponents(): Promise<void> {
    const lowPriorityComponents = [
      { name: 'CommunityFeed', importFunc: () => import('../../components/community/CommunityFeed') },
      { name: 'Settings', importFunc: () => import('../../components/settings/Settings') },
      { name: 'Profile', importFunc: () => import('../../components/profile/Profile') },
      { name: 'TherapistFinder', importFunc: () => import('../../components/professional/TherapistFinder') },
    ];

    // Load one component at a time to avoid overwhelming the network
    for (const component of lowPriorityComponents) {
      await this.preloadComponent(component.name, component.importFunc);
      
      // Add small delay between preloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// Route-based code splitting
export const _RouteComponents = {
  // Core routes (always loaded)
  Dashboard: createLazyComponent(
    () => import('../../pages/HomePage'),
    'Dashboard'
  ),
  
  // Crisis routes (high priority)
  Crisis: createLazyComponent(
    () => import('../../pages/CrisisPage'),
    'Crisis'
  ),
  
  // Wellness routes (medium priority)
  Wellness: createLazyComponent(
    () => import('../../pages/WellnessPage'),
    'Wellness'
  ),
  
  // Community routes (lower priority)
  Community: createLazyComponent(
    () => import('../../pages/CommunityPage'),
    'Community'
  ),
  
  // Professional routes
  Professional: createLazyComponent(
    () => import('../../pages/ProfessionalPage'),
    'Professional'
  ),
  
  // Settings routes (lowest priority)
  Settings: createLazyComponent(
    () => import('../../pages/Settings'),
    'Settings'
  ),
};

// Bundle analysis utilities
export class BundleAnalyzer {
  static analyzeChunkSizes(): void {
    if (process.env.NODE_ENV === 'development') {
      // Log chunk loading information
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('chunk') || entry.name.includes('lazy')) {
            const resourceEntry = entry as PerformanceResourceTiming;
            logger.info(`Chunk loaded: ${entry.name}, Size: ${resourceEntry.transferSize || 0} bytes, Time: ${entry.duration}ms`);
            
            performanceMonitor.recordMetric('chunk_load', entry.duration, {
              chunkName: entry.name,
              size: resourceEntry.transferSize || 0,
              cached: (resourceEntry.transferSize || 0) === 0
            });
          }
        }
      });
      
      observer.observe({ entryTypes: ['resource'] });
    }
  }

  static generateBundleReport(): {
    totalChunks: number;
    avgLoadTime: number;
    largestChunk: { name: string; size: number } | null;
    cacheHitRate: number;
  } {
    const metrics = performanceMonitor.getMetrics();
    const chunkMetrics = metrics.get('chunk_load') || [];
    
    if (chunkMetrics.length === 0) {
      return {
        totalChunks: 0,
        avgLoadTime: 0,
        largestChunk: null,
        cacheHitRate: 0
      };
    }

    const totalLoadTime = chunkMetrics.reduce((sum, metric) => sum + metric.value, 0);
    const avgLoadTime = totalLoadTime / chunkMetrics.length;
    
    const largestChunk = chunkMetrics.reduce((largest, current) => {
      const currentSize = current.context?.size || 0;
      const largestSize = largest?.context?.size || 0;
      return currentSize > largestSize ? current : largest;
    }, chunkMetrics[0]);

    const cachedChunks = chunkMetrics.filter(metric => metric.context?.cached).length;
    const cacheHitRate = cachedChunks / chunkMetrics.length;

    return {
      totalChunks: chunkMetrics.length,
      avgLoadTime,
      largestChunk: largestChunk ? {
        name: largestChunk.context?.chunkName || 'Unknown',
        size: largestChunk.context?.size || 0
      } : null,
      cacheHitRate
    };
  }
}

// Initialize bundle optimization
export function initializeBundleOptimization(): void {
  // Start bundle analysis in development
  if (process.env.NODE_ENV === 'development') {
    BundleAnalyzer.analyzeChunkSizes();
  }

  // Preload critical components
  ComponentPreloader.preloadCriticalComponents();

  // Schedule idle preloading
  ComponentPreloader.preloadDuringIdle();

  // Performance monitoring
  window.addEventListener('load', () => {
    // Generate initial bundle report after page load
    setTimeout(() => {
      const report = BundleAnalyzer.generateBundleReport();
      logger.info('Bundle Performance Report:', report);
      
      performanceMonitor.recordMetric('bundle_analysis', 1, report);
    }, 1000);
  });
}