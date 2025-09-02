/**
 * Secure LocalStorage Wrapper
 * 
 * SECURITY FIX: Encrypts all sensitive data before storing in localStorage
 * Prevents XSS attacks from accessing plain text mental health data
 */

// @ts-ignore - CryptoJS types compatibility
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
    // @ts-ignore - CryptoJS lib property access
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
      // @ts-ignore - CryptoJS method access
      const encrypted = CryptoJS.AES.encrypt(data, this.encryptionKey, {
        // @ts-ignore - CryptoJS mode property access
        mode: CryptoJS.mode.CBC,
        // @ts-ignore - CryptoJS padding property access
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
      // @ts-ignore - CryptoJS method access
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey, {
        // @ts-ignore - CryptoJS mode property access
        mode: CryptoJS.mode.CBC,
        // @ts-ignore - CryptoJS padding property access
        padding: CryptoJS.pad.Pkcs7
      });
      // @ts-ignore - CryptoJS encoding access
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
        localStorage.setItem(`encrypted_${key}`, encryptedValue);
        
        // Log security action (but not the data)
        console.info('🔒 Stored encrypted data for key:', key);
      } else {
        // Store non-sensitive data normally
        localStorage.setItem(key, value);
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
        const encryptedValue = localStorage.getItem(`encrypted_${key}`);
        if (encryptedValue) {
          try {
            return this.decrypt(encryptedValue);
          } catch (decryptError) {
            // If decryption fails (malformed data/wrong key), clear corrupted data
            console.warn('🔒 Corrupted encrypted data detected, clearing:', key);
            localStorage.removeItem(`encrypted_${key}`);
            localStorage.removeItem(key);
            return null;
          }
        }
        
        // Fall back to plain text (for migration)
        const plainValue = localStorage.getItem(key);
        if (plainValue) {
          try {
            // Migrate to encrypted storage
            this.setItem(key, plainValue);
            localStorage.removeItem(key); // Remove plain text version
            console.info('🔒 Migrated plain text data to encrypted storage:', key);
            return plainValue;
          } catch (encryptError) {
            console.warn('🔒 Failed to encrypt during migration, returning plain value:', key);
            return plainValue;
          }
        }
        
        return null;
      } else {
        // Get non-sensitive data normally
        return localStorage.getItem(key);
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
        localStorage.removeItem(`encrypted_${key}`);
        localStorage.removeItem(key); // Also remove any plain text version
        console.info('🔒 Removed encrypted data for key:', key);
      } else {
        localStorage.removeItem(key);
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
          used += (localStorage.getItem(key) || '').length;
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
      const value = localStorage.getItem(key);
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
const secureStorageInstance = secureLocalStorage;
export const secureStorage = {
  setItem: (key: string, value: string) => secureStorageInstance.setItem(key, value),
  getItem: (key: string) => secureStorageInstance.getItem(key),
  removeItem: (key: string) => secureStorageInstance.removeItem(key),
  clear: () => secureStorageInstance.clear(),
  get length() { return localStorage.length; },
  key: (index: number) => localStorage.key(index)
};