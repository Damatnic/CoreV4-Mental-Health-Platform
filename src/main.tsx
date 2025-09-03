import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { EmergencyErrorBoundary, __setupGlobalErrorHandling } from './components/ErrorBoundary';
import { setupRuntimeGuards } from './utils/runtimeGuards';
import { logger } from './utils/logger';
// CRITICAL SECURITY: Validate environment configuration before app startup
import './config/securityValidation';

// Extend Window interface for temporary update function
declare global {
  interface Window {
    updateApp?: () => void;
  }
}

// Initialize global error handling and runtime guards immediately
_setupGlobalErrorHandling();
setupRuntimeGuards();

// Performance monitoring (quiet in production)
if (import.meta.env.PROD) {
  import('web-vitals').then((vitals) => {
    // Send to analytics instead of console.log in production
    const _logMetric = (metric: unknown) => {
      // Only log critical performance issues, not every metric
      if (metric.rating === 'poor' && import.meta.env.DEV) {
        logger.warn(`Poor performance metric: ${metric.name}: ${metric.value}`, 'WebVitals');
      }
    };
    
    vitals.onCLS(_logMetric);
    vitals.onFID(_logMetric);
    vitals.onFCP(_logMetric);
    vitals.onLCP(_logMetric);
    vitals.onTTFB(_logMetric);
  });
}

// Suppress source map warnings in production
if (import.meta.env.PROD) {
  // Suppress source map warnings that clutter the console
  const originalConsoleWarn = console.warn;
  console.warn = function(...args) {
    const message = args.join(' ');
    if (message.includes('Source map') || 
        message.includes('DevTools') ||
        message.includes('installHook') ||
        message.includes('react_devtools')) {
      return; // Suppress these warnings
    }
    originalConsoleWarn.apply(console, args);
  };

  // Also suppress source map errors
  window.addEventListener('error', (e) => {
    if (e.message?.includes('Source map') || 
        e.filename?.includes('react_devtools') ||
        e.filename?.includes('installHook')) {
      e.preventDefault();
      return false;
    }
  });
}

// Register Service Worker for offline support (silent mode)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw-enhanced.js')
      .then((registration) => {
        // Service Worker registered successfully
        
        // Handle updates silently - no user notifications
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Update silently - will activate on next page load naturally
                // Update available - will activate on next visit
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch((error) => {
        logger.error('[Service Worker] Registration failed:', error);
      });
  });
}

// Initialize React with DOM ready check
function initializeReact() {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    // If DOM isn&apos;t ready, wait and retry
    if (document.readyState !== 'complete') {
      setTimeout(() => {
        initializeReact();
      }, 100);
      return;
    }
    
    // If DOM is ready but no root element, create it
    const newRoot = document.createElement('div');
    newRoot.id = 'root';
    document.body.appendChild(newRoot);
    
    // Retry initialization
    setTimeout(() => {
      initializeReact();
    }, 50);
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootElement);

    root.render(
      <React.StrictMode>
        <EmergencyErrorBoundary>
          <App />
        </EmergencyErrorBoundary>
      </React.StrictMode>
    );
  } catch (error) {
    logger.error('🚨 React initialization failed:');
    // Show emergency fallback
    rootElement.innerHTML = `
      <div style="padding: 2rem; text-align: center; font-family: system-ui; color: #dc2626;">
        <h1>🏥 CoreV4 Emergency Mode</h1>
        <p>React failed to initialize. Crisis resources available:</p>
        <a href="tel:988" style="display: block; margin: 1rem 0; padding: 1rem; background: #dc2626; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Call Crisis Lifeline: 988</a>
        <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry Loading</button>
      </div>
    `;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeReact);
} else {
  // DOM is already ready
  initializeReact();
}