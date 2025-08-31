/**
 * Security Configuration
 * Centralized security settings for different environments
 */

interface SecurityConfig {
  environment: 'development' | 'staging' | 'production';
  
  // Encryption settings
  encryption: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
    saltLength: number;
    iterations: number;
    tagLength: number;
    rotationDays: number;
  };
  
  // Session settings
  session: {
    maxIdleMinutes: number;
    absoluteTimeoutHours: number;
    renewalMinutes: number;
    maxConcurrent: number;
    requireMFA: boolean;
    bindToIP: boolean;
    bindToUserAgent: boolean;
    rotateTokens: boolean;
  };
  
  // Rate limiting
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    blockDurationMs: number;
    captchaThreshold: number;
  };
  
  // HIPAA compliance
  hipaa: {
    auditRetentionYears: number;
    phiRetentionYears: number;
    breachNotificationDays: number;
    sessionTimeoutMinutes: number;
    passwordComplexity: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      preventReuse: number;
      expirationDays: number;
    };
  };
  
  // Content Security Policy
  csp: {
    reportUri: string;
    upgradeInsecureRequests: boolean;
    blockAllMixedContent: boolean;
  };
  
  // API Security
  api: {
    baseURL: string;
    timeout: number;
    retries: number;
    requireHTTPS: boolean;
    validateCertificates: boolean;
  };
  
  // Monitoring
  monitoring: {
    enabled: boolean;
    alertThreshold: number;
    retentionDays: number;
    realTimeAlerts: boolean;
  };
  
  // Feature flags
  features: {
    encryptionEnabled: boolean;
    mfaEnabled: boolean;
    biometricsEnabled: boolean;
    deviceTrustEnabled: boolean;
    geoLocationEnabled: boolean;
    behavioralAnalysis: boolean;
  };
}

const development: SecurityConfig = {
  environment: 'development',
  
  encryption: {
    algorithm: 'AES-GCM',
    keyLength: 256,
    ivLength: 12,
    saltLength: 16,
    iterations: 100000,
    tagLength: 16,
    rotationDays: 90,
  },
  
  session: {
    maxIdleMinutes: 60, // More lenient for development
    absoluteTimeoutHours: 24,
    renewalMinutes: 10,
    maxConcurrent: 5,
    requireMFA: false,
    bindToIP: false,
    bindToUserAgent: false,
    rotateTokens: false,
  },
  
  rateLimit: {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    blockDurationMs: 60000,
    captchaThreshold: 10,
  },
  
  hipaa: {
    auditRetentionYears: 1, // Shorter for development
    phiRetentionYears: 1,
    breachNotificationDays: 60,
    sessionTimeoutMinutes: 60,
    passwordComplexity: {
      minLength: 8,
      requireUppercase: false,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      preventReuse: 3,
      expirationDays: 365,
    },
  },
  
  csp: {
    reportUri: '/api/csp-report',
    upgradeInsecureRequests: false,
    blockAllMixedContent: false,
  },
  
  api: {
    baseURL: 'http://localhost:3000',
    timeout: 30000,
    retries: 3,
    requireHTTPS: false,
    validateCertificates: false,
  },
  
  monitoring: {
    enabled: true,
    alertThreshold: 50,
    retentionDays: 7,
    realTimeAlerts: false,
  },
  
  features: {
    encryptionEnabled: true,
    mfaEnabled: false,
    biometricsEnabled: false,
    deviceTrustEnabled: false,
    geoLocationEnabled: false,
    behavioralAnalysis: false,
  },
};

const staging: SecurityConfig = {
  environment: 'staging',
  
  encryption: {
    algorithm: 'AES-GCM',
    keyLength: 256,
    ivLength: 12,
    saltLength: 16,
    iterations: 100000,
    tagLength: 16,
    rotationDays: 90,
  },
  
  session: {
    maxIdleMinutes: 30,
    absoluteTimeoutHours: 8,
    renewalMinutes: 5,
    maxConcurrent: 3,
    requireMFA: true,
    bindToIP: true,
    bindToUserAgent: true,
    rotateTokens: true,
  },
  
  rateLimit: {
    windowMs: 60000,
    maxRequests: 60,
    blockDurationMs: 300000, // 5 minutes
    captchaThreshold: 5,
  },
  
  hipaa: {
    auditRetentionYears: 7,
    phiRetentionYears: 7,
    breachNotificationDays: 60,
    sessionTimeoutMinutes: 30,
    passwordComplexity: {
      minLength: 10,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventReuse: 5,
      expirationDays: 90,
    },
  },
  
  csp: {
    reportUri: '/api/csp-report',
    upgradeInsecureRequests: true,
    blockAllMixedContent: true,
  },
  
  api: {
    baseURL: 'https://staging-api.mentalhealth.app',
    timeout: 20000,
    retries: 2,
    requireHTTPS: true,
    validateCertificates: true,
  },
  
  monitoring: {
    enabled: true,
    alertThreshold: 30,
    retentionDays: 30,
    realTimeAlerts: true,
  },
  
  features: {
    encryptionEnabled: true,
    mfaEnabled: true,
    biometricsEnabled: true,
    deviceTrustEnabled: true,
    geoLocationEnabled: true,
    behavioralAnalysis: true,
  },
};

