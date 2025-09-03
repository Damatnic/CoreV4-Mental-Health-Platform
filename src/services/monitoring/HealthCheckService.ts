// Health Check and Monitoring Service
// Provides comprehensive health monitoring for the mental health platform

import { _apiService } from '../api/ApiService';
import { wsService } from '../websocket/WebSocketService';
import { logger } from '../utils/logger';

// Health check status types
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown'
}

// Service health check result
export interface ServiceHealth {
  name: string;
  status: HealthStatus;
  responseTime: number;
  message?: string;
  lastChecked: Date;
  uptime?: number;
  details?: Record<string, any>;
}

// System health overview
export interface SystemHealth {
  overall: HealthStatus;
  services: ServiceHealth[];
  _metrics: SystemMetrics;
  timestamp: Date;
  version: string;
}

// System metrics
export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    latency: number;
    bandwidth: number;
    packetsLost: number;
  };
  activeUsers: number;
  activeSessions: number;
  requestsPerMinute: number;
  errorRate: number;
}

// Crisis system metrics
export interface CrisisMetrics {
  activecrisisSessions: number;
  waitingUsers: number;
  averageWaitTime: number;
  availableCounselors: number;
  escalationRate: number;
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
  };
}

// Performance metrics
export interface PerformanceMetrics {
  pageLoadTime: number;
  timeToFirstByte: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  totalBlockingTime: number;
}

// Health Check Service Class
export class HealthCheckService {
  private static instance: HealthCheckService;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metricsCollectionInterval: NodeJS.Timeout | null = null;
  private healthHistory: Map<string, ServiceHealth[]> = new Map();
  private performanceObserver: PerformanceObserver | null = null;
  private readonly maxHistorySize = 100;

  private constructor() {
    this.initializePerformanceObserver();
  }

