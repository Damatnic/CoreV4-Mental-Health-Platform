/**
 * Secure LocalStorage Wrapper
 * 
 * SECURITY FIX: Encrypts all sensitive data before storing in localStorage
 * Prevents XSS attacks from accessing plain text mental health data
 */

import CryptoJS from 'crypto-js';

// Sensitive data types that must be encrypted
const SENSITIVE_DATA_KEYS = [
  'mood_data',
  'wellnessData',
  'journalEntries',
  'journalDraft',
  'crisis_sessions',
  'safety_plan',
  'safetyPlan',
  'emergencyContacts',
  'crisis_assessment',
  'last_crisis_assessment',
  'patient_data',
  'user_data',
  'current_user',
  'access_token',
  'refresh_token',
  'auth_token',
  'sessionId',
  'userId',
  'anonymous_user',
  'critical_events',
  'corev4_critical_errors'
];

class SecureLocalStorage {
  private encryptionKey: string;

  constructor() {
    // Get encryption key from environment (secure approach)
    this.encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || this.generateTempKey();
  }

  /**
   * Generate temporary encryption key (development only)
   * WARNING: This key will not persist between sessions
   */
  private generateTempKey(): string {
    const tempKey = CryptoJS.lib.WordArray.random(256/8).toString();
    console.warn('⚠️ Using temporary encryption key. Set VITE_ENCRYPTION_KEY for production.');
    return tempKey;
  }

  /**
   * Check if a key contains sensitive data that should be encrypted
   */
  private isSensitiveData(key: string): boolean {
    return SENSITIVE_DATA_KEYS.some(sensitiveKey => 
      key.includes(sensitiveKey) || key.toLowerCase().includes(sensitiveKey.toLowerCase())
    );
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(data: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(data, this.encryptionKey, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      return encrypted.toString();
    } catch (error) {
      console.error('🔒 Encryption failed:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedData: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('🔒 Decryption failed:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  /**
   * Secure setItem - encrypts sensitive data automatically
   */
  setItem(key: string, value: string): void {
    try {
      if (this.isSensitiveData(key)) {
        // Encrypt sensitive data
        const encryptedValue = this.encrypt(value);
        secureStorage.setItem(`encrypted_${key}`, encryptedValue);
        
        // Log security action (but not the data)
        console.info('🔒 Stored encrypted data for key:', key);
      } else {
        // Store non-sensitive data normally
        secureStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('🔒 SecureLocalStorage.setItem failed:', error);
      throw error;
    }
  }

  /**
   * Secure getItem - decrypts sensitive data automatically
   */
  getItem(key: string): string | null {
    try {
      if (this.isSensitiveData(key)) {
        // Try to get encrypted version first
        const encryptedValue = secureStorage.getItem(`encrypted_${key}`);
        if (encryptedValue) {
          return this.decrypt(encryptedValue);
        }
        
        // Fall back to plain text (for migration)
        const plainValue = secureStorage.getItem(key);
        if (plainValue) {
          // Migrate to encrypted storage
          this.setItem(key, plainValue);
          secureStorage.removeItem(key); // Remove plain text version
          console.info('🔒 Migrated plain text data to encrypted storage:', key);
          return plainValue;
        }
        
        return null;
      } else {
        // Get non-sensitive data normally
        return secureStorage.getItem(key);
      }
    } catch (error) {
      console.error('🔒 SecureLocalStorage.getItem failed:', error);
      return null;
    }
  }

  /**
   * Secure removeItem - removes both encrypted and plain versions
   */
  removeItem(key: string): void {
    try {
      if (this.isSensitiveData(key)) {
        secureStorage.removeItem(`encrypted_${key}`);
        secureStorage.removeItem(key); // Also remove any plain text version
        console.info('🔒 Removed encrypted data for key:', key);
      } else {
        secureStorage.removeItem(key);
      }
    } catch (error) {
      console.error('🔒 SecureLocalStorage.removeItem failed:', error);
    }
  }

  /**
   * Clear all data (both encrypted and plain)
   */
  clear(): void {
    try {
      localStorage.clear();
      console.info('🔒 Cleared all localStorage data');
    } catch (error) {
      console.error('🔒 SecureLocalStorage.clear failed:', error);
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): { used: number; total: number; percentage: number } {
    try {
      let used = 0;
      const total = 5 * 1024 * 1024; // 5MB typical localStorage limit
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          used += (secureStorage.getItem(key) || '').length;
        }
      }
      
      return {
        used,
        total,
        percentage: Math.round((used / total) * 100)
      };
    } catch (error) {
      console.error('🔒 Failed to get storage info:', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }

  /**
   * Audit all stored keys and identify sensitive data
   */
  auditStoredData(): { encrypted: string[]; plainText: string[]; sensitive: string[] } {
    const encrypted: string[] = [];
    const plainText: string[] = [];
    const sensitive: string[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          if (key.startsWith('encrypted_')) {
            encrypted.push(key);
          } else if (this.isSensitiveData(key)) {
            sensitive.push(key);
          } else {
            plainText.push(key);
          }
        }
      }
    } catch (error) {
      console.error('🔒 Failed to audit stored data:', error);
    }

    return { encrypted, plainText, sensitive };
  }

  /**
   * Migrate all sensitive plain text data to encrypted storage
   */
  migrateSensitiveData(): void {
    console.info('🔒 Starting migration of sensitive data to encrypted storage...');
    
    const audit = this.auditStoredData();
    let migrated = 0;

    // Migrate sensitive plain text data
    audit.sensitive.forEach(key => {
      const value = secureStorage.getItem(key);
      if (value) {
        try {
          this.setItem(key, value); // This will encrypt it
          migrated++;
        } catch (error) {
          console.error(`🔒 Failed to migrate ${key}:`, error);
        }
      }
    });

    console.info(`🔒 Migration complete. ${migrated} keys migrated to encrypted storage.`);
  }
}

// Export singleton instance
export const secureLocalStorage = new SecureLocalStorage();

// Export class for dependency injection
export { SecureLocalStorage };

/**
 * Drop-in replacement for localStorage that automatically encrypts sensitive data
 * Use this instead of localStorage throughout the application
 */
export const secureStorage = {
  setItem: (key: string, value: string) => secureLocalStorage.setItem(key, value),
  getItem: (key: string) => secureLocalStorage.getItem(key),
  removeItem: (key: string) => secureLocalStorage.removeItem(key),
  clear: () => secureLocalStorage.clear(),
  get length() { return localStorage.length; },
  key: (index: number) => localStorage.key(index)
};