const production: SecurityConfig = {
  environment: 'production',
  
  encryption: {
    algorithm: 'AES-GCM',
    keyLength: 256,
    ivLength: 12,
    saltLength: 16,
    iterations: 150000, // Increased for production
    tagLength: 16,
    rotationDays: 30, // More frequent rotation
  },
  
  session: {
    maxIdleMinutes: 15, // HIPAA compliant
    absoluteTimeoutHours: 4,
    renewalMinutes: 3,
    maxConcurrent: 2,
    requireMFA: true,
    bindToIP: true,
    bindToUserAgent: true,
    rotateTokens: true,
  },
  
  rateLimit: {
    windowMs: 60000,
    maxRequests: 30, // Stricter limits
    blockDurationMs: 3600000, // 1 hour
    captchaThreshold: 3,
  },
  
  hipaa: {
    auditRetentionYears: 7, // HIPAA requirement
    phiRetentionYears: 7,
    breachNotificationDays: 60,
    sessionTimeoutMinutes: 15, // HIPAA recommended
    passwordComplexity: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventReuse: 12,
      expirationDays: 60,
    },
  },
  
  csp: {
    reportUri: 'https://api.mentalhealth.app/csp-report',
    upgradeInsecureRequests: true,
    blockAllMixedContent: true,
  },
  
  api: {
    baseURL: 'https://api.mentalhealth.app',
    timeout: 15000,
    retries: 1,
    requireHTTPS: true,
    validateCertificates: true,
  },
  
  monitoring: {
    enabled: true,
    alertThreshold: 20,
    retentionDays: 90,
    realTimeAlerts: true,
  },
  
  features: {
    encryptionEnabled: true,
    mfaEnabled: true,
    biometricsEnabled: true,
    deviceTrustEnabled: true,
    geoLocationEnabled: true,
    behavioralAnalysis: true,
  },
};

// Determine current environment
const getEnvironment = (): 'development' | 'staging' | 'production' => {
  const env = import.meta.env.MODE;
  
  switch (env) {
    case 'production':
      return 'production';
    case 'staging':
      return 'staging';
    default:
      return 'development';
  }
};

// Export configuration based on environment
const configs = {
  development,
  staging,
  production,
};

export const securityConfig = configs[getEnvironment()];

// Validation function to ensure configuration integrity
export const validateSecurityConfig = (): boolean => {
  const config = securityConfig;
  
  // Validate encryption settings
  if (config.encryption.keyLength < 256) {
    console.error('Encryption key length must be at least 256 bits');
    return false;
  }
  
  // Validate HIPAA compliance
  if (config.hipaa.sessionTimeoutMinutes > 30) {
    console.warn('Session timeout exceeds HIPAA recommendations');
  }
  
  if (config.hipaa.auditRetentionYears < 7) {
    console.error('Audit retention must be at least 7 years for HIPAA compliance');
    return false;
  }
  
  // Validate production requirements
  if (config.environment === 'production') {
    if (!config.api.requireHTTPS) {
      console.error('HTTPS is required in production');
      return false;
    }
    
    if (!config.features.encryptionEnabled) {
      console.error('Encryption must be enabled in production');
      return false;
    }
    
    if (!config.session.requireMFA) {
      console.warn('MFA should be required in production');
    }
  }
  
  return true;
};

// Initialize validation on load
if (!validateSecurityConfig()) {
  console.error('Security configuration validation failed!');
}

// Export individual configurations for specific use cases
export const encryptionConfig = securityConfig.encryption;
export const sessionConfig = securityConfig.session;
export const rateLimitConfig = securityConfig.rateLimit;
export const hipaaConfig = securityConfig.hipaa;
export const cspConfig = securityConfig.csp;
export const apiConfig = securityConfig.api;
export const monitoringConfig = securityConfig.monitoring;
export const featureFlags = securityConfig.features;