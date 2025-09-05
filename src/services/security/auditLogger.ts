/**
 * Audit Logging Service
 * HIPAA-compliant audit logging for security events and data access
 * Maintains immutable audit trail for compliance requirements
 */

import { secureStorage } from './secureStorage';
import { cryptoService } from './cryptoService';
import { logger } from '../../utils/logger';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  event: AuditEventType;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resourceId?: string;
  resourceType?: string;
  action?: string;
  outcome: 'success' | 'failure' | 'partial';
  details?: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  signature?: string;
}

export type AuditEventType =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_REGISTRATION'
  | 'LOGIN_FAILED'
  | 'REGISTRATION_FAILED'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'PASSWORD_RESET_FAILED'
  | 'PROFILE_UPDATED'
  | 'PROFILE_UPDATE_FAILED'
  | 'DATA_ACCESS'
  | 'DATA_MODIFICATION'
  | 'DATA_DELETION'
  | 'PERMISSION_GRANTED'
  | 'PERMISSION_DENIED'
  | 'MFA_ENABLED'
  | 'MFA_DISABLED'
  | 'MFA_CHALLENGE_SUCCESS'
  | 'MFA_CHALLENGE_FAILED'
  | 'SESSION_TIMEOUT'
  | 'SUSPICIOUS_ACTIVITY'
  | 'SECURITY_ALERT'
  | 'COMPLIANCE_VIOLATION'
  | 'EMERGENCY_ACCESS'
  | 'CRISIS_INTERVENTION'
  | 'PHI_ACCESS'
  | 'PHI_MODIFICATION'
  | 'PHI_EXPORT'
  | 'CONSENT_GRANTED'
  | 'CONSENT_REVOKED'
  | 'SYSTEM_ERROR'
  | 'CONFIGURATION_CHANGE';

interface AuditLogConfig {
  maxLogsInMemory: number;
  persistenceInterval: number;
  retentionDays: number;
  enableEncryption: boolean;
  enableSignatures: boolean;
}

class AuditLoggerService {
  private static instance: AuditLoggerService;
  private logs: AuditLogEntry[] = [];
  private config: AuditLogConfig = {
    maxLogsInMemory: 1000,
    persistenceInterval: 60000, // 1 minute
    retentionDays: 2555, // 7 years for HIPAA compliance
    enableEncryption: true,
    enableSignatures: true,
  };
  private persistenceTimer: NodeJS.Timeout | null = null;
  private sessionInfo: {
    sessionId?: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
  } = {};

  private constructor() {
    this.initializeLogger();
  }

  static getInstance(): AuditLoggerService {
    if (!AuditLoggerService.instance) {
      AuditLoggerService.instance = new AuditLoggerService();
    }
    return AuditLoggerService.instance;
  }

  private initializeLogger(): void {
    // Load existing logs from storage
    this.loadStoredLogs();
    
    // Set up automatic persistence
    this.setupAutoPersistence();
    
    // Set up retention cleanup
    this.setupRetentionCleanup();
    
    // Capture session information
    this.captureSessionInfo();
  }

  /**
   * Log an audit event
   */
  async log(params: {
    event: AuditEventType;
    userId?: string;
    resourceId?: string;
    resourceType?: string;
    action?: string;
    outcome?: 'success' | 'failure' | 'partial';
    details?: Record<string, any>;
    severity: 'info' | 'warning' | 'error' | 'critical';
  }): Promise<void> {
    try {
      // Create log entry
      const entry: AuditLogEntry = {
        id: cryptoService.generateSecureUUID(),
        timestamp: new Date(),
        event: params.event,
        userId: params.userId || this.sessionInfo.userId,
        sessionId: this.sessionInfo.sessionId,
        ipAddress: this.sessionInfo.ipAddress,
        userAgent: this.sessionInfo.userAgent,
        resourceId: params.resourceId,
        resourceType: params.resourceType,
        action: params.action,
        outcome: params.outcome || 'success',
        details: params.details,
        severity: params.severity,
      };

      // Add signature if enabled
      if (this.config.enableSignatures) {
        entry.signature = await this.signLogEntry(entry);
      }

      // Add to memory buffer
      this.logs.push(entry);

      // Check if immediate persistence is needed
      if (this.shouldPersistImmediately(entry)) {
        await this.persistLogs();
      }

      // Trim memory buffer if needed
      if (this.logs.length > this.config.maxLogsInMemory) {
        await this.persistLogs();
      }

      // Send critical events to monitoring service
      if (entry.severity === 'critical') {
        this.notifyCriticalEvent(entry);
      }
    } catch (error) {
      logger.error('Failed to log audit event:');
      // Audit logging should never throw - fail silently but log to console
    }
  }

