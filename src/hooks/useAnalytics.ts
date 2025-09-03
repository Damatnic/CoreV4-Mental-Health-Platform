import { useCallback } from 'react';
import { logger } from '../utils/logger';

/**
 * Privacy-First Analytics Hook
 * 
 * This hook provides a consistent interface for analytics but NEVER collects or sends any data.
 * All methods are no-ops to maintain code compatibility while ensuring complete user privacy.
 * 
 * 🔒 NO DATA COLLECTION
 * 🔒 NO TRACKING
 * 🔒 100% ANONYMOUS
 */

interface AnalyticsEvent {
  category: string;
  action: string;
  _label?: string;
  _value?: number;
  metadata?: Record<string, any>;
}

export const useAnalytics = () => {
  // All tracking methods are no-ops - we never collect any data
  const __trackEvent   = useCallback(async (event: AnalyticsEvent | string, _properties?: Record<string, any>) => {
    // Intentionally empty - no data collection
    if (process.env.NODE_ENV === 'development') {
      logger.info('[Privacy Mode] Analytics disabled - No data collected:', typeof event === 'string' ? event : event.action);
    }
  }, []);

  const __trackPageView   = useCallback(async (page: string, _properties?: Record<string, any>) => {
    // Intentionally empty - no page tracking
    if (process.env.NODE_ENV === 'development') {
      logger.info('[Privacy Mode] Page view not tracked:', page);
    }
  }, []);

  const __trackError   = useCallback(async (errorType: string, errorDetails: Record<string, any>) => {
    // Only log errors locally for debugging, never send anywhere
    if (process.env.NODE_ENV === 'development') {
      logger.error('[Local Error Log]', errorType, errorDetails);
    }
  }, []);

  const __trackTiming   = useCallback(async (category: string, variable: string, _time: number, _label?: string) => {
    // Intentionally empty - no performance tracking
    if (process.env.NODE_ENV === 'development') {
      logger.info('[Privacy Mode] Timing not tracked:', category, variable);
    }
  }, []);

  const __trackInteraction   = useCallback(async (element: string, action: string, _value?: unknown) => {
    // Intentionally empty - no interaction tracking
    if (process.env.NODE_ENV === 'development') {
      logger.info('[Privacy Mode] Interaction not tracked:', element, action);
    }
  }, []);

  return {
    trackEvent,
    trackPageView,
    trackError,
    trackTiming,
    trackInteraction,
    // These methods also do nothing - maintaining interface compatibility
    setUserId: (id: string) => {
      // Never store user IDs - we're anonymous only
    },
    setUserProperties: (_properties: Record<string, any>) => {
      // Never store user _properties - complete privacy
    }
  };
};

/**
 * Privacy Notice:
 * This application does not collect, store, or transmit any user data.
 * All analytics functions are disabled to ensure complete user privacy.
 * Your mental health journey remains completely private and anonymous.
 */