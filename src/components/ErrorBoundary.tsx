/**
 * Emergency Error Boundary - Critical Runtime Protection
 * Prevents app crash from lexical declaration errors and other runtime issues
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class EmergencyErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('🚨 EMERGENCY ERROR BOUNDARY CAUGHT:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // Send error to monitoring service
    this.reportError(error, errorInfo);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Log to console for immediate debugging
      console.error('Runtime Error Details:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        timestamp: new Date().toISOString()
      });

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

      // Send to Sentry or error tracking service (if available)
      if (window.Sentry) {
        window.Sentry.captureException(error, {
          tags: {
            component: 'ErrorBoundary',
            errorId: this.state.errorId
          },
          extra: {
            componentStack: errorInfo.componentStack
          }
        });
      }
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`🔄 Retrying... (${this.retryCount}/${this.maxRetries})`);
      
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: this.generateErrorId()
      });
    } else {
      console.error('❌ Maximum retry attempts reached');
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private renderErrorUI() {
    const { error, errorInfo, errorId } = this.state;
    const canRetry = this.retryCount < this.maxRetries;

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          maxWidth: '600px',
          textAlign: 'center',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '2rem',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚨</div>
          <h1 style={{ color: '#dc2626', marginBottom: '1rem' }}>
            Application Error Detected
          </h1>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            The application encountered a runtime error and has been safely contained.
            Our error boundary is protecting you from a complete crash.
          </p>
          
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            padding: '1rem',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <h3 style={{ color: '#dc2626', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              Error Details:
            </h3>
            <code style={{ fontSize: '0.8rem', color: '#991b1b' }}>
              {error?.message || 'Unknown error'}
            </code>
            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.5rem' }}>
              Error ID: {errorId}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            {canRetry && (
              <button
                onClick={this.handleRetry}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                🔄 Retry ({this.maxRetries - this.retryCount} attempts left)
              </button>
            )}
            
            <button
              onClick={this.handleReload}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🔄 Reload Page
            </button>
          </div>

          <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#6b7280' }}>
            <p>This error has been logged for analysis.</p>
            <p>If the problem persists, please contact support with Error ID: {errorId}</p>
          </div>
        </div>

        {/* Development error details */}
        {process.env.NODE_ENV === 'development' && error && (
          <details style={{ marginTop: '2rem', maxWidth: '800px', width: '100%' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              🔍 Debug Information (Development Only)
            </summary>
            <pre style={{
              backgroundColor: '#1f2937',
              color: '#f9fafb',
              padding: '1rem',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.8rem',
              marginTop: '1rem'
            }}>
              <strong>Error Stack:</strong>{'\n'}
              {error.stack}
              
              {errorInfo?.componentStack && (
                <>
                  {'\n\n'}<strong>Component Stack:</strong>{'\n'}
                  {errorInfo.componentStack}
                </>
              )}
            </pre>
          </details>
        )}
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI or default error UI
      return this.props.fallback || this.renderErrorUI();
    }

    return this.props.children;
  }
}

// Global error handler for uncaught errors
export const setupGlobalErrorHandling = () => {
  // Handle uncaught JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('🚨 UNCAUGHT ERROR:', {
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      error: event.error?.stack,
      timestamp: new Date().toISOString()
    });

    // Store error for analysis
    const errorReport = {
      type: 'uncaught_error',
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error?.stack,
      timestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem(`uncaught_error_${Date.now()}`, JSON.stringify(errorReport));
    } catch (e) {
      console.error('Failed to store error report:', e);
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 UNHANDLED PROMISE REJECTION:', {
      reason: event.reason,
      promise: event.promise,
      timestamp: new Date().toISOString()
    });

    // Store rejection for analysis
    const rejectionReport = {
      type: 'unhandled_rejection',
      reason: event.reason?.toString(),
      stack: event.reason?.stack,
      timestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem(`rejection_${Date.now()}`, JSON.stringify(rejectionReport));
    } catch (e) {
      console.error('Failed to store rejection report:', e);
    }
  });

  console.log('✅ Global error handling initialized');
};

export default EmergencyErrorBoundary;