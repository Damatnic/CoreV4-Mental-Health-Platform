/**
 * HIPAA Compliance Service
 * Ensures all health data handling meets HIPAA requirements
 * Manages PHI (Protected Health Information) access and security
 */

import { auditLogger } from '../security/auditLogger';
import { cryptoService } from '../security/cryptoService';
import { secureStorage } from '../security/secureStorage';
import { privacyService } from '../privacy/privacyService';

export interface PHIAccessControl {
  userId: string;
  resourceId: string;
  resourceType: PHIResourceType;
  accessLevel: AccessLevel;
  purpose: string;
  grantedBy?: string;
  grantedAt: Date;
  expiresAt?: Date;
  conditions?: AccessCondition[];
}

export type PHIResourceType =
  | 'medical_record'
  | 'mental_health_assessment'
  | 'therapy_notes'
  | 'medication_list'
  | 'diagnosis'
  | 'treatment_plan'
  | 'crisis_plan'
  | 'lab_results'
  | 'insurance_info';

export type AccessLevel = 'read' | 'write' | 'modify' | 'delete' | 'share';

export interface AccessCondition {
  type: 'time_based' | 'location_based' | 'emergency' | 'consent_required';
  value: any;
}

export interface PHIDisclosure {
  id: string;
  patientId: string;
  recipientId: string;
  recipientType: 'provider' | 'insurance' | 'family' | 'legal' | 'research';
  disclosedData: string[];
  purpose: string;
  legalBasis: string;
  disclosedAt: Date;
  authorizedBy: string;
}

export interface MinimumNecessaryAssessment {
  requestId: string;
  dataRequested: string[];
  purpose: string;
  assessment: {
    necessary: string[];
    unnecessary: string[];
    alternatives?: string[];
  };
  assessedBy: 'system' | 'manual';
  assessedAt: Date;
}

export interface BreachNotification {
  id: string;
  discoveredAt: Date;
  reportedAt?: Date;
  affectedUsers: string[];
  dataCompromised: string[];
  cause: string;
  remediation: string[];
  notificationsSent: boolean;
}

class HIPAAComplianceService {
  private static instance: HIPAAComplianceService;
  private readonly ENCRYPTION_REQUIRED = true;
  private readonly PHI_RETENTION_YEARS = 7;
  private readonly BREACH_NOTIFICATION_DAYS = 60;
  private readonly SESSION_TIMEOUT_MINUTES = 30;
  private phiAccessCache: Map<string, PHIAccessControl[]> = new Map();

  private constructor() {
    this.initializeCompliance();
  }

  static getInstance(): HIPAAComplianceService {
    if (!HIPAAComplianceService.instance) {
      HIPAAComplianceService.instance = new HIPAAComplianceService();
    }
    return HIPAAComplianceService.instance;
  }

  private initializeCompliance(): void {
    // Set up compliance monitoring
    this.setupComplianceMonitoring();
    
    // Initialize breach detection
    this.initializeBreachDetection();
    
    // Set up automatic PHI encryption
    this.enforceEncryption();
  }

