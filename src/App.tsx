import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { EnhancedLayout } from './components/ui/EnhancedLayout';
import { DashboardPage } from './pages/DashboardPage';
import { CrisisPage } from './pages/CrisisPage';
import { WellnessPage } from './pages/WellnessPage';
import { CommunityPage } from './pages/CommunityPage';
import { ProfessionalPage } from './pages/ProfessionalPage';
import { AuthProvider } from './contexts/AuthContext';
import { SecurityProvider, withSecurity } from './middleware/securityMiddleware';

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

// Temporarily remove security wrappers for dashboard, keep for others
// const SecureDashboard = withSecurity(DashboardPage, 'basic'); // Removed for now
const SecureWellness = withSecurity(WellnessPage, 'elevated');
const SecureProfessional = withSecurity(ProfessionalPage, 'maximum');
const SecureCommunity = withSecurity(CommunityPage, 'basic');

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SecurityProvider>
          <AuthProvider>
            <Router>
              <EnhancedLayout>
                <Routes>
                  {/* Dashboard is now the default home route without auth */}
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/crisis" element={<CrisisPage />} />
                  <Route path="/wellness/*" element={<SecureWellness />} />
                  <Route path="/community/*" element={<SecureCommunity />} />
                  <Route path="/professional/*" element={<SecureProfessional />} />
                </Routes>
              </EnhancedLayout>
            </Router>
          </AuthProvider>
        </SecurityProvider>
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
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;