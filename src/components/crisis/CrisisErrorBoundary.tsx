import React, { Component, ReactNode, ErrorInfo } from 'react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Crisis-specific error boundary that provides emergency fallback UI
 * Ensures crisis features remain functional even if other parts fail
 */
export class CrisisErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log crisis component errors with high priority
    logger.crisis(
      'Crisis component error boundary triggered',
      'critical',
      'CrisisErrorBoundary',
      {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      }
    );

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      // Show custom fallback or default crisis UI
      return this.props.fallback || (
        <div className="min-h-screen bg-red-900 text-white p-8 flex flex-col items-center justify-center">
          <div className="max-w-md text-center">
            <h1 className="text-3xl font-bold mb-4">🚨 Crisis System Error</h1>
            <p className="mb-6 text-red-100">
              The crisis support system encountered an error, but emergency resources are still available.
            </p>
            
            <div className="space-y-4">
              <a
                href="tel:988"
                className="block w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                📞 Call Crisis Lifeline: 988
              </a>
              
              <a
                href="tel:911"
                className="block w-full bg-red-800 hover:bg-red-900 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                🚨 Emergency Services: 911
              </a>
              
              <button
                onClick={() => window.location.reload()}
                className="block w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                🔄 Reload Application
              </button>
            </div>
            
            <p className="mt-6 text-sm text-red-200">
              Error: {this.state.error?.message}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
