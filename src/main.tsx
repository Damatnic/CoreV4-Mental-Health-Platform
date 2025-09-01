import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Performance monitoring
if (import.meta.env.PROD) {
  import('web-vitals').then((vitals) => {
    vitals.onCLS(console.log);
    vitals.onFID(console.log);
    vitals.onFCP(console.log);
    vitals.onLCP(console.log);
    vitals.onTTFB(console.log);
  });
}

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
  let updateAvailableShown = false; // Prevent multiple notifications
  let lastUpdateCheck = 0;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
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

// Initialize React 19 with concurrent features
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);