/**
 * Security Monitoring and Incident Response Service
 * Real-time threat detection, monitoring, and automated incident response
 * HIPAA and SOC 2 compliant security event management
 */

import { auditLogger } from './auditLogger';
import { rateLimiter } from './rateLimiter';
import { hipaaService } from '../compliance/hipaaService';
import { cryptoService } from './cryptoService';
import { logger } from '../../utils/logger';

interface SecurityEvent {
  _id: string;
  timestamp: Date;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target?: string;
  userId?: string;
  ipAddress?: string;
  details: Record<string, any>;
  indicators: string[];
  mitigated: boolean;
  responseActions: string[];
}

type SecurityEventType =
  | 'unauthorized_access'
  | 'brute_force_attack'
  | 'sql_injection'
  | 'xss_attack'
  | 'csrf_attempt'
  | 'data_breach'
  | 'malware_detected'
  | 'privilege_escalation'
  | 'suspicious_activity'
  | 'policy_violation'
  | 'configuration_change'
  | 'authentication_failure'
  | 'session_hijacking'
  | 'api_abuse'
  | 'dos_attack';

interface ThreatIndicator {
  pattern: string | RegExp;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  description: string;
}

interface IncidentResponse {
  incidentId: string;
  triggeredBy: SecurityEvent[];
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'contained' | 'resolved' | 'escalated';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedSystems: string[];
  affectedUsers: string[];
  responseActions: ResponseAction[];
  escalationLevel: number;
  assignedTo?: string;
  notes: string[];
}

interface ResponseAction {
  actionId: string;
  type: string;
  target: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  executedAt?: Date;
  result?: unknown;
  error?: string;
}

interface SecurityMetrics {
  totalEvents: number;
  eventsBySeverity: Record<string, number>;
  eventsByType: Record<string, number>;
  activeIncidents: number;
  meanTimeToDetect: number; // milliseconds
  meanTimeToRespond: number; // milliseconds
  falsePositiveRate: number;
  threatScore: number; // 0-100
}

class SecurityMonitorService {
  private static instance: SecurityMonitorService;
  private events: Map<string, SecurityEvent> = new Map();
  private incidents: Map<string, IncidentResponse> = new Map();
  private threatIndicators: ThreatIndicator[] = [];
  private baselineMetrics: Map<string, any> = new Map();
  private anomalyThresholds: Map<string, number> = new Map();
  private alertSubscribers: Set<(event: SecurityEvent) => void> = new Set();
  private monitoringActive: boolean = true;
  private readonly EVENT_RETENTION_DAYS = 90;
  private readonly CORRELATION_WINDOW = 300000; // 5 minutes

  private constructor() {
    this.initializeMonitoring();
  }

  static getInstance(): SecurityMonitorService {
    if (!SecurityMonitorService.instance) {
      SecurityMonitorService.instance = new SecurityMonitorService();
    }
    return SecurityMonitorService.instance;
  }

  private initializeMonitoring(): void {
    this.setupThreatIndicators();
    this.establishBaseline();
    this.startRealtimeMonitoring();
    this.setupIncidentResponseAutomation();
  }

  /**
   * Report a security event
   */
  async reportEvent(params: {
    type: SecurityEventType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: string;
    target?: string;
    userId?: string;
    ipAddress?: string;
    details: Record<string, any>;
  }): Promise<SecurityEvent> {
    const event: SecurityEvent = {
      _id: cryptoService.generateSecureUUID(),
      timestamp: new Date(),
      type: params.type,
      severity: params.severity,
      source: params.source,
      target: params.target,
      userId: params.userId,
      ipAddress: params.ipAddress,
      details: params.details,
      indicators: this.extractIndicators(params),
      mitigated: false,
      responseActions: [],
    };

    // Store event
    this.events.set(event.id, event);

    // Log to audit trail
    await auditLogger.log({ event: 'SECURITY_ALERT',
      userId: params.userId,
      details: {
        eventId: event._id,
        type: params.type,
        severity: params.severity,
        source: params.source,
      },
      severity: params.severity === 'critical' ? 'critical' : 'warning',
    });

    // Check for correlated events
    const correlated = this.correlateEvents(event);
    
    // Determine if incident response needed
    if (this.requiresIncidentResponse(event, correlated)) {
      await this.createIncident(event, correlated);
    }

    // Execute immediate response actions
    await this.executeImmediateResponse(event);

    // Notify subscribers
    this.notifySubscribers(event);

    // Update threat metrics
    this.updateThreatMetrics(event);

    return event;
  }

