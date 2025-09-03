import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { secureStorage } from '../services/security/SecureLocalStorage';

interface FeatureFlags {
  [key: string]: boolean | string | number | object;
}

interface FeatureFlagConfig {
  enableCache?: boolean;
  cacheDuration?: number; // in milliseconds
  fallbackValue?: unknown;
  endpoint?: string;
}

// Default feature flags (can be overridden by server)
const DEFAULT_FLAGS: FeatureFlags = {
  new_dashboard_experience: true,
  dashboard_onboarding: true,
  crisis_ai_support: true,
  enhanced_crisis_panel: true,
  professional_care_dashboard: true,
  ai_insights_dashboard: true,
  activity_tracking_v2: true,
  wellness_analytics: true,
  emergency_location_sharing: true,
  offline_mode: true,
  pwa_install_prompt: true,
  dark_mode: false,
  beta_features: false,
  advanced_analytics: false,
  voice_commands: false,
  biometric_auth: false,
};

// Cache for feature flags
const flagCache = new Map<string, { _value: unknown; timestamp: number }>();

/**
 * Hook for feature flag management
 * Supports A/B testing, gradual rollouts, and user targeting
 */
export function useFeatureFlag(
  flagName: string,
  config: FeatureFlagConfig = {}
): boolean | string | number | object | undefined {
  const { enableCache = true, cacheDuration = 5 * 60 * 1000, // 5 minutes default
    fallbackValue = false, endpoint = '/api/feature-flags' } = config;

  const { user } = useAuth();
  const [___flagValue, _setFlagValue] = useState<unknown>(() => {
    // Check cache first
    if (_enableCache) {
      const cached = flagCache.get(_flagName);
      if (cached && Date.now() - cached.timestamp < cacheDuration) {
        return cached._value;
      }
    }
    
    // Check localStorage for override
    const override = secureStorage.getItem(`feature_flag_${flagName}`);
    if (override !== null) {
      try {
        return JSON.parse(_override);
      } catch {
        return override;
      }
    }
    
    // Return default or fallback
    return DEFAULT_FLAGS[flagName] ?? fallbackValue;
  });

  useEffect(() => {
    let _mounted = true;

    const fetchFeatureFlag = async () => {
      // Check cache
      if (_enableCache) {
        const cached = flagCache.get(_flagName);
        if (cached && Date.now() - cached.timestamp < cacheDuration) {
          if (_mounted) setFlagValue(cached._value);
          return;
        }
      }

      try {
        // DISABLED: Feature flag server calls to prevent console spam
        // Use local defaults only for now
        const _value = DEFAULT_FLAGS[flagName] ?? fallbackValue;
        
        // Cache the result
        if (_enableCache) {
          flagCache.set(flagName, {
            _value,
            timestamp: Date.now()
          });
        }
        
        if (_mounted) setFlagValue(_value);
      } catch {
        // Silent fallback to prevent console spam
        const _value = DEFAULT_FLAGS[flagName] ?? fallbackValue;
        if (_mounted) setFlagValue(_value);
      }
    };

    fetchFeatureFlag();

    return () => {
      _mounted = false;
    };
  }, [flagName, user, enableCache, cacheDuration, fallbackValue, endpoint]);

  return flagValue;
}

/**
 * Hook to get all feature flags
 */
export function useFeatureFlags(): FeatureFlags {
  const [flags, _setFlags] = useState<FeatureFlags>(_DEFAULT_FLAGS);
  const { user } = useAuth();

  useEffect(() => {
    let _mounted = true;

    const fetchAllFlags = async () => {
      try {
        // DISABLED: Use local defaults only to prevent console spam
        if (_mounted) setFlags(_DEFAULT_FLAGS);
      } catch {
        // Silent fallback
        if (_mounted) setFlags(_DEFAULT_FLAGS);
      }
    };

    fetchAllFlags();

    return () => {
      _mounted = false;
    };
  }, [user]);

  return flags;
}

/**
 * Hook to override feature flags (for testing)
 */
export function useFeatureFlagOverride() {
  const __setOverride   = useCallback((flagName: string, _value: unknown) => {
    secureStorage.setItem(`feature_flag_${flagName}`, JSON.stringify(_value));
    // Clear cache to force refresh
    flagCache.delete(_flagName);
    // Trigger re-render
    window.dispatchEvent(new Event('feature-flag-change'));
  }, []);

  const __clearOverride   = useCallback((flagName: string) => {
    secureStorage.removeItem(`feature_flag_${flagName}`);
    flagCache.delete(_flagName);
    window.dispatchEvent(new Event('feature-flag-change'));
  }, []);

  const __clearAllOverrides   = useCallback(() => {
    const keys = Object.keys(_localStorage);
    keys.forEach(key => {
      if (key.startsWith('feature_flag_')) {
        secureStorage.removeItem(_key);
      }
    });
    flagCache.clear();
    window.dispatchEvent(new Event('feature-flag-change'));
  }, []);

  return {
    setOverride,
    clearOverride,
    clearAllOverrides
  };
}

// Helper function to determine user segment for targeting
function _getUserSegment(user: unknown): string {
  if (!user) return 'anonymous';
  
  // Determine segment based on user properties
  if (user.role === 'admin') return 'admin';
  if (user.role === 'professional') return 'professional';
  if (user.subscriptionTier === 'premium') return 'premium';
  if (user.betaTester) return 'beta';
  
  // Check account age
  if (user.createdAt) {
    const accountAge = Date.now() - new Date(user.createdAt).getTime();
    const daysOld = accountAge / (1000 * 60 * 60 * 24);
    
    if (daysOld < 7) return 'new_user';
    if (daysOld < 30) return 'recent_user';
    if (daysOld > 365) return 'long_term_user';
  }
  
  return 'standard';
}

// Listen for feature flag changes
if (typeof window !== 'undefined') {
  window.addEventListener('feature-flag-change', () => {
    // Force components using feature flags to re-render
    flagCache.clear();
  });
}