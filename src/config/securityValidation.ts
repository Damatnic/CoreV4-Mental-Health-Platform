/**
 * Security Validation Service
 * Validates environment configuration for security compliance
 * Prevents insecure deployments
 */

interface SecurityValidationResult {
  isSecure: boolean;
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
}

export class SecurityValidationService {
  /**
   * Validate client-side environment configuration
   */
  static validateClientEnvironment(): SecurityValidationResult {
    const result: SecurityValidationResult = {
      isSecure: true,
      criticalIssues: [],
      warnings: [],
      recommendations: []
    };

    // CRITICAL: Check for exposed secrets in client-side environment
    const exposedSecrets = [
      'VITE_OPENAI_API_KEY',
      'VITE_TWILIO_AUTH_TOKEN', 
      'VITE_ENCRYPTION_KEY',
      'VITE_JWT_SECRET',
      'VITE_DATABASE_URL',
      'VITE_STRIPE_SECRET_KEY'
    ];

    exposedSecrets.forEach(secret => {
      // @ts-ignore - checking for dangerous environment variables
      if (import.meta.env[secret]) {
        result.isSecure = false;
        result.criticalIssues.push(`🚨 CRITICAL: ${secret} is exposed client-side and accessible to attackers`);
      }
    });

    // Check for production readiness
    if (import.meta.env.PROD) {
      // Production-specific validations
      const apiUrl = import.meta.env.VITE_API_URL;
      if (apiUrl && !apiUrl.startsWith('https://')) {
        result.criticalIssues.push('🚨 CRITICAL: API URL must use HTTPS in production');
        result.isSecure = false;
      }

      const wsUrl = import.meta.env.VITE_WS_URL;
      if (wsUrl && !wsUrl.startsWith('wss://')) {
        result.warnings.push('⚠️ WARNING: WebSocket URL should use WSS (secure) in production');
      }

      if (apiUrl?.includes('localhost')) {
        result.criticalIssues.push('🚨 CRITICAL: Production build pointing to localhost API');
        result.isSecure = false;
      }
    }

    // Check for development-specific security issues
    if (import.meta.env.DEV) {
      result.warnings.push('⚠️ DEV MODE: Enhanced security validation disabled');
      
      if (import.meta.env.VITE_API_URL?.includes('http://')) {
        result.recommendations.push('💡 RECOMMENDATION: Use HTTPS even in development for testing');
      }
    }

    // Validate critical environment variables (only fail on truly essential ones)
    const criticalVars = [
      'VITE_CRISIS_HOTLINE' // Critical for mental health platform
    ];

    const recommendedVars = [
      'VITE_APP_NAME',
      'VITE_API_URL'
    ];

    criticalVars.forEach(varName => {
      // @ts-ignore - checking for critical environment variables
      if (!import.meta.env[varName]) {
        result.warnings.push(`⚠️ WARNING: Missing critical environment variable: ${varName}`);
      }
    });

    recommendedVars.forEach(varName => {
      // @ts-ignore - checking for recommended environment variables
      if (!import.meta.env[varName]) {
        result.recommendations.push(`💡 RECOMMENDATION: Set environment variable: ${varName}`);
      }
    });

    return result;
  }

  /**
   * Validate and log security status on application startup
   */
  static validateAndLog(): boolean {
    const validation = this.validateClientEnvironment();
    
    console.log('🔐 SECURITY VALIDATION REPORT');
    console.log('============================');
    
    if (validation.isSecure) {
      console.log('✅ CLIENT SECURITY: PASSED');
    } else {
      console.error('❌ CLIENT SECURITY: FAILED');
      console.error('🚨 CRITICAL SECURITY ISSUES DETECTED:');
      validation.criticalIssues.forEach(issue => console.error(issue));
    }

    if (validation.warnings.length > 0) {
      console.warn('⚠️  SECURITY WARNINGS:');
      validation.warnings.forEach(warning => console.warn(warning));
    }

    if (validation.recommendations.length > 0) {
      console.log('💡 SECURITY RECOMMENDATIONS:');
      validation.recommendations.forEach(rec => console.log(rec));
    }

    // In production, fail hard on security issues
    if (!validation.isSecure && import.meta.env.PROD) {
      console.error('🚫 PRODUCTION DEPLOYMENT BLOCKED DUE TO SECURITY ISSUES');
      throw new Error('Security validation failed - deployment blocked');
    }

    return validation.isSecure;
  }
}

// Auto-validate on module load
try {
  SecurityValidationService.validateAndLog();
} catch (error) {
  console.error('Security validation failed:', error);
  if (import.meta.env.PROD) {
    // Prevent insecure production deployments
    document.body.innerHTML = `
      <div style="padding: 2rem; background: #dc2626; color: white; font-family: monospace;">
        <h1>🚫 Security Validation Failed</h1>
        <p>This application cannot start due to critical security configuration issues.</p>
        <p>Please contact your system administrator.</p>
      </div>
    `;
  }
}