  // Singleton pattern
  public static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  // Initialize performance observer
  private initializePerformanceObserver(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const _entry of list.getEntries()) {
          this.recordPerformanceMetric(_entry);
        }
      });

      // Observe different performance entry types
      try {
        this.performanceObserver.observe({ 
          entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] 
        });
      } catch (error) {
        logger.error('Failed to initialize performance observer:');
      }
    }
  }

  // Start health monitoring
  public startMonitoring(intervalMs: number = 30000): void {
    if (this.healthCheckInterval) {
      logger.info('Health monitoring already running');
      return;
    }

    // Initial health check
    this.performHealthCheck();

    // Set up recurring health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);

    // Set up metrics collection
    this.metricsCollectionInterval = setInterval(() => {
      this.collectMetrics();
    }, 60000); // Every minute

    logger.info(`Health monitoring started with ${intervalMs}ms interval`);
  }

  // Stop health monitoring
  public stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
      this.metricsCollectionInterval = null;
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    logger.info('Health monitoring stopped');
  }

  // Perform comprehensive health check
  private async performHealthCheck(): Promise<SystemHealth> {
    const services: ServiceHealth[] = [];
    
    // Check API health
    services.push(await this.checkAPIHealth());
    
    // Check WebSocket health
    services.push(await this.checkWebSocketHealth());
    
    // Check database health
    services.push(await this.checkDatabaseHealth());
    
    // Check cache health
    services.push(await this.checkCacheHealth());
    
    // Check crisis system health
    services.push(await this.checkCrisisSystemHealth());
    
    // Check third-party integrations
    services.push(await this.checkIntegrationsHealth());
    
    // Determine overall health
    const overall = this.calculateOverallHealth(_services);
    
    // Collect system _metrics
    const _metrics = await this.collectSystemMetrics();
    
    const systemHealth: SystemHealth = {
      overall,
      services,
      _metrics,
      timestamp: new Date(),
      version: '4.0.0'
    };
    
    // Store in history
    this.storeHealthHistory(_systemHealth);
    
    // Send to monitoring service
    this.reportHealthStatus(_systemHealth);
    
    return systemHealth;
  }

  // Check API health
  private async checkAPIHealth(): Promise<ServiceHealth> {
    const startTime = performance.now();
    
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      const responseTime = performance.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        return {
          name: 'API',
          status: HealthStatus.HEALTHY,
          responseTime,
          lastChecked: new Date(),
          uptime: data.uptime,
          details: data
        };
      } else {
        return {
          name: 'API',
          status: response.status >= 500 ? HealthStatus.UNHEALTHY : HealthStatus.DEGRADED,
          responseTime,
          message: `HTTP ${response.status}`,
          lastChecked: new Date()
        };
      }
    } catch (error) {
      return {
        name: 'API',
        status: HealthStatus.UNHEALTHY,
        responseTime: performance.now() - startTime,
        message: error instanceof Error ? error.message : 'Connection failed',
        lastChecked: new Date()
      };
    }
  }

  // Check WebSocket health
  private async checkWebSocketHealth(): Promise<ServiceHealth> {
    const startTime = performance.now();
    
    try {
      const isConnected = wsService.isConnected();
      const latency = wsService.getLatency();
      
      return {
        name: 'WebSocket',
        status: isConnected ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
        responseTime: latency,
        lastChecked: new Date(),
        details: {
          connected: isConnected,
          latency
        }
      };
    } catch (error) {
      return {
        name: 'WebSocket',
        status: HealthStatus.UNHEALTHY,
        responseTime: performance.now() - startTime,
        message: error instanceof Error ? error.message : 'Check failed',
        lastChecked: new Date()
      };
    }
  }

  // Check database health
  private async checkDatabaseHealth(): Promise<ServiceHealth> {
    const startTime = performance.now();
    
    try {
      const response = await fetch('/api/health/database', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      const responseTime = performance.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        return {
          name: 'Database',
          status: data.healthy ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
          responseTime,
          lastChecked: new Date(),
          details: {
            connections: data.connections,
            replicationLag: data.replicationLag
          }
        };
      } else {
        return {
          name: 'Database',
          status: HealthStatus.UNHEALTHY,
          responseTime,
          message: `HTTP ${response.status}`,
          lastChecked: new Date()
        };
      }
    } catch (_error) {
      return {
        name: 'Database',
        status: HealthStatus.UNHEALTHY,
        responseTime: performance.now() - startTime,
        message: 'Database check failed',
        lastChecked: new Date()
      };
    }
  }

  // Check cache health
  private async checkCacheHealth(): Promise<ServiceHealth> {
    const startTime = performance.now();
    
    try {
      const response = await fetch('/api/health/cache', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      
      const responseTime = performance.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        return {
          name: 'Cache',
          status: data.healthy ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
          responseTime,
          lastChecked: new Date(),
          details: {
            hitRate: data.hitRate,
            memoryUsage: data.memoryUsage
          }
        };
      } else {
        return {
          name: 'Cache',
          status: HealthStatus.DEGRADED,
          responseTime,
          message: 'Cache degraded',
          lastChecked: new Date()
        };
      }
    } catch (_error) {
      return {
        name: 'Cache',
        status: HealthStatus.DEGRADED,
        responseTime: performance.now() - startTime,
        message: 'Cache check failed',
        lastChecked: new Date()
      };
    }
  }

  // Check crisis system health
  private async checkCrisisSystemHealth(): Promise<ServiceHealth> {
    const startTime = performance.now();
    
    try {
      const response = await fetch('/api/health/crisis', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      
      const responseTime = performance.now() - startTime;
      
      if (response.ok) {
        const data: CrisisMetrics = await response.json();
        
        // Determine health based on crisis _metrics
        let status = HealthStatus.HEALTHY;
        let message: string | undefined;
        
        if (data.waitingUsers > 10) {
          status = HealthStatus.DEGRADED;
          message = 'High number of waiting users';
        }
        
        if (data.availableCounselors === 0) {
          status = HealthStatus.UNHEALTHY;
          message = 'No counselors available';
        }
        
        if (data.responseTime.p95 > 60000) { // 60 seconds
          status = HealthStatus.DEGRADED;
          message = 'High response times';
        }
        
        return {
          name: 'Crisis System',
          status,
          responseTime,
          message,
          lastChecked: new Date(),
          details: data
        };
      } else {
        return {
          name: 'Crisis System',
          status: HealthStatus.UNHEALTHY,
          responseTime,
          message: 'Crisis system unavailable',
          lastChecked: new Date()
        };
      }
    } catch (_error) {
      return {
        name: 'Crisis System',
        status: HealthStatus.UNKNOWN,
        responseTime: performance.now() - startTime,
        message: 'Crisis system check failed',
        lastChecked: new Date()
      };
    }
  }

  // Check third-party integrations
  private async checkIntegrationsHealth(): Promise<ServiceHealth> {
    const startTime = performance.now();
    const integrations = ['payment', 'video', 'sms', 'email'];
    const _results: Record<string, boolean> = {};
    
    try {
      // Check each integration in parallel
      const _checks = integrations.map(async (integration) => {
        try {
          const response = await fetch(`/api/health/integration/${integration}`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
          });
          results[integration] = response.ok;
        } catch (_error) {
          results[integration] = false;
        }
      });
      
      await Promise.all(_checks);
      
      const healthyCount = Object.values(_results).filter(v => v).length;
      const totalCount = Object.values(_results).length;
      
      let status = HealthStatus.HEALTHY;
      if (healthyCount < totalCount) {
        status = healthyCount > totalCount / 2 ? HealthStatus.DEGRADED : HealthStatus.UNHEALTHY;
      }
      
      return {
        name: 'Integrations',
        status,
        responseTime: performance.now() - startTime,
        lastChecked: new Date(),
        details: results
      };
    } catch (_error) {
      return {
        name: 'Integrations',
        status: HealthStatus.UNKNOWN,
        responseTime: performance.now() - startTime,
        message: 'Integration check failed',
        lastChecked: new Date()
      };
    }
  }

  // Calculate overall system health
  private calculateOverallHealth(services: ServiceHealth[]): HealthStatus {
    const criticalServices = ['API', 'Database', 'Crisis System'];
    
    // Check critical services
    for (const service of services) {
      if (criticalServices.includes(service.name) && service.status === HealthStatus.UNHEALTHY) {
        return HealthStatus.UNHEALTHY;
      }
    }
    
    // Check for degraded services
    const degradedCount = services.filter(s => s.status === HealthStatus.DEGRADED).length;
    if (degradedCount > services.length / 3) {
      return HealthStatus.DEGRADED;
    }
    
    // Check for any unhealthy services
    const unhealthyCount = services.filter(s => s.status === HealthStatus.UNHEALTHY).length;
    if (unhealthyCount > 0) {
      return HealthStatus.DEGRADED;
    }
    
    return HealthStatus.HEALTHY;
  }

  // Collect system metrics
  private async collectSystemMetrics(): Promise<SystemMetrics> {
    // In a real implementation, these would come from actual system monitoring
    return {
      cpu: {
        usage: this.getRandomMetric(10, 80),
        cores: navigator.hardwareConcurrency || 4
      },
      memory: {
        used: this.getRandomMetric(1000, 3000),
        total: 4096,
        percentage: this.getRandomMetric(25, 75)
      },
      storage: {
        used: this.getRandomMetric(10000, 50000),
        total: 100000,
        percentage: this.getRandomMetric(10, 50)
      },
      network: {
        latency: this.getRandomMetric(10, 100),
        bandwidth: this.getRandomMetric(50, 100),
        packetsLost: this.getRandomMetric(0, 0.1)
      },
      activeUsers: Math.floor(this.getRandomMetric(100, 1000)),
      activeSessions: Math.floor(this.getRandomMetric(50, 500)),
      requestsPerMinute: Math.floor(this.getRandomMetric(1000, 5000)),
      errorRate: this.getRandomMetric(0, 0.05)
    };
  }

  // Collect performance metrics
  private collectMetrics(): void {
    if (typeof window === 'undefined') return;
    
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    const _metrics: PerformanceMetrics = {
      pageLoadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
      timeToFirstByte: navigation ? navigation.responseStart - navigation.fetchStart : 0,
      firstContentfulPaint: this.getMetricValue(paint, 'first-contentful-paint'),
      largestContentfulPaint: this.getLCPValue(),
      cumulativeLayoutShift: this.getCLSValue(),
      firstInputDelay: this.getFIDValue(),
      totalBlockingTime: this.getTBTValue()
    };
    
    this.reportPerformanceMetrics(_metrics);
  }

  // Record performance metric
  private recordPerformanceMetric(_entry: PerformanceEntry): void {
    // Store and analyze performance entries
    logger.info(`Performance metric: ${_entry.name} - ${_entry.entryType} - ${_entry.duration}ms`);
  }

  // Helper methods for performance metrics
  private getMetricValue(entries: PerformanceEntryList, name: string): number {
    const _entry = entries.find(e => e.name === name);
    return _entry ? _entry.startTime : 0;
  }

  private getLCPValue(): number {
    // In production, use PerformanceObserver for LCP
    return this.getRandomMetric(1000, 3000);
  }

  private getCLSValue(): number {
    // In production, calculate actual CLS
    return this.getRandomMetric(0, 0.1);
  }

  private getFIDValue(): number {
    // In production, measure actual FID
    return this.getRandomMetric(10, 100);
  }

  private getTBTValue(): number {
    // In production, calculate actual TBT
    return this.getRandomMetric(50, 300);
  }

  // Store health history
  private storeHealthHistory(health: SystemHealth): void {
    health.services.forEach(service => {
      if (!this.healthHistory.has(service.name)) {
        this.healthHistory.set(service.name, []);
      }
      
      const history = this.healthHistory.get(service.name)!;
      history.push(_service);
      
      // Limit history size
      if (history.length > this.maxHistorySize) {
        history.shift();
      }
    });
  }

  // Report health status to monitoring service
  private reportHealthStatus(health: SystemHealth): void {
    // Send to monitoring endpoint
    if (health.overall !== HealthStatus.HEALTHY) {
      logger.warn('System health degraded:', health);
    }
    
    // Send metrics to Prometheus/Grafana
    this.sendMetricsToMonitoring(_health);
  }

  // Report performance metrics
  private reportPerformanceMetrics(_metrics: PerformanceMetrics): void {
    // Send to analytics service
    logger.info('Performance _metrics:', _metrics);
  }

  // Send metrics to monitoring service
  private sendMetricsToMonitoring(health: SystemHealth): void {
    // In production, send to Prometheus pushgateway
    try {
      fetch('/api/_metrics/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timestamp: health.timestamp,
          _metrics: health._metrics,
          services: health.services.map(s => ({
            name: s.name,
            status: s.status,
            responseTime: s.responseTime
          }))
        })
      }).catch(error => {
        logger.error('Failed to send _metrics:', error);
      });
    } catch (error) {
      logger.error('Failed to send _metrics:');
    }
  }

  // Utility method for generating random metrics (for demo)
  private getRandomMetric(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  // Public methods for accessing health data
  public async getSystemHealth(): Promise<SystemHealth> {
    return this.performHealthCheck();
  }

  public getHealthHistory(_serviceName: string): ServiceHealth[] {
    return this.healthHistory.get(_serviceName) || [];
  }

  public async getCrisisMetrics(): Promise<CrisisMetrics> {
    const response = await fetch('/api/_metrics/crisis');
    return response.json();
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    // Return latest collected _metrics
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    return {
      pageLoadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
      timeToFirstByte: navigation ? navigation.responseStart - navigation.fetchStart : 0,
      firstContentfulPaint: this.getMetricValue(paint, 'first-contentful-paint'),
      largestContentfulPaint: this.getLCPValue(),
      cumulativeLayoutShift: this.getCLSValue(),
      firstInputDelay: this.getFIDValue(),
      totalBlockingTime: this.getTBTValue()
    };
  }
}

// Export singleton instance
export const __healthCheckService = HealthCheckService.getInstance();