import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Suspense, lazy, useEffect, useState } from 'react';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, RefreshCw, Home, Wifi, WifiOff } from 'lucide-react';
import { useNavigatorOnLine } from '../hooks/useNavigatorOnLine';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import { useAnalytics } from '../hooks/useAnalytics';
import { useFeatureFlag } from '../hooks/useFeatureFlag';

// Lazy load dashboard components for better performance
const PersonalDashboard = lazy(() => 
  import('../components/dashboard/PersonalDashboard').then(module => ({
    default: module.PersonalDashboard
  }))
);

const ProfessionalCareDashboard = lazy(() => 
  import('../components/dashboard/ProfessionalCareDashboard').then(module => ({
    default: module.ProfessionalCareDashboard
  }))
);

const DashboardOnboarding = lazy(() => 
  import('../components/dashboard/DashboardOnboarding').then(module => ({
    default: module.DashboardOnboarding
  }))
);

// Loading skeleton component
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 auto-rows-[minmax(120px,auto)]">
          <div className="col-span-1 md:col-span-6 lg:col-span-6 h-64 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="col-span-1 md:col-span-3 lg:col-span-3 h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="col-span-1 md:col-span-3 lg:col-span-3 h-32 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  const { trackError } = useAnalytics();
  
  useEffect(() => {
    // Track error in analytics
    trackError('dashboard_error', {
      message: error.message,
      stack: error.stack,
      component: 'HomePage'
    });
  }, [error, trackError]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
        </div>
        <p className="text-gray-600 mb-6">
          We encountered an error loading your dashboard. Don't worry, your data is safe.
        </p>
        <div className="space-y-3">
          <button
            onClick={resetErrorBoundary}
            className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
          <Link
            to="/crisis"
            className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Get Crisis Support
          </Link>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Home className="h-4 w-4 mr-2" />
            Return Home
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Error ID: {Math.random().toString(36).substr(2, 9)}
        </p>
      </div>
    </div>
  );
}

// Offline indicator component
function OfflineIndicator() {
  return (
    <div className="fixed bottom-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center z-50">
      <WifiOff className="h-4 w-4 mr-2" />
      <span className="text-sm font-medium">You're offline - Some features may be limited</span>
    </div>
  );
}