  /**
   * Query audit logs
   */
  async query(filters: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    event?: AuditEventType;
    severity?: string;
    resourceId?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogEntry[]> {
    try {
      // Get all logs (from memory and storage)
      const allLogs = await this.getAllLogs();
      
      // Apply filters
      let filteredLogs = allLogs;
      
      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(
          log => new Date(log.timestamp) >= filters.startDate!
        );
      }
      
      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(
          log => new Date(log.timestamp) <= filters.endDate!
        );
      }
      
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(
          log => log.userId === filters.userId
        );
      }
      
      if (filters.event) {
        filteredLogs = filteredLogs.filter(
          log => log.event === filters.event
        );
      }
      
      if (filters.severity) {
        filteredLogs = filteredLogs.filter(
          log => log.severity === filters.severity
        );
      }
      
      if (filters.resourceId) {
        filteredLogs = filteredLogs.filter(
          log => log.resourceId === filters.resourceId
        );
      }
      
      // Sort by timestamp (newest first)
      filteredLogs.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Apply pagination
      const offset = filters.offset || 0;
      const limit = filters.limit || 100;
      
      return filteredLogs.slice(offset, offset + limit);
    } catch (error) {
      logger.error('Failed to query audit logs:');
      return [];
    }
  }

  /**
   * Export audit logs for compliance reporting
   */
  async exportLogs(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const logs = await this.query({ startDate, endDate });
      
      if (format === 'json') {
        return JSON.stringify(logs, null, 2);
      } else {
        return this.convertToCSV(logs);
      }
    } catch (error) {
      logger.error('Failed to export audit logs:');
      throw new Error('Export failed');
    }
  }

  /**
   * Verify log integrity
   */
  async verifyLogIntegrity(log: AuditLogEntry): Promise<boolean> {
    if (!log.signature || !this.config.enableSignatures) {
      return true; // No signature to verify
    }
    
    try {
      const logWithoutSignature = { ...log };
      delete logWithoutSignature.signature;
      
      const dataToVerify = JSON.stringify(logWithoutSignature);
      return await cryptoService.verifySignature(
        dataToVerify,
        log.signature
      );
    } catch (error) {
      logger.error('Failed to verify log integrity:');
      return false;
    }
  }

  /**
   * Get audit statistics
   */
  async getStatistics(_period: 'day' | 'week' | 'month' = 'day'): Promise<{
    totalEvents: number;
    byEvent: Record<string, number>;
    bySeverity: Record<string, number>;
    byUser: Record<string, number>;
    failureRate: number;
    criticalEvents: number;
  }> {
    const now = new Date();
    const startDate = new Date();
    
    switch (_period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }
    
    const logs = await this.query({ startDate, endDate: now });
    
    const stats = {
      totalEvents: logs.length,
      byEvent: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byUser: {} as Record<string, number>,
      failureRate: 0,
      criticalEvents: 0,
    };
    
    let failures = 0;
    
    logs.forEach(log => {
      // Count by event type
      stats.byEvent[log.event] = (stats.byEvent[log.event] || 0) + 1;
      
      // Count by severity
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
      
      // Count by user
      if (log.userId) {
        stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1;
      }
      
      // Count failures
      if (log.outcome === 'failure') {
        failures++;
      }
      
      // Count critical events
      if (log.severity === 'critical') {
        stats.criticalEvents++;
      }
    });
    
    stats.failureRate = logs.length > 0 ? (failures / logs.length) * 100 : 0;
    
    return stats;
  }

  /**
   * Update session information
   */
  updateSessionInfo(info: {
    sessionId?: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
  }): void {
    this.sessionInfo = { ...this.sessionInfo, ...info };
  }

  /**
   * Private helper methods
   */
  private async loadStoredLogs(): Promise<void> {
    try {
      const storedLogs = await secureStorage.getItem('audit_logs');
      if (storedLogs && Array.isArray(storedLogs)) {
        // Only load recent logs into memory
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 1);
        
        this.logs = storedLogs.filter(
          log => new Date(log.timestamp) > recentDate
        );
      }
    } catch (error) {
      logger.error('Failed to load stored audit logs:');
    }
  }

  private async persistLogs(): Promise<void> {
    try {
      if (this.logs.length === 0) return;
      
      // Get existing logs
      const existingLogs = (await secureStorage.getItem('audit_logs') as AuditLogEntry[]) || [];
      
      // Combine and deduplicate
      const allLogs = [...existingLogs, ...this.logs];
      const uniqueLogs = Array.from(
        new Map(allLogs.map(log => [log.id, log])).values()
      );
      
      // Store encrypted if enabled
      await secureStorage.setItem('audit_logs', uniqueLogs, {
        encrypted: this.config.enableEncryption,
        compress: true,
      });
      
      // Clear memory buffer of persisted logs
      this.logs = [];
    } catch (error) {
      logger.error('Failed to persist audit logs:');
    }
  }

  private setupAutoPersistence(): void {
    if (this.persistenceTimer) {
      clearInterval(this.persistenceTimer);
    }
    
    this.persistenceTimer = setInterval(() => {
      this.persistLogs();
    }, this.config.persistenceInterval);
  }

  private setupRetentionCleanup(): void {
    // Run cleanup daily
    setInterval(() => {
      this.cleanupOldLogs();
    }, 24 * 60 * 60 * 1000);
    
    // Run initial cleanup
    this.cleanupOldLogs();
  }

  private async cleanupOldLogs(): Promise<void> {
    try {
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - this.config.retentionDays);
      
      const allLogs = await this.getAllLogs();
      const recentLogs = allLogs.filter(
        log => new Date(log.timestamp) > retentionDate
      );
      
      if (recentLogs.length < allLogs.length) {
        await secureStorage.setItem('audit_logs', recentLogs, {
          encrypted: this.config.enableEncryption,
          compress: true,
        });
      }
    } catch (error) {
      logger.error('Failed to cleanup old audit logs:');
    }
  }

  private async getAllLogs(): Promise<AuditLogEntry[]> {
    const storedLogs = (await secureStorage.getItem('audit_logs') as AuditLogEntry[]) || [];
    return [...storedLogs, ...this.logs];
  }

  private async signLogEntry(entry: AuditLogEntry): Promise<string> {
    const entryWithoutSignature = { ...entry };
    delete entryWithoutSignature.signature;
    
    const dataToSign = JSON.stringify(entryWithoutSignature);
    return await cryptoService.signData(dataToSign);
  }

  private shouldPersistImmediately(entry: AuditLogEntry): boolean {
    // Immediately persist critical events and security-related events
    return entry.severity === 'critical' ||
           entry.event.includes('SECURITY') ||
           entry.event.includes('EMERGENCY') ||
           entry.event.includes('CRISIS') ||
           entry.event.includes('PHI');
  }

  private notifyCriticalEvent(entry: AuditLogEntry): void {
    // In production, send to monitoring service
    logger.error('CRITICAL AUDIT EVENT', JSON.stringify(entry));
    
    // Could trigger alerts, emails, etc.
    if (window.navigator.onLine) {
      // Send to monitoring endpoint
      fetch('/api/monitoring/critical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).catch(err => logger.error('Failed to notify monitoring:', err));
    }
  }

  private captureSessionInfo(): void {
    // Capture browser information
    this.sessionInfo.userAgent = window.navigator.userAgent;
    
    // Generate session ID if not exists
    if (!this.sessionInfo.sessionId) {
      this.sessionInfo.sessionId = cryptoService.generateSecureUUID();
    }
  }

  private convertToCSV(logs: AuditLogEntry[]): string {
    if (logs.length === 0) return '';
    
    // Get headers
    const headers = [
      'ID',
      'Timestamp',
      'Event',
      'User ID',
      'Session ID',
      'IP Address',
      'Resource ID',
      'Resource Type',
      'Action',
      'Outcome',
      'Severity',
      'Details',
    ];
    
    // Convert logs to CSV rows
    const rows = logs.map(log => [
      log.id,
      log.timestamp.toISOString(),
      log.event,
      log.userId || '',
      log.sessionId || '',
      log.ipAddress || '',
      log.resourceId || '',
      log.resourceType || '',
      log.action || '',
      log.outcome,
      log.severity,
      JSON.stringify(log.details || {}),
    ]);
    
    // Combine headers and rows
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
    
    return csv;
  }
}

export const auditLogger = AuditLoggerService.getInstance();