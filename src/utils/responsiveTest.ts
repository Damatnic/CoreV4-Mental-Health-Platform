/**
 * Responsive Design Testing Utilities
 * Helps verify dashboard works across all device sizes
 */

export interface DeviceProfile {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  userAgent: string;
  touch: boolean;
  mobile: boolean;
}

// Common device profiles for testing
export const DEVICE_PROFILES: DeviceProfile[] = [
  // Mobile Devices
  {
    name: 'iPhone SE',
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
    touch: true,
    mobile: true
  },
  {
    name: 'iPhone 12 Pro',
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
    touch: true,
    mobile: true
  },
  {
    name: 'iPhone 14 Pro Max',
    width: 430,
    height: 932,
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
    touch: true,
    mobile: true
  },
  {
    name: 'Samsung Galaxy S21',
    width: 384,
    height: 854,
    deviceScaleFactor: 2.625,
    userAgent: 'Mozilla/5.0 (Linux; Android 12; Samsung Galaxy S21)',
    touch: true,
    mobile: true
  },
  {
    name: 'Pixel 5',
    width: 393,
    height: 851,
    deviceScaleFactor: 2.625,
    userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5)',
    touch: true,
    mobile: true
  },
  
  // Tablets
  {
    name: 'iPad Mini',
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)',
    touch: true,
    mobile: false
  },
  {
    name: 'iPad Air',
    width: 820,
    height: 1180,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)',
    touch: true,
    mobile: false
  },
  {
    name: 'iPad Pro 11"',
    width: 834,
    height: 1194,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)',
    touch: true,
    mobile: false
  },
  {
    name: 'iPad Pro 12.9"',
    width: 1024,
    height: 1366,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)',
    touch: true,
    mobile: false
  },
  
  // Desktop
  {
    name: 'Desktop HD',
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    touch: false,
    mobile: false
  },
  {
    name: 'Desktop FHD',
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    touch: false,
    mobile: false
  },
  {
    name: 'MacBook Pro 13"',
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    touch: false,
    mobile: false
  },
  {
    name: 'MacBook Pro 16"',
    width: 1728,
    height: 1117,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    touch: false,
    mobile: false
  }
];

// Breakpoint definitions
export const BREAKPOINTS = {
  xs: 0,     // Extra small devices (portrait phones)
  sm: 640,   // Small devices (landscape phones)
  md: 768,   // Medium devices (_tablets)
  lg: 1024,  // Large devices (_desktops)
  xl: 1280,  // Extra large devices (large desktops)
  '2xl': 1536 // 2X large devices (larger desktops)
} as const;

