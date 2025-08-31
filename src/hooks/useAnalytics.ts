import { useCallback } from 'react';
import axios from 'axios';

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

export const useAnalytics = () => {
  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    // Only track if analytics is enabled
    if (process.env.VITE_ENABLE_ANALYTICS === 'false') {
      return;
    }

    try {
      // Send to analytics endpoint
      await axios.post('/api/analytics/event', {
        ...event,
        timestamp: Date.now(),
        sessionId: sessionStorage.getItem('sessionId') || generateSessionId(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics]', event);
      }
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }, []);

  const trackPageView = useCallback(async (page: string) => {
    await trackEvent({
      category: 'navigation',
      action: 'page_view',
      label: page,
    });
  }, [trackEvent]);

  const trackError = useCallback(async (error: Error, context?: string) => {
    await trackEvent({
      category: 'error',
      action: 'error_occurred',
      label: context || 'unknown',
      metadata: {
        message: error.message,
        stack: error.stack,
      },
    });
  }, [trackEvent]);

  const trackTiming = useCallback(async (category: string, variable: string, time: number) => {
    await trackEvent({
      category: 'performance',
      action: 'timing',
      label: `${category}_${variable}`,
      value: time,
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackError,
    trackTiming,
  };
};

// Helper function to generate session ID
function generateSessionId(): string {
  const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('sessionId', id);
  return id;
}