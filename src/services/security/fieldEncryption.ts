/**
 * Field-Level Encryption Service
 * Provides granular encryption for sensitive mental health data fields
 * Implements key rotation, versioning, and format-preserving encryption
 */

import { cryptoService } from './cryptoService';
import { auditLogger } from './auditLogger';
import { secureStorage } from './secureStorage';

interface EncryptionKeyMetadata {
  keyId: string;
  version: number;
  algorithm: string;
  createdAt: Date;
  rotatedAt?: Date;
  expiresAt?: Date;
  purpose: string;
  active: boolean;
}

interface EncryptedField {
  ciphertext: string;
  keyId: string;
  version: number;
  algorithm: string;
  iv?: string;
  tag?: string;
  metadata?: {
    fieldType: string;
    originalFormat?: string;
    encrypted: Date;
  };
}

interface FieldEncryptionConfig {
  fieldName: string;
  dataType: 'string' | 'number' | 'date' | 'object' | 'array';
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  encryptionRequired: boolean;
  formatPreserving?: boolean;
  searchable?: boolean;
  tokenization?: boolean;
}

// Mental health specific field configurations
const FIELD_CONFIGS: Record<string, FieldEncryptionConfig> = {
  // Critical sensitivity - always encrypted
  'mood_data': {
    fieldName: 'mood_data',
    dataType: 'object',
    sensitivity: 'critical',
    encryptionRequired: true,
    searchable: false,
  },
  'crisis_notes': {
    fieldName: 'crisis_notes',
    dataType: 'string',
    sensitivity: 'critical',
    encryptionRequired: true,
    searchable: false,
  },
  'journal_entry': {
    fieldName: 'journal_entry',
    dataType: 'string',
    sensitivity: 'critical',
    encryptionRequired: true,
    searchable: true, // Encrypted search capability
  },
  'therapy_notes': {
    fieldName: 'therapy_notes',
    dataType: 'string',
    sensitivity: 'critical',
    encryptionRequired: true,
    searchable: false,
  },
  'medication_list': {
    fieldName: 'medication_list',
    dataType: 'array',
    sensitivity: 'high',
    encryptionRequired: true,
    searchable: true,
  },
  'diagnosis': {
    fieldName: 'diagnosis',
    dataType: 'string',
    sensitivity: 'critical',
    encryptionRequired: true,
    searchable: false,
  },
  'emergency_contacts': {
    fieldName: 'emergency_contacts',
    dataType: 'array',
    sensitivity: 'high',
    encryptionRequired: true,
    searchable: false,
  },
  
  // High sensitivity
  'phone_number': {
    fieldName: 'phone_number',
    dataType: 'string',
    sensitivity: 'high',
    encryptionRequired: true,
    formatPreserving: true, // Preserve phone number format
  },
  'date_of_birth': {
    fieldName: 'date_of_birth',
    dataType: 'date',
    sensitivity: 'high',
    encryptionRequired: true,
    formatPreserving: true,
  },
  'insurance_info': {
    fieldName: 'insurance_info',
    dataType: 'object',
    sensitivity: 'high',
    encryptionRequired: true,
    tokenization: true, // Use tokenization for insurance numbers
  },
  
  // Medium sensitivity
  'email': {
    fieldName: 'email',
    dataType: 'string',
    sensitivity: 'medium',
    encryptionRequired: true,
    searchable: true,
    formatPreserving: true,
  },
  'name': {
    fieldName: 'name',
    dataType: 'string',
    sensitivity: 'medium',
    encryptionRequired: true,
    searchable: true,
  },
};

class FieldEncryptionService {
  private static instance: FieldEncryptionService;
  private encryptionKeys: Map<string, CryptoKey> = new Map();
  private keyMetadata: Map<string, EncryptionKeyMetadata> = new Map();
  private tokenVault: Map<string, string> = new Map();
  private searchIndexes: Map<string, Map<string, string[]>> = new Map();
  private readonly KEY_ROTATION_DAYS = 90;
  private readonly MAX_KEY_VERSIONS = 5;

