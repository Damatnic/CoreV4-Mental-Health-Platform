import React, { ComponentType, ReactNode } from 'react';
import { CrisisErrorBoundary } from './CrisisErrorBoundary';

/**
 * Higher-Order Component that wraps any component with crisis error boundary
 * Ensures crisis-related components have emergency fallbacks
 */
export function withCrisisErrorBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  fallback?: ReactNode
) {
  const WithCrisisErrorBoundaryComponent = (props: P) => {
    return (
      <CrisisErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </CrisisErrorBoundary>
    );
  };

  // Set display name for debugging
  WithCrisisErrorBoundaryComponent.displayName = 
    `withCrisisErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithCrisisErrorBoundaryComponent;
}
