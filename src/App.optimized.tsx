/**
 * Optimized App Component with Performance Enhancements
 * Implements React 18/19 features, code splitting, and lazy loading
 */

import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Layout } from './components/ui/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { SecurityProvider, withSecurity } from './middleware/securityMiddleware';
import { 
  lazyWithPreload, 
  LoadingFallbacks, 
  SuspenseWrapper,
  UpdatePriority 
} from './utils/performance/concurrentFeatures';
import { performanceMonitor, memoryMonitor, frameRateMonitor } from './utils/performance/performanceMonitor';

// Lazy load pages with preload support
const HomePage = lazyWithPreload(() => import('./pages/HomePage'));
const DashboardPage = lazyWithPreload(() => import('./pages/DashboardPage'));
const CrisisPage = lazyWithPreload(() => import('./pages/CrisisPage'));
const WellnessPage = lazyWithPreload(() => import('./pages/WellnessPage'));
const CommunityPage = lazyWithPreload(() => import('./pages/CommunityPage'));
const ProfessionalPage = lazyWithPreload(() => import('./pages/ProfessionalPage'));

// Preload critical pages
if (typeof window !== 'undefined') {
  // Preload crisis page for immediate availability
  (CrisisPage as any).preload();
  
  // Preload other pages after initial render
  requestIdleCallback(() => {
    (DashboardPage as any).preload();
    (WellnessPage as any).preload();
  });
}

// Optimized Query Client with aggressive caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 1,
    },
  },
});

// Wrap pages with security and performance monitoring
const SecureDashboard = withSecurity(DashboardPage, 'basic');
const SecureWellness = withSecurity(WellnessPage, 'elevated');
const SecureProfessional = withSecurity(ProfessionalPage, 'maximum');
const SecureCommunity = withSecurity(CommunityPage, 'basic');

// Performance monitoring component
function PerformanceMonitoring() {
  useEffect(() => {
    // Start monitoring in production
    if (import.meta.env.PROD) {
      memoryMonitor.start();
      frameRateMonitor.start();
    }

    // Cleanup on unmount
    return () => {
      memoryMonitor.stop();
      frameRateMonitor.stop();
      performanceMonitor.cleanup();
    };
  }, []);

  return null;
}

// Route loading component with priority
function RouteLoader({ 
  component: Component, 
  priority = UpdatePriority.MEDIUM 
}: { 
  component: React.ComponentType<any>;
  priority?: UpdatePriority;
}) {
  return (
    <SuspenseWrapper 
      fallback={<LoadingFallbacks.FullPage />}
      priority={priority}
    >
      <Component />
    </SuspenseWrapper>
  );
}

function OptimizedApp() {
  // Preconnect to API and CDN endpoints
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = new URL(apiUrl).origin;
      document.head.appendChild(link);
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SecurityProvider>
          <AuthProvider>
            <Router>
              <PerformanceMonitoring />
              <Layout>
                <Suspense fallback={<LoadingFallbacks.FullPage />}>
                  <Routes>
                    {/* Home page - high priority */}
                    <Route 
                      path="/" 
                      element={
                        <RouteLoader 
                          component={HomePage} 
                          priority={UpdatePriority.HIGH} 
                        />
                      } 
                    />
                    
                    {/* Crisis page - critical priority */}
                    <Route 
                      path="/crisis" 
                      element={
                        <RouteLoader 
                          component={CrisisPage} 
                          priority={UpdatePriority.CRISIS} 
                        />
                      } 
                    />
                    
                    {/* Dashboard - medium priority */}
                    <Route 
                      path="/dashboard" 
                      element={
                        <RouteLoader 
                          component={SecureDashboard} 
                          priority={UpdatePriority.MEDIUM} 
                        />
                      } 
                    />
                    
                    {/* Wellness - high priority */}
                    <Route 
                      path="/wellness/*" 
                      element={
                        <RouteLoader 
                          component={SecureWellness} 
                          priority={UpdatePriority.HIGH} 
                        />
                      } 
                    />
                    
                    {/* Community - medium priority */}
                    <Route 
                      path="/community/*" 
                      element={
                        <RouteLoader 
                          component={SecureCommunity} 
                          priority={UpdatePriority.MEDIUM} 
                        />
                      } 
                    />
                    
                    {/* Professional - low priority */}
                    <Route 
                      path="/professional/*" 
                      element={
                        <RouteLoader 
                          component={SecureProfessional} 
                          priority={UpdatePriority.LOW} 
                        />
                      } 
                    />
                  </Routes>
                </Suspense>
              </Layout>
            </Router>
          </AuthProvider>
        </SecurityProvider>
        
        {/* Optimized toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#f3f4f6',
              borderRadius: '0.5rem',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#f3f4f6',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#f3f4f6',
              },
            },
          }}
        />
        
        {/* Dev tools - lazy loaded */}
        {import.meta.env.DEV && (
          <Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} />
          </Suspense>
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default OptimizedApp;