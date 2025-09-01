/**
 * Higher-Order Component for Crisis Error Boundaries
 * Automatically wraps crisis-related components with error boundaries
 * Ensures emergency resources are always available even when components fail
 */

import React from 'react';
import { CrisisErrorBoundary } from './CrisisErrorBoundary';

interface WithCrisisErrorBoundaryOptions {
  showCrisisResources?: boolean;
  fallback?: React.ReactNode;
}

/**
 * HOC that wraps components with crisis-aware error boundary
 */
export function withCrisisErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: WithCrisisErrorBoundaryOptions = {}
) {
  const WrappedComponent = React.forwardRef<any, P & React.RefAttributes<any>>((props, ref) => {
    const { ...componentProps } = props;
    return (
      <CrisisErrorBoundary 
        showCrisisResources={options.showCrisisResources}
        fallback={options.fallback}
      >
        <Component {...componentProps as P} ref={ref} />
      </CrisisErrorBoundary>
    );
  });

  // Set display name for debugging
  WrappedComponent.displayName = `withCrisisErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Decorator version for class components
 */
export function CrisisProtected(options: WithCrisisErrorBoundaryOptions = {}) {
  return function <P extends object>(Component: React.ComponentType<P>) {
    return withCrisisErrorBoundary(Component, options);
  };
}

/**
 * Hook version for functional components
 */
export function useCrisisErrorBoundary() {
  return React.useCallback((component: React.ComponentType<any>, options?: WithCrisisErrorBoundaryOptions) => {
    return withCrisisErrorBoundary(component, options);
  }, []);
}