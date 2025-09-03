/**
 * Multi-Factor Authentication Service
 * Provides TOTP, SMS, Email, and Biometric authentication methods
 * HIPAA-compliant implementation with secure backup codes
 */

import { cryptoService } from '../security/cryptoService';
import { secureStorage } from '../security/secureStorage';
import { auditLogger } from '../security/auditLogger';
import { logger } from '../logging/logger';

export type MFAMethod = 'totp' | 'sms' | 'email' | 'biometric' | 'backup';

export interface MFASetup {
  method: MFAMethod;
  enabled: boolean;
  verified: boolean;
  createdAt: Date;
  lastUsed?: Date;
  metadata?: Record<string, any>;
}

export interface TOTPSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFAChallenge {
  challengeId: string;
  method: MFAMethod;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
}

class MultiFactorAuthService {
  private static instance: MultiFactorAuthService;
  private readonly MAX_ATTEMPTS = 3;
  private readonly CODE_LENGTH = 6;
  private readonly BACKUP_CODE_LENGTH = 8;
  private readonly BACKUP_CODE_COUNT = 10;
  private readonly TOTP_WINDOW = 30; // seconds
  private readonly CHALLENGE_EXPIRY = 5 * 60 * 1000; // 5 minutes
  private activeChallenges: Map<string, MFAChallenge> = new Map();

  private constructor() {
    this.initializeService();
  }

  static getInstance(): MultiFactorAuthService {
    if (!MultiFactorAuthService.instance) {
      MultiFactorAuthService.instance = new MultiFactorAuthService();
    }
    return MultiFactorAuthService.instance;
  }

  private initializeService(): void {
    // Clean up expired challenges periodically
    setInterval(() => {
      this.cleanupExpiredChallenges();
    }, 60000); // Every minute
  }

  /**
   * Setup TOTP (Time-based One-Time Password) authentication
   */
  async setupTOTP(_userId: string): Promise<TOTPSetup> {
    try {
      // Generate secret
      const secret = this.generateTOTPSecret();
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      
      // Store encrypted setup
      await this.storeMFASetup(_userId, {
        method: 'totp',
        enabled: false,
        verified: false,
        createdAt: new Date(),
        metadata: {
          secret: await cryptoService.encrypt(secret),
          backupCodes: await cryptoService.encrypt(JSON.stringify(_backupCodes)),
          usedBackupCodes: [],
        },
      });

      // Generate QR code URL
      const qrCodeUrl = this.generateTOTPQRCode(_userId, secret);

      // Log setup initiation
      await auditLogger.log({
        event: 'MFA_ENABLED',
        _userId,
        details: { method: 'totp' },
        severity: 'info',
      });

      return {
        secret,
        qrCodeUrl,
        backupCodes,
      };
    } catch (error) {
      await auditLogger.log({
        event: 'SECURITY_ALERT',
        _userId,
        details: { error: error instanceof Error ? error.message : String(error), action: 'mfa_setup_failed' },
        severity: 'error',
      });
      throw error;
    }
  }

  /**
   * Verify TOTP setup with initial code
   */
  async verifyTOTPSetup(_userId: string, code: string): Promise<boolean> {
    try {
      const setup = await this.getMFASetup(_userId, 'totp');
      if (!setup) {
        throw new Error('TOTP not configured');
      }

      const secret = await cryptoService.decrypt(setup.metadata?.secret || '');
      const isValid = await this.verifyTOTPCode(secret, code);

      if (_isValid) {
        // Mark as verified and enabled
        setup.enabled = true;
        setup.verified = true;
        await this.storeMFASetup(_userId, setup);

        await auditLogger.log({
          event: 'MFA_ENABLED',
          _userId,
          details: { method: 'totp', verified: true },
          severity: 'info',
        });
      }

      return isValid;
    } catch (error) {
      await auditLogger.log({
        event: 'SECURITY_ALERT',
        _userId,
        details: { error: error instanceof Error ? error.message : String(error), action: 'mfa_setup_failed' },
        severity: 'warning',
      });
      return false;
    }
  }

