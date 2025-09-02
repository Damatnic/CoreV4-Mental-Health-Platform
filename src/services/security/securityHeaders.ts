/**
 * Security Headers Service
 * Implements comprehensive security headers for XSS, CSRF, and other attack prevention
 * OWASP compliant security header implementation
 */

export interface SecurityHeadersConfig {
  csp: ContentSecurityPolicyConfig;
  hsts: HSTSConfig;
  cors: CORSConfig;
  referrerPolicy: string;
  xContentTypeOptions: string;
  xFrameOptions: string;
  xXSSProtection: string;
  permissionsPolicy: string;
}

interface ContentSecurityPolicyConfig {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  fontSrc: string[];
  connectSrc: string[];
  mediaSrc: string[];
  objectSrc: string[];
  frameSrc: string[];
  workerSrc: string[];
  formAction: string[];
  frameAncestors: string[];
  baseUri: string[];
  manifestSrc: string[];
  upgradeInsecureRequests?: boolean;
  blockAllMixedContent?: boolean;
  reportUri?: string;
  reportTo?: string;
}

interface HSTSConfig {
  maxAge: number;
  includeSubDomains: boolean;
  preload: boolean;
}

interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

class SecurityHeadersService {
  private static instance: SecurityHeadersService;
  private config: SecurityHeadersConfig;
  private nonce: string = '';

  private constructor() {
    this.config = this.getDefaultConfig();
    this.generateNonce();
  }

  static getInstance(): SecurityHeadersService {
    if (!SecurityHeadersService.instance) {
      SecurityHeadersService.instance = new SecurityHeadersService();
    }
    return SecurityHeadersService.instance;
  }

