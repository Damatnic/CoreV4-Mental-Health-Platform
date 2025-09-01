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
import { AnonymousAuthProvider } from './contexts/AnonymousAuthContext';
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

// Adjusted security levels for development/demo - production should use higher levels
// const SecureDashboard = withSecurity(DashboardPage, 'basic'); // Dashboard doesn't need security wrapper
const SecureWellness = withSecurity(WellnessPage, 'basic'); // Reduced from 'elevated' for demo
const SecureProfessional = withSecurity(ProfessionalPage, 'basic'); // Reduced from 'maximum' for demo
const SecureCommunity = withSecurity(CommunityPage, 'basic'); // Already at basic level

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SecurityProvider>
          <AnonymousAuthProvider>
            <Router>
              <EnhancedLayout>
                <Routes>
                  {/* All routes are accessible anonymously */}
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/crisis" element={<CrisisPage />} />
                  <Route path="/wellness/*" element={<WellnessPage />} />
                  <Route path="/community/*" element={<CommunityPage />} />
                  <Route path="/professional/*" element={<ProfessionalPage />} />
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
            success: {
              iconTheme: {
                primary: '#66BB6A',
                secondary: '#ffffff',
              },
              style: {
                background: 'linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)',
                border: '1px solid #81C784',
              },
            },
            error: {
              iconTheme: {
                primary: '#FF8A80',
                secondary: '#ffffff',
              },
              style: {
                background: 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)',
                border: '1px solid #FFAB91',
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