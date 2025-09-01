import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { EmergencyErrorBoundary, setupGlobalErrorHandling } from './components/ErrorBoundary';
import { setupRuntimeGuards } from './utils/runtimeGuards';
// CRITICAL SECURITY: Validate environment configuration before app startup
import './config/securityValidation';

// Initialize global error handling and runtime guards immediately
setupGlobalErrorHandling();
setupRuntimeGuards();

// Performance monitoring (quiet in production)
if (import.meta.env.PROD) {
  import('web-vitals').then((vitals) => {
    // Send to analytics instead of console.log in production
    const logMetric = (metric: any) => {
      // Only log critical performance issues, not every metric
      if (metric.rating === 'poor' || import.meta.env.DEV) {
        console.log(`${metric.name}: ${metric.value} (${metric.rating})`);
      }
    };
    
    vitals.onCLS(logMetric);
    vitals.onFID(logMetric);
    vitals.onFCP(logMetric);
    vitals.onLCP(logMetric);
    vitals.onTTFB(logMetric);
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

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
  let updateAvailableShown = false; // Prevent multiple notifications
  let lastUpdateCheck = 0;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw-enhanced.js')
      .then((registration) => {
        console.log('[Service Worker] Registered successfully:', registration.scope);
        
        // Handle updates with user-friendly notifications
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller && !updateAvailableShown) {
                updateAvailableShown = true;
                console.log('[Service Worker] Update available - will activate on next page load');
                
                // Show unobtrusive notification instead of blocking dialog
                showUpdateNotification(() => {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                });
              }
            });
          }
        });

        // Check for updates occasionally, not constantly
        const checkForUpdates = () => {
          const now = Date.now();
          if (now - lastUpdateCheck > 300000) { // Only check every 5 minutes
            lastUpdateCheck = now;
            registration.update();
          }
        };

        // Check for updates on visibility change (when user returns to tab)
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            checkForUpdates();
          }
        });
      })
      .catch((error) => {
        console.error('[Service Worker] Registration failed:', error);
      });
  });

  // Show a non-intrusive update notification
  function showUpdateNotification(onUpdate) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      max-width: 300px;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>🔄 Update available!</span>
        <button onclick="this.parentElement.parentElement.style.display='none'" 
                style="background: none; border: none; color: white; cursor: pointer; font-size: 16px;">×</button>
      </div>
      <div style="margin-top: 8px;">
        <button onclick="updateApp()" 
                style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-right: 8px;">
          Update Now
        </button>
        <button onclick="this.parentElement.parentElement.style.display='none'" 
                style="background: none; border: none; color: white; text-decoration: underline; cursor: pointer;">
          Later
        </button>
      </div>
    `;
    
    // Add update function to global scope temporarily
    window.updateApp = () => {
      notification.remove();
      onUpdate();
      delete window.updateApp;
    };
    
    document.body.appendChild(notification);
    
    // Slide in animation
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-hide after 10 seconds if user doesn't interact
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
      }
    }, 10000);
  }
}

// Initialize React with DOM ready check
function initializeReact() {
  console.log('🔍 Looking for root element...');
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('❌ Root element #root not found! DOM ready state:', document.readyState);
    
    // If DOM isn't ready, wait and retry
    if (document.readyState !== 'complete') {
      console.log('🔄 DOM not ready, retrying in 100ms...');
      setTimeout(() => {
        initializeReact();
      }, 100);
      return;
    }
    
    // If DOM is ready but no root element, create it
    console.log('🏠 Creating missing root element...');
    const newRoot = document.createElement('div');
    newRoot.id = 'root';
    document.body.appendChild(newRoot);
    
    // Retry initialization
    setTimeout(() => {
      initializeReact();
    }, 50);
    return;
  }

  console.log('✅ Found root element, initializing React...');
  
  try {
    const root = ReactDOM.createRoot(rootElement);

    root.render(
      <React.StrictMode>
        <EmergencyErrorBoundary>
          <App />
        </EmergencyErrorBoundary>
      </React.StrictMode>
    );
    
    console.log('✅ React successfully initialized!');
  } catch (error) {
    console.error('🚨 React initialization failed:', error);
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