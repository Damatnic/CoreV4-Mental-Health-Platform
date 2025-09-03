/**
 * Security Validation Service
 * Validates environment configuration for security compliance
 * Prevents insecure deployments
 */

import { logger } from '../utils/logger';

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
      // @ts-expect-error - checking for dangerous environment variables
      if (import.meta.env[secret]) {
        // In production, only fail for truly critical secrets
        if (import.meta.env.PROD && ['VITE_JWT_SECRET', 'VITE_DATABASE_URL', 'VITE_STRIPE_SECRET_KEY'].includes(secret)) {
          result.isSecure = false;
          result.criticalIssues.push(`🚨 CRITICAL: ${secret} is exposed client-side and accessible to attackers`);
        } else {
          result.warnings.push(`⚠️ WARNING: ${secret} is exposed client-side. Consider using server-side API.`);
        }
      }
    });

    // Check for production readiness
    if (import.meta.env.PROD) {
      // Production-specific validations
      const apiUrl = import.meta.env.VITE_API_URL;
      if (apiUrl && !apiUrl.startsWith('https://') && !apiUrl.includes('static-deployment')) {
        result.warnings.push('⚠️ WARNING: API URL should use HTTPS in production');
      }

      const wsUrl = import.meta.env.VITE_WS_URL;
      if (wsUrl && !wsUrl.startsWith('wss://')) {
        result.warnings.push('⚠️ WARNING: WebSocket URL should use WSS (_secure) in production');
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
      // @ts-expect-error - checking for critical environment variables
      if (!import.meta.env[varName]) {
        result.warnings.push(`⚠️ WARNING: Missing critical environment variable: ${varName}`);
      }
    });

    recommendedVars.forEach(varName => {
      // @ts-expect-error - checking for recommended environment variables
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
    
    // Only log security issues in development or when critical errors exist
    if (import.meta.env.DEV || !validation.isSecure) {
      logger.info('SECURITY VALIDATION REPORT', 'SecurityValidation');
      logger.info('============================', 'SecurityValidation');
      
      if (validation.isSecure) {
        logger.info('CLIENT SECURITY: PASSED', 'SecurityValidation');
      } else {
        logger.error('❌ CLIENT SECURITY: FAILED');
        logger.error('🚨 CRITICAL SECURITY ISSUES DETECTED:');
        validation.criticalIssues.forEach(issue => logger.error(issue));
      }

      if (validation.warnings.length > 0) {
        logger.warn('⚠️  SECURITY WARNINGS:');
        validation.warnings.forEach(_warning => logger.warn(_warning));
      }

      if (validation.recommendations.length > 0 && import.meta.env.DEV) {
        logger.info('SECURITY RECOMMENDATIONS:', 'SecurityValidation');
        validation.recommendations.forEach(rec => logger.info(rec, 'SecurityValidation'));
      }
    }

    // In production, fail hard on security issues
    if (!validation.isSecure && import.meta.env.PROD) {
      logger.error('🚫 PRODUCTION DEPLOYMENT BLOCKED DUE TO SECURITY ISSUES');
      throw new Error('Security validation failed - deployment blocked');
    }

    return validation.isSecure;
  }
}

// Auto-validate on module load
try {
  SecurityValidationService.validateAndLog();
} catch (error) {
  logger.error('Security validation failed:');
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