/**
 * Secure Storage Service
 * Provides encrypted storage for sensitive data with HIPAA compliance
 * Implements defense-in-depth with multiple layers of security
 */

import { cryptoService } from './cryptoService';
import { secureStorage as _localSecureStorage } from './SecureLocalStorage';
import { logger } from '../../utils/logger';

interface StorageOptions {
  persistent?: boolean;
  expires?: Date;
  encrypted?: boolean;
  compress?: boolean;
}

interface StorageItem {
  value: unknown;
  metadata: {
    created: Date;
    updated: Date;
    expires?: Date;
    encrypted: boolean;
    _compressed: boolean;
    checksum: string;
  };
}

class SecureStorageService {
  private static instance: SecureStorageService;
  private memoryCache: Map<string, StorageItem> = new Map();
  private readonly STORAGE_PREFIX = 'mh_secure_';
  private readonly MAX_STORAGE_SIZE = 10 * 1024 * 1024; // 10MB limit per user

  private constructor() {
    this.initializeStorage();
  }

  static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  private initializeStorage(): void {
    // Clean up expired items on initialization
    this.cleanupExpiredItems();
    
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupExpiredItems();
    }, 60 * 60 * 1000); // Clean up every hour

    // Listen for storage quota errors
    this.setupStorageQuotaHandling();
  }

  /**
   * Store an item securely
   */
  async setItem(
    key: string,
    value: unknown,
    options: StorageOptions = {}
  ): Promise<void> {
    try {
      const { persistent = true, expires, encrypted = true, compress = false,  } = options;

      // Validate storage quota
      await this.checkStorageQuota();

      // Serialize value
      let serialized = JSON.stringify(value);

      // Compress if requested and beneficial
      if (compress && serialized.length > 1024) {
        serialized = await this.compress(_serialized);
      }

      // Encrypt if requested
      if (_encrypted) {
        serialized = await cryptoService.encrypt(_serialized);
      }

      // Calculate checksum for integrity verification
      const checksum = await this.calculateChecksum(_serialized);

      // Create storage item
      const storageItem: StorageItem = {
        value: serialized,
        metadata: {
          created: new Date(),
          updated: new Date(),
          expires,
          encrypted,
          _compressed: compress,
          checksum,
        },
      };

      // Store in memory cache
      this.memoryCache.set(key, storageItem);

      // Store persistently if requested
      if (_persistent) {
        const _storageKey = this.getStorageKey(key);
        
        try {
          localStorage.setItem(_storageKey, JSON.stringify(storageItem));
        } catch (_error) {
          // Try IndexedDB as fallback for larger data
          await this.storeInIndexedDB(_storageKey, storageItem);
        }
      }

      // Log storage event for audit
      this.logStorageEvent('SET', key, { encrypted, persistent });
    } catch (error) {
      logger.error(`Failed to store item ${key}:`, error);
      throw new Error(`Storage failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Retrieve an item from secure storage
   */
  async getItem(key: string): Promise<unknown> {
    try {
      // Check memory cache first
      let storageItem = this.memoryCache.get(key);

      // If not in memory, check persistent storage
      if (!storageItem) {
        const _storageKey = this.getStorageKey(key);
        
        // Try localStorage first
        const _stored = localStorage.getItem(_storageKey);
        if (_stored) {
          storageItem = JSON.parse(_stored) as StorageItem;
        } else {
          // Try IndexedDB as fallback
          storageItem = await this.getFromIndexedDB(_storageKey) || undefined;
        }

        // Cache in memory if found
        if (storageItem) {
          this.memoryCache.set(key, storageItem);
        }
      }

      if (!storageItem) {
        return null;
      }

      // Check expiration
      if (storageItem.metadata.expires && 
          new Date() > new Date(storageItem.metadata.expires)) {
        await this.removeItem(key);
        return null;
      }

      // Verify integrity
      const checksum = await this.calculateChecksum(storageItem.value);
      if (checksum !== storageItem.metadata.checksum) {
        logger.error(`Integrity check failed for ${key}`);
        await this.removeItem(key);
        throw new Error('Data integrity verification failed');
      }

      let value = storageItem.value;

      // Decrypt if encrypted
      if (storageItem.metadata.encrypted) {
        value = await cryptoService.decrypt(value);
      }

      // Decompress if compressed
      if (storageItem.metadata.compressed) {
        value = await this.decompress(value);
      }

      // Deserialize
      return JSON.parse(value);
    } catch (error) {
      logger.error(`Failed to retrieve item ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove an item from storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      // Remove from memory cache
      this.memoryCache.delete(key);

      // Remove from localStorage
      const _storageKey = this.getStorageKey(key);
      localStorage.removeItem(_storageKey);

      // Remove from IndexedDB
      await this.removeFromIndexedDB(_storageKey);

      // Log removal event
      this.logStorageEvent('REMOVE', key);
    } catch (error) {
      logger.error(`Failed to remove item ${key}:`, error);
    }
  }

  /**
   * Clear all stored items
   */
  async clear(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();

      // Clear localStorage items with our prefix
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Clear IndexedDB
      await this.clearIndexedDB();

      // Log clear event
      this.logStorageEvent('CLEAR', 'all');
    } catch (error) {
      logger.error('Failed to clear storage:');
    }
  }

  /**
   * Get all keys in storage
   */
  async getAllKeys(): Promise<string[]> {
    const keys = new Set<string>();

    // Get keys from memory cache
    this.memoryCache.forEach((_, key) => keys.add(key));

    // Get keys from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const _storageKey = localStorage.key(i);
      if (_storageKey?.startsWith(this.STORAGE_PREFIX)) {
        const key = _storageKey.replace(this.STORAGE_PREFIX, '');
        keys.add(key);
      }
    }

    // Get keys from IndexedDB
    const idbKeys = await this.getKeysFromIndexedDB();
    idbKeys.forEach(key => keys.add(key.replace(this.STORAGE_PREFIX, '')));

    return Array.from(_keys);
  }

  /**
   * Get storage size information
   */
  async getStorageInfo(): Promise<{
    used: number;
    available: number;
    quota: number;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: (estimate.quota || 0) - (estimate.usage || 0),
        quota: estimate.quota || 0,
      };
    }

    // Fallback for browsers without storage API
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        used += (localStorage.getItem(key) || '').length;
      }
    }

    return {
      used,
      available: this.MAX_STORAGE_SIZE - used,
      quota: this.MAX_STORAGE_SIZE,
    };
  }

  /**
   * Private helper methods
   */
  private getStorageKey(key: string): string {
    return `${this.STORAGE_PREFIX}${key}`;
  }

  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const _hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(_hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async compress(data: string): Promise<string> {
    // Simple compression using browser's CompressionStream API if available
    if ('CompressionStream' in window) {
      const encoder = new TextEncoder();
      const stream = new Response(
        new Blob([encoder.encode(data)])
          .stream()
          .pipeThrough(new (window as unknown).CompressionStream('gzip'))
      );
      const _compressed = await stream.arrayBuffer();
      return btoa(String.fromCharCode(...new Uint8Array(_compressed)));
    }
    return data; // Return uncompressed if API not available
  }

  private async decompress(data: string): Promise<string> {
    try {
      // Validate base64 input
      if (!data || typeof data !== 'string') {
        logger.warn('[SecureStorage] Invalid data for decompression');
        return '';
      }
      
      // Check if data is already decompressed (not base64)
      if (!this.isBase64(data)) {
        return data;
      }
      
      // Decompress using browser's DecompressionStream API if available
      if ('DecompressionStream' in window) {
        const _compressed = Uint8Array.from(atob(data), c => c.charCodeAt(0));
        const stream = new Response(
          new Blob([_compressed])
            .stream()
            .pipeThrough(new (window as unknown).DecompressionStream('gzip'))
        );
        const decompressed = await stream.text();
        return decompressed;
      }
      return data; // Return as-is if API not available
    } catch (error) {
      logger.error('[SecureStorage] Decompression failed:');
      return ''; // Return empty string instead of throwing
    }
  }

  private isBase64(str: string): boolean {
    try {
      // Basic base64 validation
      return btoa(atob(_str)) === str;
    } catch (_error) {
      return false;
    }
  }

  private async checkStorageQuota(): Promise<void> {
    const info = await this.getStorageInfo();
    if (info.available < 1024 * 1024) { // Less than 1MB available
      // Clean up old items
      await this.cleanupOldItems();
      
      // Check again
      const newInfo = await this.getStorageInfo();
      if (newInfo.available < 1024 * 1024) {
        throw new Error('Storage quota exceeded');
      }
    }
  }

  private async cleanupExpiredItems(): Promise<void> {
    const keys = await this.getAllKeys();
    for (const key of keys) {
      const __item = await this.getItem(key);
      // getItem automatically removes expired items
    }
  }

  private async cleanupOldItems(): Promise<void> {
    // Remove items older than 30 days that aren't marked as persistent
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const keys = await this.getAllKeys();
    
    for (const key of keys) {
      const _storageKey = this.getStorageKey(key);
      const _stored = localStorage.getItem(_storageKey);
      if (_stored) {
        const item = JSON.parse(_stored) as StorageItem;
        if (new Date(item.metadata.created) < thirtyDaysAgo) {
          await this.removeItem(key);
        }
      }
    }
  }

  private setupStorageQuotaHandling(): void {
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith(this.STORAGE_PREFIX)) {
        // Invalidate memory cache for changed items
        const key = event.key.replace(this.STORAGE_PREFIX, '');
        this.memoryCache.delete(key);
      }
    });
  }

  private logStorageEvent(
    action: string,
    key: string,
    details?: Record<string, any>
  ): void {
    // In production, this would log to audit service
    logger.debug(`Storage ${action}: ${key}`, 'SecureStorage', details);
  }

  /**
   * IndexedDB fallback methods for larger data
   */
  private async storeInIndexedDB(key: string, value: StorageItem): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SecureStorage', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['items'], 'readwrite');
        const store = transaction.objectStore('items');
        store.put({ key, value });
        
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('items')) {
          db.createObjectStore('items', { keyPath: 'key' });
        }
      };
    });
  }

  private async getFromIndexedDB(key: string): Promise<StorageItem | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SecureStorage', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('items')) {
          db.close();
          resolve(null);
          return;
        }
        
        const transaction = db.transaction(['items'], 'readonly');
        const store = transaction.objectStore('items');
        const getRequest = store.get(key);
        
        getRequest.onsuccess = () => {
          db.close();
          resolve(getRequest.result?.value || null);
        };
        
        getRequest.onerror = () => {
          db.close();
          reject(getRequest.error);
        };
      };
    });
  }

  private async removeFromIndexedDB(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SecureStorage', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('items')) {
          db.close();
          resolve();
          return;
        }
        
        const transaction = db.transaction(['items'], 'readwrite');
        const store = transaction.objectStore('items');
        store.delete(key);
        
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      };
    });
  }

  private async getKeysFromIndexedDB(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SecureStorage', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('items')) {
          db.close();
          resolve([]);
          return;
        }
        
        const transaction = db.transaction(['items'], 'readonly');
        const store = transaction.objectStore('items');
        const getAllKeysRequest = store.getAllKeys();
        
        getAllKeysRequest.onsuccess = () => {
          db.close();
          resolve(getAllKeysRequest.result as string[]);
        };
        
        getAllKeysRequest.onerror = () => {
          db.close();
          reject(getAllKeysRequest.error);
        };
      };
    });
  }

  private async clearIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase('SecureStorage');
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });
  }
}

export const secureStorage = SecureStorageService.getInstance();