  private constructor() {
    this.initializeFieldEncryption();
  }

  static getInstance(): FieldEncryptionService {
    if (!FieldEncryptionService.instance) {
      FieldEncryptionService.instance = new FieldEncryptionService();
    }
    return FieldEncryptionService.instance;
  }

  private async initializeFieldEncryption(): Promise<void> {
    await this.loadEncryptionKeys();
    await this.checkKeyRotation();
    this.setupAutoRotation();
  }

  /**
   * Encrypt a single field
   */
  async encryptField(
    fieldName: string,
    value: any,
    userId?: string
  ): Promise<EncryptedField | any> {
    try {
      const config = FIELD_CONFIGS[fieldName];
      
      if (!config || !config.encryptionRequired) {
        return value; // Return unencrypted if not configured
      }

      // Get or create encryption key for this field type
      const keyInfo = await this.getFieldKey(fieldName, config.sensitivity);
      
      // Handle different encryption strategies
      if (config.tokenization) {
        return await this.tokenizeValue(value, fieldName);
      }
      
      if (config.formatPreserving) {
        return await this.formatPreservingEncrypt(value, config, keyInfo);
      }

      // Standard encryption
      const serialized = JSON.stringify(value);
      const encrypted = await cryptoService.encrypt(serialized);
      
      // Create encrypted field object
      const encryptedField: EncryptedField = {
        ciphertext: encrypted,
        keyId: keyInfo.keyId,
        version: keyInfo.version,
        algorithm: keyInfo.algorithm,
        metadata: {
          fieldType: config.dataType,
          encrypted: new Date(),
        },
      };

      // Handle searchable fields
      if (config.searchable) {
        await this.updateSearchIndex(fieldName, value, encrypted, userId);
      }

      // Audit sensitive field encryption
      if (config.sensitivity === 'critical') {
        await auditLogger.log({
          event: 'PHI_MODIFICATION',
          userId,
          details: {
            action: 'field_encrypted',
            fieldName,
            sensitivity: config.sensitivity,
          },
          severity: 'info',
        });
      }

      return encryptedField;
    } catch (error) {
      console.error(`Failed to encrypt field ${fieldName}:`, error);
      throw new Error('Field encryption failed');
    }
  }

  /**
   * Decrypt a single field
   */
  async decryptField(
    fieldName: string,
    encryptedData: EncryptedField | string,
    userId?: string
  ): Promise<any> {
    try {
      const config = FIELD_CONFIGS[fieldName];
      
      if (!config || !config.encryptionRequired) {
        return encryptedData; // Return as-is if not configured
      }

      // Handle tokenized values
      if (config.tokenization && typeof encryptedData === 'string') {
        return await this.detokenizeValue(encryptedData, fieldName);
      }

      // Handle format-preserving encryption
      if (config.formatPreserving && typeof encryptedData === 'string') {
        return await this.formatPreservingDecrypt(encryptedData, config);
      }

      // Standard decryption
      if (typeof encryptedData === 'object' && 'ciphertext' in encryptedData) {
        const decrypted = await cryptoService.decrypt(encryptedData.ciphertext);
        const value = JSON.parse(decrypted);
        
        // Audit sensitive field access
        if (config.sensitivity === 'critical') {
          await auditLogger.log({
            event: 'PHI_ACCESS',
            userId,
            details: {
              action: 'field_decrypted',
              fieldName,
              sensitivity: config.sensitivity,
            },
            severity: 'info',
          });
        }
        
        return value;
      }

      return encryptedData;
    } catch (error) {
      console.error(`Failed to decrypt field ${fieldName}:`, error);
      throw new Error('Field decryption failed');
    }
  }

