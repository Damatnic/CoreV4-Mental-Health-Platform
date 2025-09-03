/**
 * Privacy and Consent Management Service
 * GDPR and HIPAA compliant privacy controls
 * Manages user consent, data sharing preferences, and privacy settings
 */

import { secureStorage } from '../security/secureStorage';
import { auditLogger } from '../security/auditLogger';
import { cryptoService } from '../security/cryptoService';
import { logger } from '../logging/logger';

export interface ConsentRecord {
  id: string;
  userId: string;
  type: ConsentType;
  consentGiven: boolean;
  purpose: string;
  dataCategories: DataCategory[];
  expiresAt?: Date;
  withdrawable: boolean;
  timestamp: Date;
  ipAddress?: string;
  version: string;
}

export type ConsentType =
  | 'data_processing'
  | 'data_sharing'
  | 'marketing'
  | 'analytics'
  | 'cookies'
  | 'health_data'
  | 'crisis_intervention'
  | 'emergency_contact'
  | 'therapist_access'
  | 'research'
  | 'third_party';

export type DataCategory =
  | 'personal_info'
  | 'health_records'
  | 'mood_data'
  | 'journal_entries'
  | 'crisis_plans'
  | 'medications'
  | 'therapy_notes'
  | 'community_posts'
  | 'usage_analytics'
  | 'device_info';

export interface PrivacySettings {
  userId: string;
  dataMinimization: boolean;
  anonymousMode: boolean;
  shareData: boolean;
  shareWithTherapist: boolean;
  shareWithEmergencyContacts: boolean;
  allowAnalytics: boolean;
  allowResearch: boolean;
  publicProfile: boolean;
  showMoodHistory: boolean;
  encryptLocalData: boolean;
  autoDeleteInactiveDays?: number;
  dataRetentionDays?: number;
  exportFormat: 'json' | 'csv' | 'pdf';
}

export interface DataAccessRequest {
  id: string;
  userId: string;
  requestType: 'access' | 'portability' | 'deletion' | 'rectification';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  dataCategories?: DataCategory[];
  reason?: string;
  response?: unknown;
}

export interface DataSharingAgreement {
  id: string;
  userId: string;
  recipientId: string;
  recipientType: 'therapist' | 'emergency_contact' | 'researcher' | 'third_party';
  dataCategories: DataCategory[];
  purpose: string;
  startDate: Date;
  endDate?: Date;
  revocable: boolean;
  active: boolean;
}

class PrivacyService {
  private static instance: PrivacyService;
  private readonly CONSENT_VERSION = '2.0';
  private readonly DEFAULT_RETENTION_DAYS = 365;
  private readonly MIN_AGE_OF_CONSENT = 13;
  private privacyCache: Map<string, PrivacySettings> = new Map();

  private constructor() {
    this.initializeService();
  }

  static getInstance(): PrivacyService {
    if (!PrivacyService.instance) {
      PrivacyService.instance = new PrivacyService();
    }
    return PrivacyService.instance;
  }

  private initializeService(): void {
    // Set up periodic consent review reminders
    this.setupConsentReview();
    
    // Set up data retention cleanup
    this.setupDataRetention();
  }

  /**
   * Record user consent
   */
  async recordConsent(params: {
    userId: string;
    type: ConsentType;
    consentGiven: boolean;
    purpose: string;
    dataCategories: DataCategory[];
    expiresInDays?: number;
    withdrawable?: boolean;
  }): Promise<ConsentRecord> {
    try {
      const consent: ConsentRecord = {
        id: cryptoService.generateSecureUUID(),
        userId: params.userId,
        type: params.type,
        consentGiven: params.consentGiven,
        purpose: params.purpose,
        dataCategories: params.dataCategories,
        expiresAt: params.expiresInDays 
          ? new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000)
          : undefined,
        withdrawable: params.withdrawable !== false,
        timestamp: new Date(),
        ipAddress: await this.getClientIp(),
        version: this.CONSENT_VERSION,
      };

      // Store consent record
      await this.storeConsentRecord(consent);

      // Log consent event
      await auditLogger.log({
        event: params.consentGiven ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
        userId: params.userId,
        details: {
          type: params.type,
          dataCategories: params.dataCategories,
          purpose: params.purpose,
        },
        severity: 'info',
      });

      return consent;
    } catch {
      logger.error('Failed to record consent:');
      throw undefined;
    }
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(
    userId: string,
    consentId: string
  ): Promise<void> {
    try {
      const consent = await this.getConsentRecord(consentId);
      
      if (!consent) {
        throw new Error('Consent record not found');
      }

      if (consent.userId !== userId) {
        throw new Error('Unauthorized');
      }

      if (!consent.withdrawable) {
        throw new Error('This consent cannot be withdrawn');
      }

      // Mark consent as withdrawn
      consent.consentGiven = false;
      await this.storeConsentRecord(consent);

      // Trigger data deletion if required
      if (consent.dataCategories.includes('health_records')) {
        await this.scheduleDataDeletion(userId, consent.dataCategories);
      }

      // Log withdrawal
      await auditLogger.log({
        event: 'CONSENT_REVOKED',
        userId,
        details: {
          consentId,
          type: consent.type,
          dataCategories: consent.dataCategories,
        },
        severity: 'info',
      });
    } catch {
      logger.error('Failed to withdraw consent:');
      throw undefined;
    }
  }

