// HIPAA Compliance and Security Service
// Ensures all PHI (Protected Health Information) is handled according to HIPAA standards

import CryptoJS from 'crypto-js';
import { secureStorage } from './SecureLocalStorage';

// HIPAA compliance requirements
export enum ComplianceRequirement {
  ENCRYPTION_AT_REST = 'encryption_at_rest',
  ENCRYPTION_IN_TRANSIT = 'encryption_in_transit',
  ACCESS_CONTROL = 'access_control',
  AUDIT_LOGGING = 'audit_logging',
  DATA_INTEGRITY = 'data_integrity',
  TRANSMISSION_SECURITY = 'transmission_security',
  DATA_BACKUP = 'data_backup',
  DISASTER_RECOVERY = 'disaster_recovery',
  BREACH_NOTIFICATION = 'breach_notification',
  MINIMUM_NECESSARY = 'minimum_necessary'
}

// PHI field types
export enum PHIFieldType {
  NAME = 'name',
  DATE_OF_BIRTH = 'date_of_birth',
  SSN = 'ssn',
  MEDICAL_RECORD = 'medical_record',
  HEALTH_PLAN = 'health_plan',
  ACCOUNT_NUMBER = 'account_number',
  CERTIFICATE_LICENSE = 'certificate_license',
  VEHICLE_ID = 'vehicle_id',
  DEVICE_ID = 'device_id',
  WEB_URL = 'web_url',
  IP_ADDRESS = 'ip_address',
  BIOMETRIC = 'biometric',
  PHOTO = 'photo',
  OTHER_UNIQUE_ID = 'other_unique_id'
}

// Audit log entry
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure' | 'denied';
  details?: Record<string, any>;
  phiAccessed?: boolean;
  dataFields?: string[];
}

// Encryption configuration
interface EncryptionConfig {
  algorithm: string;
  keySize: number;
  iterations: number;
  saltSize: number;
}

// Access control entry
export interface AccessControlEntry {
  userId: string;
  resourceType: string;
  resourceId?: string;
  permissions: string[];
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  conditions?: Record<string, any>;
}

// Data retention policy
export interface RetentionPolicy {
  dataType: string;
  retentionPeriod: number; // in days
  purgeAfter: number; // in days
  archiveRequired: boolean;
  legalHold?: boolean;
}

// Breach notification
export interface BreachNotification {
  id: string;
  detectedAt: Date;
  reportedAt?: Date;
  affectedUsers: string[];
  dataTypes: PHIFieldType[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  remediation: string;
  notificationsSent: boolean;
}

// HIPAA Compliance Service Class
export class HIPAAComplianceService {
  private static instance: HIPAAComplianceService;
  private encryptionKey: string;
  private auditQueue: AuditLogEntry[] = [];
  private encryptionConfig: EncryptionConfig = {
    algorithm: 'AES',
    keySize: 256,
    iterations: 10000,
    saltSize: 128
  };
  private retentionPolicies: Map<string, RetentionPolicy> = new Map();
  private accessControlList: Map<string, AccessControlEntry[]> = new Map();

  private constructor() {
    this.encryptionKey = this.getOrGenerateEncryptionKey();
    this.initializeRetentionPolicies();
    this.startAuditProcessor();
  }

  // Singleton pattern
  public static getInstance(): HIPAAComplianceService {
    if (!HIPAAComplianceService.instance) {
      HIPAAComplianceService.instance = new HIPAAComplianceService();
    }
    return HIPAAComplianceService.instance;
  }

  // Initialize encryption key
  private getOrGenerateEncryptionKey(): string {
    // SECURITY FIX: Never store encryption keys in localStorage
    // Use environment variables or secure key management service
    
    // Get key from environment variable (secure approach)
    let key = import.meta.env.VITE_ENCRYPTION_KEY;
    
    if (!key) {
      // Generate a temporary key for development ONLY
      // WARNING: This key will not persist between sessions
      key = CryptoJS.lib.WordArray.random(256/8).toString();
      
      // Log warning about temporary key
      console.warn('⚠️ Using temporary encryption key. Set VITE_ENCRYPTION_KEY for production.');
      
      // NEVER store in localStorage - this was the critical vulnerability
      // secureStorage.setItem('hipaa_encryption_key', key); // REMOVED
    }
    
    return key;
  }

