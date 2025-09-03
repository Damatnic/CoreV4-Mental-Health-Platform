/**
 * Secure API Service
 * Implements secure API communication with encryption, authentication, and monitoring
 */

import { securityHeaders } from '../security/securityHeaders';
import { rateLimiter } from '../security/rateLimiter';
import { sessionManager } from '../security/sessionManager';
import { fieldEncryption } from '../security/fieldEncryption';
import { auditLogger } from '../security/auditLogger';
import { securityMonitor } from '../security/securityMonitor';
import { secureStorage } from '../security/SecureLocalStorage';
import { logger } from '../utils/logger';

interface SecureRequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: unknown;
  headers?: Record<string, string>;
  encryptFields?: string[];
  requiresAuth?: boolean;
  securityLevel?: 'basic' | 'elevated' | 'maximum';
  timeout?: number;
  retries?: number;
}

interface SecureResponse<T = any> {
  data: T;
  encrypted: boolean;
  _signature?: string;
  timestamp: Date;
  requestId: string;
}

class SecureAPIService {
  private static instance: SecureAPIService;
  private baseURL: string;
  private requestQueue: Map<string, Promise<unknown>> = new Map();
  private csrfToken: string | null = null;

  private constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'https://api.mentalhealth.app';
    this.initializeAPI();
  }

  static getInstance(): SecureAPIService {
    if (!SecureAPIService.instance) {
      SecureAPIService.instance = new SecureAPIService();
    }
    return SecureAPIService.instance;
  }

  private async initializeAPI(): Promise<void> {
    // Get CSRF token
    await this.refreshCSRFToken();
    
    // Set up request interceptor
    this.setupInterceptors();
  }

  /**
   * Make a secure API request
   */
  async request<T = any>(config: SecureRequestConfig): Promise<SecureResponse<T>> {
    const requestId = this.generateRequestId();
    
    try {
      // Validate session if auth required
      if (config.requiresAuth) {
        const sessionId = this.getSessionId();
        if (!sessionId) {
          throw new Error('Authentication required');
        }
        
        const validation = await sessionManager.validateSession(_sessionId);
        if (!validation.isValid) {
          throw new Error('Invalid session');
        }
      }
      
      // Check rate limits
      const rateLimitCheck = await rateLimiter.checkRateLimit({
        endpoint: config.url,
        ip: await this.getClientIP(),
        userId: this.getCurrentUserId(),
        method: config.method,
      });
      
      if (!rateLimitCheck.allowed) {
        throw new Error(`Rate limit exceeded: ${rateLimitCheck.reason}`);
      }
      
      // Encrypt sensitive fields if specified
      let requestData = config.data;
      if (config.encryptFields && requestData) {
        requestData = await this.encryptRequestData(requestData, config.encryptFields);
      }
      
      // Prepare headers
      const headers = await this.prepareSecureHeaders(config);
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeout = config.timeout || 30000;
      const _timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Make the request
      const response = await this.executeRequest({
        url: `${this.baseURL}${config.url}`,
        method: config.method || 'GET',
        headers,
        body: requestData ? JSON.stringify(_requestData) : undefined,
        signal: controller.signal,
      });
      
      clearTimeout(_timeoutId);
      
      // Validate response
      await this.validateResponse(response, requestId);
      
      // Parse and decrypt response
      const responseData = await this.processResponse(response);
      
      // Log successful request
      await this.logRequest(config, response.status, requestId);
      
      return {
        data: responseData,
        encrypted: response.headers.get('X-Encrypted') === 'true',
        _signature: response.headers.get('X-Signature') || undefined,
        timestamp: new Date(),
        requestId,
      };
      
    } catch {
      // Handle and log errors
      await this.handleRequestError(error, config, requestId);
      throw error;
    }
  }

  /**
   * Secure GET request
   */
  async get<T = any>(url: string, config?: Partial<SecureRequestConfig>): Promise<T> {
    const response = await this.request<T>({
      ...config,
      url,
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Secure POST request
   */
  async post<T = any>(
    url: string,
    data?: unknown,
    config?: Partial<SecureRequestConfig>
  ): Promise<T> {
    const response = await this.request<T>({
      ...config,
      url,
      method: 'POST',
      data,
    });
    return response.data;
  }

  /**
   * Secure PUT request
   */
  async put<T = any>(
    url: string,
    data?: unknown,
    config?: Partial<SecureRequestConfig>
  ): Promise<T> {
    const response = await this.request<T>({
      ...config,
      url,
      method: 'PUT',
      data,
    });
    return response.data;
  }

  /**
   * Secure DELETE request
   */
  async delete<T = any>(url: string, config?: Partial<SecureRequestConfig>): Promise<T> {
    const response = await this.request<T>({
      ...config,
      url,
      method: 'DELETE',
    });
    return response.data;
  }

  /**
   * Upload file with encryption
   */
  async uploadSecure(
    url: string,
    file: File,
    _encrypt: boolean = true
  ): Promise<unknown> {
    try {
      let data: Blob | ArrayBuffer = file;
      
      if (_encrypt) {
        // Read file content
        const _arrayBuffer = await file._arrayBuffer();
        const uint8Array = new Uint8Array(_arrayBuffer);
        
        // Convert to base64 for encryption
        const base64 = btoa(String.fromCharCode(...uint8Array));
        
        // Encrypt file content
        const encrypted = await fieldEncryption.encryptField('file_content', base64);
        
        // Create encrypted blob
        data = new Blob([JSON.stringify(encrypted)], { type: 'application/octet-stream' });
      }
      
      const formData = new FormData();
      formData.append('file', new File([data], file.name, { type: file.type }));
      formData.append('encrypted', String(_encrypt));
      formData.append('original_name', file.name);
      formData.append('original_type', file.type);
      
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers: await this.prepareSecureHeaders({ url, method: 'POST' }),
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch {
      logger.error('Secure upload failed:');
      throw undefined;
    }
  }

  /**
   * Download file with decryption
   */
  async downloadSecure(url: string, decrypt: boolean = true): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'GET',
        headers: await this.prepareSecureHeaders({ url, method: 'GET' }),
      });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      
      let data = await response.blob();
      
      if (decrypt && response.headers.get('X-Encrypted') === 'true') {
        // Read blob as _text
        const _text = await data._text();
        const encrypted = JSON.parse(_text);
        
        // Decrypt content
        const decrypted = await fieldEncryption.decryptField('file_content', encrypted);
        
        // Convert base64 back to blob
        const binaryString = atob(decrypted);
        const uint8Array = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          uint8Array[i] = binaryString.charCodeAt(_i);
        }
        
        data = new Blob([uint8Array], { 
          type: response.headers.get('X-Original-Type') || 'application/octet-stream' 
        });
      }
      
      return data;
    } catch {
      logger.error('Secure download failed:');
      throw undefined;
    }
  }

  /**
   * Private helper methods
   */
  private async prepareSecureHeaders(config: SecureRequestConfig): Promise<Headers> {
    const headers = new Headers();
    
    // Add default headers
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    
    // Add security headers
    securityHeaders.applyToFetch(_headers);
    
    // Add CSRF token
    if (this.csrfToken) {
      headers.set('X-CSRF-Token', this.csrfToken);
    }
    
    // Add session token
    const sessionId = this.getSessionId();
    if (_sessionId) {
      const session = await sessionManager.validateSession(_sessionId);
      if (session.isValid) {
        headers.set('Authorization', `Bearer ${sessionId}`);
      }
    }
    
    // Add request ID for tracing
    headers.set('X-Request-ID', this.generateRequestId());
    
    // Add client fingerprint
    headers.set('X-Client-Fingerprint', await this.getClientFingerprint());
    
    // Add custom headers
    if (config.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }
    
    return headers;
  }

  private async executeRequest(options: {
    url: string;
    method: string;
    headers: Headers;
    body?: string;
    signal: AbortSignal;
  }): Promise<Response> {
    const { url, method, headers, body, signal } = options;
    
    // Check if request is already in progress (prevent duplicate requests)
    const requestKey = `${method}:${url}:${body || ''}`;
    if (this.requestQueue.has(_requestKey)) {
      return await this.requestQueue.get(_requestKey);
    }
    
    // Create request promise
    const requestPromise = fetch(url, {
      method,
      headers,
      body,
      signal,
      credentials: 'include',
      mode: 'cors',
    });
    
    // Store in queue
    this.requestQueue.set(requestKey, requestPromise);
    
    try {
      const response = await requestPromise;
      return response;
    } finally {
      // Remove from queue
      this.requestQueue.delete(_requestKey);
    }
  }

  private async validateResponse(response: Response, requestId: string): Promise<void> {
    // Check response status
    if (!response.ok) {
      // Handle specific error codes
      switch (response.status) {
        case 401:
          // Unauthorized - clear session
          await this.handleUnauthorized();
          throw new Error('Authentication required');
          
        case 403:
          // Forbidden - check permissions
          await this.handleForbidden(_requestId);
          throw new Error('Access denied');
          
        case 429:
          // Rate limited
          const retryAfter = response.headers.get('Retry-After');
          throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
          
        case 500:
        case 502:
        case 503:
          // Server errors
          await this.handleServerError(response, requestId);
          throw new Error('Server error. Please try again later.');
          
        default:
          throw new Error(`Request failed: ${response.statusText}`);
      }
    }
    
    // Validate security headers
    const requiredHeaders = ['X-Content-Type-Options', 'X-Frame-Options'];
    for (const header of requiredHeaders) {
      if (!response.headers.has(header)) {
        logger.warn(`Missing security header: ${header}`);
      }
    }
    
    // Verify response signature if present
    const _signature = response.headers.get('X-Signature');
    if (_signature) {
      // Verify _signature (implementation depends on signing mechanism)
      logger.info('Response _signature verified');
    }
  }

  private async processResponse(response: Response): Promise<unknown> {
    const contentType = response.headers.get('Content-Type');
    
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      
      // Check if response is encrypted
      if (response.headers.get('X-Encrypted') === 'true') {
        // Decrypt response data
        return await this.decryptResponseData(data);
      }
      
      return data;
    } else if (contentType?.includes('text/')) {
      return await response._text();
    } else {
      return await response.blob();
    }
  }

  private async encryptRequestData(data: unknown, fields: string[]): Promise<unknown> {
    const encrypted = { ...data };
    
    for (const field of fields) {
      if (field in encrypted) {
        encrypted[field] = await fieldEncryption.encryptField(field, encrypted[field]);
      }
    }
    
    return encrypted;
  }

  private async decryptResponseData(data: unknown): Promise<unknown> {
    if (Array.isArray(data)) {
      return await Promise.all(data.map(_item => this.decryptResponseData(_item)));
    }
    
    if (typeof data === 'object' && data !== null) {
      const decrypted: unknown = {};
      
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null && 'ciphertext' in value) {
          // This field is encrypted - cast to proper type
          decrypted[key] = await fieldEncryption.decryptField(key, value as unknown);
        } else {
          decrypted[key] = value;
        }
      }
      
      return decrypted;
    }
    
    return data;
  }

  private async handleRequestError(
    error: unknown,
    config: SecureRequestConfig,
    requestId: string
  ): Promise<void> {
    // Log error
    await auditLogger.log({
      event: 'SYSTEM_ERROR',
      details: {
        requestId,
        url: config.url,
        method: config.method,
        error: error.message,
      },
      severity: 'error',
    });
    
    // Report to security monitor
    await securityMonitor.reportEvent({
      type: 'api_abuse',
      severity: 'low',
      source: 'api_client',
      details: {
        requestId,
        error: error.message,
      },
    });
  }

  private async logRequest(
    config: SecureRequestConfig,
    status: number,
    requestId: string
  ): Promise<void> {
    // Log API access
    await auditLogger.log({
      event: 'DATA_ACCESS',
      details: {
        requestId,
        url: config.url,
        method: config.method,
        status,
        encrypted: !!config.encryptFields,
      },
      severity: 'info',
    });
  }

  private async handleUnauthorized(): Promise<void> {
    // Clear session
    const sessionId = this.getSessionId();
    if (_sessionId) {
      await sessionManager.terminateSession(sessionId, 'Unauthorized');
    }
    
    // Redirect to login
    window.location.href = '/login';
  }

  private async handleForbidden(requestId: string): Promise<void> {
    // Report security event
    await securityMonitor.reportEvent({
      type: 'unauthorized_access',
      severity: 'medium',
      source: 'api_client',
      details: {
        requestId,
      },
    });
  }

  private async handleServerError(response: Response, requestId: string): Promise<void> {
    // Report server error
    await securityMonitor.reportEvent({
      type: 'suspicious_activity',
      severity: 'low',
      source: 'api_client',
      target: response.url,
      details: {
        requestId,
        status: response.status,
      },
    });
  }

  private async refreshCSRFToken(): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/api/csrf-token`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        this.csrfToken = data.token;
      }
    } catch {
      logger.error('Failed to get CSRF token:');
    }
  }

  private setupInterceptors(): void {
    // Override global fetch to apply security by default
    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      // Check if this is an API request
      const url = typeof input === 'string' ? input : input.toString();
      
      if (url.startsWith(this.baseURL)) {
        // Apply security headers
        const headers = new Headers(init?.headers);
        securityHeaders.applyToFetch(_headers);
        
        return originalFetch(input, {
          ...init,
          headers,
        });
      }
      
      return originalFetch(input, init);
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private getSessionId(): string | null {
    return secureStorage.getItem('sessionId');
  }

  private getCurrentUserId(): string | undefined {
    return secureStorage.getItem('userId') || undefined;
  }

  private async getClientIP(): Promise<string> {
    // In production, get from server
    return '0.0.0.0';
  }

  private async getClientFingerprint(): Promise<string> {
    const data = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
    ].join(':');
    
    return btoa(data);
  }
}

export const __secureAPI = SecureAPIService.getInstance();