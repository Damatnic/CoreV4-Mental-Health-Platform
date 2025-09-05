// Comprehensive Test Setup for CoreV4 Mental Health Platform
import '@testing-library/jest-dom';
import { expect, afterEach, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { toHaveNoViolations } from 'jest-axe';
import { server } from './mocks/server';
import { logger } from '../utils/logger';

// Extend Vitest matchers with jest-dom and jest-axe
expect.extend(matchers);
expect.extend({ toHaveNoViolations });

// Setup MSW (Mock Service Worker)
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

afterAll(() => {
  server.close();
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: () => [],
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock navigator.vibrate for mobile interactions
navigator.vibrate = vi.fn();

// Mock crypto for security testing with full WebCrypto API
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: (arr: any) => {
      for (let i = 0; i < (arr as any[]).length; i++) {
        (arr as any[])[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    randomUUID: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },
    subtle: {
      generateKey: vi.fn().mockResolvedValue({
        privateKey: {},
        publicKey: {}
      }),
      encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      sign: vi.fn().mockResolvedValue(new ArrayBuffer(64)),
      verify: vi.fn().mockResolvedValue(true),
      deriveBits: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      deriveKey: vi.fn().mockResolvedValue({}),
      importKey: vi.fn().mockResolvedValue({}),
      exportKey: vi.fn().mockResolvedValue({}),
      wrapKey: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      unwrapKey: vi.fn().mockResolvedValue({})
    }
  },
});

// Mock IndexedDB for storage testing
const indexedDBMock = {
  databases: new Map(),
  open: vi.fn((_name: string) => {
    return {
      result: {
        objectStoreNames: [],
        createObjectStore: vi.fn(),
        transaction: vi.fn(() => ({
          objectStore: vi.fn(() => ({
            add: vi.fn(),
            put: vi.fn(),
            get: vi.fn(() => ({ result: null })),
            delete: vi.fn(),
            clear: vi.fn(),
            getAll: vi.fn(() => ({ result: [] }))
          }))
        }))
      },
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null
    };
  }),
  deleteDatabase: vi.fn()
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDBMock,
  writable: true
});

// Performance monitoring for tests
const performanceMarks: Map<string, number> = new Map();

global.beforeEach(() => {
  performanceMarks.set('test-start', performance.now());
});

global.afterEach(() => {
  const startTime = performanceMarks.get('test-start');
  if (startTime) {
    const duration = performance.now() - startTime;
    if (duration > 200) {
      logger.warn(`Test took ${duration.toFixed(2)}ms - exceeds 200ms threshold for crisis response`);
    }
  }
  performanceMarks.clear();
});

// Custom matchers for mental health specific validations
expect.extend({
  toBeAccessible(received: HTMLElement) {
    const violations: string[] = [];
    
    // Check for ARIA labels
    const interactiveElements = received.querySelectorAll('button, a, input, select, textarea');
    interactiveElements.forEach(el => {
      if (!el.getAttribute('aria-label') && !el.textContent?.trim()) {
        violations.push(`Element ${el.tagName} missing accessible label`);
      }
    });
    
    // Check for alt text on images
    const images = received.querySelectorAll('img');
    images.forEach(img => {
      if (!img.getAttribute('alt')) {
        violations.push('Image missing alt text');
      }
    });
    
    // Check for proper heading hierarchy
    const headings = Array.from(received.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let lastLevel = 0;
    headings.forEach(h => {
      const level = parseInt(h.tagName[1]);
      if (level - lastLevel > 1) {
        violations.push(`Heading hierarchy broken: ${h.tagName} follows h${lastLevel}`);
      }
      lastLevel = level;
    });
    
    return {
      pass: violations.length === 0,
      message: () => violations.length > 0 
        ? `Accessibility violations found:\n${violations.join('\n')}`
        : 'Element is accessible',
    };
  },
  
  toHaveValidCrisisResponse(received: any) {
    const requiredFields = ['hotlineNumber', 'emergencyProtocol', 'responseTime'];
    const missingFields = requiredFields.filter(field => !received[field]);
    
    const responseTimeValid = received.responseTime && received.responseTime < 200;
    
    return {
      pass: missingFields.length === 0 && responseTimeValid,
      message: () => {
        if (missingFields.length > 0) {
          return `Crisis response missing required fields: ${missingFields.join(', ')}`;
        }
        if (!responseTimeValid) {
          return `Crisis response time ${received.responseTime}ms exceeds 200ms threshold`;
        }
        return 'Valid crisis response';
      },
    };
  },
  
  toBeHIPAACompliant(received: any) {
    const violations: string[] = [];
    
    // Check for encryption
    if (!received.encrypted) {
      violations.push('Data not encrypted');
    }
    
    // Check for audit logging
    if (!received.auditLog) {
      violations.push('No audit logging present');
    }
    
    // Check for access controls
    if (!received.accessControls) {
      violations.push('Missing access controls');
    }
    
    // Check for data retention policy
    if (!received.retentionPolicy) {
      violations.push('No data retention policy defined');
    }
    
    return {
      pass: violations.length === 0,
      message: () => violations.length > 0
        ? `HIPAA compliance violations:\n${violations.join('\n')}`
        : 'Data is HIPAA compliant',
    };
  },
});

// Test utilities for mental health features
export const __testUtils = {
  // Simulate crisis trigger
  triggerCrisis: () => {
    const event = new CustomEvent('crisis-detected', {
      detail: { severity: 'high', timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  },
  
  // Simulate professional response
  simulateProfessionalResponse: (responseTime: number = 100) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          professional: 'Dr. Smith',
          responseTime,
          available: true,
        });
      }, responseTime);
    });
  },
  
  // Check wellness score calculation
  calculateWellnessScore: (metrics: any) => {
    const weights = {
      mood: 0.3,
      sleep: 0.2,
      exercise: 0.2,
      nutrition: 0.15,
      social: 0.15,
    };
    
    return Object.entries(weights).reduce((score, [key, weight]) => {
      return score + (metrics[key] || 0) * weight;
    }, 0);
  },
};

// Mock analytics functions globally
global.trackEvent = vi.fn();
global.trackPageView = vi.fn();
global.trackError = vi.fn();
global.trackTiming = vi.fn();
global.trackInteraction = vi.fn();

// Mock gtag for Google Analytics
global.gtag = vi.fn();

// Environment variables for testing
process.env.NODE_ENV = 'test';
process.env.VITE_API_URL = 'http://localhost:3000';
process.env.VITE_CRISIS_HOTLINE = '988';
process.env.VITE_ENABLE_ANALYTICS = 'false';