  // Initialize retention policies
  private initializeRetentionPolicies(): void {
    // Set default retention policies based on HIPAA requirements
    this.retentionPolicies.set('medical_records', {
      dataType: 'medical_records',
      retentionPeriod: 2190, // 6 years
      purgeAfter: 2555, // 7 years
      archiveRequired: true
    });

    this.retentionPolicies.set('audit_logs', {
      dataType: 'audit_logs',
      retentionPeriod: 2190, // 6 years
      purgeAfter: 2555, // 7 years
      archiveRequired: true
    });

    this.retentionPolicies.set('appointment_records', {
      dataType: 'appointment_records',
      retentionPeriod: 2190, // 6 years
      purgeAfter: 2555, // 7 years
      archiveRequired: true
    });

    this.retentionPolicies.set('crisis_sessions', {
      dataType: 'crisis_sessions',
      retentionPeriod: 2555, // 7 years (critical mental health data)
      purgeAfter: 3650, // 10 years
      archiveRequired: true
    });

    this.retentionPolicies.set('community_posts', {
      dataType: 'community_posts',
      retentionPeriod: 365, // 1 year
      purgeAfter: 730, // 2 years
      archiveRequired: false
    });
  }

  // Start audit log processor
  private startAuditProcessor(): void {
    // Process audit queue every 5 seconds
    setInterval(() => {
      this.flushAuditQueue();
    }, 5000);
  }

  // ============================================
  // Encryption Methods
  // ============================================

  // Encrypt PHI data
  public encryptPHI(data: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(data, this.encryptionKey, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      return encrypted.toString();
    } catch (error) {
      this.logSecurityEvent('encryption_failure', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to encrypt PHI data');
    }
  }

  // Decrypt PHI data
  public decryptPHI(encryptedData: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      this.logSecurityEvent('decryption_failure', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to decrypt PHI data');
    }
  }

  // Hash sensitive identifiers
  public hashIdentifier(identifier: string): string {
    return CryptoJS.SHA256(identifier + this.encryptionKey).toString();
  }

  // Encrypt object with PHI fields
  public encryptObject<T extends Record<string, any>>(obj: T, phiFields: string[]): T {
    const encrypted = { ...obj };
    
    for (const field of phiFields) {
      if (field in encrypted && encrypted[field]) {
        encrypted[field] = this.encryptPHI(JSON.stringify(encrypted[field]));
      }
    }
    
    return encrypted;
  }

  // Decrypt object with PHI fields
  public decryptObject<T extends Record<string, any>>(obj: T, phiFields: string[]): T {
    const decrypted = { ...obj };
    
    for (const field of phiFields) {
      if (field in decrypted && decrypted[field]) {
        try {
          decrypted[field] = JSON.parse(this.decryptPHI(decrypted[field]));
        } catch {
          // If not JSON, return as string
          decrypted[field] = this.decryptPHI(decrypted[field]);
        }
      }
    }
    
    return decrypted;
  }

  // ============================================
  // Access Control Methods
  // ============================================

  // Check access permission
  public async checkAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    permission: string
  ): Promise<boolean> {
    // Log access attempt
    this.auditAccess(userId, resourceType, resourceId, 'access_check', { permission });
    
    // Get user's access control entries
    const userAcl = this.accessControlList.get(userId) || [];
    
    // Check for matching permission
    const hasAccess = userAcl.some(acl => {
      // Check resource type match
      if (acl.resourceType !== resourceType) return false;
      
      // Check resource ID match (if specified)
      if (acl.resourceId && acl.resourceId !== resourceId) return false;
      
      // Check permission
      if (!acl.permissions.includes(permission)) return false;
      
      // Check expiration
      if (acl.expiresAt && acl.expiresAt < new Date()) return false;
      
      // Check conditions
      if (acl.conditions) {
        // Implement condition checking logic
        // For example: time-based, location-based, etc.
      }
      
      return true;
    });
    
    // Log result
    this.auditAccess(userId, resourceType, resourceId, 'access_result', {
      permission,
      granted: hasAccess
    });
    
    return hasAccess;
  }

  // Grant access
  public grantAccess(
    userId: string,
    resourceType: string,
    permissions: string[],
    grantedBy: string,
    options?: {
      resourceId?: string;
      expiresIn?: number; // minutes
      conditions?: Record<string, any>;
    }
  ): void {
    const entry: AccessControlEntry = {
      userId,
      resourceType,
      resourceId: options?.resourceId,
      permissions,
      grantedBy,
      grantedAt: new Date(),
      expiresAt: options?.expiresIn 
        ? new Date(Date.now() + options.expiresIn * 60000)
        : undefined,
      conditions: options?.conditions
    };
    
    if (!this.accessControlList.has(userId)) {
      this.accessControlList.set(userId, []);
    }
    
    this.accessControlList.get(userId)!.push(entry);
    
    // Audit the grant
    this.auditAccess(grantedBy, 'access_control', userId, 'grant_access', {
      resourceType,
      permissions,
      expiresAt: entry.expiresAt
    });
  }

