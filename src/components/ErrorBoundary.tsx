/**
 * Unified Error Boundary Component
 * Combines crisis-aware features, multiple fallback options, and comprehensive error handling
 * Ensures users never lose access to critical crisis intervention resources during errors
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Phone, MessageCircle, Home, RefreshCw } from 'lucide-react';
import { logger } from '../utils/logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  FallbackComponent?: React.ComponentType<unknown>;
  fallbackRender?: (props: { error: Error; resetErrorBoundary: () => void }) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  showCrisisResources?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId()
    };
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with error info
    this.setState({ error, errorInfo });
    
    // Log error with multiple logging systems
    logger.error('Component error caught by ErrorBoundary', JSON.stringify({ error: error.message, errorInfo: errorInfo.componentStack }));
    
    // Log to crisis-aware logging system if available
    if ((logger as any)?.logCrisisIntervention) {
      (logger as any).logCrisisIntervention('componenterror', undefined, {
        error: error.message,
        component: errorInfo.componentStack,
        severity: 'high',
        emergency_resources_available: true,
        errorId: this.state.errorId
      });
    }

    // Log error details for debugging
    logger.error('🚨 ERROR BOUNDARY CAUGHT:', JSON.stringify({
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }));

    // Send error to monitoring service
    this.reportError(error, errorInfo);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Store error in localStorage for analysis
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      localStorage.setItem(`error_${this.state.errorId}`, JSON.stringify(errorReport));

      // Send to monitoring service in production
      if (import.meta.env.PROD) {
        try {
          fetch('/api/monitoring/crisis-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(errorReport),
          }).catch(() => {
            // Fail silently - don&apos;t let monitoring failures affect crisis support
          });
        } catch (error) {
          // Fail silently - don&apos;t let monitoring failures affect crisis support
          console.error('Monitoring error:', error);
        }
      }

      // Send to Sentry if available
      if ((window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: {
            component: 'ErrorBoundary',
            errorId: this.state.errorId
          },
          extra: {
            componentStack: errorInfo.componentStack
          }
        });
      }
    } catch (error) {
      logger.error('Failed to report error: ErrorBoundary', String(error));
    }
  };

  private handleReset = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      logger.info(`Retrying... (${this.retryCount}/${this.maxRetries}) - ErrorBoundary`);
      
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: this.generateErrorId()
      });
      
      // Call onReset callback if provided
      if (this.props.onReset) {
        this.props.onReset();
      }
    } else {
      logger.error('❌ Maximum retry attempts reached');
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleEmergencyCall = (number: string) => {
    if ((logger as any)?.logCrisisIntervention) {
      (logger as any).logCrisisIntervention('emergency_call_from_error_boundary', undefined, {
        number,
        error_context: this.state.error?.message
      });
    }
    
    // Try to initiate call
    window.open(`tel:${number}`, '_self');
  };

  private renderCrisisResources = () => (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
      <div className="flex items-center mb-3">
        <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
        <h3 className="text-lg font-semibold text-red-800">
          Emergency Resources Available
        </h3>
      </div>
      
      <p className="text-red-700 mb-4">
        Even though there{"'"}s a technical issue, your safety is our priority. 
        These resources are always available:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={() => this.handleEmergencyCall('911')}
          className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Phone className="h-5 w-5 mr-2" />
          Emergency: 911
        </button>
        
        <button
          onClick={() => this.handleEmergencyCall('988')}
          className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Phone className="h-5 w-5 mr-2" />
          Crisis Hotline: 988
        </button>
        
        <button
          onClick={() => window.open('sms:741741', '_self')}
          className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <MessageCircle className="h-5 w-5 mr-2" />
          Crisis Text: 741741
        </button>
        
        <button
          onClick={() => window.location.href = '/crisis'}
          className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <AlertTriangle className="h-5 w-5 mr-2" />
          Crisis Resources
        </button>
      </div>
    </div>
  );

  private renderErrorUI() {
    const { error, errorInfo, errorId } = this.state;
    const canRetry = this.retryCount < this.maxRetries;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-white mr-3" />
              <div>
                <h1 className="text-xl font-bold text-white">
                  Technical Issue Detected
                </h1>
                <p className="text-red-100">
                  Your safety resources remain available
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {(this.props.showCrisisResources !== false) && this.renderCrisisResources()}
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happened?
              </h3>
              <p className="text-gray-700 mb-3">
                A component on this page encountered an unexpected error. 
                This doesn{"'"}t affect the safety and crisis support features of the application.
              </p>
              
              {import.meta.env.DEV && error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 mb-2">
                    Technical Details (Development Mode)
                  </summary>
                  <div className="bg-gray-100 rounded p-3 text-xs font-mono overflow-auto max-h-48">
                    <div className="text-red-600 font-semibold mb-2">Error:</div>
                    <div className="mb-3">{error.message}</div>
                    {error.stack && (
                      <>
                        <div className="text-red-600 font-semibold mb-2">Stack Trace:</div>
                        <pre className="whitespace-pre-wrap">{error.stack}</pre>
                      </>
                    )}
                    {errorInfo?.componentStack && (
                      <>
                        <div className="text-red-600 font-semibold mb-2 mt-3">Component Stack:</div>
                        <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                      </>
                    )}
                  </div>
                </details>
              )}
              
              <div className="text-sm text-gray-500 mt-2">
                Error ID: {errorId}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {canRetry && (
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Try Again ({this.maxRetries - this.retryCount} left)
                </button>
              )}
              
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Home className="h-5 w-5 mr-2" />
                Go to Home
              </button>
              
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Reload Page
              </button>
              
              <button
                onClick={() => window.location.href = '/crisis'}
                className="flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <AlertTriangle className="h-5 w-5 mr-2" />
                Crisis Support
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                If you{"'"}re experiencing a mental health emergency, please contact emergency services immediately. 
                Technical issues never prevent access to crisis support resources.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  override render() {
    if (this.state.hasError) {
      // Support react-error-boundary fallbackRender prop
      if (this.props.fallbackRender && this.state.error) {
        return this.props.fallbackRender({
          error: this.state.error,
          resetErrorBoundary: this.handleReset
        });
      }

      // Support react-error-boundary FallbackComponent prop
      if (this.props.FallbackComponent && this.state.error) {
        const FallbackComponent = this.props.FallbackComponent;
        return <FallbackComponent />;
      }

      // Support our own fallback prop
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render default error UI with crisis resources
      return this.renderErrorUI();
    }

    return this.props.children;
  }
}

// Export alias for backward compatibility
export class EmergencyErrorBoundary extends ErrorBoundary {}
export class CrisisErrorBoundary extends ErrorBoundary {}

/**
 * Higher-Order Component for Crisis Error Boundaries
 * Automatically wraps crisis-related components with error boundaries
 */