  /**
   * Get default secure configuration
   */
  private getDefaultConfig(): SecurityHeadersConfig {
    return {
      csp: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'strict-dynamic'",
          "https://cdn.jsdelivr.net", // For trusted CDNs only
          "'unsafe-inline'", // Placeholder for dynamic nonce
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for styled-components, but mitigated with strict CSP
          "https://fonts.googleapis.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "blob:",
        ],
        fontSrc: [
          "'self'",
          "data:",
          "https://fonts.gstatic.com",
        ],
        connectSrc: [
          "'self'",
          "https://api.mentalhealth.app", // Your API domain
          "wss://api.mentalhealth.app", // WebSocket connections
          "https://sentry.io", // Error tracking
        ],
        mediaSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        workerSrc: ["'self'", "blob:"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        manifestSrc: ["'self'"],
        upgradeInsecureRequests: true,
        blockAllMixedContent: true,
        reportUri: "/api/csp-report",
        reportTo: "csp-endpoint",
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      cors: {
        allowedOrigins: [
          process.env.VITE_APP_URL || 'https://mentalhealth.app',
        ],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-CSRF-Token',
          'X-Request-ID',
        ],
        exposedHeaders: ['X-Request-ID'],
        credentials: true,
        maxAge: 86400, // 24 hours
      },
      referrerPolicy: 'strict-origin-when-cross-origin',
      xContentTypeOptions: 'nosniff',
      xFrameOptions: 'DENY',
      xXSSProtection: '1; mode=block',
      permissionsPolicy: this.getPermissionsPolicy(),
    };
  }

  /**
   * Generate CSP nonce for inline scripts
   */
  generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    this.nonce = btoa(String.fromCharCode(...array));
    return this.nonce;
  }

  /**
   * Get current nonce
   */
  getNonce(): string {
    return this.nonce;
  }

  /**
   * Build Content Security Policy header
   */
  buildCSP(forMetaTag: boolean = false): string {
    const { csp } = this.config;
    const directives: string[] = [];

    // Process each CSP directive
    const processDirective = (name: string, values: any[]): string => {
      const processedValues = values.map(value => {
        if (typeof value === 'function') {
          return value({ nonce: this.nonce });
        }
        return value;
      });
      return `${name} ${processedValues.join(' ')}`;
    };

    // Build directives
    if (csp.defaultSrc.length > 0) {
      directives.push(processDirective('default-src', csp.defaultSrc));
    }
    if (csp.scriptSrc.length > 0) {
      directives.push(processDirective('script-src', csp.scriptSrc));
    }
    if (csp.styleSrc.length > 0) {
      directives.push(processDirective('style-src', csp.styleSrc));
    }
    if (csp.imgSrc.length > 0) {
      directives.push(processDirective('img-src', csp.imgSrc));
    }
    if (csp.fontSrc.length > 0) {
      directives.push(processDirective('font-src', csp.fontSrc));
    }
    if (csp.connectSrc.length > 0) {
      directives.push(processDirective('connect-src', csp.connectSrc));
    }
    if (csp.mediaSrc.length > 0) {
      directives.push(processDirective('media-src', csp.mediaSrc));
    }
    if (csp.objectSrc.length > 0) {
      directives.push(processDirective('object-src', csp.objectSrc));
    }
    if (csp.frameSrc.length > 0) {
      directives.push(processDirective('frame-src', csp.frameSrc));
    }
    if (csp.workerSrc.length > 0) {
      directives.push(processDirective('worker-src', csp.workerSrc));
    }
    if (csp.formAction.length > 0) {
      directives.push(processDirective('form-action', csp.formAction));
    }
    
    // Only include frame-ancestors and report-uri in HTTP headers, not meta tags
    if (!forMetaTag) {
      if (csp.frameAncestors.length > 0) {
        directives.push(processDirective('frame-ancestors', csp.frameAncestors));
      }
      // Add reporting only for HTTP headers
      if (csp.reportUri) {
        directives.push(`report-uri ${csp.reportUri}`);
      }
      if (csp.reportTo) {
        directives.push(`report-to ${csp.reportTo}`);
      }
    }
    
    if (csp.baseUri.length > 0) {
      directives.push(processDirective('base-uri', csp.baseUri));
    }
    if (csp.manifestSrc.length > 0) {
      directives.push(processDirective('manifest-src', csp.manifestSrc));
    }

    // Add boolean directives
    if (csp.upgradeInsecureRequests) {
      directives.push('upgrade-insecure-requests');
    }
    if (csp.blockAllMixedContent) {
      directives.push('block-all-mixed-content');
    }

    return directives.join('; ');
  }

  /**
   * Build HSTS header
   */
  buildHSTS(): string {
    const { hsts } = this.config;
    const parts = [`max-age=${hsts.maxAge}`];
    
    if (hsts.includeSubDomains) {
      parts.push('includeSubDomains');
    }
    if (hsts.preload) {
      parts.push('preload');
    }
    
    return parts.join('; ');
  }

  /**
   * Build Permissions Policy header
   */
  private getPermissionsPolicy(): string {
    return [
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=(self)',
      'battery=()',
      'camera=()',
      'cross-origin-isolated=(self)',
      'display-capture=()',
      'document-domain=()',
      'encrypted-media=(self)',
      'execution-while-not-rendered=()',
      'execution-while-out-of-viewport=()',
      'fullscreen=(self)',
      'geolocation=(self)', // May be needed for crisis location services
      'gyroscope=()',
      'keyboard-map=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'navigation-override=()',
      'payment=()',
      'picture-in-picture=()',
      'publickey-credentials-get=()',
      'screen-wake-lock=()',
      'sync-xhr=()',
      'usb=()',
      'web-share=(self)',
      'xr-spatial-tracking=()',
    ].join(', ');
  }

  /**
   * Apply security headers to fetch request
   */
  applyToFetch(headers: Headers): void {
    headers.set('X-Content-Type-Options', this.config.xContentTypeOptions);
    headers.set('X-Frame-Options', this.config.xFrameOptions);
    headers.set('X-XSS-Protection', this.config.xXSSProtection);
    headers.set('Referrer-Policy', this.config.referrerPolicy);
    headers.set('Permissions-Policy', this.config.permissionsPolicy);
    
    // Only set HSTS for HTTPS connections
    if (window.location.protocol === 'https:') {
      headers.set('Strict-Transport-Security', this.buildHSTS());
    }
  }

  /**
   * Apply CSP meta tag to document
   */
  applyCSPToDocument(): void {
    // Remove existing CSP meta tag if present
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCSP) {
      existingCSP.remove();
    }

    // Create new CSP meta tag with filtered directives (no frame-ancestors or report-uri)
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = this.buildCSP(true); // Pass true to filter out meta-incompatible directives
    document.head.appendChild(meta);
  }

  /**
   * Validate origin for CORS
   */
  validateOrigin(origin: string): boolean {
    const { cors } = this.config;
    
    // Check if origin is in allowed list
    if (cors.allowedOrigins.includes('*')) {
      return true;
    }
    
    return cors.allowedOrigins.some(allowed => {
      if (allowed === origin) {
        return true;
      }
      
      // Support wildcard subdomains
      if (allowed.startsWith('*.')) {
        const domain = allowed.slice(2);
        return origin.endsWith(domain);
      }
      
      return false;
    });
  }

  /**
   * Get CORS headers for response
   */
  getCORSHeaders(origin: string, method: string): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.validateOrigin(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Methods'] = this.config.cors.allowedMethods.join(', ');
      headers['Access-Control-Allow-Headers'] = this.config.cors.allowedHeaders.join(', ');
      headers['Access-Control-Expose-Headers'] = this.config.cors.exposedHeaders.join(', ');
      headers['Access-Control-Max-Age'] = this.config.cors.maxAge.toString();
      
      if (this.config.cors.credentials) {
        headers['Access-Control-Allow-Credentials'] = 'true';
      }
    }
    
    return headers;
  }

  /**
   * Report CSP violation
   */
  async reportViolation(violation: any): Promise<void> {
    try {
      // Log violation for analysis
      console.warn('CSP Violation:', violation);
      
      // Send to reporting endpoint
      if (this.config.csp.reportUri) {
        await fetch(this.config.csp.reportUri, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...violation,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
          }),
        });
      }
    } catch (error) {
      console.error('Failed to report CSP violation:', error);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<SecurityHeadersConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): SecurityHeadersConfig {
    return { ...this.config };
  }
}

export const securityHeaders = SecurityHeadersService.getInstance();

// Set up CSP violation reporting
if (typeof window !== 'undefined') {
  document.addEventListener('securitypolicyviolation', (e) => {
    securityHeaders.reportViolation({
      blockedUri: e.blockedURI,
      columnNumber: e.columnNumber,
      disposition: e.disposition,
      documentUri: e.documentURI,
      effectiveDirective: e.effectiveDirective,
      lineNumber: e.lineNumber,
      originalPolicy: e.originalPolicy,
      referrer: e.referrer,
      sample: e.sample,
      sourceFile: e.sourceFile,
      statusCode: e.statusCode,
      violatedDirective: e.violatedDirective,
    });
  });
}