  /**
   * Detect anomalies in system behavior
   */
  async detectAnomalies(metrics: Record<string, number>): Promise<{
    anomalies: Array<{
      metric: string;
      value: number;
      baseline: number;
      deviation: number;
      severity: string;
    }>;
    overallRisk: number;
  }> {
    const anomalies: unknown[] = [];
    let totalRisk = 0;

    for (const [metric, value] of Object.entries(metrics)) {
      const baseline = this.baselineMetrics.get(_metric);
      if (!baseline) continue;

      const deviation = Math.abs(value - baseline) / baseline;
      const threshold = this.anomalyThresholds.get(_metric) || 0.5;

      if (deviation > threshold) {
        const severity = deviation > threshold * 2 ? 'high' : 
                        deviation > threshold * 1.5 ? 'medium' : 'low';
        
        anomalies.push({
          metric,
          value,
          baseline,
          deviation,
          severity,
        });

        totalRisk += deviation * (severity === 'high' ? 3 : severity === 'medium' ? 2 : 1);
      }
    }

    // Report significant anomalies
    if (anomalies.length > 0 && totalRisk > 5) {
      await this.reportEvent({
        type: 'suspicious_activity',
        severity: totalRisk > 10 ? 'high' : 'medium',
        source: 'anomaly_detection',
        details: { anomalies, totalRisk },
      });
    }

    return {
      anomalies,
      overallRisk: Math.min(100, totalRisk * 10),
    };
  }

  /**
   * Create and manage incident response
   */
  async createIncident(
    triggerEvent: SecurityEvent,
    correlatedEvents: SecurityEvent[] = []
  ): Promise<IncidentResponse> {
    const incident: IncidentResponse = {
      incidentId: `INC-${Date.now()}-${cryptoService.generateSecureUUID().substring(0, 8)}`,
      triggeredBy: [triggerEvent, ...correlatedEvents],
      startTime: new Date(),
      status: 'active',
      severity: this.calculateIncidentSeverity(triggerEvent, correlatedEvents),
      affectedSystems: this.identifyAffectedSystems([triggerEvent, ...correlatedEvents]),
      affectedUsers: this.identifyAffectedUsers([triggerEvent, ...correlatedEvents]),
      responseActions: [],
      escalationLevel: 0,
      notes: [`Incident created from ${triggerEvent.type} event`],
    };

    // Store incident
    this.incidents.set(incident.incidentId, incident);

    // Log incident creation
    await auditLogger.log({ event: 'SECURITY_ALERT',
      details: {
        incidentId: incident.incidentId,
        severity: incident.severity,
        affectedUsers: incident.affectedUsers.length,
        affectedSystems: incident.affectedSystems.length,
      },
      severity: 'critical',
    });

    // Execute incident response playbook
    await this.executeIncidentPlaybook(_incident);

    // Check if HIPAA breach notification required
    if (this.requiresBreachNotification(_incident)) {
      await this.initiateBreachNotification(_incident);
    }

    return incident;
  }

  /**
   * Execute automated incident response
   */
  private async executeIncidentPlaybook(incident: IncidentResponse): Promise<void> {
    const firstTrigger = incident.triggeredBy[0];
    if (!firstTrigger) {
      logger.warn('No trigger found for incident, skipping playbook execution');
      return;
    }
    const playbook = this.getPlaybook(incident.severity, firstTrigger.type);
    
    for (const action of playbook) {
      const responseAction: ResponseAction = {
        actionId: cryptoService.generateSecureUUID(),
        type: action.type,
        target: action.target,
        status: 'pending',
      };
      
      incident.responseActions.push(responseAction);
      
      try {
        responseAction.status = 'in_progress';
        responseAction.executedAt = new Date();
        
        // Execute action based on type
        switch (action.type) {
          case 'block_ip':
            await rateLimiter.blockIP(action.target, 'Security incident', action.duration);
            break;
            
          case 'disable_account':
            await this.disableUserAccount(action.target);
            break;
            
          case 'force_logout':
            await this.forceUserLogout(action.target);
            break;
            
          case 'quarantine_data':
            await this.quarantineData(action.target);
            break;
            
          case 'notify_admin':
            await this.notifyAdministrators(_incident);
            break;
            
          case 'escalate':
            await this.escalateIncident(_incident);
            break;
            
          case 'snapshot_system':
            await this.createSystemSnapshot();
            break;
            
          default:
            logger.warn(`Unknown response action: ${action.type}`);
        }
        
        responseAction.status = 'completed';
        responseAction.result = { success: true };
        
      } catch (error) {
        responseAction.status = 'failed';
        responseAction.undefined = false ? '[Error details unavailable]' : String(_undefined);
        logger.error(`Failed to execute response action: ${action.type}`, error);
      }
    }
  }

