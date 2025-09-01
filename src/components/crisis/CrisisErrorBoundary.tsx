/**
 * Crisis-Aware Error Boundary
 * Provides emergency resources and crisis support even when components fail
 * Ensures users never lose access to critical crisis intervention resources
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Phone, MessageCircle, Home, RefreshCw } from 'lucide-react';
import { logError } from '../../utils/logger';
import { logger } from '../../services/logging/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showCrisisResources?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class CrisisErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log the error with crisis context
    logError('Crisis component error - emergency resources maintained', 'CrisisErrorBoundary', { error, errorInfo });
    
    // Log to crisis-aware logging system
    logger.logCrisisIntervention('component_error', undefined, {
      error: error.message,
      component: errorInfo.componentStack,
      severity: 'high',
      emergency_resources_available: true
    });

    // Send critical error to monitoring service immediately
    if (import.meta.env.PROD) {
      try {
        fetch('/api/monitoring/crisis-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
          }),
        }).catch(() => {
          // Fail silently - don't let monitoring failures affect crisis support
        });
      } catch {
        // Fail silently
      }
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleEmergencyCall = (number: string) => {
    logger.logCrisisIntervention('emergency_call_from_error_boundary', undefined, {
      number,
      error_context: this.state.error?.message
    });
    
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
        Even though there's a technical issue, your safety is our priority. 
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

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

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
                  This doesn't affect the safety and crisis support features of the application.
                </p>
                
                {import.meta.env.DEV && this.state.error && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 mb-2">
                      Technical Details (Development Mode)
                    </summary>
                    <div className="bg-gray-100 rounded p-3 text-xs font-mono overflow-auto max-h-48">
                      <div className="text-red-600 font-semibold mb-2">Error:</div>
                      <div className="mb-3">{this.state.error.message}</div>
                      {this.state.error.stack && (
                        <>
                          <div className="text-red-600 font-semibold mb-2">Stack Trace:</div>
                          <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                        </>
                      )}
                      {this.state.errorInfo?.componentStack && (
                        <>
                          <div className="text-red-600 font-semibold mb-2 mt-3">Component Stack:</div>
                          <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                        </>
                      )}
                    </div>
                  </details>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Try Again
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Home className="h-5 w-5 mr-2" />
                  Go to Home
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
                  If you're experiencing a mental health emergency, please contact emergency services immediately. 
                  Technical issues never prevent access to crisis support resources.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}