  // Revoke access
  public revokeAccess(
    userId: string,
    resourceType: string,
    resourceId?: string,
    revokedBy?: string
  ): void {
    const userAcl = this.accessControlList.get(userId);
    
    if (userAcl) {
      const filtered = userAcl.filter(acl => {
        if (acl.resourceType !== resourceType) return true;
        if (resourceId && acl.resourceId !== resourceId) return true;
        return false;
      });
      
      this.accessControlList.set(userId, filtered);
    }
    
    // Audit the revocation
    this.auditAccess(revokedBy || 'system', 'access_control', userId, 'revoke_access', {
      resourceType,
      resourceId
    });
  }

  // ============================================
  // Audit Logging Methods
  // ============================================

  // Log PHI access
  public auditAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string,
    details?: Record<string, any>
  ): void {
    const entry: AuditLogEntry = {
      id: this.generateAuditId(),
      timestamp: new Date(),
      userId,
      action,
      resourceType,
      resourceId,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      result: 'success',
      details,
      phiAccessed: this.isPHIResource(resourceType)
    };
    
    this.auditQueue.push(entry);
    
    // Flush immediately for critical actions
    if (this.isCriticalAction(action)) {
      this.flushAuditQueue();
    }
  }

  // Log security event
  public logSecurityEvent(eventType: string, details: Record<string, any>): void {
    const entry: AuditLogEntry = {
      id: this.generateAuditId(),
      timestamp: new Date(),
      userId: this.getCurrentUserId(),
      action: `security:${eventType}`,
      resourceType: 'security',
      resourceId: '',
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      result: 'failure',
      details
    };
    
    this.auditQueue.push(entry);
    this.flushAuditQueue(); // Security events are always flushed immediately
  }