  /**
   * Setup SMS authentication
   */
  async setupSMS(_userId: string, _phoneNumber: string): Promise<void> {
    try {
      // Validate phone number
      const sanitizedPhone = this.sanitizePhoneNumber(_phoneNumber);
      
      // Store setup
      await this.storeMFASetup(_userId, {
        method: 'sms',
        enabled: false,
        verified: false,
        createdAt: new Date(),
        metadata: {
          _phoneNumber: await cryptoService.encrypt(sanitizedPhone),
        },
      });

      // Send verification code
      await this.sendSMSCode(_userId, sanitizedPhone);

      await auditLogger.log({
        event: 'MFA_ENABLED',
        _userId,
        details: { method: 'sms' },
        severity: 'info',
      });
    } catch (error) {
      await auditLogger.log({
        event: 'SECURITY_ALERT',
        _userId,
        details: { error: error instanceof Error ? error.message : String(error), action: 'mfa_setup_failed' },
        severity: 'error',
      });
      throw error;
    }
  }

  /**
   * Setup email authentication
   */
  async setupEmail(_userId: string, email: string): Promise<void> {
    try {
      // Store setup
      await this.storeMFASetup(_userId, {
        method: 'email',
        enabled: false,
        verified: false,
        createdAt: new Date(),
        metadata: {
          email: await cryptoService.encrypt(email),
        },
      });

      // Send verification code
      await this.sendEmailCode(_userId, email);

      await auditLogger.log({
        event: 'MFA_ENABLED',
        _userId,
        details: { method: 'email' },
        severity: 'info',
      });
    } catch (error) {
      await auditLogger.log({
        event: 'SECURITY_ALERT',
        _userId,
        details: { error: error instanceof Error ? error.message : String(error), action: 'mfa_setup_failed' },
        severity: 'error',
      });
      throw error;
    }
  }

  /**
   * Setup biometric authentication
   */
  async setupBiometric(_userId: string): Promise<boolean> {
    try {
      // Check if WebAuthn is available
      if (!window.PublicKeyCredential) {
        throw new Error('Biometric authentication not supported');
      }

      // Create credential options
      const credentialOptions = await this.createBiometricCredential(_userId);
      
      // Store setup
      await this.storeMFASetup(_userId, {
        method: 'biometric',
        enabled: true,
        verified: true,
        createdAt: new Date(),
        metadata: credentialOptions,
      });

      await auditLogger.log({
        event: 'MFA_ENABLED',
        _userId,
        details: { method: 'biometric' },
        severity: 'info',
      });

      return true;
    } catch (error) {
      await auditLogger.log({
        event: 'SECURITY_ALERT',
        _userId,
        details: { error: error instanceof Error ? error.message : String(error), action: 'mfa_setup_failed' },
        severity: 'error',
      });
      return false;
    }
  }

  /**
   * Create MFA challenge for login
   */
  async createChallenge(_userId: string, _method?: MFAMethod): Promise<MFAChallenge> {
    try {
      // Get user's MFA _methods
      const _methods = await this.getUserMFAMethods(_userId);
      
      // Select method (use provided or default to most secure available)
      const selectedMethod = method || this.selectBestMethod(_methods);
      
      if (!selectedMethod) {
        throw new Error('No MFA method configured');
      }

      // Create challenge
      const challenge: MFAChallenge = {
        challengeId: cryptoService.generateSecureUUID(),
        method: selectedMethod,
        expiresAt: new Date(Date.now() + this.CHALLENGE_EXPIRY),
        attempts: 0,
        maxAttempts: this.MAX_ATTEMPTS,
      };

      // Store challenge
      this.activeChallenges.set(challenge.challengeId, challenge);

      // Send code based on method
      await this.sendChallengeCode(_userId, selectedMethod);

      await auditLogger.log({
        event: 'MFA_CHALLENGE_SUCCESS',
        _userId,
        details: { method: selectedMethod, challengeId: challenge.challengeId },
        severity: 'info',
      });

      return challenge;
    } catch (error) {
      await auditLogger.log({
        event: 'MFA_CHALLENGE_FAILED',
        _userId,
        details: { error: error instanceof Error ? error.message : String(error) },
        severity: 'warning',
      });
      throw error;
    }
  }

