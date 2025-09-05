/**
 * React 18/19 Concurrent Features Utilities
 * Leverages advanced React features for optimal performance in mental health app
 */

import React, {
  Suspense,
  startTransition,
  useDeferredValue,
  useTransition,
  lazy,
  memo,
  useCallback,
  useMemo,
  ComponentType,
  ReactNode,
} from 'react';

/**
 * Priority levels for updates in mental health context
 */
export enum UpdatePriority {
  CRISIS = 'crisis',        // Immediate - crisis intervention
  HIGH = 'high',           // User interactions
  MEDIUM = 'medium',       // Data updates
  LOW = 'low',            // Analytics, background tasks
}

/**
 * Custom hook for managing transitions with priority
 */
export function usePrioritizedTransition(priority: UpdatePriority = UpdatePriority.MEDIUM) {
  const [isPending, startTransition] = useTransition();
  
  const prioritizedTransition = useCallback((callback: () => void) => {
    if (priority === UpdatePriority.CRISIS) {
      // Crisis updates run immediately
      callback();
    } else if (priority === UpdatePriority.HIGH) {
      // High priority updates with minimal delay
      requestAnimationFrame(() => callback());
    } else {
      // Lower priority updates use transition
      startTransition(() => callback());
    }
  }, [priority]);

  return [isPending, prioritizedTransition] as const;
}

/**
 * Deferred value with custom delay based on priority
 */
export function usePrioritizedDeferredValue<T>(
  value: T,
  priority: UpdatePriority = UpdatePriority.MEDIUM
): T {
  const deferred = useDeferredValue(value);
  
  // For crisis priority, return immediate value
  if (priority === UpdatePriority.CRISIS) {
    return value;
  }
  
  return deferred;
}

/**
 * Loading fallback components for Suspense boundaries
 */
export const LoadingFallbacks = {
  FullPage: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your wellness journey...</p>
      </div>
    </div>
  ),
  
  Component: () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-600 border-t-transparent"></div>
    </div>
  ),
  
  Inline: () => (
    <span className="inline-flex items-center">
      <span className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></span>
      Loading...
    </span>
  ),
  
  Skeleton: ({ lines = 3, className = '' }: { lines?: number; className?: string }) => (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded mb-2" style={{ width: `${100 - i * 10}%` }}></div>
      ))}
    </div>
  ),
  
  Chart: () => (
    <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
      <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    </div>
  ),
  
  List: ({ items = 5 }: { items?: number }) => (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-4 shadow-sm animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  ),
};

/**
 * Enhanced Suspense wrapper with error boundary
 */
interface SuspenseWrapperProps {
  fallback?: ReactNode;
  children: ReactNode;
  priority?: UpdatePriority;
}

export function SuspenseWrapper({ 
  fallback = <LoadingFallbacks.Component />, 
  children,
  priority = UpdatePriority.MEDIUM 
}: SuspenseWrapperProps) {
  // For crisis priority, render immediately without suspense
  if (priority === UpdatePriority.CRISIS) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

/**
 * Lazy loading with preload support
 */
export function lazyWithPreload<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
) {
  let preloadPromise: Promise<{ default: T }> | null = null;
  
  const LazyComponent = lazy(() => {
    if (preloadPromise) {
      return preloadPromise;
    }
    return importFn();
  });
  
  // Add preload method
  (LazyComponent as any).preload = () => {
    if (!preloadPromise) {
      preloadPromise = importFn();
    }
    return preloadPromise;
  };
  
  return LazyComponent;
}

/**
 * Progressive enhancement wrapper for heavy components
 */
interface ProgressiveEnhancementProps {
  children: ReactNode;
  placeholder?: ReactNode;
  delay?: number;
  priority?: UpdatePriority;
}

export function ProgressiveEnhancement({
  children,
  placeholder = <LoadingFallbacks.Skeleton />,
  delay = 0,
  priority = UpdatePriority.LOW,
}: ProgressiveEnhancementProps) {
  const [isReady, setIsReady] = React.useState(priority === UpdatePriority.CRISIS);
  
  React.useEffect(() => {
    if (priority === UpdatePriority.CRISIS) {
      return;
    }
    
    const _timer = setTimeout(() => {
      startTransition(() => {
        setIsReady(true);
      });
    }, delay);
    
    return () => clearTimeout(_timer);
  }, [delay, priority]);
  
  if (!isReady) {
    return <>{placeholder}</>;
  }
  
  return <>{children}</>;
}

/**
 * Optimized memo wrapper with custom comparison
 */
export function optimizedMemo<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return memo(Component, propsAreEqual || shallowEqual);
}

/**
 * Shallow equality check for props
 */
function shallowEqual<T extends object>(prevProps: T, nextProps: T): boolean {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);
  
  if (prevKeys.length !== nextKeys.length) {
    return false;
  }
  
  for (const key of prevKeys) {
    if (prevProps[key as keyof T] !== nextProps[key as keyof T]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Batch updates for performance
 */
export function batchedUpdates(callback: () => void) {
  // React 18+ automatically batches updates, but we can still use this for explicit control
  startTransition(() => {
    callback();
  });
}

/**
 * Hook for managing heavy computations
 */
export function useHeavyComputation<T>(
  computation: () => T,
  deps: React.DependencyList,
  priority: UpdatePriority = UpdatePriority.LOW
): T | undefined {
  const [result, setResult] = React.useState<T>();
  const [isPending, startTransition] = useTransition();
  
  React.useEffect(() => {
    if (priority === UpdatePriority.CRISIS) {
      // Immediate computation for crisis
      setResult(computation());
    } else {
      // Deferred computation for non-critical
      startTransition(() => {
        setResult(computation());
      });
    }
  }, deps);
  
  return result;
}

/**
 * Intersection Observer with Suspense integration
 */
export function LazyLoad({ 
  children, 
  rootMargin = '50px',
  fallback = <LoadingFallbacks.Component />
}: {
  children: ReactNode;
  rootMargin?: string;
  fallback?: ReactNode;
}) {
  const [isInView, setIsInView] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          startTransition(() => {
            setIsInView(true);
          });
        }
      },
      { rootMargin }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [rootMargin]);
  
  return (
    <div ref={ref}>
      {isInView ? children : fallback}
    </div>
  );
}

/**
 * Time slicing for expensive operations
 */
export async function timeSlice<T>(
  items: T[],
  processor: (item: T) => void,
  chunkSize = 10,
  delay = 0
) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    
    await new Promise(resolve => {
      startTransition(() => {
        chunk.forEach(processor);
        setTimeout(resolve, delay);
      });
    });
  }
}

// UpdatePriority is already exported as an enum (both type and value)