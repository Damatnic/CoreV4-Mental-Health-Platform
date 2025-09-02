import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { EnhancedLayout } from './components/ui/EnhancedLayout';
import { HomePage } from './pages/HomePage'; // Main entry point
import { CrisisPage } from './pages/CrisisPage'; // Keep crisis page eager for emergency access
import { AnonymousAuthProvider } from './contexts/AnonymousAuthContext';
import { SecurityProvider, withSecurity } from './middleware/securityMiddleware';

// Lazy load non-critical pages for better initial bundle size
const WellnessPage = lazy(() => import('./pages/WellnessPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const ProfessionalPage = lazy(() => import('./pages/ProfessionalPage'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const AnalyticsPage = lazy(() => import('./pages/Analytics'));
const AccessibilityPage = lazy(() => import('./pages/AccessibilitySettings'));
const NotificationCenterPage = lazy(() => import('./pages/NotificationCenter'));

// Loading component for lazy-loaded pages
const PageLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]" role="status" aria-live="polite">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" aria-hidden="true"></div>
    <span className="sr-only">Loading page content...</span>
  </div>
);

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

// Adjusted security levels for development/demo - production should use higher levels
const SecureWellness = withSecurity(WellnessPage, 'basic'); // Reduced from 'elevated' for demo
const SecureProfessional = withSecurity(ProfessionalPage, 'basic'); // Reduced from 'maximum' for demo
const SecureCommunity = withSecurity(CommunityPage, 'basic'); // Already at basic level
const SecureSettings = withSecurity(SettingsPage, 'basic'); // Settings with basic security
const SecureAnalytics = withSecurity(AnalyticsPage, 'basic'); // Analytics with basic security
const SecureAccessibility = withSecurity(AccessibilityPage, 'basic'); // Accessibility settings
const SecureNotifications = withSecurity(NotificationCenterPage, 'basic'); // Notifications center

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SecurityProvider>
          <AnonymousAuthProvider>
            <Router>
              <EnhancedLayout>
                <Routes>
                  {/* Critical routes - loaded immediately */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/crisis" element={<CrisisPage />} />
                  
                  {/* Non-critical routes - lazy loaded with suspense */}
                  <Route path="/wellness/*" element={
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <SecureWellness />
                    </Suspense>
                  } />
                  <Route path="/community/*" element={
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <SecureCommunity />
                    </Suspense>
                  } />
                  <Route path="/professional/*" element={
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <SecureProfessional />
                    </Suspense>
                  } />
                  <Route path="/analytics" element={
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <SecureAnalytics />
                    </Suspense>
                  } />
                  <Route path="/accessibility" element={
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <SecureAccessibility />
                    </Suspense>
                  } />
                  <Route path="/notifications" element={
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <SecureNotifications />
                    </Suspense>
                  } />
                  <Route path="/settings" element={
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <SecureSettings />
                    </Suspense>
                  } />
                </Routes>
              </EnhancedLayout>
            </Router>
          </AnonymousAuthProvider>
        </SecurityProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 5000,
            style: {
              background: 'linear-gradient(135deg, #E8F4FD 0%, #E8F5E8 100%)',
              color: '#424242',
              borderRadius: '1rem',
              border: '1px solid #B3E5FC',
              padding: '16px',
              fontSize: '14px',
            },
          }}
        />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;