export function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const isOnline = useNavigatorOnLine();
  const { recordMetric } = usePerformanceMonitor();
  const { trackPageView, trackEvent } = useAnalytics();
  const enableNewDashboard = useFeatureFlag('new_dashboard_experience');
  const enableOnboarding = useFeatureFlag('dashboard_onboarding');
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(
    () => localStorage.getItem('dashboard_onboarding_completed') === 'true'
  );
  const [dashboardLoadTime, setDashboardLoadTime] = useState<number>(0);

  // Track page view and performance
  useEffect(() => {
    const startTime = performance.now();
    trackPageView('home', {
      authenticated: isAuthenticated,
      userId: user?.id
    });

    // Record dashboard load time
    const loadTime = performance.now() - startTime;
    setDashboardLoadTime(loadTime);
    recordMetric('dashboard_load_time', loadTime);

    // Track if user is returning
    const lastVisit = localStorage.getItem('last_visit');
    if (lastVisit) {
      const daysSinceLastVisit = Math.floor(
        (Date.now() - parseInt(lastVisit)) / (1000 * 60 * 60 * 24)
      );
      trackEvent('returning_user', {
        daysSinceLastVisit,
        authenticated: isAuthenticated
      });
    }
    localStorage.setItem('last_visit', Date.now().toString());
  }, [isAuthenticated, user, trackPageView, trackEvent, recordMetric]);

  // Handle first-time dashboard users
  useEffect(() => {
    if (isAuthenticated && enableOnboarding && !hasSeenOnboarding) {
      trackEvent('dashboard_onboarding_shown', {
        userId: user?.id
      });
    }
  }, [isAuthenticated, enableOnboarding, hasSeenOnboarding, user, trackEvent]);

  // Show dashboard for authenticated users with proper error handling and loading states
  if (isAuthenticated) {
    // Check if new dashboard is enabled via feature flag
    if (!enableNewDashboard) {
      // Fallback to old dashboard experience
      return (
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold mb-4">Classic Dashboard</h1>
              <p className="text-gray-600">The new dashboard experience is coming soon!</p>
              <Link to="/wellness" className="btn-primary mt-4">Go to Wellness Tools</Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Offline indicator */}
        {!isOnline && <OfflineIndicator />}
        
        {/* Performance metrics in development */}
        {process.env.NODE_ENV === 'development' && dashboardLoadTime > 0 && (
          <div className="fixed top-20 right-4 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded z-50">
            Load time: {dashboardLoadTime.toFixed(2)}ms
          </div>
        )}

        {/* Dashboard with error boundary and loading states */}
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onReset={() => {
            // Clear any cached data that might be causing issues
            sessionStorage.clear();
            window.location.reload();
          }}
          onError={(error, errorInfo) => {
            // Log to error tracking service
            console.error('Dashboard Error:', error, errorInfo);
          }}
        >
          <Suspense fallback={<DashboardSkeleton />}>
            {/* Show onboarding for first-time users */}
            {enableOnboarding && !hasSeenOnboarding && (
              <Suspense fallback={null}>
                <DashboardOnboarding 
                  onComplete={() => {
                    setHasSeenOnboarding(true);
                    localStorage.setItem('dashboard_onboarding_completed', 'true');
                    trackEvent('onboarding_completed', { userId: user?.id });
                  }}
                  onSkip={() => {
                    setHasSeenOnboarding(true);
                    localStorage.setItem('dashboard_onboarding_completed', 'true');
                    trackEvent('onboarding_skipped', { userId: user?.id });
                  }}
                />
              </Suspense>
            )}
            <PersonalDashboard />
          </Suspense>
        </ErrorBoundary>
      </>
    );
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-display font-bold text-gray-900 mb-6">
              Your Mental Health
              <span className="text-primary-600"> Matters</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              A comprehensive platform for mental wellness, crisis support, and community connection.
              Take control of your mental health journey with professional guidance and peer support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard" className="btn-primary text-lg px-8 py-3">
                Get Started
              </Link>
              <Link to="/crisis" className="btn-outline text-lg px-8 py-3">
                Crisis Resources
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -z-10 opacity-10">
          <div className="w-96 h-96 bg-primary-500 rounded-full blur-3xl"></div>
        </div>
        <div className="absolute bottom-0 left-0 -z-10 opacity-10">
          <div className="w-96 h-96 bg-secondary-500 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
              Comprehensive Mental Health Support
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need for your mental wellness journey in one secure platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
              Start Your Wellness Journey Today
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Join thousands of users who have taken control of their mental health
            </p>
            <Link to="/dashboard" className="btn-primary text-lg px-10 py-4">
              Create Free Account
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    icon: '🧠',
    title: 'AI-Powered Support',
    description: 'Get personalized mental health insights and recommendations powered by advanced AI.',
  },
  {
    icon: '📊',
    title: 'Mood Tracking',
    description: 'Track your emotional patterns and identify triggers with our intuitive mood tracker.',
  },
  {
    icon: '👥',
    title: 'Community Support',
    description: 'Connect with others on similar journeys in our moderated support groups.',
  },
  {
    icon: '👨‍⚕️',
    title: 'Professional Network',
    description: 'Access licensed therapists and mental health professionals when you need them.',
  },
  {
    icon: '🆘',
    title: 'Crisis Resources',
    description: '24/7 access to crisis support hotlines and emergency mental health resources.',
  },
  {
    icon: '🌱',
    title: 'Wellness Tools',
    description: 'Meditation, breathing exercises, and self-care activities for daily wellness.',
  },
];

const stats = [
  { value: '50K+', label: 'Active Users' },
  { value: '500+', label: 'Professionals' },
  { value: '98%', label: 'Satisfaction' },
  { value: '24/7', label: 'Support' },
];

// Default export for lazy loading
export default HomePage;