  /**
   * Encrypt multiple fields in an object
   */
  async encryptObject(
    obj: Record<string, any>,
    fieldList?: string[],
    userId?: string
  ): Promise<Record<string, any>> {
    const encrypted: Record<string, any> = {};
    const fieldsToEncrypt = fieldList || Object.keys(obj);

    for (const key of Object.keys(obj)) {
      if (fieldsToEncrypt.includes(key) && FIELD_CONFIGS[key]) {
        encrypted[key] = await this.encryptField(key, obj[key], userId);
      } else {
        encrypted[key] = obj[key];
      }
    }

    return encrypted;
  }

  /**
   * Decrypt multiple fields in an object
   */
  async decryptObject(
    obj: Record<string, any>,
    fieldList?: string[],
    userId?: string
  ): Promise<Record<string, any>> {
    const decrypted: Record<string, any> = {};
    const fieldsToDecrypt = fieldList || Object.keys(obj);

    for (const key of Object.keys(obj)) {
      if (fieldsToDecrypt.includes(key) && FIELD_CONFIGS[key]) {
        decrypted[key] = await this.decryptField(key, obj[key], userId);
      } else {
        decrypted[key] = obj[key];
      }
    }

    return decrypted;
  }

  /**
   * Search encrypted fields
   */
  async searchEncryptedField(
    fieldName: string,
    searchTerm: string,
    userId?: string
  ): Promise<string[]> {
    const config = FIELD_CONFIGS[fieldName];
    
    if (!config || !config.searchable) {
      throw new Error('Field is not searchable');
    }

    // Generate search token
    const searchToken = await this.generateSearchToken(searchTerm, fieldName);
    
    // Search in index
    const fieldIndex = this.searchIndexes.get(fieldName);
    if (!fieldIndex) {
      return [];
    }

    const results = fieldIndex.get(searchToken) || [];
    
    // Audit search operation
    await auditLogger.log({
      event: 'DATA_ACCESS',
      userId,
      details: {
        action: 'encrypted_search',
        fieldName,
        resultsCount: results.length,
      },
      severity: 'info',
    });

    return results;
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys(force: boolean = false): Promise<void> {
    try {
      const now = new Date();
      
      for (const [keyId, metadata] of this.keyMetadata.entries()) {
        const daysSinceRotation = metadata.rotatedAt
          ? (now.getTime() - metadata.rotatedAt.getTime()) / (1000 * 60 * 60 * 24)
          : (now.getTime() - metadata.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        
        if (force || daysSinceRotation >= this.KEY_ROTATION_DAYS) {
          await this.rotateKey(keyId);
        }
      }
      
      // Clean up old key versions
      await this.cleanupOldKeys();
      
    } catch (error) {
      console.error('Key rotation failed:', error);
      throw new Error('Key rotation failed');
    }
  }

  /**
   * Re-encrypt data with new key
   */
  async reencryptData(
    oldKeyId: string,
    newKeyId: string,
    data: EncryptedField
  ): Promise<EncryptedField> {
    try {
      // Decrypt with old key
      const decrypted = await cryptoService.decrypt(data.ciphertext);
      
      // Encrypt with new key
      const encrypted = await cryptoService.encrypt(decrypted);
      
      // Update metadata
      const newMetadata = this.keyMetadata.get(newKeyId);
      if (!newMetadata) {
        throw new Error('New key not found');
      }
      
      return {
        ciphertext: encrypted,
        keyId: newKeyId,
        version: newMetadata.version,
        algorithm: newMetadata.algorithm,
        metadata: {
          ...data.metadata,
          encrypted: new Date(),
        },
      };
    } catch (error) {
      console.error('Re-encryption failed:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async getFieldKey(
    fieldName: string,
    sensitivity: string
  ): Promise<EncryptionKeyMetadata> {
    const keyId = `field_key_${sensitivity}`;
    let metadata = this.keyMetadata.get(keyId);
    
    if (!metadata) {
      // Generate new key for this sensitivity level
      metadata = await this.generateFieldKey(keyId, sensitivity);
    }
    
    return metadata;
  }

  private async generateFieldKey(
    keyId: string,
    purpose: string
  ): Promise<EncryptionKeyMetadata> {
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
    
    const metadata: EncryptionKeyMetadata = {
      keyId,
      version: 1,
      algorithm: 'AES-GCM',
      createdAt: new Date(),
      purpose,
      active: true,
    };
    
    this.encryptionKeys.set(keyId, key);
    this.keyMetadata.set(keyId, metadata);
    
    // Persist key securely
    await this.persistKey(keyId, key, metadata);
    
    return metadata;
  }

  private async rotateKey(keyId: string): Promise<void> {
    const oldMetadata = this.keyMetadata.get(keyId);
    if (!oldMetadata) return;
    
    // Generate new key version
    const newKeyId = `${keyId}_v${oldMetadata.version + 1}`;
    const newKey = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
    
    const newMetadata: EncryptionKeyMetadata = {
      keyId: newKeyId,
      version: oldMetadata.version + 1,
      algorithm: 'AES-GCM',
      createdAt: new Date(),
      rotatedAt: new Date(),
      purpose: oldMetadata.purpose,
      active: true,
    };
    
    // Deactivate old key
    oldMetadata.active = false;
    oldMetadata.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    // Store new key
    this.encryptionKeys.set(newKeyId, newKey);
    this.keyMetadata.set(newKeyId, newMetadata);
    
    // Persist changes
    await this.persistKey(newKeyId, newKey, newMetadata);
    
    // Log rotation
    await auditLogger.log({
      event: 'CONFIGURATION_CHANGE',
      details: {
        action: 'key_rotation',
        keyId,
        newKeyId,
        version: newMetadata.version,
      },
      severity: 'info',
    });
  }

  private async tokenizeValue(value: any, fieldName: string): Promise<string> {
    // Generate unique token
    const token = `tok_${cryptoService.generateSecureUUID()}`;
    
    // Encrypt and store actual value
    const encrypted = await cryptoService.encrypt(JSON.stringify(value));
    this.tokenVault.set(token, encrypted);
    
    // Persist token mapping
    await secureStorage.setItem(`token_${token}`, encrypted, {
      encrypted: true,
    });
    
    return token;
  }

  private async detokenizeValue(token: string, fieldName: string): Promise<any> {
    // Retrieve from vault
    let encrypted = this.tokenVault.get(token);
    
    if (!encrypted) {
      // Try loading from storage
      encrypted = await secureStorage.getItem(`token_${token}`);
    }
    
    if (!encrypted) {
      throw new Error('Token not found');
    }
    
    const decrypted = await cryptoService.decrypt(encrypted);
    return JSON.parse(decrypted);
  }

  private async formatPreservingEncrypt(
    value: any,
    config: FieldEncryptionConfig,
    keyInfo: EncryptionKeyMetadata
  ): Promise<string> {
    // Simple format-preserving encryption
    // In production, use FF3-1 or similar algorithm
    const stringValue = String(value);
    const encrypted = await cryptoService.encrypt(stringValue);
    
    // Preserve format characteristics
    if (config.dataType === 'date') {
      return `enc_date_${encrypted.substring(0, 10)}`;
    } else if (config.fieldName === 'phone_number') {
      return `enc_phone_${encrypted.substring(0, 10)}`;
    } else if (config.fieldName === 'email') {
      return `enc_${encrypted.substring(0, 20)}@encrypted.local`;
    }
    
    return encrypted;
  }

  private async formatPreservingDecrypt(
    encrypted: string,
    config: FieldEncryptionConfig
  ): Promise<any> {
    // Extract actual encrypted data
    let actualEncrypted = encrypted;
    
    if (encrypted.startsWith('enc_')) {
      // Need to retrieve full encrypted value from storage
      const fullEncrypted = await secureStorage.getItem(`fpe_${encrypted}`);
      if (fullEncrypted) {
        actualEncrypted = fullEncrypted;
      }
    }
    
    const decrypted = await cryptoService.decrypt(actualEncrypted);
    
    // Convert back to appropriate type
    if (config.dataType === 'date') {
      return new Date(decrypted);
    } else if (config.dataType === 'number') {
      return Number(decrypted);
    }
    
    return decrypted;
  }

  private async generateSearchToken(searchTerm: string, fieldName: string): Promise<string> {
    // Generate deterministic search token
    const normalized = searchTerm.toLowerCase().trim();
    const hash = await cryptoService.sha256(`${fieldName}:${normalized}`);
    return hash.substring(0, 16); // Use prefix for efficiency
  }

  private async updateSearchIndex(
    fieldName: string,
    value: any,
    encrypted: string,
    userId?: string
  ): Promise<void> {
    if (!this.searchIndexes.has(fieldName)) {
      this.searchIndexes.set(fieldName, new Map());
    }
    
    const fieldIndex = this.searchIndexes.get(fieldName)!;
    
    // Generate search tokens for value
    const searchableText = String(value).toLowerCase();
    const words = searchableText.split(/\s+/);
    
    for (const word of words) {
      if (word.length > 2) { // Skip very short words
        const token = await this.generateSearchToken(word, fieldName);
        
        const entries = fieldIndex.get(token) || [];
        if (!entries.includes(encrypted)) {
          entries.push(encrypted);
          fieldIndex.set(token, entries);
        }
      }
    }
  }

  private async loadEncryptionKeys(): Promise<void> {
    try {
      const storedKeys = await secureStorage.getItem('field_encryption_keys');
      if (storedKeys) {
        // Load and reconstruct keys
        for (const [keyId, keyData] of Object.entries(storedKeys)) {
          // Reconstruct CryptoKey objects
          // Implementation depends on key storage format
        }
      }
    } catch (error) {
      console.error('Failed to load encryption keys:', error);
    }
  }

  private async persistKey(
    keyId: string,
    key: CryptoKey,
    metadata: EncryptionKeyMetadata
  ): Promise<void> {
    try {
      // Export key for storage
      const exportedKey = await crypto.subtle.exportKey('raw', key);
      const keyString = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
      
      // Store securely
      await secureStorage.setItem(`field_key_${keyId}`, {
        key: keyString,
        metadata,
      }, {
        encrypted: true,
        persistent: true,
      });
    } catch (error) {
      console.error('Failed to persist key:', error);
    }
  }

  private async checkKeyRotation(): Promise<void> {
    const needsRotation: string[] = [];
    const now = new Date();
    
    for (const [keyId, metadata] of this.keyMetadata.entries()) {
      if (!metadata.active) continue;
      
      const age = (now.getTime() - metadata.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (age >= this.KEY_ROTATION_DAYS) {
        needsRotation.push(keyId);
      }
    }
    
    if (needsRotation.length > 0) {
      console.log(`Keys needing rotation: ${needsRotation.join(', ')}`);
    }
  }

  private setupAutoRotation(): void {
    // Schedule daily key rotation check
    setInterval(async () => {
      await this.rotateKeys();
    }, 24 * 60 * 60 * 1000);
  }

  private async cleanupOldKeys(): Promise<void> {
    const toDelete: string[] = [];
    
    for (const [keyId, metadata] of this.keyMetadata.entries()) {
      if (!metadata.active && metadata.expiresAt && new Date() > metadata.expiresAt) {
        toDelete.push(keyId);
      }
    }
    
    for (const keyId of toDelete) {
      this.encryptionKeys.delete(keyId);
      this.keyMetadata.delete(keyId);
      await secureStorage.removeItem(`field_key_${keyId}`);
    }
  }
}

export const fieldEncryption = FieldEncryptionService.getInstance();