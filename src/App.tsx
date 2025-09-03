import React, { Suspense, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { EnhancedLayout } from './components/ui/EnhancedLayout';
import { RouteComponents } from './utils/bundleOptimization/lazyLoading';
// Crisis page is now loaded via lazy loading for better performance
import { AnonymousAuthProvider } from './contexts/AnonymousAuthContext';
import { SecurityProvider, withSecurity } from './middleware/securityMiddleware';
import { ConsoleBootSequence } from './components/console/ConsoleBootSequence';
import { 
  lazyWithPreload, 
  LoadingFallbacks, 
  SuspenseWrapper,
  UpdatePriority,
  usePrioritizedTransition
} from './utils/performance/concurrentFeatures';
import { performanceMonitor } from './utils/performance/performanceMonitor';
import { initializeBundleOptimization } from './utils/bundleOptimization/lazyLoading';
import { initializeGamingPerformance } from './utils/performance/gamingOptimizations';

// Enhanced lazy loading with preload support for better performance
const AITherapyPage = lazyWithPreload(() => import('./pages/AITherapyPage'));
const WellnessPage = lazyWithPreload(() => import('./pages/WellnessPage'));
const CommunityPage = lazyWithPreload(() => import('./pages/CommunityPage'));
const ProfessionalPage = lazyWithPreload(() => import('./pages/ProfessionalPage'));
const SettingsPage = lazyWithPreload(() => import('./pages/Settings'));
const AnalyticsPage = lazyWithPreload(() => import('./pages/Analytics'));
const AccessibilityPage = lazyWithPreload(() => import('./pages/AccessibilitySettings'));
const NotificationCenterPage = lazyWithPreload(() => import('./pages/NotificationCenter'));

// Preload critical pages immediately
if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
  // Preload crisis-related content during idle time
  (window as unknown).requestIdleCallback(() => {
    (WellnessPage as unknown).preload?.();
    (AITherapyPage as unknown).preload?.(); // Preload AI Therapy as it's frequently accessed
  }, { timeout: 2000 });
  
  // Preload frequently accessed pages
  setTimeout(() => {
    (CommunityPage as unknown).preload?.();
    (SettingsPage as unknown).preload?.();
  }, 3000);
}

// Enhanced loading component with console aesthetics
const PageLoadingSpinner = memo(() => (
  <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-console-dark to-console-surface" role="status" aria-live="polite">
    <div className="text-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-console-accent border-t-transparent mx-auto" aria-hidden="true"></div>
        <div className="absolute inset-0 rounded-full bg-console-glow animate-pulse opacity-30"></div>
      </div>
      <p className="text-console-highlight mt-4 font-mono text-sm animate-pulse">Initializing system...</p>
      <span className="sr-only">Loading page content...</span>
    </div>
  </div>
));

PageLoadingSpinner.displayName = 'PageLoadingSpinner';

// Enhanced QueryClient with optimized caching and performance monitoring
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors except 408 (_timeout)
        if (error?.response?.status >= 400 && error?.response?.status < 500 && error?.response?.status !== 408) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      networkMode: 'online',
    },
    mutations: {
      retry: (failureCount, error: unknown) => {
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      networkMode: 'online',
    },
  },
});

const queryClient = createQueryClient();

// Memoized security-wrapped components to prevent unnecessary re-renders
const SecureAITherapy = memo(withSecurity(AITherapyPage, 'basic'));
const SecureWellness = memo(withSecurity(WellnessPage, 'basic'));
const SecureProfessional = memo(withSecurity(ProfessionalPage, 'basic'));
const SecureCommunity = memo(withSecurity(CommunityPage, 'basic'));
const SecureSettings = memo(withSecurity(SettingsPage, 'basic'));
const SecureAnalytics = memo(withSecurity(AnalyticsPage, 'basic'));
const SecureAccessibility = memo(withSecurity(AccessibilityPage, 'basic'));
const SecureNotifications = memo(withSecurity(NotificationCenterPage, 'basic'));

// Performance monitoring component
const PerformanceMonitoring = memo(() => {
  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitor.recordMetric('app_initialized', performance.now());
    performanceMonitor.measureStart('app_lifecycle');
    
    // Initialize bundle optimization
    initializeBundleOptimization();
    
    // Initialize gaming-grade performance optimizations
    initializeGamingPerformance();
    
    // Monitor console navigation performance
    const handlePerformanceEmergency = () => {
      console.warn('[Performance] Emergency mode activated - optimizing for crisis response');
      // Disable non-critical animations
      document.documentElement.style.setProperty('--animation-duration', '0s');
      document.documentElement.classList.add('performance-emergency');
    };
    
    window.addEventListener('performance:emergency', handlePerformanceEmergency);
    
    return () => {
      performanceMonitor.measureEnd('app_lifecycle');
      window.removeEventListener('performance:emergency', handlePerformanceEmergency);
    };
  }, []);
  
  return null;
});

PerformanceMonitoring.displayName = 'PerformanceMonitoring';

// Route wrapper component for performance optimization
const RouteWrapper = memo(({ 
  component: Component, 
  priority = UpdatePriority.MEDIUM,
  fallback = <PageLoadingSpinner />
}: {
  component: React.ComponentType<unknown>;
  priority?: UpdatePriority;
  fallback?: React.ReactNode;
}) => {
  return (
    <SuspenseWrapper fallback={fallback} priority={priority}>
      <Component />
    </SuspenseWrapper>
  );
});