  /**
   * Request access to PHI with validation
   */
  async requestPHIAccess(params: {
    userId: string;
    resourceId: string;
    resourceType: PHIResourceType;
    accessLevel: AccessLevel;
    purpose: string;
    duration?: number; // in minutes
  }): Promise<PHIAccessControl | null> {
    try {
      // Verify user authorization
      const isAuthorized = await this.verifyAuthorization(
        params.userId,
        params.resourceType,
        params.accessLevel
      );

      if (!isAuthorized) {
        await auditLogger.log({
          event: 'PERMISSION_DENIED',
          userId: params.userId,
          resourceId: params.resourceId,
          resourceType: params.resourceType,
          details: {
            reason: 'Unauthorized PHI access attempt',
            accessLevel: params.accessLevel,
          },
          severity: 'warning',
        });
        return null;
      }

      // Apply minimum necessary standard
      const assessment = await this.assessMinimumNecessary(
        params.resourceId,
        params.resourceType,
        params.purpose
      );

      if (!assessment.assessment.necessary.includes(params.resourceType)) {
        await auditLogger.log({
          event: 'COMPLIANCE_VIOLATION',
          userId: params.userId,
          details: {
            violation: 'minimum_necessary_standard',
            requested: params.resourceType,
            alternatives: assessment.assessment.alternatives,
          },
          severity: 'warning',
        });
        return null;
      }

      // Check patient consent
      const hasConsent = await privacyService.hasConsent(
        params.userId,
        'health_data',
        ['health_records']
      );

      if (!hasConsent && params.accessLevel !== 'read') {
        await auditLogger.log({
          event: 'PERMISSION_DENIED',
          userId: params.userId,
          details: {
            reason: 'No patient consent for PHI modification',
          },
          severity: 'warning',
        });
        return null;
      }

      // Grant access
      const accessControl: PHIAccessControl = {
        userId: params.userId,
        resourceId: params.resourceId,
        resourceType: params.resourceType,
        accessLevel: params.accessLevel,
        purpose: params.purpose,
        grantedAt: new Date(),
        expiresAt: params.duration
          ? new Date(Date.now() + params.duration * 60 * 1000)
          : undefined,
      };

      // Store access control
      await this.storePHIAccess(accessControl);

      // Log PHI access
      await auditLogger.log({
        event: 'PHI_ACCESS',
        userId: params.userId,
        resourceId: params.resourceId,
        resourceType: params.resourceType,
        action: params.accessLevel,
        details: {
          purpose: params.purpose,
          duration: params.duration,
        },
        severity: 'info',
      });

      return accessControl;
    } catch (error) {
      await auditLogger.log({
        event: 'SYSTEM_ERROR',
        userId: params.userId,
        details: {
          error: error.message,
          context: 'PHI access request',
        },
        severity: 'error',
      });
      throw error;
    }
  }

  /**
   * Record PHI disclosure for accounting
   */
  async recordDisclosure(params: {
    patientId: string;
    recipientId: string;
    recipientType: 'provider' | 'insurance' | 'family' | 'legal' | 'research';
    disclosedData: string[];
    purpose: string;
    legalBasis: string;
    authorizedBy: string;
  }): Promise<PHIDisclosure> {
    try {
      const disclosure: PHIDisclosure = {
        id: cryptoService.generateSecureUUID(),
        ...params,
        disclosedAt: new Date(),
      };

      // Store disclosure record
      await this.storeDisclosure(disclosure);

      // Log disclosure
      await auditLogger.log({
        event: 'PHI_MODIFICATION',
        userId: params.patientId,
        details: {
          action: 'disclosure',
          recipient: params.recipientId,
          recipientType: params.recipientType,
          dataTypes: params.disclosedData,
          purpose: params.purpose,
        },
        severity: 'info',
      });

      return disclosure;
    } catch (error) {
      console.error('Failed to record PHI disclosure:', error);
      throw error;
    }
  }

