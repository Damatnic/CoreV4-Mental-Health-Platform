import { useCallback, useRef, useEffect } from 'react';
import axios from 'axios';

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

interface ExtendedAnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
}

export const useAnalytics = () => {
  const eventQueue = useRef<ExtendedAnalyticsEvent[]>([]);
  const flushTimer = useRef<NodeJS.Timeout>();

  // Check if tracking is allowed based on user consent
  const isTrackingAllowed = useCallback(() => {
    // Check localStorage for consent
    const consent = localStorage.getItem('analytics_consent');
    if (consent === 'denied') return false;
    
    // Check Do Not Track header
    if (navigator.doNotTrack === '1') return false;
    
    // Only track if analytics is enabled
    if (process.env.VITE_ENABLE_ANALYTICS === 'false') {
      return false;
    }
    
    return true;
  }, []);

  const trackEvent = useCallback(async (event: AnalyticsEvent | string, properties?: Record<string, any>) => {
    if (!isTrackingAllowed()) return;

    const eventData = typeof event === 'string' 
      ? { event, properties }
      : {
          event: `${event.category}_${event.action}`,
          properties: {
            label: event.label,
            value: event.value,
            ...event.metadata
          }
        };

    try {
      // Send to analytics endpoint
      await axios.post('/api/analytics/event', {
        ...eventData,
        timestamp: Date.now(),
        sessionId: sessionStorage.getItem('sessionId') || generateSessionId(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics]', eventData);
      }
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }, [isTrackingAllowed]);

  const trackPageView = useCallback(async (page: string, properties?: Record<string, any>) => {
    await trackEvent({
      category: 'navigation',
      action: 'page_view',
      label: page,
      metadata: properties
    });
  }, [trackEvent]);

  const trackError = useCallback(async (errorType: string, errorDetails: Record<string, any>) => {
    await trackEvent({
      category: 'error',
      action: errorType,
      label: errorDetails.component || 'unknown',
      metadata: {
        message: errorDetails.message?.substring(0, 200),
        stack: process.env.NODE_ENV === 'development' ? errorDetails.stack?.substring(0, 500) : undefined,
        ...errorDetails
      },
    });
  }, [trackEvent]);

  const trackTiming = useCallback(async (category: string, variable: string, time: number, label?: string) => {
    await trackEvent({
      category: 'performance',
      action: 'timing',
      label: label || `${category}_${variable}`,
      value: time,
    });
  }, [trackEvent]);

  const trackInteraction = useCallback(async (element: string, action: string, value?: any) => {
    await trackEvent({
      category: 'interaction',
      action,
      label: element,
      value: typeof value === 'number' ? value : undefined,
      metadata: typeof value === 'object' ? value : { value }
    });
  }, [trackEvent]);

  // Flush events on page unload
  useEffect(() => {
    const handleUnload = () => {
      // Send any queued events
      if (eventQueue.current.length > 0) {
        navigator.sendBeacon('/api/analytics/batch', JSON.stringify(eventQueue.current));
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleUnload();
      }
    });

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  return {
    trackEvent,
    trackPageView,
    trackError,
    trackTiming,
    trackInteraction,
    setUserId: (id: string) => {
      sessionStorage.setItem('analytics_user_id', id);
    },
    setUserProperties: (properties: Record<string, any>) => {
      trackEvent('user_properties', properties);
    }
  };
};

// Helper function to generate session ID
function generateSessionId(): string {
  const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('sessionId', id);
  return id;
}