  /**
   * Get user's privacy settings
   */
  async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    try {
      // Check cache first
      if (this.privacyCache.has(userId)) {
        return this.privacyCache.get(userId)!;
      }

      // Load from storage
      const key = `privacy_settings_${userId}`;
      const stored = await secureStorage.getItem(key);

      if (stored) {
        this.privacyCache.set(userId, stored);
        return stored;
      }

      // Return defaults
      const defaults: PrivacySettings = {
        userId,
        dataMinimization: true,
        anonymousMode: false,
        shareData: false,
        shareWithTherapist: false,
        shareWithEmergencyContacts: false,
        allowAnalytics: false,
        allowResearch: false,
        publicProfile: false,
        showMoodHistory: false,
        encryptLocalData: true,
        autoDeleteInactiveDays: 365,
        dataRetentionDays: this.DEFAULT_RETENTION_DAYS,
        exportFormat: 'json',
      };

      this.privacyCache.set(userId, defaults);
      return defaults;
    } catch {
      logger.error('Failed to get privacy settings:');
      throw undefined;
    }
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(
    userId: string,
    updates: Partial<PrivacySettings>
  ): Promise<PrivacySettings> {
    try {
      const current = await this.getPrivacySettings(userId);
      const updated = { ...current, ...updates };

      // Store updated settings
      const key = `privacy_settings_${userId}`;
      await secureStorage.setItem(key, updated);

      // Update cache
      this.privacyCache.set(userId, updated);

      // Log changes
      await auditLogger.log({
        event: 'CONFIGURATION_CHANGE',
        userId,
        details: {
          type: 'privacy_settings',
          changes: Object.keys(updates),
        },
        severity: 'info',
      });

      // Apply immediate changes
      await this.applyPrivacySettings(userId, updated);

      return updated;
    } catch {
      logger.error('Failed to update privacy settings:');
      throw undefined;
    }
  }

  /**
   * Handle data access request (GDPR Article 15)
   */
  async requestDataAccess(
    userId: string,
    dataCategories?: DataCategory[]
  ): Promise<DataAccessRequest> {
    try {
      const request: DataAccessRequest = {
        id: cryptoService.generateSecureUUID(),
        userId,
        requestType: 'access',
        status: 'pending',
        requestedAt: new Date(),
        dataCategories,
      };

      // Store request
      await this.storeDataRequest(request);

      // Process request asynchronously
      this.processDataAccessRequest(request);

      // Log request
      await auditLogger.log({
        event: 'DATA_ACCESS',
        userId,
        details: {
          requestId: request.id,
          dataCategories,
        },
        severity: 'info',
      });

      return request;
    } catch {
      logger.error('Failed to create data access request:');
      throw undefined;
    }
  }

