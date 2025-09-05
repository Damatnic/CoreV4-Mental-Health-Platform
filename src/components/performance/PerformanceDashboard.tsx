import { logger } from '../../utils/logger';
/**
 * Performance Monitoring Dashboard
 * Displays real-time performance metrics for crisis response and general app performance
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Heart,
  MemoryStick,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { performanceMonitor, PERFORMANCE_THRESHOLDS } from '../../utils/performance/performanceMonitor';
import { useMobileFeatures } from '../../hooks/useMobileFeatures';

interface MetricSummary {
  name: string;
  value: number;
  threshold: number;
  _status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface PerformanceStats {
  crisisResponseTime: number;
  pageLoadTime: number;
  memoryUsage: number;
  coreWebVitals: {
    LCP: number;
    FID: number;
    CLS: number;
    FCP: number;
    TTFB: number;
  };
  networkSpeed: string;
  deviceInfo: unknown;
}

export function PerformanceDashboard() {
  const { deviceInfo } = useMobileFeatures();
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      const summary = performanceMonitor.getPerformanceSummary();
      const _metrics = performanceMonitor.getMetrics();
      
      // Get memory info if available
      const memoryInfo = (performance as any).memory || {};
      
      // Get connection info if available
      const connection = (navigator as any).connection || {};
      
      const _newStats: PerformanceStats = {
        crisisResponseTime: summary.crisis_response_time?.avg || 0,
        pageLoadTime: summary.navigation_timing?.avg || 0,
        memoryUsage: memoryInfo.usedJSHeapSize ? 
          memoryInfo.usedJSHeapSize / 1048576 : 0, // Convert to MB
        coreWebVitals: {
          LCP: summary.LCP?.latest || 0,
          FID: summary.FID?.latest || 0,
          CLS: summary.CLS?.latest || 0,
          FCP: summary.FCP?.latest || 0,
          TTFB: summary.TTFB?.latest || 0
        },
        networkSpeed: connection.effectiveType || 'unknown',
        deviceInfo
      };
      
      setStats(_newStats);
    } catch (error) {
      logger.error('Failed to refresh performance stats:');
    }
  }, [deviceInfo]);

  // Initialize performance monitoring
  useEffect(() => {
    const initializeMonitoring = async () => {
      try {
        // Start monitoring
        performanceMonitor.recordMetric('dashboard_load_start', Date.now());
        
        // Get initial stats
        await refreshStats();
        
        performanceMonitor.recordMetric('dashboard_load_complete', Date.now());
        setIsLoading(false);
      } catch (error) {
        logger.error('Failed to initialize performance monitoring:');
        setIsLoading(false);
      }
    };

    initializeMonitoring();
    refreshStats();
  }, [refreshStats]);

  // Auto-refresh performance data
  useEffect(() => {
    const interval = setInterval(refreshStats, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, refreshStats]);

  // Generate metric summaries with status and trends
  const metricSummaries: MetricSummary[] = useMemo(() => {
    if (!stats) return [];

    return [
      {
        name: 'Crisis Response',
        value: stats.crisisResponseTime,
        threshold: PERFORMANCE_THRESHOLDS.CRISIS_PAGE_LOAD,
        _status: stats.crisisResponseTime <= PERFORMANCE_THRESHOLDS.CRISIS_PAGE_LOAD ? 'good' : 
                stats.crisisResponseTime <= PERFORMANCE_THRESHOLDS.CRISIS_PAGE_LOAD * 1.5 ? 'warning' : 'critical',
        trend: 'stable'
      },
      {
        name: 'Page Load Time',
        value: stats.pageLoadTime,
        threshold: 3000,
        _status: stats.pageLoadTime <= 3000 ? 'good' : 
                stats.pageLoadTime <= 5000 ? 'warning' : 'critical',
        trend: 'stable'
      },
      {
        name: 'Memory Usage',
        value: stats.memoryUsage,
        threshold: PERFORMANCE_THRESHOLDS.MAX_MEMORY_MB,
        _status: stats.memoryUsage <= PERFORMANCE_THRESHOLDS.MAX_MEMORY_MB * 0.7 ? 'good' : 
                stats.memoryUsage <= PERFORMANCE_THRESHOLDS.MAX_MEMORY_MB ? 'warning' : 'critical',
        trend: 'up'
      },
      {
        name: 'Largest Contentful Paint',
        value: stats.coreWebVitals.LCP,
        threshold: PERFORMANCE_THRESHOLDS.LCP,
        _status: stats.coreWebVitals.LCP <= PERFORMANCE_THRESHOLDS.LCP ? 'good' : 
                stats.coreWebVitals.LCP <= PERFORMANCE_THRESHOLDS.LCP * 1.5 ? 'warning' : 'critical',
        trend: 'stable'
      },
      {
        name: 'First Input Delay',
        value: stats.coreWebVitals.FID,
        threshold: PERFORMANCE_THRESHOLDS.FID,
        _status: stats.coreWebVitals.FID <= PERFORMANCE_THRESHOLDS.FID ? 'good' : 
                stats.coreWebVitals.FID <= PERFORMANCE_THRESHOLDS.FID * 1.5 ? 'warning' : 'critical',
        trend: 'stable'
      },
      {
        name: 'Cumulative Layout Shift',
        value: stats.coreWebVitals.CLS,
        threshold: PERFORMANCE_THRESHOLDS.CLS,
        _status: stats.coreWebVitals.CLS <= PERFORMANCE_THRESHOLDS.CLS ? 'good' : 
                stats.coreWebVitals.CLS <= PERFORMANCE_THRESHOLDS.CLS * 2 ? 'warning' : 'critical',
        trend: 'stable'
      }
    ];
  }, [stats]);

  const getStatusIcon = (_status: string) => {
    switch (_status) {
      case 'good': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (_status: string) => {
    switch (_status) {
      case 'good': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatValue = (name: string, value: number) => {
    if (name === 'Memory Usage') {
      return `${value.toFixed(1)} MB`;
    } else if (name === 'Cumulative Layout Shift') {
      return value.toFixed(3);
    } else {
      return `${value.toFixed(0)} ms`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <span className="ml-4 text-gray-600">Loading performance data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Real-time monitoring for optimal mental health support
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          <button
            onClick={refreshStats}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 flex items-center"
          >
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Critical Metrics Alert */}
      {metricSummaries.some(m => m._status === 'critical') && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
            <div>
              <h3 className="font-medium text-red-800">Performance Issues Detected</h3>
              <p className="text-sm text-red-600 mt-1">
                Critical performance metrics are exceeding safe thresholds. Crisis features may be impacted.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Device & Network Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Smartphone className="h-5 w-5 text-blue-500 mr-3" />
              <span className="text-sm font-medium text-gray-700">Device</span>
            </div>
          </div>
          <div className="mt-3 space-y-1 text-sm text-gray-600">
            <div>Type: {deviceInfo.isMobile ? 'Mobile' : deviceInfo.isTablet ? 'Tablet' : 'Desktop'}</div>
            <div>Screen: {deviceInfo.screenSize.toUpperCase()}</div>
            <div>PWA: {deviceInfo.isPWA ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {stats?.networkSpeed === 'offline' ? 
                <WifiOff className="h-5 w-5 text-red-500 mr-3" /> :
                <Wifi className="h-5 w-5 text-green-500 mr-3" />
              }
              <span className="text-sm font-medium text-gray-700">Network</span>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            <div>Speed: {stats?.networkSpeed || 'Unknown'}</div>
            <div>Status: {navigator.onLine ? 'Online' : 'Offline'}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MemoryStick className="h-5 w-5 text-purple-500 mr-3" />
              <span className="text-sm font-medium text-gray-700">Memory</span>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            <div>Used: {formatValue('Memory Usage', stats?.memoryUsage || 0)}</div>
            <div className={`mt-1 px-2 py-1 rounded text-xs ${
              (stats?.memoryUsage || 0) <= PERFORMANCE_THRESHOLDS.MAX_MEMORY_MB * 0.7 ? 'bg-green-100 text-green-700' :
              (stats?.memoryUsage || 0) <= PERFORMANCE_THRESHOLDS.MAX_MEMORY_MB ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {(stats?.memoryUsage || 0) <= PERFORMANCE_THRESHOLDS.MAX_MEMORY_MB * 0.7 ? 'Optimal' :
               (stats?.memoryUsage || 0) <= PERFORMANCE_THRESHOLDS.MAX_MEMORY_MB ? 'High' : 'Critical'}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricSummaries.map((metric) => (
          <motion.div
            key={metric.name}
            whileHover={{ scale: 1.02 }}
            className={`bg-white rounded-lg border-2 transition-colors cursor-pointer ${
              selectedMetric === metric.name ? 'border-primary-300' : 'border-gray-200'
            }`}
            onClick={() => setSelectedMetric(selectedMetric === metric.name ? null : metric.name)}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  {getStatusIcon(metric._status)}
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {metric.name}
                  </span>
                </div>
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : metric.trend === 'down' ? (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatValue(metric.name, metric.value)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric._status)}`}>
                    {metric._status.toUpperCase()}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      metric._status === 'good' ? 'bg-green-500' :
                      metric._status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (metric.value / metric.threshold) * 100)}%`
                    }}
                  />
                </div>

                <div className="text-xs text-gray-500">
                  Threshold: {formatValue(metric.name, metric.threshold)}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {selectedMetric === metric.name && showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-gray-200 p-4 bg-gray-50"
                >
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current:</span>
                      <span className="font-medium">{formatValue(metric.name, metric.value)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target:</span>
                      <span className="font-medium">{formatValue(metric.name, metric.threshold)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Performance:</span>
                      <span className={`font-medium ${
                        metric.value <= metric.threshold ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metric.value <= metric.threshold ? 'Within Target' : 'Exceeds Target'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Crisis-Specific Metrics */}
      <div className="bg-red-50 rounded-lg border border-red-200 p-6">
        <div className="flex items-center mb-4">
          <Heart className="h-6 w-6 text-red-500 mr-3" />
          <h3 className="text-lg font-semibold text-red-800">Crisis Response Performance</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-700">
              {formatValue('Crisis Response', stats?.crisisResponseTime || 0)}
            </div>
            <div className="text-sm text-red-600">Response Time</div>
            <div className="text-xs text-red-500 mt-1">
              Target: &lt;200ms
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-700">
              &lt;50ms
            </div>
            <div className="text-sm text-red-600">988 Access</div>
            <div className="text-xs text-red-500 mt-1">
              Critical Priority
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-700">
              &lt;100ms
            </div>
            <div className="text-sm text-red-600">Safety Plan</div>
            <div className="text-xs text-red-500 mt-1">
              High Priority
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-700">
              &lt;50ms
            </div>
            <div className="text-sm text-red-600">Emergency Contacts</div>
            <div className="text-xs text-red-500 mt-1">
              Critical Priority
            </div>
          </div>
        </div>
      </div>

      {/* Performance Recommendations */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-center mb-4">
          <Zap className="h-6 w-6 text-blue-500 mr-3" />
          <h3 className="text-lg font-semibold text-blue-800">Optimization Recommendations</h3>
        </div>
        
        <div className="space-y-3">
          {metricSummaries
            .filter(m => m._status !== 'good')
            .map(metric => (
              <div key={metric.name} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  metric._status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                }`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-800">
                    {metric.name} Optimization
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    {metric.name === 'Crisis Response' && 'Consider preloading crisis resources and optimizing critical path rendering.'}
                    {metric.name === 'Memory Usage' && 'Review memory leaks and implement aggressive cleanup for unused resources.'}
                    {metric.name === 'Page Load Time' && 'Implement code splitting and lazy loading for non-critical components.'}
                    {metric.name === 'Largest Contentful Paint' && 'Optimize images and implement resource prioritization.'}
                    {metric.name === 'First Input Delay' && 'Reduce JavaScript execution time and implement input response optimization.'}
                    {metric.name === 'Cumulative Layout Shift' && 'Reserve space for dynamic content and optimize font loading.'}
                  </div>
                </div>
              </div>
            ))}
          
          {metricSummaries.every(m => m._status === 'good') && (
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-700">
                All performance _metrics are within optimal ranges!
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}