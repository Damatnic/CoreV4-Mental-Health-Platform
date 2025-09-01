/**
 * Cryptography Service
 * Provides encryption, decryption, hashing, and key management
 * HIPAA-compliant implementation with AES-256-GCM encryption
 */

class CryptographyService {
  private static instance: CryptographyService;
  private masterKey: CryptoKey | null = null;
  private derivedKeys: Map<string, CryptoKey> = new Map();
  private readonly ALGORITHM = 'AES-GCM';
  private readonly KEY_LENGTH = 256;
  private readonly IV_LENGTH = 12; // 96 bits for GCM
  private readonly SALT_LENGTH = 16; // 128 bits
  private readonly TAG_LENGTH = 16; // 128 bits
  private readonly PBKDF2_ITERATIONS = 100000;

  private constructor() {
    this.initializeCrypto();
  }

  static getInstance(): CryptographyService {
    if (!CryptographyService.instance) {
      CryptographyService.instance = new CryptographyService();
    }
    return CryptographyService.instance;
  }

  private async initializeCrypto(): Promise<void> {
    // Generate or retrieve master key
    await this.initializeMasterKey();
  }

  /**
   * Initialize or retrieve the master encryption key
   */
  private async initializeMasterKey(): Promise<void> {
    try {
      // Check if we have a stored master key
      const storedKey = this.getStoredMasterKey();
      
      if (storedKey) {
        // Import the stored key
        this.masterKey = await this.importKey(storedKey);
      } else {
        // Generate a new master key
        this.masterKey = await this.generateMasterKey();
        
        // Store the key securely (in production, use HSM or secure key storage)
        this.storeMasterKey(this.masterKey);
      }
    } catch (error) {
      console.error('Failed to initialize master key:', error);
      throw new Error('Cryptography initialization failed');
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  async encrypt(data: string, additionalData?: string): Promise<string> {
    try {
      if (!this.masterKey) {
        await this.initializeMasterKey();
      }

      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      
      // Encode the data
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(data);
      
      // Prepare additional authenticated data if provided
      const aad = additionalData ? encoder.encode(additionalData) : undefined;
      
      // Encrypt the data
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
          additionalData: aad,
          tagLength: this.TAG_LENGTH * 8,
        },
        this.masterKey!,
        encodedData
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedData), iv.length);
      
      // Convert to base64 for storage
      return this.arrayBufferToBase64(combined.buffer);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  async decrypt(encryptedData: string, additionalData?: string): Promise<string> {
    try {
      if (!this.masterKey) {
        await this.initializeMasterKey();
      }

      // Convert from base64
      const combined = this.base64ToArrayBuffer(encryptedData);
      const combinedArray = new Uint8Array(combined);
      
      // Extract IV and encrypted data
      const iv = combinedArray.slice(0, this.IV_LENGTH);
      const ciphertext = combinedArray.slice(this.IV_LENGTH);
      
      // Prepare additional authenticated data if provided
      const encoder = new TextEncoder();
      const aad = additionalData ? encoder.encode(additionalData) : undefined;
      
      // Decrypt the data
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
          additionalData: aad,
          tagLength: this.TAG_LENGTH * 8,
        },
        this.masterKey!,
        ciphertext
      );

      // Decode the result
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash a password using PBKDF2
   */
  async hashPassword(password: string, salt?: string): Promise<string> {
    try {
      // Generate or use provided salt
      const saltBytes = salt 
        ? this.base64ToArrayBuffer(salt)
        : crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
      
      // Import password as key
      const encoder = new TextEncoder();
      const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
      );
      
      // Derive key using PBKDF2
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBytes,
          iterations: this.PBKDF2_ITERATIONS,
          hash: 'SHA-256',
        },
        passwordKey,
        256
      );
      
      // Combine salt and hash
      const combined = new Uint8Array(saltBytes.byteLength + derivedBits.byteLength);
      combined.set(new Uint8Array(saltBytes), 0);
      combined.set(new Uint8Array(derivedBits), saltBytes.byteLength);
      
