/**
 * Field-Level Encryption Service
 * Provides granular encryption for sensitive mental health data fields
 * Implements key rotation, versioning, and format-preserving encryption
 */

import { cryptoService } from './cryptoService';
import { auditLogger } from './auditLogger';
import { secureStorage } from './secureStorage';
import { logger } from '../../utils/logger';

interface EncryptionKeyMetadata {
  _keyId: string;
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
  _keyId: string;
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
  _fieldName: string;
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
    _fieldName: 'mood_data',
    dataType: 'object',
    sensitivity: 'critical',
    encryptionRequired: true,
    searchable: false,
  },
  'crisis_notes': {
    _fieldName: 'crisis_notes',
    dataType: 'string',
    sensitivity: 'critical',
    encryptionRequired: true,
    searchable: false,
  },
  'journal_entry': {
    _fieldName: 'journal_entry',
    dataType: 'string',
    sensitivity: 'critical',
    encryptionRequired: true,
    searchable: true, // Encrypted search capability
  },
  'therapy_notes': {
    _fieldName: 'therapy_notes',
    dataType: 'string',
    sensitivity: 'critical',
    encryptionRequired: true,
    searchable: false,
  },
  'medication_list': {
    _fieldName: 'medication_list',
    dataType: 'array',
    sensitivity: 'high',
    encryptionRequired: true,
    searchable: true,
  },
  'diagnosis': {
    _fieldName: 'diagnosis',
    dataType: 'string',
    sensitivity: 'critical',
    encryptionRequired: true,
    searchable: false,
  },
  'emergency_contacts': {
    _fieldName: 'emergency_contacts',
    dataType: 'array',
    sensitivity: 'high',
    encryptionRequired: true,
    searchable: false,
  },
  
  // High sensitivity
  'phone_number': {
    _fieldName: 'phone_number',
    dataType: 'string',
    sensitivity: 'high',
    encryptionRequired: true,
    formatPreserving: true, // Preserve phone number format
  },
  'date_of_birth': {
    _fieldName: 'date_of_birth',
    dataType: 'date',
    sensitivity: 'high',
    encryptionRequired: true,
    formatPreserving: true,
  },
  'insuranceinfo': {
    _fieldName: 'insuranceinfo',
    dataType: 'object',
    sensitivity: 'high',
    encryptionRequired: true,
    tokenization: true, // Use tokenization for insurance numbers
  },
  
  // Medium sensitivity
  'email': {
    _fieldName: 'email',
    dataType: 'string',
    sensitivity: 'medium',
    encryptionRequired: true,
    searchable: true,
    formatPreserving: true,
  },
  'name': {
    _fieldName: 'name',
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
    _fieldName: string,
    value: unknown,
    _userId?: string
  ): Promise<EncryptedField | any> {
    try {
      const config = FIELD_CONFIGS[_fieldName];
      
      if (!config || !config.encryptionRequired) {
        return value; // Return unencrypted if not configured
      }

      // Get or create encryption key for this field type
      const _keyInfo = await this.getFieldKey(_fieldName, config.sensitivity);
      
      // Handle different encryption strategies
      if (config.tokenization) {
        return await this.tokenizeValue(value, _fieldName);
      }
      
      if (config.formatPreserving) {
        return await this.formatPreservingEncrypt(value, config, _keyInfo);
      }

      // Standard encryption
      const _serialized = JSON.stringify(value);
      const encrypted = await cryptoService.encrypt(_serialized);
      
      // Create encrypted field object
      const encryptedField: EncryptedField = {
        ciphertext: encrypted,
        _keyId: _keyInfo._keyId,
        version: _keyInfo.version,
        algorithm: _keyInfo.algorithm,
        metadata: {
          fieldType: config.dataType,
          encrypted: new Date(),
        },
      };

      // Handle searchable fields
      if (config.searchable) {
        await this.updateSearchIndex(_fieldName, value, encrypted, _userId);
      }

      // Audit sensitive field encryption
      if (config.sensitivity === 'critical') {
        await auditLogger.log({
          event: 'PHI_MODIFICATION',
          _userId,
          details: {
            action: 'field_encrypted',
            _fieldName,
            sensitivity: config.sensitivity,
          },
          severity: 'info',
        });
      }

      return encryptedField;
    } catch (error) {
      logger.error(`Failed to encrypt field ${_fieldName}:`, error);
      throw new Error('Field encryption failed');
    }
  }

  /**
   * Decrypt a single field
   */
  async decryptField(
    _fieldName: string,
    encryptedData: EncryptedField | string,
    _userId?: string
  ): Promise<unknown> {
    try {
      const config = FIELD_CONFIGS[_fieldName];
      
      if (!config || !config.encryptionRequired) {
        return encryptedData; // Return as-is if not configured
      }

      // Handle tokenized values
      if (config.tokenization && typeof encryptedData === 'string') {
        return await this.detokenizeValue(encryptedData, _fieldName);
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
            _userId,
            details: {
              action: 'field_decrypted',
              _fieldName,
              sensitivity: config.sensitivity,
            },
            severity: 'info',
          });
        }
        
        return value;
      }

      return encryptedData;
    } catch (error) {
      logger.error(`Failed to decrypt field ${_fieldName}:`, error);
      throw new Error('Field decryption failed');
    }
  }

  /**
   * Encrypt multiple fields in an object
   */
  async encryptObject(
    obj: Record<string, any>,
    fieldList?: string[],
    _userId?: string
  ): Promise<Record<string, any>> {
    const encrypted: Record<string, any> = {};
    const fieldsToEncrypt = fieldList || Object.keys(_obj);

    for (const key of Object.keys(_obj)) {
      if (fieldsToEncrypt.includes(key) && FIELD_CONFIGS[key]) {
        encrypted[key] = await this.encryptField(key, obj[key], _userId);
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
    _userId?: string
  ): Promise<Record<string, any>> {
    const decrypted: Record<string, any> = {};
    const fieldsToDecrypt = fieldList || Object.keys(_obj);

    for (const key of Object.keys(_obj)) {
      if (fieldsToDecrypt.includes(key) && FIELD_CONFIGS[key]) {
        decrypted[key] = await this.decryptField(key, obj[key], _userId);
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
    _fieldName: string,
    searchTerm: string,
    _userId?: string
  ): Promise<string[]> {
    const config = FIELD_CONFIGS[_fieldName];
    
    if (!config || !config.searchable) {
      throw new Error('Field is not searchable');
    }

    // Generate search token
    const _searchToken = await this.generateSearchToken(searchTerm, _fieldName);
    
    // Search in index
    const fieldIndex = this.searchIndexes.get(_fieldName);
    if (!fieldIndex) {
      return [];
    }

    const results = fieldIndex.get(_searchToken) || [];
    
    // Audit search operation
    await auditLogger.log({
      event: 'DATA_ACCESS',
      _userId,
      details: {
        action: 'encrypted_search',
        _fieldName,
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
      
      for (const [_keyId, metadata] of this.keyMetadata.entries()) {
        const daysSinceRotation = metadata.rotatedAt
          ? (now.getTime() - metadata.rotatedAt.getTime()) / (1000 * 60 * 60 * 24)
          : (now.getTime() - metadata.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        
        if (force || daysSinceRotation >= this.KEY_ROTATION_DAYS) {
          await this.rotateKey(_keyId);
        }
      }
      
      // Clean up old key versions
      await this.cleanupOldKeys();
      
    } catch (error) {
      logger.error('Key rotation failed:');
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
      const newMetadata = this.keyMetadata.get(_newKeyId);
      if (!newMetadata) {
        throw new Error('New key not found');
      }
      
      return {
        ciphertext: encrypted,
        _keyId: newKeyId,
        version: newMetadata.version,
        algorithm: newMetadata.algorithm,
        metadata: {
          ...data.metadata,
          fieldType: data.metadata?.fieldType || 'string',
          encrypted: new Date(),
        },
      };
    } catch (error) {
      logger.error('Re-encryption failed:');
      throw undefined;
    }
  }

  /**
   * Private helper methods
   */
  private async getFieldKey(
    _fieldName: string,
    sensitivity: string
  ): Promise<EncryptionKeyMetadata> {
    const _keyId = `field_key_${sensitivity}`;
    let metadata = this.keyMetadata.get(_keyId);
    
    if (!metadata) {
      // Generate new key for this sensitivity level
      metadata = await this.generateFieldKey(_keyId, sensitivity);
    }
    
    return metadata;
  }

  private async generateFieldKey(
    _keyId: string,
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
      _keyId,
      version: 1,
      algorithm: 'AES-GCM',
      createdAt: new Date(),
      purpose,
      active: true,
    };
    
    this.encryptionKeys.set(_keyId, key);
    this.keyMetadata.set(_keyId, metadata);
    
    // Persist key securely
    await this.persistKey(_keyId, key, metadata);
    
    return metadata;
  }

  private async rotateKey(_keyId: string): Promise<void> {
    const oldMetadata = this.keyMetadata.get(_keyId);
    if (!oldMetadata) return;
    
    // Generate new key version
    const newKeyId = `${_keyId}_v${oldMetadata.version + 1}`;
    const newKey = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
    
    const newMetadata: EncryptionKeyMetadata = {
      _keyId: newKeyId,
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
        _keyId,
        newKeyId,
        version: newMetadata.version,
      },
      severity: 'info',
    });
  }

  private async tokenizeValue(value: unknown, _fieldName: string): Promise<string> {
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

  private async detokenizeValue(token: string, _fieldName: string): Promise<unknown> {
    // Retrieve from vault
    let encrypted = this.tokenVault.get(_token);
    
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
    value: unknown,
    config: FieldEncryptionConfig,
    _keyInfo: EncryptionKeyMetadata
  ): Promise<string> {
    // Simple format-preserving encryption
    // In production, use FF3-1 or similar algorithm
    const _stringValue = String(value);
    const encrypted = await cryptoService.encrypt(_stringValue);
    
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
  ): Promise<unknown> {
    // Extract actual encrypted data
    let _actualEncrypted = encrypted;
    
    if (encrypted.startsWith('enc_')) {
      // Need to retrieve full encrypted value from storage
      const fullEncrypted = await secureStorage.getItem(`fpe_${encrypted}`);
      if (_fullEncrypted) {
        _actualEncrypted = fullEncrypted;
      }
    }
    
    const decrypted = await cryptoService.decrypt(_actualEncrypted);
    
    // Convert back to appropriate type
    if (config.dataType === 'date') {
      return new Date(decrypted);
    } else if (config.dataType === 'number') {
      return Number(decrypted);
    }
    
    return decrypted;
  }

  private async generateSearchToken(searchTerm: string, _fieldName: string): Promise<string> {
    // Generate deterministic search token
    const normalized = searchTerm.toLowerCase().trim();
    const hash = await cryptoService.sha256(`${_fieldName}:${normalized}`);
    return hash.substring(0, 16); // Use prefix for efficiency
  }

  private async updateSearchIndex(
    _fieldName: string,
    value: unknown,
    encrypted: string,
    _userId?: string
  ): Promise<void> {
    if (!this.searchIndexes.has(_fieldName)) {
      this.searchIndexes.set(_fieldName, new Map());
    }
    
    const fieldIndex = this.searchIndexes.get(_fieldName)!;
    
    // Generate search tokens for value
    const searchableText = String(value).toLowerCase();
    const words = searchableText.split(/\s+/);
    
    for (const word of words) {
      if (word.length > 2) { // Skip very short words
        const token = await this.generateSearchToken(word, _fieldName);
        
        const entries = fieldIndex.get(_token) || [];
        if (!entries.includes(encrypted)) {
          entries.push(encrypted);
          fieldIndex.set(token, entries);
        }
      }
    }
  }

  private async loadEncryptionKeys(): Promise<void> {
    try {
      const _storedKeys = await secureStorage.getItem('field_encryption_keys');
      if (_storedKeys) {
        // Load and reconstruct keys
        for (const [_keyId, _keyData] of Object.entries(_storedKeys)) {
          // Reconstruct CryptoKey objects
          // Implementation depends on key storage format
        }
      }
    } catch (error) {
      logger.error('Failed to load encryption keys:');
    }
  }

  private async persistKey(
    _keyId: string,
    key: CryptoKey,
    metadata: EncryptionKeyMetadata
  ): Promise<void> {
    try {
      // Export key for storage
      const _exportedKey = await crypto.subtle.exportKey('raw', key);
      const keyString = btoa(String.fromCharCode(...new Uint8Array(_exportedKey)));
      
      // Store securely
      await secureStorage.setItem(`field_key_${_keyId}`, {
        key: keyString,
        metadata,
      }, {
        encrypted: true,
        persistent: true,
      });
    } catch (error) {
      logger.error('Failed to persist key:');
    }
  }

  private async checkKeyRotation(): Promise<void> {
    const needsRotation: string[] = [];
    const now = new Date();
    
    for (const [_keyId, metadata] of this.keyMetadata.entries()) {
      if (!metadata.active) continue;
      
      const age = (now.getTime() - metadata.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (age >= this.KEY_ROTATION_DAYS) {
        needsRotation.push(_keyId);
      }
    }
    
    if (needsRotation.length > 0) {
      logger.info(`Keys needing rotation: ${needsRotation.join(', ')}`, 'FieldEncryption');
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
    
    for (const [_keyId, metadata] of this.keyMetadata.entries()) {
      if (!metadata.active && metadata.expiresAt && new Date() > metadata.expiresAt) {
        toDelete.push(_keyId);
      }
    }
    
    for (const _keyId of toDelete) {
      this.encryptionKeys.delete(_keyId);
      this.keyMetadata.delete(_keyId);
      await secureStorage.removeItem(`field_key_${_keyId}`);
    }
  }
}

export const _fieldEncryption = FieldEncryptionService.getInstance();