RouteWrapper.displayName = 'RouteWrapper';

function App() {
  const [_showBoot, setShowBoot] = useState(() => {
    // Show boot sequence only on first visit or if user hasn't seen it in the last hour
    const lastBoot = localStorage.getItem('console-last-boot');
    if (!lastBoot) return true;
    
    const lastBootTime = parseInt(_lastBoot);
    const oneHour = 60 * 60 * 1000;
    return Date.now() - lastBootTime > oneHour;
  });

  const [_isPending, startPriorityTransition] = usePrioritizedTransition(UpdatePriority.HIGH);

  const handleBootComplete = useCallback(() => {
    startPriorityTransition(() => {
      setShowBoot(false);
      localStorage.setItem('console-last-boot', Date.now().toString());
      
      // Record boot completion performance
      performanceMonitor.recordMetric('boot_sequence_completed', performance.now(), {
        skipBoot: import.meta.env.DEV
      });
    });
  }, [startPriorityTransition]);

  // Memoize the boot sequence props
  const _bootSequenceProps = useMemo(() => ({
    onBootComplete: handleBootComplete,
    skipBoot: import.meta.env.DEV
  }), [handleBootComplete]);

  // Preconnect to critical resources
  useEffect(() => {
    const preconnectUrls = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ];
    
    preconnectUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(_link);
    });
  }, []);

  // CRITICAL: All hooks must be declared BEFORE any conditional returns
  // Memoize toast options to prevent unnecessary re-renders
  const toasterOptions = useMemo(() => ({
    position: 'top-center' as const,
    toastOptions: {
      duration: 4000,
      style: {
        background: 'linear-gradient(135deg, rgba(27, 27, 27, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%)',
        color: '#ffffff',
        borderRadius: '12px',
        border: '1px solid rgba(0, 212, 255, 0.3)',
        padding: '16px',
        fontSize: '14px',
        backdropFilter: 'blur(_12px)',
        fontFamily: 'Inter, system-ui, sans-serif',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 212, 255, 0.1)',
      },
    },
  }), []);

  // Conditional return MUST come after all hooks
  if (_showBoot) {
    return (
      <ConsoleBootSequence 
        onBootComplete={handleBootComplete}
        skipBoot={import.meta.env.DEV} // Skip in development for faster testing
      />
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SecurityProvider>
          <AnonymousAuthProvider>
            <Router>
              <PerformanceMonitoring />
              <EnhancedLayout>
                <Routes>
                  {/* Critical routes - loaded immediately with highest priority */}
                  <Route 
                    path="/" 
                    element={
                      <RouteWrapper 
                        component={RouteComponents.Dashboard} 
                        priority={UpdatePriority.HIGH}
                        fallback={<LoadingFallbacks.FullPage />}
                      />
                    } 
                  />
                  <Route 
                    path="/crisis" 
                    element={
                      <RouteWrapper 
                        component={RouteComponents.Crisis} 
                        priority={UpdatePriority.CRISIS}
                        fallback={<LoadingFallbacks.FullPage />}
                      />
                    } 
                  />
                  
                  {/* High-priority routes */}
                  <Route 
                    path="/ai-therapy/*" 
                    element={
                      <RouteWrapper 
                        component={SecureAITherapy} 
                        priority={UpdatePriority.HIGH}
                        fallback={<LoadingFallbacks.FullPage />}
                      />
                    } 
                  />
                  <Route 
                    path="/wellness/*" 
                    element={
                      <RouteWrapper 
                        component={SecureWellness} 
                        priority={UpdatePriority.HIGH}
                      />
                    } 
                  />
                  
                  {/* Medium-priority routes */}
                  <Route 
                    path="/community/*" 
                    element={
                      <RouteWrapper 
                        component={SecureCommunity} 
                        priority={UpdatePriority.MEDIUM}
                      />
                    } 
                  />
                  <Route 
                    path="/settings" 
                    element={
                      <RouteWrapper 
                        component={SecureSettings} 
                        priority={UpdatePriority.MEDIUM}
                      />
                    } 
                  />
                  
                  {/* Lower-priority routes */}
                  <Route 
                    path="/professional/*" 
                    element={
                      <RouteWrapper 
                        component={SecureProfessional} 
                        priority={UpdatePriority.LOW}
                      />
                    } 
                  />
                  <Route 
                    path="/analytics" 
                    element={
                      <RouteWrapper 
                        component={SecureAnalytics} 
                        priority={UpdatePriority.LOW}
                      />
                    } 
                  />
                  <Route 
                    path="/accessibility" 
                    element={
                      <RouteWrapper 
                        component={SecureAccessibility} 
                        priority={UpdatePriority.LOW}
                      />
                    } 
                  />
                  <Route 
                    path="/notifications" 
                    element={
                      <RouteWrapper 
                        component={SecureNotifications} 
                        priority={UpdatePriority.LOW}
                      />
                    } 
                  />
                </Routes>
              </EnhancedLayout>
            </Router>
          </AnonymousAuthProvider>
        </SecurityProvider>
        
        {/* Optimized toast notifications */}
        <Toaster {...toasterOptions} />
        
        {/* Dev tools - lazy loaded and memoized */}
        {import.meta.env.DEV && (
          <Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} />
          </Suspense>
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;