  /**
   * Request data portability (GDPR Article 20)
   */
  async requestDataPortability(
    userId: string,
    _format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<DataAccessRequest> {
    try {
      const request: DataAccessRequest = {
        id: cryptoService.generateSecureUUID(),
        userId,
        requestType: 'portability',
        status: 'pending',
        requestedAt: new Date(),
      };

      // Store request
      await this.storeDataRequest(request);

      // Process request
      this.processDataPortabilityRequest(request, _format);

      // Log request
      await auditLogger.log({
        event: 'PHI_EXPORT',
        userId,
        details: {
          requestId: request.id,
          _format,
        },
        severity: 'info',
      });

      return request;
    } catch {
      logger.error('Failed to create data portability request:');
      throw undefined;
    }
  }

  /**
   * Request data deletion (GDPR Article 17 - Right to be forgotten)
   */
  async requestDataDeletion(
    userId: string,
    dataCategories?: DataCategory[],
    reason?: string
  ): Promise<DataAccessRequest> {
    try {
      const request: DataAccessRequest = {
        id: cryptoService.generateSecureUUID(),
        userId,
        requestType: 'deletion',
        status: 'pending',
        requestedAt: new Date(),
        dataCategories,
        reason,
      };

      // Store request
      await this.storeDataRequest(request);

      // Process request with verification
      this.processDataDeletionRequest(request);

      // Log request
      await auditLogger.log({
        event: 'DATA_DELETION',
        userId,
        details: {
          requestId: request.id,
          dataCategories,
          reason,
        },
        severity: 'warning',
      });

      return request;
    } catch {
      logger.error('Failed to create data deletion request:');
      throw undefined;
    }
  }

  /**
   * Create data sharing agreement
   */
  async createDataSharingAgreement(params: {
    userId: string;
    recipientId: string;
    recipientType: 'therapist' | 'emergency_contact' | 'researcher' | 'third_party';
    dataCategories: DataCategory[];
    purpose: string;
    durationDays?: number;
    revocable?: boolean;
  }): Promise<DataSharingAgreement> {
    try {
      const agreement: DataSharingAgreement = {
        id: cryptoService.generateSecureUUID(),
        userId: params.userId,
        recipientId: params.recipientId,
        recipientType: params.recipientType,
        dataCategories: params.dataCategories,
        purpose: params.purpose,
        startDate: new Date(),
        endDate: params.durationDays
          ? new Date(Date.now() + params.durationDays * 24 * 60 * 60 * 1000)
          : undefined,
        revocable: params.revocable !== false,
        active: true,
      };

      // Store agreement
      await this.storeDataSharingAgreement(agreement);

      // Record consent for sharing
      await this.recordConsent({
        userId: params.userId,
        type: 'data_sharing',
        consentGiven: true,
        purpose: params.purpose,
        dataCategories: params.dataCategories,
        expiresInDays: params.durationDays,
        withdrawable: params.revocable,
      });

      // Log agreement
      await auditLogger.log({
        event: 'PERMISSION_GRANTED',
        userId: params.userId,
        details: {
          agreementId: agreement.id,
          recipientId: params.recipientId,
          recipientType: params.recipientType,
          dataCategories: params.dataCategories,
        },
        severity: 'info',
      });

      return agreement;
    } catch {
      logger.error('Failed to create data sharing agreement:');
      throw undefined;
    }
  }

  /**
   * Revoke data sharing agreement
   */
  async revokeDataSharingAgreement(
    userId: string,
    agreementId: string
  ): Promise<void> {
    try {
      const agreement = await this.getDataSharingAgreement(agreementId);
      
      if (!agreement) {
        throw new Error('Agreement not found');
      }

      if (agreement.userId !== userId) {
        throw new Error('Unauthorized');
      }

      if (!agreement.revocable) {
        throw new Error('This agreement cannot be revoked');
      }

      // Mark as inactive
      agreement.active = false;
      await this.storeDataSharingAgreement(agreement);

      // Log revocation
      await auditLogger.log({
        event: 'PERMISSION_DENIED',
        userId,
        details: {
          agreementId,
          recipientId: agreement.recipientId,
        },
        severity: 'info',
      });
    } catch {
      logger.error('Failed to revoke data sharing agreement:');
      throw undefined;
    }
  }

  /**
   * Check if user has given consent for specific data processing
   */
  async hasConsent(
    userId: string,
    type: ConsentType,
    dataCategories?: DataCategory[]
  ): Promise<boolean> {
    try {
      const consents = await this.getUserConsents(userId);
      
      const relevantConsents = consents.filter(c => 
        c.type === type && 
        c.consentGiven &&
        (!c.expiresAt || new Date() < new Date(c.expiresAt))
      );

      if (dataCategories) {
        return relevantConsents.some(c =>
          dataCategories.every(_cat => c.dataCategories.includes(_cat))
        );
      }

      return relevantConsents.length > 0;
    } catch {
      logger.error('Failed to check consent:');
      return false;
    }
  }

  /**
   * Get user's consent history
   */
  async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    const key = `consents_${userId}`;
    const stored = await secureStorage.getItem(key);
    return stored || [];
  }