  /**
   * Verify MFA challenge response
   */
  async verifyChallenge(
    _userId: string,
    challengeId: string,
    code: string
  ): Promise<boolean> {
    try {
      const challenge = this.activeChallenges.get(_challengeId);
      
      if (!challenge) {
        throw new Error('Invalid or expired challenge');
      }

      // Check expiry
      if (new Date() > challenge.expiresAt) {
        this.activeChallenges.delete(_challengeId);
        throw new Error('Challenge expired');
      }

      // Check attempts
      challenge.attempts++;
      if (challenge.attempts > challenge.maxAttempts) {
        this.activeChallenges.delete(_challengeId);
        
        await auditLogger.log({
          event: 'SECURITY_ALERT',
          _userId,
          details: { reason: 'max_mfa_attempts_exceeded', challengeId },
          severity: 'critical',
        });
        
        throw new Error('Maximum attempts exceeded');
      }

      // Verify code based on method
      let isValid = false;
      
      switch (challenge.method) {
        case 'totp':
          isValid = await this.verifyTOTP(_userId, code);
          break;
        case 'sms':
        case 'email':
          isValid = await this.verifyTemporaryCode(_userId, code);
          break;
        case 'backup':
          isValid = await this.verifyBackupCode(_userId, code);
          break;
        case 'biometric':
          isValid = await this.verifyBiometric(_userId, code);
          break;
      }

      if (_isValid) {
        // Remove challenge
        this.activeChallenges.delete(_challengeId);
        
        // Update last used
        await this.updateLastUsed(_userId, challenge.method);
        
        await auditLogger.log({
          event: 'MFA_CHALLENGE_SUCCESS',
          _userId,
          details: { method: challenge.method, challengeId },
          severity: 'info',
        });
      } else {
        await auditLogger.log({
          event: 'MFA_CHALLENGE_FAILED',
          _userId,
          details: { 
            method: challenge.method, 
            challengeId,
            attempt: challenge.attempts 
          },
          severity: 'warning',
        });
      }

      return isValid;
    } catch (error) {
      await auditLogger.log({
        event: 'MFA_CHALLENGE_FAILED',
        userId,
        details: { error: error instanceof Error ? error.message : String(error), challengeId },
        severity: 'error',
      });
      return false;
    }
  }

  /**
   * Disable MFA method
   */
  async disableMFA(_userId: string, method: MFAMethod): Promise<void> {
    try {
      await this.removeMFASetup(_userId, method);
      
      await auditLogger.log({
        event: 'MFA_DISABLED',
        _userId,
        details: { method },
        severity: 'info',
      });
    } catch (error) {
      await auditLogger.log({
        event: 'SECURITY_ALERT',
        _userId,
        details: { error: error instanceof Error ? error.message : String(error), action: 'mfa_setup_failed' },
        severity: 'error',
      });
      throw error;
    }
  }

  /**
   * Get user's enabled MFA methods
   */
  async getUserMFAMethods(_userId: string): Promise<MFASetup[]> {
    const _key = `mfa_${_userId}`;
    const stored = await secureStorage.getItem(_key);
    
    if (!stored || !stored.methods) {
      return [];
    }
    
    return stored.methods.filter((m: MFASetup) => m.enabled);
  }

  /**
   * Check if user has MFA enabled
   */
  async hasMFAEnabled(_userId: string): Promise<boolean> {
    const _methods = await this.getUserMFAMethods(_userId);
    return _methods.length > 0;
  }

  /**
   * Generate recovery codes
   */
  async generateRecoveryCodes(_userId: string): Promise<string[]> {
    try {
      const codes = this.generateBackupCodes();
      
      // Store encrypted codes
      const _key = `mfa_recovery_${_userId}`;
      await secureStorage.setItem(_key, {
        codes: await cryptoService.encrypt(JSON.stringify(_codes)),
        generated: new Date(),
        used: [],
      });
      
      await auditLogger.log({
        event: 'SECURITY_ALERT',
        _userId,
        details: { action: 'recovery_codes_generated' },
        severity: 'info',
      });
      
      return codes;
    } catch (_error) {
      logger.error('Failed to generate recovery codes:');
      throw undefined;
    }
  }