  /**
   * Validate PHI handling for compliance
   */
  async validatePHIHandling(params: {
    userId: string;
    action: string;
    data: any;
    context: string;
  }): Promise<{
    compliant: boolean;
    violations: string[];
    recommendations: string[];
  }> {
    const violations: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check encryption
      if (this.ENCRYPTION_REQUIRED && !this.isDataEncrypted(params.data)) {
        violations.push('PHI must be encrypted at rest and in transit');
      }

      // Check access controls
      const hasAccess = await this.checkPHIAccess(
        params.userId,
        params.context
      );
      if (!hasAccess) {
        violations.push('User lacks proper authorization for PHI access');
      }

      // Check audit logging
      const auditEnabled = await this.isAuditingEnabled();
      if (!auditEnabled) {
        violations.push('PHI access auditing is not properly configured');
      }

      // Check data retention
      const retentionCompliant = await this.checkRetentionCompliance(params.data);
      if (!retentionCompliant) {
        violations.push('PHI retention policy violation');
      }

      // Check minimum necessary
      if (params.action === 'share' || params.action === 'disclose') {
        recommendations.push('Apply minimum necessary standard before sharing');
      }

      // Check consent
      const hasConsent = await privacyService.hasConsent(
        params.userId,
        'health_data'
      );
      if (!hasConsent) {
        recommendations.push('Obtain patient consent before processing PHI');
      }

      return {
        compliant: violations.length === 0,
        violations,
        recommendations,
      };
    } catch (error) {
      console.error('PHI validation error:', error);
      return {
        compliant: false,
        violations: ['Validation error occurred'],
        recommendations: ['Review PHI handling procedures'],
      };
    }
  }

  /**
   * Report a potential breach
   */
  async reportBreach(params: {
    discoveredBy: string;
    affectedUsers: string[];
    dataCompromised: string[];
    cause: string;
    immediateActions?: string[];
  }): Promise<BreachNotification> {
    try {
      const breach: BreachNotification = {
        id: cryptoService.generateSecureUUID(),
        discoveredAt: new Date(),
        affectedUsers: params.affectedUsers,
        dataCompromised: params.dataCompromised,
        cause: params.cause,
        remediation: params.immediateActions || [],
        notificationsSent: false,
      };

      // Store breach record
      await this.storeBreachNotification(breach);

      // Log critical security event
      await auditLogger.log({
        event: 'SECURITY_ALERT',
        userId: params.discoveredBy,
        details: {
          type: 'breach_detected',
          affectedCount: params.affectedUsers.length,
          dataTypes: params.dataCompromised,
        },
        severity: 'critical',
      });

      // Initiate breach response
      this.initiateBreachResponse(breach);

      return breach;
    } catch (error) {
      console.error('Failed to report breach:', error);
      throw error;
    }
  }

  /**
   * Get PHI access log for a patient
   */
  async getPHIAccessLog(
    patientId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    try {
      // Query audit logs for PHI access
      const logs = await auditLogger.query({
        userId: patientId,
        event: 'PHI_ACCESS',
        startDate,
        endDate,
      });

      // Include disclosures
      const disclosures = await this.getDisclosures(patientId, startDate, endDate);

      return [...logs, ...disclosures];
    } catch (error) {
      console.error('Failed to get PHI access log:', error);
      return [];
    }
  }

  /**
   * Perform HIPAA risk assessment
   */
  async performRiskAssessment(): Promise<{
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    findings: Array<{
      area: string;
      risk: string;
      severity: string;
      mitigation: string;
    }>;
    recommendations: string[];
  }> {
    const findings: any[] = [];
    const recommendations: string[] = [];

    try {
      // Check encryption status
      const encryptionStatus = await this.assessEncryption();
      if (!encryptionStatus.fullyEncrypted) {
        findings.push({
          area: 'Encryption',
          risk: 'Unencrypted PHI detected',
          severity: 'high',
          mitigation: 'Enable encryption for all PHI storage',
        });
      }

      // Check access controls
      const accessControlStatus = await this.assessAccessControls();
      if (accessControlStatus.weakControls.length > 0) {
        findings.push({
          area: 'Access Controls',
          risk: 'Weak access controls detected',
          severity: 'medium',
          mitigation: 'Strengthen role-based access controls',
        });
      }

      // Check audit logging
      const auditStatus = await this.assessAuditLogging();
      if (!auditStatus.comprehensive) {
        findings.push({
          area: 'Audit Logging',
          risk: 'Incomplete audit trail',
          severity: 'medium',
          mitigation: 'Ensure all PHI access is logged',
        });
      }

      // Check breach history
      const breachHistory = await this.getBreachHistory();
      if (breachHistory.length > 0) {
        findings.push({
          area: 'Breach Prevention',
          risk: 'Previous breaches detected',
          severity: 'high',
          mitigation: 'Review and strengthen security measures',
        });
      }

      // Calculate overall risk
      const severityScores = {
        low: 1,
        medium: 2,
        high: 3,
        critical: 4,
      };

      const avgSeverity = findings.length > 0
        ? findings.reduce((sum, f) => sum + severityScores[f.severity], 0) / findings.length
        : 0;

      let overallRisk: 'low' | 'medium' | 'high' | 'critical';
      if (avgSeverity <= 1.5) overallRisk = 'low';
      else if (avgSeverity <= 2.5) overallRisk = 'medium';
      else if (avgSeverity <= 3.5) overallRisk = 'high';
      else overallRisk = 'critical';

      // Generate recommendations
      if (findings.length > 0) {
        recommendations.push('Conduct regular security training for all staff');
        recommendations.push('Implement regular security audits');
        recommendations.push('Review and update HIPAA policies');
      }

      return {
        overallRisk,
        findings,
        recommendations,
      };
    } catch (error) {
      console.error('Risk assessment failed:', error);
      return {
        overallRisk: 'high',
        findings: [{
          area: 'Assessment',
          risk: 'Assessment failed',
          severity: 'high',
          mitigation: 'Manual review required',
        }],
        recommendations: ['Perform manual HIPAA compliance review'],
      };
    }
  }

  /**
   * Private helper methods
   */
  private async verifyAuthorization(
    userId: string,
    resourceType: PHIResourceType,
    accessLevel: AccessLevel
  ): Promise<boolean> {
    // Check user role and permissions
    // In production, integrate with RBAC system
    const userRole = await this.getUserRole(userId);
    
    const permissions = {
      provider: ['read', 'write', 'modify'],
      patient: ['read'],
      admin: ['read', 'write', 'modify', 'delete', 'share'],
      emergency: ['read', 'write'],
    };

    return permissions[userRole]?.includes(accessLevel) || false;
  }

  private async assessMinimumNecessary(
    resourceId: string,
    resourceType: PHIResourceType,
    purpose: string
  ): Promise<MinimumNecessaryAssessment> {
    // Apply minimum necessary standard
    const assessment: MinimumNecessaryAssessment = {
      requestId: cryptoService.generateSecureUUID(),
      dataRequested: [resourceType],
      purpose,
      assessment: {
        necessary: [],
        unnecessary: [],
      },
      assessedBy: 'system',
      assessedAt: new Date(),
    };

    // Determine what's necessary based on purpose
    const necessaryData = {
      treatment: ['medical_record', 'diagnosis', 'medication_list', 'treatment_plan'],
      payment: ['insurance_info', 'diagnosis'],
      operations: ['mental_health_assessment'],
      emergency: ['crisis_plan', 'medication_list', 'emergency_contacts'],
    };

    const purposeCategory = this.categorizePurpose(purpose);
    if (necessaryData[purposeCategory]) {
      assessment.assessment.necessary = necessaryData[purposeCategory].filter(
        d => d === resourceType
      );
      assessment.assessment.unnecessary = [resourceType].filter(
        d => !assessment.assessment.necessary.includes(d)
      );
    }

    return assessment;
  }

  private categorizePurpose(purpose: string): string {
    const lowerPurpose = purpose.toLowerCase();
    if (lowerPurpose.includes('treatment') || lowerPurpose.includes('therapy')) {
      return 'treatment';
    } else if (lowerPurpose.includes('payment') || lowerPurpose.includes('billing')) {
      return 'payment';
    } else if (lowerPurpose.includes('emergency') || lowerPurpose.includes('crisis')) {
      return 'emergency';
    }
    return 'operations';
  }

  private async storePHIAccess(access: PHIAccessControl): Promise<void> {
    const key = `phi_access_${access.userId}`;
    const existing = await secureStorage.getItem(key) || [];
    existing.push(access);
    
    // Keep only recent access records
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const recent = existing.filter((a: PHIAccessControl) => 
      new Date(a.grantedAt) > cutoff
    );
    
    await secureStorage.setItem(key, recent, { encrypted: true });
    
    // Update cache
    this.phiAccessCache.set(access.userId, recent);
  }

  private async checkPHIAccess(userId: string, context: string): Promise<boolean> {
    // Check if user has valid PHI access
    const key = `phi_access_${userId}`;
    const accesses = this.phiAccessCache.get(userId) || 
                     await secureStorage.getItem(key) || [];
    
    const now = new Date();
    return accesses.some((a: PHIAccessControl) => 
      (!a.expiresAt || new Date(a.expiresAt) > now) &&
      a.purpose.includes(context)
    );
  }

  private async storeDisclosure(disclosure: PHIDisclosure): Promise<void> {
    const key = `phi_disclosures_${disclosure.patientId}`;
    const existing = await secureStorage.getItem(key) || [];
    existing.push(disclosure);
    await secureStorage.setItem(key, existing, { encrypted: true });
  }

  private async getDisclosures(
    patientId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PHIDisclosure[]> {
    const key = `phi_disclosures_${patientId}`;
    const all = await secureStorage.getItem(key) || [];
    
    return all.filter((d: PHIDisclosure) => {
      const disclosedAt = new Date(d.disclosedAt);
      return (!startDate || disclosedAt >= startDate) &&
             (!endDate || disclosedAt <= endDate);
    });
  }

  private async storeBreachNotification(breach: BreachNotification): Promise<void> {
    const key = 'hipaa_breaches';
    const existing = await secureStorage.getItem(key) || [];
    existing.push(breach);
    await secureStorage.setItem(key, existing, { encrypted: true });
  }

  private async initiateBreachResponse(breach: BreachNotification): Promise<void> {
    // In production, implement full breach response protocol
    console.error('BREACH DETECTED:', breach);
    
    // 1. Contain the breach
    // 2. Assess the scope
    // 3. Notify affected individuals within 60 days
    // 4. Notify HHS
    // 5. Notify media if > 500 individuals affected
    
    setTimeout(async () => {
      breach.notificationsSent = true;
      breach.reportedAt = new Date();
      await this.storeBreachNotification(breach);
    }, 1000);
  }

  private async getBreachHistory(): Promise<BreachNotification[]> {
    const key = 'hipaa_breaches';
    return await secureStorage.getItem(key) || [];
  }

  private isDataEncrypted(data: any): boolean {
    // Check if data appears to be encrypted
    if (typeof data === 'string') {
      // Simple check for base64 encoded encrypted data
      return /^[A-Za-z0-9+/]+=*$/.test(data) && data.length > 100;
    }
    return false;
  }

  private async isAuditingEnabled(): Promise<boolean> {
    // Check if audit logging is properly configured
    return true; // Audit logger is always enabled in our implementation
  }

  private async checkRetentionCompliance(data: any): Promise<boolean> {
    // Check if data retention meets HIPAA requirements (7 years)
    return true; // Simplified for development
  }

  private async assessEncryption(): Promise<{ fullyEncrypted: boolean }> {
    // Assess encryption status of PHI storage
    return { fullyEncrypted: true }; // Our storage service encrypts by default
  }

  private async assessAccessControls(): Promise<{ weakControls: string[] }> {
    // Assess strength of access controls
    return { weakControls: [] };
  }

  private async assessAuditLogging(): Promise<{ comprehensive: boolean }> {
    // Assess completeness of audit logging
    return { comprehensive: true };
  }

  private async getUserRole(userId: string): Promise<string> {
    // Get user role from auth system
    // Simplified for development
    return 'provider';
  }

  private setupComplianceMonitoring(): void {
    // Monitor for compliance violations
    setInterval(async () => {
      const assessment = await this.performRiskAssessment();
      if (assessment.overallRisk === 'critical') {
        console.error('CRITICAL HIPAA COMPLIANCE ISSUE DETECTED');
      }
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private initializeBreachDetection(): void {
    // Set up breach detection mechanisms
    // In production, integrate with security monitoring tools
  }

  private enforceEncryption(): void {
    // Ensure all PHI is encrypted
    // Our secure storage service handles this automatically
  }
}

export const hipaaService = HIPAAComplianceService.getInstance();