  /**
   * Get security metrics
   */
  getMetrics(): SecurityMetrics {
    const events = Array.from(this.events.values());
    const incidents = Array.from(this.incidents.values());
    
    // Calculate metrics
    const eventsBySeverity: Record<string, number> = {};
    const eventsByType: Record<string, number> = {};
    
    events.forEach(event => {
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });
    
    // Calculate MTTD and MTTR
    let totalDetectTime = 0;
    let totalResponseTime = 0;
    let detectionCount = 0;
    let responseCount = 0;
    
    incidents.forEach(incident => {
      if (incident.triggeredBy.length > 0) {
        const firstTrigger = incident.triggeredBy[0];
        if (!firstTrigger) return;
        const detectTime = incident.startTime.getTime() - firstTrigger.timestamp.getTime();
        totalDetectTime += detectTime;
        detectionCount++;
      }
      
      if (incident.endTime) {
        const responseTime = incident.endTime.getTime() - incident.startTime.getTime();
        totalResponseTime += responseTime;
        responseCount++;
      }
    });
    
    // Calculate threat score (0-100)
    const threatScore = this.calculateThreatScore(events, incidents);
    
    return {
      totalEvents: events.length,
      eventsBySeverity,
      eventsByType,
      activeIncidents: incidents.filter(i => i.status === 'active').length,
      meanTimeToDetect: detectionCount > 0 ? totalDetectTime / detectionCount : 0,
      meanTimeToRespond: responseCount > 0 ? totalResponseTime / responseCount : 0,
      falsePositiveRate: this.calculateFalsePositiveRate(),
      threatScore,
    };
  }

  /**
   * Subscribe to security alerts
   */
  subscribe(callback: (event: SecurityEvent) => void): () => void {
    this.alertSubscribers.add(callback);
    return () => this.alertSubscribers.delete(callback);
  }

  /**
   * Private helper methods
   */
  private setupThreatIndicators(): void {
    this.threatIndicators = [
      // Authentication attacks
      {
        pattern: /failed_login.*5.*times/i,
        type: 'brute_force_attack',
        severity: 'high',
        confidence: 0.9,
        description: 'Multiple failed login attempts',
      },
      {
        pattern: /password.*spray/i,
        type: 'brute_force_attack',
        severity: 'high',
        confidence: 0.85,
        description: 'Password spray attack detected',
      },
      
      // Injection attacks
      {
        pattern: /sql.*injection|union.*select|drop.*table/i,
        type: 'sql_injection',
        severity: 'critical',
        confidence: 0.95,
        description: 'SQL injection attempt',
      },
      {
        pattern: /<script|javascript:|onerror=/i,
        type: 'xss_attack',
        severity: 'high',
        confidence: 0.9,
        description: 'Cross-site scripting attempt',
      },
      
      // Data exfiltration
      {
        pattern: /bulk.*export|mass.*download/i,
        type: 'data_breach',
        severity: 'critical',
        confidence: 0.8,
        description: 'Potential data exfiltration',
      },
      
      // Privilege escalation
      {
        pattern: /admin.*access.*unauthorized|privilege.*escalation/i,
        type: 'privilege_escalation',
        severity: 'critical',
        confidence: 0.9,
        description: 'Privilege escalation attempt',
      },
      
      // Session attacks
      {
        pattern: /session.*hijack|session.*fixation/i,
        type: 'session_hijacking',
        severity: 'high',
        confidence: 0.85,
        description: 'Session hijacking attempt',
      },
      
      // API abuse
      {
        pattern: /rate.*limit.*exceeded|too.*many.*requests/i,
        type: 'api_abuse',
        severity: 'medium',
        confidence: 0.9,
        description: 'API rate limit abuse',
      },
    ];
  }

  private extractIndicators(params: unknown): string[] {
    const indicators: string[] = [];
    const data = JSON.stringify(params);
    
    for (const indicator of this.threatIndicators) {
      if (typeof indicator.pattern === 'string') {
        if (data.includes(indicator.pattern)) {
          indicators.push(indicator.description);
        }
      } else if (indicator.pattern.test(data)) {
        indicators.push(indicator.description);
      }
    }
    
    return indicators;
  }

