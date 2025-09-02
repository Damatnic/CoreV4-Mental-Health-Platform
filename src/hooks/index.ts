/**
 * Hooks - Barrel Export
 * Provides easy access to all custom React hooks
 */

// Core hooks
export { useAuth } from './useAuth';
export { useAnalytics } from './useAnalytics';
export { useNavigatorOnLine } from './useNavigatorOnLine';
export { useNetworkStatus } from './useNetworkStatus';
export { useToast } from './useToast';

// Performance hooks
export { usePerformanceMonitor } from './usePerformanceMonitor';

// Device hooks
export { useBatteryStatus } from './useBatteryStatus';
export { useVibration } from './useVibration';
export { useGeolocation } from './useGeolocation';

// Navigation hooks
export { useKeyboardNavigation } from './useKeyboardNavigation';
export { useConsoleNavigation } from './useConsoleNavigation';

// Crisis hooks
export { useCrisisAssessment } from './useCrisisAssessment';

// Mobile hooks
export { useMobileFeatures, useTouchGestures } from './useMobileFeatures';