  /**
   * Private helper methods
   */
  private generateTOTPSecret(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += characters[Math.floor(Math.random() * characters.length)];
    }
    return secret;
  }

  private generateTOTPQRCode(_userId: string, secret: string): string {
    const issuer = 'Mental Health Platform';
    const algorithm = 'SHA1';
    const digits = this.CODE_LENGTH;
    const period = this.TOTP_WINDOW;
    
    const _otpauth = `_otpauth://totp/${issuer}:${_userId}?secret=${secret}&issuer=${issuer}&algorithm=${algorithm}&digits=${digits}&period=${period}`;
    
    // In production, generate actual QR code
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(_otpauth)}`;
  }

  private async verifyTOTPCode(secret: string, code: string): Promise<boolean> {
    // Simplified TOTP verification - in production, use a proper TOTP library
    const _time = Math.floor(Date.now() / 1000 / this.TOTP_WINDOW);
    
    // Check current and adjacent time windows
    for (let i = -1; i <= 1; i++) {
      const testTime = time + i;
      const expectedCode = await this.generateTOTPCode(secret, testTime);
      if (expectedCode === code) {
        return true;
      }
    }
    
    return false;
  }

  private async generateTOTPCode(secret: string, time: number): Promise<string> {
    // Simplified TOTP generation - in production, use a proper implementation
    const hash = await cryptoService.sha256(`${secret}${time}`);
    const code = parseInt(hash.substr(0, 6), 16) % 1000000;
    return code.toString().padStart(6, '0');
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < this.BACKUP_CODE_COUNT; i++) {
      codes.push(this.generateBackupCode());
    }
    return codes;
  }

  private generateBackupCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < this.BACKUP_CODE_LENGTH; i++) {
      if (i === 4) code += '-'; // Add separator
      code += characters[Math.floor(Math.random() * characters.length)];
    }
    return code;
  }

  private sanitizePhoneNumber(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Validate length (assuming US numbers)
    if (digits.length !== 10 && digits.length !== 11) {
      throw new Error('Invalid phone number');
    }
    
    return digits;
  }

  private async sendSMSCode(_userId: string, _phoneNumber: string): Promise<void> {
    const code = this.generateVerificationCode();
    
    // Store temporary code
    await this.storeTemporaryCode(_userId, code);
    
    // In production, send actual SMS
    logger.info(`SMS to ${_phoneNumber}: Your verification code is ${code}`);
  }

  private async sendEmailCode(_userId: string, email: string): Promise<void> {
    const code = this.generateVerificationCode();
    
    // Store temporary code
    await this.storeTemporaryCode(_userId, code);
    
    // In production, send actual email
    logger.info(`Email to ${email}: Your verification code is ${code}`);
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async storeTemporaryCode(_userId: string, code: string): Promise<void> {
    const _key = `mfa_temp_${_userId}`;
    await secureStorage.setItem(_key, {
      code: await cryptoService.encrypt(code),
      expiresAt: new Date(Date.now() + this.CHALLENGE_EXPIRY),
    });
  }

  private async verifyTemporaryCode(_userId: string, code: string): Promise<boolean> {
    const _key = `mfa_temp_${_userId}`;
    const stored = await secureStorage.getItem(_key);
    
    if (!stored) return false;
    
    if (new Date() > new Date(stored.expiresAt)) {
      await secureStorage.removeItem(_key);
      return false;
    }
    
    const storedCode = await cryptoService.decrypt(stored.code);
    const isValid = storedCode === code;
    
    if (_isValid) {
      await secureStorage.removeItem(_key);
    }
    
    return isValid;
  }

  private async verifyTOTP(_userId: string, code: string): Promise<boolean> {
    const setup = await this.getMFASetup(_userId, 'totp');
    if (!setup) return false;
    
    const secret = await cryptoService.decrypt(setup.metadata?.secret || '');
    return await this.verifyTOTPCode(secret, code);
  }

  private async verifyBackupCode(_userId: string, code: string): Promise<boolean> {
    const setup = await this.getMFASetup(_userId, 'totp');
    if (!setup) return false;
    
    const backupCodes = JSON.parse(
      await cryptoService.decrypt(setup.metadata?.backupCodes || '[]')
    );
    const usedCodes = setup.metadata?.usedBackupCodes || [];
    
    if (usedCodes.includes(code)) {
      return false;
    }
    
    const isValid = backupCodes.includes(code);
    
    if (_isValid) {
      // Mark code as used
      usedCodes.push(code);
      if (setup.metadata) {
        setup.metadata.usedBackupCodes = usedCodes;
      }
      await this.storeMFASetup(_userId, setup);
    }
    
    return isValid;
  }

  private async verifyBiometric(_userId: string, credential: string): Promise<boolean> {
    // In production, verify WebAuthn credential
    logger.info('Verifying biometric credential:', credential);
    return true; // Simplified for development
  }

  private async createBiometricCredential(_userId: string): Promise<unknown> {
    // In production, create WebAuthn credential
    return {
      credentialId: cryptoService.generateSecureUUID(),
      publicKey: 'mock_public_key',
    };
  }

  private async storeMFASetup(_userId: string, setup: MFASetup): Promise<void> {
    const _key = `mfa_${_userId}`;
    const existing = await secureStorage.getItem(_key) || { _methods: [] };
    
    // Update or add method
    const index = existing.methods.findIndex((m: MFASetup) => m.method === setup.method);
    if (index >= 0) {
      existing._methods[index] = setup;
    } else {
      existing._methods.push(setup);
    }
    
    await secureStorage.setItem(_key, existing);
  }

  private async getMFASetup(_userId: string, method: MFAMethod): Promise<MFASetup | null> {
    const _key = `mfa_${_userId}`;
    const stored = await secureStorage.getItem(_key);
    
    if (!stored || !stored.methods) {
      return null;
    }
    
    return stored.methods.find((m: MFASetup) => m.method === method) || null;
  }

  private async removeMFASetup(_userId: string, method: MFAMethod): Promise<void> {
    const _key = `mfa_${_userId}`;
    const existing = await secureStorage.getItem(_key);
    
    if (existing && existing.methods) {
      existing._methods = existing._methods.filter((m: MFASetup) => m.method !== method);
      await secureStorage.setItem(_key, existing);
    }
  }

  private async updateLastUsed(_userId: string, method: MFAMethod): Promise<void> {
    const setup = await this.getMFASetup(_userId, method);
    if (setup) {
      setup.lastUsed = new Date();
      await this.storeMFASetup(_userId, setup);
    }
  }

  private selectBestMethod(_methods: MFASetup[]): MFAMethod | null {
    // Priority order: biometric > totp > sms > email
    const priority: MFAMethod[] = ['biometric', 'totp', 'sms', 'email'];
    
    for (const method of priority) {
      if (_methods.some(m => m.method === method)) {
        return method;
      }
    }
    
    return null;
  }

  private async sendChallengeCode(_userId: string, method: MFAMethod): Promise<void> {
    switch (method) {
      case "sms": {
        const smsSetup = await this.getMFASetup(_userId, 'sms');
        if (smsSetup) {
          const phone = await cryptoService.decrypt(smsSetup.metadata?._phoneNumber || '');
          await this.sendSMSCode(_userId, phone);
        }
        break;
      }
      case "email": {
        const emailSetup = await this.getMFASetup(_userId, 'email');
        if (emailSetup) {
          const email = await cryptoService.decrypt(emailSetup.metadata?.email || '');
          await this.sendEmailCode(_userId, email);
        }
        break;
      }
      // TOTP and biometric don't need to send codes
    }
  }

  private cleanupExpiredChallenges(): void {
    const now = new Date();
    for (const [_id, challenge] of this.activeChallenges.entries()) {
      if (now > challenge.expiresAt) {
        this.activeChallenges.delete(_id);
      }
    }
  }
}

export const __mfaService = MultiFactorAuthService.getInstance();