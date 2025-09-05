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
  aiinsights_dashboard: true,
  activity_tracking_v2: true,
  wellness_analytics: true,
  emergency_location_sharing: true,
  offline_mode: true,
  pwainstall_prompt: true,
  dark_mode: false,
  beta_features: false,
  advanced_analytics: false,
  voice_commands: false,
  biometric_auth: false,
};

// Cache for feature flags
const flagCache = new Map<string, { value: unknown; timestamp: number }>();

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
  const [flagValue, setFlagValue] = useState<typeof fallbackValue>(() => {
    // Check cache first
    if (enableCache) {
      const cached = flagCache.get(flagName);
      if (cached && Date.now() - cached.timestamp < cacheDuration) {
        return cached.value;
      }
    }
    
    // Check localStorage for override
    const override = secureStorage.getItem(`feature_flag_${flagName}`);
    if (override !== null) {
      try {
        return JSON.parse(override);
      } catch (error) {
        return override;
      }
    }
    
    // Return default or fallback
    return DEFAULT_FLAGS[flagName] ?? fallbackValue;
  });

  useEffect(() => {
    let mounted = true;

    const fetchFeatureFlag = async () => {
      // Check cache
      if (enableCache) {
        const cached = flagCache.get(flagName);
        if (cached && Date.now() - cached.timestamp < cacheDuration) {
          if (mounted) setFlagValue(cached.value);
          return;
        }
      }

      try {
        // DISABLED: Feature flag server calls to prevent console spam
        // Use local defaults only for now
        const value = DEFAULT_FLAGS[flagName] ?? fallbackValue;
        
        // Cache the result
        if (enableCache) {
          flagCache.set(flagName, {
            value,
            timestamp: Date.now()
          });
        }
        
        if (mounted) setFlagValue(value);
      } catch (error) {
        // Silent fallback to prevent console spam
        const value = DEFAULT_FLAGS[flagName] ?? fallbackValue;
        if (mounted) setFlagValue(value);
      }
    };

    fetchFeatureFlag();

    return () => {
      mounted = false;
    };
  }, [flagName, user, enableCache, cacheDuration, fallbackValue, endpoint]);

  return flagValue as boolean | string | number | object | undefined;
}

/**
 * Hook to get all feature flags
 */
export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;

    const fetchAllFlags = async () => {
      try {
        // DISABLED: Use local defaults only to prevent console spam
        if (mounted) setFlags(DEFAULT_FLAGS);
      } catch (error) {
        // Silent fallback
        if (mounted) setFlags(DEFAULT_FLAGS);
      }
    };

    fetchAllFlags();

    return () => {
      mounted = false;
    };
  }, [user]);

  return flags;
}

/**
 * Hook to override feature flags (for testing)
 */
export function useFeatureFlagOverride() {
  const setOverride   = useCallback((flagName: string, value: unknown) => {
    secureStorage.setItem(`feature_flag_${flagName}`, JSON.stringify(value));
    // Clear cache to force refresh
    flagCache.delete(flagName);
    // Trigger re-render
    window.dispatchEvent(new Event('feature-flag-change'));
  }, []);

  const clearOverride   = useCallback((flagName: string) => {
    secureStorage.removeItem(`feature_flag_${flagName}`);
    flagCache.delete(flagName);
    window.dispatchEvent(new Event('feature-flag-change'));
  }, []);

  const clearAllOverrides   = useCallback(() => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('feature_flag_')) {
        secureStorage.removeItem(key);
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
  
  const typedUser = user as { 
    role?: string; 
    subscriptionTier?: string; 
    betaTester?: boolean; 
    createdAt?: string | Date;
  };
  
  // Determine segment based on user properties
  if (typedUser.role === 'admin') return 'admin';
  if (typedUser.role === 'professional') return 'professional';
  if (typedUser.subscriptionTier === 'premium') return 'premium';
  if (typedUser.betaTester) return 'beta';
  
  // Check account age
  if (typedUser.createdAt) {
    const accountAge = Date.now() - new Date(typedUser.createdAt).getTime();
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