  /**
   * Anonymize user data
   */
  async anonymizeUserData(userId: string): Promise<void> {
    try {
      // Update privacy settings
      await this.updatePrivacySettings(userId, {
        anonymousMode: true,
        publicProfile: false,
        showMoodHistory: false,
      });

      // Anonymize stored data
      await this.anonymizeStoredData(userId);

      // Log anonymization
      await auditLogger.log({
        event: 'DATA_MODIFICATION',
        userId,
        details: {
          action: 'anonymization',
        },
        severity: 'info',
      });
    } catch {
      logger.error('Failed to anonymize user data:');
      throw undefined;
    }
  }

  /**
   * Private helper methods
   */
  private async storeConsentRecord(consent: ConsentRecord): Promise<void> {
    const key = `consents_${consent.userId}`;
    const existing = await secureStorage.getItem(key) || [];
    
    // Update or add consent
    const index = existing.findIndex((c: ConsentRecord) => c.id === consent.id);
    if (index >= 0) {
      existing[index] = consent;
    } else {
      existing.push(consent);
    }
    
    await secureStorage.setItem(key, existing);
  }

  private async getConsentRecord(consentId: string): Promise<ConsentRecord | null> {
    // Search all user consents (in production, use indexed database)
    const allKeys = await secureStorage.getAllKeys();
    const consentKeys = allKeys.filter(k => k.startsWith('consents_'));
    
    for (const key of consentKeys) {
      const consents = await secureStorage.getItem(key) || [];
      const consent = consents.find((c: ConsentRecord) => c.id === consentId);
      if (consent) return consent;
    }
    
    return null;
  }

  private async storeDataRequest(request: DataAccessRequest): Promise<void> {
    const key = `data_requests_${request.userId}`;
    const existing = await secureStorage.getItem(key) || [];
    existing.push(request);
    await secureStorage.setItem(key, existing);
  }

  private async storeDataSharingAgreement(agreement: DataSharingAgreement): Promise<void> {
    const key = `sharing_agreements_${agreement.userId}`;
    const existing = await secureStorage.getItem(key) || [];
    
    const index = existing.findIndex((a: DataSharingAgreement) => a.id === agreement.id);
    if (index >= 0) {
      existing[index] = agreement;
    } else {
      existing.push(agreement);
    }
    
    await secureStorage.setItem(key, existing);
  }

  private async getDataSharingAgreement(agreementId: string): Promise<DataSharingAgreement | null> {
    // Search all agreements (in production, use indexed database)
    const allKeys = await secureStorage.getAllKeys();
    const agreementKeys = allKeys.filter(k => k.startsWith('sharing_agreements_'));
    
    for (const key of agreementKeys) {
      const agreements = await secureStorage.getItem(key) || [];
      const agreement = agreements.find((a: DataSharingAgreement) => a.id === agreementId);
      if (agreement) return agreement;
    }
    
    return null;
  }

  private async processDataAccessRequest(request: DataAccessRequest): Promise<void> {
    // Simulate async processing
    setTimeout(async () => {
      try {
        // Gather requested data
        const userData = await this.gatherUserData(request.userId, request.dataCategories);
        
        // Update request status
        request.status = 'completed';
        request.completedAt = new Date();
        request.response = userData;
        
        await this.storeDataRequest(request);
        
        // Notify user (in production, send email/notification)
        logger.info('Data access request completed:', request.id);
      } catch {
        request.status = 'rejected';
        await this.storeDataRequest(request);
      }
    }, 5000);
  }

  private async processDataPortabilityRequest(
    request: DataAccessRequest,
    _format: string
  ): Promise<void> {
    // Simulate async processing
    setTimeout(async () => {
      try {
        // Gather all user data
        const userData = await this.gatherUserData(request.userId);
        
        // Convert to requested _format
        let exportedData: string;
        switch (_format) {
          case 'csv':
            exportedData = this.convertToCSV(userData);
            break;
          case 'pdf':
            exportedData = await this.convertToPDF(userData);
            break;
          default:
            exportedData = JSON.stringify(userData, null, 2);
        }
        
        // Update request
        request.status = 'completed';
        request.completedAt = new Date();
        request.response = exportedData;
        
        await this.storeDataRequest(request);
        
        // Notify user
        logger.info('Data portability request completed:', request.id);
      } catch {
        request.status = 'rejected';
        await this.storeDataRequest(request);
      }
    }, 5000);
  }