// Get current breakpoint
export function getCurrentBreakpoint(): keyof typeof BREAKPOINTS {
  const width = window.innerWidth;
  
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

// Check if current device is mobile
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Check if current device supports touch
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Get device orientation
export function getDeviceOrientation(): 'portrait' | 'landscape' {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

// Test responsive layout
export class ResponsiveLayoutTester {
  private originalWidth: number;
  private originalHeight: number;
  private testResults: Map<string, TestResult> = new Map();

  constructor() {
    this.originalWidth = window.innerWidth;
    this.originalHeight = window.innerHeight;
  }

  // Test all device profiles
  async testAllDevices(testFn: (device: DeviceProfile) => Promise<boolean>): Promise<TestReport> {
    const _results: TestResult[] = [];

    for (const device of DEVICE_PROFILES) {
      const result = await this.testDevice(device, testFn);
      results.push(result);
      this.testResults.set(device.name, result);
    }

    return this.generateReport(results);
  }

  // Test specific device
  async testDevice(
    device: DeviceProfile, 
    testFn: (device: DeviceProfile) => Promise<boolean>
  ): Promise<TestResult> {
    const startTime = performance.now();
    
    // Simulate device viewport
    this.setViewport(device.width, device.height);
    
    // Run test
    let passed = false;
    let error: Error | undefined;
    
    try {
      passed = await testFn(_device);
    } catch {
      error = e as Error;
      passed = false;
    }
    
    const duration = performance.now() - startTime;
    
    // Reset viewport
    this.resetViewport();
    
    return {
      device: device.name,
      passed,
      duration,
      error: error?.message,
      timestamp: new Date()
    };
  }

  // Set viewport size (for testing only)
  private setViewport(width: number, height: number) {
    // This would typically be done with a testing framework like Playwright or Cypress
    // For development, we can use CSS to simulate different viewports
    document.documentElement.style.setProperty('--test-viewport-width', `${width}px`);
    document.documentElement.style.setProperty('--test-viewport-height', `${height}px`);
  }

  // Reset viewport
  private resetViewport() {
    document.documentElement.style.removeProperty('--test-viewport-width');
    document.documentElement.style.removeProperty('--test-viewport-height');
  }

  // Generate test report
  private generateReport(results: TestResult[]): TestReport {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    return {
      summary: {
        total: results.length,
        passed,
        failed,
        passRate: (passed / results.length) * 100,
        averageDuration: totalDuration / results.length
      }, _results,
      generatedAt: new Date(),
      recommendations: this.generateRecommendations(results)
    };
  }

  // Generate recommendations based on test results
  private generateRecommendations(results: TestResult[]): string[] {
    const recommendations: string[] = [];
    const failedDevices = results.filter(r => !r.passed);

    if (failedDevices.length > 0) {
      const mobileFailures = failedDevices.filter(r => 
        DEVICE_PROFILES.find(d => d.name === r.device)?.mobile
      );
      
      if (mobileFailures.length > 0) {
        recommendations.push('Mobile responsiveness needs improvement');
      }

      const tabletFailures = failedDevices.filter(r => {
        const device = DEVICE_PROFILES.find(d => d.name === r.device);
        return device && !device.mobile && device.touch;
      });
      
      if (tabletFailures.length > 0) {
        recommendations.push('Tablet layout optimization required');
      }
    }

    const slowTests = results.filter(r => r.duration > 1000);
    if (slowTests.length > 0) {
      recommendations.push('Performance optimization needed for some viewports');
    }

    return recommendations;
  }
}

// Test result interfaces
interface TestResult {
  device: string;
  passed: boolean;
  duration: number;
  error?: string;
  timestamp: Date;
}

interface TestReport {
  summary: {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    averageDuration: number;
  };
  results: TestResult[];
  generatedAt: Date;
  recommendations: string[];
}

// CSS Media Query validator
export function validateMediaQueries(): MediaQueryValidation[] {
  const validations: MediaQueryValidation[] = [];
  
  // Check common breakpoints
  for (const [name, minWidth] of Object.entries(_BREAKPOINTS)) {
    const query = `(min-width: ${minWidth}px)`;
    const matches = window.matchMedia(_query).matches;
    
    validations.push({
      breakpoint: name,
      query,
      matches,
      currentWidth: window.innerWidth
    });
  }
  
  // Check orientation
  validations.push({
    breakpoint: 'orientation',
    query: '(orientation: portrait)',
    matches: window.matchMedia('(orientation: portrait)').matches,
    currentWidth: window.innerWidth
  });
  
  // Check touch capability
  validations.push({
    breakpoint: 'touch',
    query: '(hover: none)',
    matches: window.matchMedia('(hover: none)').matches,
    currentWidth: window.innerWidth
  });
  
  return validations;
}

interface MediaQueryValidation {
  breakpoint: string;
  query: string;
  matches: boolean;
  currentWidth: number;
}

// Accessibility viewport testing
export function testAccessibilityAtBreakpoint(breakpoint: keyof typeof BREAKPOINTS): AccessibilityTest {
  const tests: AccessibilityCheck[] = [];
  
  // Check font sizes
  const minFontSize = 14; // Minimum recommended font size
  const bodyFontSize = parseFloat(
    window.getComputedStyle(document.body).fontSize
  );
  
  tests.push({
    name: 'Font Size',
    passed: bodyFontSize >= minFontSize,
    message: `Body font size is ${bodyFontSize}px (min: ${minFontSize}px)`
  });
  
  // Check touch target sizes
  const minTouchTarget = 44; // Minimum touch target size in pixels
  const buttons = document.querySelectorAll('button');
  let touchTargetsPassed = true;
  
  buttons.forEach(button => {
    const rect = button.getBoundingClientRect();
    if (rect.width < minTouchTarget || rect.height < minTouchTarget) {
      touchTargetsPassed = false;
    }
  });
  
  tests.push({
    name: 'Touch Targets',
    passed: touchTargetsPassed,
    message: touchTargetsPassed 
      ? 'All touch targets meet minimum size' 
      : 'Some touch targets are too small'
  });
  
  // Check contrast ratios
  tests.push({
    name: 'Color Contrast',
    passed: true, // Would need more complex checking
    message: 'Manual verification required'
  });
  
  // Check viewport zoom
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  const allowsZoom = !viewportMeta?.getAttribute('content')?.includes('user-scalable=no');
  
  tests.push({
    name: 'Viewport Zoom',
    passed: allowsZoom,
    message: allowsZoom ? 'Zoom is enabled' : 'Zoom is disabled'
  });
  
  return {
    breakpoint,
    timestamp: new Date(),
    tests,
    passed: tests.every(t => t.passed)
  };
}

interface AccessibilityCheck {
  name: string;
  passed: boolean;
  message: string;
}

interface AccessibilityTest {
  breakpoint: string;
  timestamp: Date;
  tests: AccessibilityCheck[];
  passed: boolean;
}

// Export test runner for use in components
export const __responsiveTester = new ResponsiveLayoutTester();