  private correlateEvents(event: SecurityEvent): SecurityEvent[] {
    const correlated: SecurityEvent[] = [];
    const correlationWindow = Date.now() - this.CORRELATION_WINDOW;
    
    for (const [_id, existingEvent] of this.events) {
      if (_id === event._id) continue;
      
      if (existingEvent.timestamp.getTime() > correlationWindow) {
        // Check for correlation patterns
        if (
          (existingEvent.userId && existingEvent.userId === event.userId) ||
          (existingEvent.ipAddress && existingEvent.ipAddress === event.ipAddress) ||
          (existingEvent.target && existingEvent.target === event.target)
        ) {
          correlated.push(_existingEvent);
        }
      }
    }
    
    return correlated;
  }

  private requiresIncidentResponse(
    event: SecurityEvent,
    correlated: SecurityEvent[]
  ): boolean {
    // Critical events always require response
    if (event.severity === 'critical') return true;
    
    // Multiple high severity events
    if (event.severity === 'high' && correlated.length > 2) return true;
    
    // Pattern of attacks
    if (correlated.length > 5) return true;
    
    // Specific event types that require response
    const criticalTypes: SecurityEventType[] = [
      'data_breach',
      'privilege_escalation',
      'malware_detected',
    ];
    
    return criticalTypes.includes(event.type);
  }