      return this.arrayBufferToBase64(combined.buffer);
    } catch (error) {
      console.error('Password hashing failed:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      // Extract salt from hash
      const combined = this.base64ToArrayBuffer(hash);
      const combinedArray = new Uint8Array(combined);
      const salt = combinedArray.slice(0, this.SALT_LENGTH);
      const originalHash = combinedArray.slice(this.SALT_LENGTH);
      
      // Hash the provided password with the same salt
      const saltBase64 = this.arrayBufferToBase64(salt.buffer);
      const newHashWithSalt = await this.hashPassword(password, saltBase64);
      
      // Extract the hash part from the new result
      const newCombined = this.base64ToArrayBuffer(newHashWithSalt);
      const newCombinedArray = new Uint8Array(newCombined);
      const newHash = newCombinedArray.slice(this.SALT_LENGTH);
      
      // Compare hashes using constant-time comparison
      return this.constantTimeCompare(originalHash, newHash);
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }

  /**
   * Generate a secure random token
   */
  generateSecureToken(length: number = 32): string {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return this.arrayBufferToBase64(bytes.buffer);
  }

  /**
   * Generate a cryptographically secure UUID
   */
  generateSecureUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Derive a key from a password
   */
  async deriveKeyFromPassword(
    password: string,
    salt: string,
    usage: KeyUsage[] = ['encrypt', 'decrypt']
  ): Promise<CryptoKey> {
    const cacheKey = `${password}_${salt}_${usage.join(',')}`;
    
    // Check cache
    if (this.derivedKeys.has(cacheKey)) {
      return this.derivedKeys.get(cacheKey)!;
    }

    try {
      // Import password
      const encoder = new TextEncoder();
      const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
      );
      
      // Derive key
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode(salt),
          iterations: this.PBKDF2_ITERATIONS,
          hash: 'SHA-256',
        },
        passwordKey,
        {
          name: this.ALGORITHM,
          length: this.KEY_LENGTH,
        },
        false,
        usage
      );
      
      // Cache the derived key
      this.derivedKeys.set(cacheKey, derivedKey);
      
      return derivedKey;
    } catch (error) {
      console.error('Key derivation failed:', error);
      throw new Error('Failed to derive key from password');
    }
  }

  /**
   * Calculate SHA-256 hash of data
   */
  async sha256(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Sign data using HMAC-SHA256
   */
  async signData(data: string, key?: CryptoKey): Promise<string> {
    try {
      const signingKey = key || this.masterKey;
      if (!signingKey) {
        throw new Error('No signing key available');
      }

      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Generate HMAC key if needed
      const hmacKey = await crypto.subtle.importKey(
        'raw',
        await crypto.subtle.exportKey('raw', signingKey),
        {
          name: 'HMAC',
          hash: 'SHA-256',
        },
        false,
        ['sign']
      );
      
      const signature = await crypto.subtle.sign(
        'HMAC',
        hmacKey,
        dataBuffer
      );
      
      return this.arrayBufferToBase64(signature);
    } catch (error) {
      console.error('Data signing failed:', error);
      throw new Error('Failed to sign data');
    }
  }

  /**
   * Verify data signature
   */
  async verifySignature(
    data: string,
    signature: string,
    key?: CryptoKey
  ): Promise<boolean> {
    try {
      const verifyKey = key || this.masterKey;
      if (!verifyKey) {
        throw new Error('No verification key available');
      }

      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const signatureBuffer = this.base64ToArrayBuffer(signature);
      
      // Generate HMAC key if needed
      const hmacKey = await crypto.subtle.importKey(
        'raw',
        await crypto.subtle.exportKey('raw', verifyKey),
        {
          name: 'HMAC',
          hash: 'SHA-256',
        },
        false,
        ['verify']
      );
      
      return await crypto.subtle.verify(
        'HMAC',
        hmacKey,
        signatureBuffer,
        dataBuffer
      );
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Private helper methods
   */
  private async generateMasterKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  private async importKey(keyData: string): Promise<CryptoKey> {
    const keyBuffer = this.base64ToArrayBuffer(keyData);
    return await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  private getStoredMasterKey(): string | null {
    // SECURITY: Key storage disabled to prevent insecure key exposure
    // In production, implement secure key storage (HSM, KMS, or server-side)
    // For development, keys are generated per session (more secure than browser storage)
    console.warn('🔐 SECURITY: Using session-only keys (no persistent storage)');
    return null; // Force key regeneration each session for security
  }

  private async storeMasterKey(key: CryptoKey): Promise<void> {
    // SECURITY: Key storage disabled to prevent insecure key exposure
    // In production, implement secure key storage:
    // - AWS KMS, Azure Key Vault, Google Cloud KMS
    // - Hardware Security Module (HSM)
    // - Server-side secure key management
    // For now, keys are kept in memory only (more secure than browser storage)
    console.log('🔐 SECURITY: Master key kept in memory only (no persistent storage)');
    // No storage operation - key lives only in this.masterKey
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i] || 0);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private constantTimeCompare(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= (a[i] || 0) ^ (b[i] || 0);
    }
    
    return result === 0;
  }

  /**
   * Clear sensitive data from memory
   */
  clearSensitiveData(): void {
    this.derivedKeys.clear();
    // Note: Cannot truly clear CryptoKey objects from memory in JavaScript
    // This is a limitation of the Web Crypto API
  }
}

export const cryptoService = CryptographyService.getInstance();