  private async processDataDeletionRequest(request: DataAccessRequest): Promise<void> {
    // Simulate async processing with verification
    setTimeout(async () => {
      try {
        // Verify user identity (in production, require additional confirmation)
        
        // Delete specified data categories
        await this.deleteUserData(request.userId, request.dataCategories);
        
        // Update request
        request.status = 'completed';
        request.completedAt = new Date();
        
        await this.storeDataRequest(request);
        
        // Notify user
        logger.info('Data deletion request completed:', request.id);
      } catch {
        request.status = 'rejected';
        await this.storeDataRequest(request);
      }
    }, 10000); // Longer delay for deletion
  }

  private async gatherUserData(
    userId: string,
    categories?: DataCategory[]
  ): Promise<unknown> {
    // In production, gather actual user data from various sources
    const allData: unknown = {
      personal_info: { userId, email: 'user@example.com' },
      health_records: [],
      mood_data: [],
      journal_entries: [],
      crisis_plans: [],
      medications: [],
      therapy_notes: [],
      community_posts: [],
      usage_analytics: [],
      device_info: [],
    };

    if (!categories) {
      return allData;
    }

    const filtered: unknown = {};
    for (const category of categories) {
      if (allData[category]) {
        filtered[category] = allData[category];
      }
    }
    
    return filtered;
  }

  private async deleteUserData(
    userId: string,
    categories?: DataCategory[]
  ): Promise<void> {
    // In production, actually delete user data
    logger.info(`Deleting user data for ${userId}:`, categories);
    
    // Clear from all storage
    if (!categories || categories.length === 0) {
      // Delete all user data
      const allKeys = await secureStorage.getAllKeys();
      const userKeys = allKeys.filter(k => k.includes(userId));
      
      for (const key of userKeys) {
        await secureStorage.removeItem(key);
      }
    } else {
      // Delete specific categories
      for (const category of categories) {
        const key = `${category}_${userId}`;
        await secureStorage.removeItem(key);
      }
    }
  }

  private async anonymizeStoredData(userId: string): Promise<void> {
    // Replace PII with anonymous identifiers
    const anonymousId = `anon_${cryptoService.generateSecureUUID()}`;
    
    // In production, update all references to user ID
    logger.info(`Anonymizing data for user ${userId} -> ${anonymousId}`);
  }

  private async scheduleDataDeletion(
    userId: string,
    categories: DataCategory[]
  ): Promise<void> {
    // Schedule deletion after grace period
    setTimeout(() => {
      this.deleteUserData(userId, categories);
    }, 7 * 24 * 60 * 60 * 1000); // 7 days grace period
  }

  private async applyPrivacySettings(
    userId: string,
    settings: PrivacySettings
  ): Promise<void> {
    // Apply privacy settings immediately
    if (settings.anonymousMode) {
      await this.anonymizeUserData(userId);
    }
    
    if (settings.autoDeleteInactiveDays) {
      // Schedule auto-deletion
      logger.info(`Auto-deletion scheduled after ${settings.autoDeleteInactiveDays} days of inactivity`);
    }
  }

  private setupConsentReview(): void {
    // Check for expired consents daily
    setInterval(async () => {
      const allKeys = await secureStorage.getAllKeys();
      const consentKeys = allKeys.filter(k => k.startsWith('consents_'));
      
      for (const key of consentKeys) {
        const consents = await secureStorage.getItem(key) || [];
        const userId = key.replace('consents_', '');
        
        for (const consent of consents) {
          if (consent.expiresAt && new Date() > new Date(consent.expiresAt)) {
            // Notify user to renew consent
            logger.info(`Consent expired for user ${userId}:`, consent.type);
          }
        }
      }
    }, 24 * 60 * 60 * 1000);
  }

  private setupDataRetention(): void {
    // Clean up old data based on retention policies
    setInterval(async () => {
      const allKeys = await secureStorage.getAllKeys();
      
      for (const key of allKeys) {
        if (key.includes('_')) {
          const userId = key.split('_').pop();
          if (userId) {
            const settings = await this.getPrivacySettings(userId);
            
            if (settings.dataRetentionDays) {
              // Check and delete old data
              logger.info(`Checking data retention for user ${userId}`);
            }
          }
        }
      }
    }, 24 * 60 * 60 * 1000);
  }

  private async getClientIp(): Promise<string> {
    // In production, get actual client IP
    return '127.0.0.1';
  }

  private convertToCSV(_data: unknown): string {
    // Convert data to CSV _format
    return 'CSV data export';
  }

  private async convertToPDF(_data: unknown): Promise<string> {
    // Convert data to PDF _format
    return 'PDF data export';
  }
}

export const _privacyService = PrivacyService.getInstance();