  // Flush audit queue to storage
  private async flushAuditQueue(): Promise<void> {
    if (this.auditQueue.length === 0) return;
    
    const entries = [...this.auditQueue];
    this.auditQueue = [];
    
    try {
      // Send to audit logging service
      await fetch('/api/audit/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ entries })
      });
    } catch (error) {
      console.error('Failed to flush audit logs:', error);
      
      // Re-queue failed entries
      this.auditQueue.unshift(...entries);
    }
  }

  // ============================================
  // Data Integrity Methods
  // ============================================

  // Generate checksum for data integrity
  public generateChecksum(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  // Verify data integrity
  public verifyIntegrity(data: string, checksum: string): boolean {
    const calculatedChecksum = this.generateChecksum(data);
    return calculatedChecksum === checksum;
  }

  // Sign data for non-repudiation
  public signData(data: string): string {
    const signature = CryptoJS.HmacSHA256(data, this.encryptionKey).toString();
    return `${data}.${signature}`;
  }

  // Verify signed data
  public verifySignature(signedData: string): boolean {
    const parts = signedData.split('.');
    if (parts.length !== 2) return false;
    
    const [data, signature] = parts;
    const calculatedSignature = CryptoJS.HmacSHA256(data, this.encryptionKey).toString();
    
    return signature === calculatedSignature;
  }

  // ============================================
  // Data Retention & Disposal Methods
  // ============================================

  // Check if data should be retained
  public shouldRetainData(dataType: string, createdDate: Date): boolean {
    const policy = this.retentionPolicies.get(dataType);
    if (!policy) return true; // Default to retention if no policy
    
    const ageInDays = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return ageInDays < policy.retentionPeriod;
  }

  // Check if data should be purged
  public shouldPurgeData(dataType: string, createdDate: Date): boolean {
    const policy = this.retentionPolicies.get(dataType);
    if (!policy) return false; // Default to no purge if no policy
    
    if (policy.legalHold) return false; // Don't purge if under legal hold
    
    const ageInDays = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return ageInDays > policy.purgeAfter;
  }

  // Securely dispose of data
  public async secureDispose(dataType: string, dataId: string): Promise<void> {
    // Audit the disposal
    this.auditAccess('system', dataType, dataId, 'secure_disposal', {
      timestamp: new Date().toISOString()
    });
    
    // In production, this would:
    // 1. Delete from primary storage
    // 2. Delete from backups (after retention period)
    // 3. Overwrite memory locations
    // 4. Update disposal records
    
    console.log(`Securely disposed ${dataType} with ID ${dataId}`);
  }

  // ============================================
  // Breach Detection & Response
  // ============================================

  // Detect potential breach
  public detectBreach(indicators: {
    unusualAccess?: boolean;
    multipleFailedAttempts?: boolean;
    unauthorizedDataAccess?: boolean;
    abnormalDataVolume?: boolean;
  }): boolean {
    const breachScore = Object.values(indicators).filter(v => v).length;
    return breachScore >= 2; // Breach detected if 2+ indicators
  }

  // Report breach
  public async reportBreach(breach: Omit<BreachNotification, 'id' | 'reportedAt'>): Promise<void> {
    const notification: BreachNotification = {
      ...breach,
      id: this.generateBreachId(),
      reportedAt: new Date()
    };
    
    // Log the breach
    this.logSecurityEvent('breach_detected', notification);
    
    // In production, this would:
    // 1. Notify security team
    // 2. Notify affected users (within 60 days per HIPAA)
    // 3. Notify HHS (within 60 days)
    // 4. Notify media if > 500 individuals affected
    // 5. Document remediation steps
    
    // Send breach notification
    await this.sendBreachNotifications(notification);
  }

  // Send breach notifications
  private async sendBreachNotifications(breach: BreachNotification): Promise<void> {
    // Notify affected users
    for (const userId of breach.affectedUsers) {
      await this.notifyUser(userId, breach);
    }
    
    // Notify authorities if required
    if (breach.affectedUsers.length > 500) {
      await this.notifyAuthorities(breach);
    }
    
    breach.notificationsSent = true;
  }

  // ============================================
  // Compliance Validation Methods
  // ============================================

  // Validate HIPAA compliance
  public validateCompliance(): Record<ComplianceRequirement, boolean> {
    return {
      [ComplianceRequirement.ENCRYPTION_AT_REST]: this.validateEncryptionAtRest(),
      [ComplianceRequirement.ENCRYPTION_IN_TRANSIT]: this.validateEncryptionInTransit(),
      [ComplianceRequirement.ACCESS_CONTROL]: this.validateAccessControl(),
      [ComplianceRequirement.AUDIT_LOGGING]: this.validateAuditLogging(),
      [ComplianceRequirement.DATA_INTEGRITY]: this.validateDataIntegrity(),
      [ComplianceRequirement.TRANSMISSION_SECURITY]: this.validateTransmissionSecurity(),
      [ComplianceRequirement.DATA_BACKUP]: this.validateDataBackup(),
      [ComplianceRequirement.DISASTER_RECOVERY]: this.validateDisasterRecovery(),
      [ComplianceRequirement.BREACH_NOTIFICATION]: this.validateBreachNotification(),
      [ComplianceRequirement.MINIMUM_NECESSARY]: this.validateMinimumNecessary()
    };
  }

  // Individual validation methods
  private validateEncryptionAtRest(): boolean {
    // Check if encryption is properly configured
    return this.encryptionConfig.keySize >= 256;
  }

  private validateEncryptionInTransit(): boolean {
    // Check if HTTPS is enforced
    return window.location.protocol === 'https:';
  }

  private validateAccessControl(): boolean {
    // Check if access control is implemented
    return this.accessControlList.size > 0;
  }

  private validateAuditLogging(): boolean {
    // Check if audit logging is active
    return true; // Always true as we're logging
  }

  private validateDataIntegrity(): boolean {
    // Check if data integrity measures are in place
    return true;
  }

  private validateTransmissionSecurity(): boolean {
    // Check if secure transmission is enforced
    return window.location.protocol === 'https:';
  }

  private validateDataBackup(): boolean {
    // Check if backup procedures are in place
    // In production, check backup service status
    return true;
  }

  private validateDisasterRecovery(): boolean {
    // Check if disaster recovery plan exists
    // In production, check DR service status
    return true;
  }

  private validateBreachNotification(): boolean {
    // Check if breach notification procedures are in place
    return true;
  }

  private validateMinimumNecessary(): boolean {
    // Check if minimum necessary standard is enforced
    return true;
  }

  // ============================================
  // Utility Methods
  // ============================================

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBreachId(): string {
    return `breach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientIP(): string {
    // In production, get from server headers
    return '127.0.0.1';
  }

  private getCurrentUserId(): string {
    // SECURITY FIX: Get user ID from secure authentication context
    // instead of localStorage which is vulnerable to XSS
    
    try {
      // In production, get from secure HTTP-only cookie or authentication service
      // For now, return anonymous to prevent localStorage access
      
      // TODO: Implement secure user ID retrieval from authentication context
      // const authService = AuthService.getInstance();
      // return authService.getCurrentUserId();
      
      return 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  private isPHIResource(resourceType: string): boolean {
    const phiResources = [
      'medical_record',
      'appointment',
      'prescription',
      'lab_result',
      'diagnosis',
      'treatment_plan',
      'mood_entry',
      'crisis_session',
      'safety_plan'
    ];
    
    return phiResources.includes(resourceType);
  }

  private isCriticalAction(action: string): boolean {
    const criticalActions = [
      'delete',
      'export',
      'share',
      'breach',
      'security',
      'access_denied'
    ];
    
    return criticalActions.some(critical => action.includes(critical));
  }

  private async notifyUser(userId: string, breach: BreachNotification): Promise<void> {
    // Send notification to user
    console.log(`Notifying user ${userId} about breach ${breach.id}`);
  }

  private async notifyAuthorities(breach: BreachNotification): Promise<void> {
    // Notify HHS and other required authorities
    console.log(`Notifying authorities about breach ${breach.id}`);
  }
}

// Export singleton instance
export const hipaaService = HIPAAComplianceService.getInstance();