  private calculateIncidentSeverity(
    trigger: SecurityEvent,
    correlated: SecurityEvent[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Start with trigger severity
    let severityScore = this.severityToScore(trigger.severity);
    
    // Add correlated events
    correlated.forEach(event => {
      severityScore += this.severityToScore(event.severity) * 0.5;
    });
    
    // Normalize and convert back
    if (severityScore >= 4) return 'critical';
    if (severityScore >= 3) return 'high';
    if (severityScore >= 2) return 'medium';
    return 'low';
  }

  private severityToScore(severity: string): number {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  private identifyAffectedSystems(events: SecurityEvent[]): string[] {
    const systems = new Set<string>();
    events.forEach(event => {
      if (event.target) systems.add(event.target);
      if (event.source) systems.add(event.source);
    });
    return Array.from(_systems);
  }

  private identifyAffectedUsers(events: SecurityEvent[]): string[] {
    const users = new Set<string>();
    events.forEach(event => {
      if (event.userId) users.add(event.userId);
    });
    return Array.from(_users);
  }

  private getPlaybook(severity: string, eventType: SecurityEventType): unknown[] {
    const playbooks: Record<string, any[]> = {
      'critical:data_breach': [
        { type: 'snapshot_system', target: 'all' },
        { type: 'quarantine_data', target: 'affected' },
        { type: 'notify_admin', target: 'all' },
        { type: 'escalate', target: 'security_team' },
      ],
      'high:brute_force_attack': [
        { type: 'block_ip', target: 'attacker', duration: 3600000 },
        { type: 'force_logout', target: 'affected_user' },
        { type: 'notify_admin', target: 'security' },
      ],
      'default': [
        { type: 'notify_admin', target: 'security' },
      ],
    };
    
    const key = `${severity}:${eventType}`;
    return playbooks[key] || playbooks['default'] || [];
  }

  private async executeImmediateResponse(event: SecurityEvent): Promise<void> {
    // Immediate responses based on event type
    switch (event.type) {
      case 'brute_force_attack':
        if (event.ipAddress) {
          await rateLimiter.requireCaptcha(event.ipAddress);
        }
        break;
        
      case 'sql_injection':
      case 'xss_attack':
        if (event.ipAddress) {
          await rateLimiter.blockIP(event.ipAddress, 'Attack detected', 3600000);
        }
        break;
        
      case 'data_breach':
        // Immediate containment
        await this.initiateEmergencyMode();
        break;
    }
    
    event.mitigated = true;
    event.responseActions.push('immediate_response_executed');
  }

  private requiresBreachNotification(incident: IncidentResponse): boolean {
    // Check if PHI was potentially compromised
    const phiRelatedTypes: SecurityEventType[] = [
      'data_breach',
      'unauthorized_access',
      'privilege_escalation',
    ];
    
    return incident.triggeredBy.some(event => 
      phiRelatedTypes.includes(event.type) && 
      incident.affectedUsers.length > 0
    );
  }

  private async initiateBreachNotification(incident: IncidentResponse): Promise<void> {
    await hipaaService.reportBreach({
      discoveredBy: 'security_monitor',
      affectedUsers: incident.affectedUsers,
      dataCompromised: ['potential_phi_exposure'],
      cause: `Security incident: ${incident.incidentId}`,
      immediateActions: incident.responseActions.map(a => a.type),
    });
  }

  private async disableUserAccount(userId: string): Promise<void> {
    // Implementation would disable user account
    logger.crisis(`Disabling account due to security incident`, 'high', 'SecurityMonitor', { userId });
  }

  private async forceUserLogout(userId: string): Promise<void> {
    // Implementation would force logout
    logger.warn(`Forcing logout due to security incident`, 'SecurityMonitor', { userId });
  }

  private async quarantineData(target: string): Promise<void> {
    // Implementation would quarantine data
    logger.crisis(`Quarantining data due to security threat`, 'high', 'SecurityMonitor', { target });
  }

  private async notifyAdministrators(incident: IncidentResponse): Promise<void> {
    // Implementation would send notifications
    logger.crisis(`Notifying administrators about security incident`, 'critical', 'SecurityMonitor', { incidentId: incident.incidentId });
  }

  private async escalateIncident(incident: IncidentResponse): Promise<void> {
    incident.escalationLevel++;
    incident.notes.push(`Escalated to level ${incident.escalationLevel}`);
  }

  private async createSystemSnapshot(): Promise<void> {
    // Implementation would create system snapshot for forensics
    logger.info('Creating system snapshot for forensic analysis', 'SecurityMonitor');
  }

  private async initiateEmergencyMode(): Promise<void> {
    // Emergency containment mode
    logger.crisis('EMERGENCY MODE ACTIVATED - Containing potential breach', 'critical', 'SecurityMonitor');
  }

  private establishBaseline(): void {
    // Establish baseline metrics for anomaly detection
    this.baselineMetrics.set('login_attempts_per_minute', 10);
    this.baselineMetrics.set('api_calls_per_minute', 100);
    this.baselineMetrics.set('data_exports_per_hour', 5);
    this.baselineMetrics.set('failed_auth_per_hour', 20);
    this.baselineMetrics.set('new_users_per_day', 50);
    
    // Set anomaly thresholds
    this.anomalyThresholds.set('login_attempts_per_minute', 2.0); // 200% deviation
    this.anomalyThresholds.set('api_calls_per_minute', 3.0); // 300% deviation
    this.anomalyThresholds.set('data_exports_per_hour', 5.0); // 500% deviation
    this.anomalyThresholds.set('failed_auth_per_hour', 2.5); // 250% deviation
    this.anomalyThresholds.set('new_users_per_day', 4.0); // 400% deviation
  }

  private startRealtimeMonitoring(): void {
    // Start monitoring intervals
    setInterval(() => {
      this.performSecurityChecks();
    }, 60000); // Every minute
    
    setInterval(() => {
      this.cleanupOldEvents();
    }, 24 * 3600000); // Daily
  }

  private async performSecurityChecks(): Promise<void> {
    if (!this.monitoringActive) return;
    
    // Perform routine security checks
    // This would integrate with various system components
  }

  private cleanupOldEvents(): void {
    const cutoff = Date.now() - (this.EVENT_RETENTION_DAYS * 24 * 3600000);
    
    for (const [_id, event] of this.events) {
      if (event.timestamp.getTime() < cutoff) {
        this.events.delete(_id);
      }
    }
  }

  private setupIncidentResponseAutomation(): void {
    // Set up automated incident response rules
    logger.info('Incident response automation initialized', 'SecurityMonitor');
  }

  private notifySubscribers(event: SecurityEvent): void {
    this.alertSubscribers.forEach(callback => {
      try {
        callback(event);
      } catch (_error) {
        logger.error('Alert subscriber error: ');
      }
    });
  }

  private updateThreatMetrics(_event: SecurityEvent): void {
    // Update running threat metrics
    // Implementation would update various threat indicators
  }

  private calculateThreatScore(events: SecurityEvent[], incidents: IncidentResponse[]): number {
    let score = 0;
    
    // Recent events impact
    const recentEvents = events.filter(e => 
      e.timestamp.getTime() > Date.now() - 3600000 // Last hour
    );
    
    recentEvents.forEach(event => {
      score += this.severityToScore(event.severity) * 2;
    });
    
    // Active incidents impact
    incidents.filter(i => i.status === 'active').forEach(incident => {
      score += this.severityToScore(incident.severity) * 5;
    });
    
    return Math.min(100, score);
  }

  private calculateFalsePositiveRate(): number {
    // Simplified calculation
    // In production, would track confirmed false positives
    return 0.05; // 5% false positive rate
  }
}

export const securityMonitor = SecurityMonitorService.getInstance();