export interface WithErrorBoundaryOptions {
  showCrisisResources?: boolean;
  fallback?: React.ReactNode;
  FallbackComponent?: React.ComponentType<unknown>;
  fallbackRender?: (props: { error: Error; resetErrorBoundary: () => void }) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

/**
 * HOC that wraps components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
) {
  const WrappedComponent = React.forwardRef<any, P & React.RefAttributes<unknown>>((props, ref) => {
    const { ...componentProps } = props;
    return (
      <ErrorBoundary {...options}>
        <Component {...componentProps as P} ref={ref} />
      </ErrorBoundary>
    );
  });

  // Set display name for debugging
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Alias for crisis-aware error boundary HOC
 */
export const _withCrisisErrorBoundary = withErrorBoundary;

/**
 * Decorator version for class components
 */
export function CrisisProtected(options: WithErrorBoundaryOptions = {}) {
  return function <P extends object>(Component: React.ComponentType<P>) {
    return withErrorBoundary(Component, options);
  };
}

/**
 * Hook version for functional components
 */
export function useErrorBoundary() {
  return React.useCallback((component: React.ComponentType<unknown>, options?: WithErrorBoundaryOptions) => {
    return withErrorBoundary(component, options);
  }, []);
}

// Global error handler for uncaught errors
export const _setupGlobalErrorHandling = () => {
  // Handle uncaught JavaScript errors
  window.addEventListener('error', (event) => {
    logger.error('🚨 UNCAUGHT ERROR:', JSON.stringify({
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      error: event.error?.stack,
      timestamp: new Date().toISOString()
    }));

    // Store error for analysis
    const errorReport = {
      type: 'uncaughterror',
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error?.stack,
      timestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem(`uncaughterror_${Date.now()}`, JSON.stringify(errorReport));
    } catch (err) {
      logger.error('Failed to store error report: ErrorBoundary', String(err));
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('🚨 UNHANDLED PROMISE REJECTION:', JSON.stringify({
      reason: String(event.reason),
      promise: String(event.promise),
      timestamp: new Date().toISOString()
    }));

    // Store rejection for analysis
    const rejectionReport = {
      type: 'unhandled_rejection',
      reason: event.reason?.toString(),
      stack: event.reason?.stack,
      timestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem(`rejection_${Date.now()}`, JSON.stringify(rejectionReport));
    } catch (err) {
      logger.error('Failed to store rejection report: ErrorBoundary', String(err));
    }
  });

  logger.info('Global error handling initialized', 'ErrorBoundary');
};

export default ErrorBoundary;