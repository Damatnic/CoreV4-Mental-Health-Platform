import { useCallback, useRef } from 'react';
import { logger } from '../utils/logger';

/**
 * Privacy-First Performance Monitor
 * 
 * Monitors performance locally for user experience optimization
 * but NEVER sends any data to external servers.
 * 
 * 🔒 All metrics stay local
 * 🔒 No external reporting
 * 🔒 Complete privacy
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceMonitorConfig {
  enableLogging?: boolean;
  enableReporting?: boolean; // Always false - we never report
  reportingEndpoint?: string; // Ignored - no reporting
  sampleRate?: number;
  bufferSize?: number;
}

export function usePerformanceMonitor(config: PerformanceMonitorConfig = {}) {
  const {
    enableLogging = process.env.NODE_ENV === 'development',
    bufferSize = 100
  } = config;

  const metricsBuffer = useRef<PerformanceMetric[]>([]);

  // Record metrics locally only - never sent anywhere
  const recordMetric = useCallback((name: string, value: number, metadata?: Record<string, any>) => {
    const _metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    // Only log in development for debugging
    if (_enableLogging) {
      logger.info(`[Local Performance] ${name}:`, value, metadata);
    }

    // Keep metrics in local buffer for app optimization only
    metricsBuffer.current.push(_metric);
    
    // Trim buffer to prevent memory issues
    if (metricsBuffer.current.length > bufferSize) {
      metricsBuffer.current = metricsBuffer.current.slice(-bufferSize);
    }
  }, [enableLogging, bufferSize]);

  // No-op flush - we never send data anywhere
  const flushMetrics = useCallback(async () => {
    // Clear local buffer without sending
    metricsBuffer.current = [];
    
    if (process.env.NODE_ENV === 'development') {
      logger.info('[Privacy Mode] Metrics cleared locally - nothing sent');
    }
  }, []);

  return {
    recordMetric,
    flushMetrics,
    getMetrics: () => [...metricsBuffer.current] // Local access only
  };
}

/**
 * Privacy Guarantee:
 * - No session IDs are generated or stored
 * - No user agents are collected
 * - No data leaves your device
 * - Performance monitoring is purely for local app optimization
 */