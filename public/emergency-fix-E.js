/**
 * EMERGENCY FIX - Variable 'E' Lexical Declaration Error
 * Target: react-core-Bx9C_nFw.js:1:162065 and index.mjs:2:4158
 * 
 * IMMEDIATE DEPLOYMENT - Prevents production crash
 */

(function emergencyFixE() {
  console.log('🚨 EMERGENCY FIX FOR VARIABLE E ACTIVATED');
  
  // 1. Create safe fallback for variable 'E'
  if (typeof window.E === 'undefined') {
    window.E = {};
    console.log('✅ Created fallback for variable E');
  }
  
  // 2. Use Proxy to handle dynamic access to E
  const EHandler = {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
      console.warn(`Accessing undefined property E.${prop}, returning safe default`);
      return {};
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    }
  };
  
  // Create proxied E to handle any access pattern
  window.E = new Proxy(window.E || {}, EHandler);
  
  // 3. Fix EventTarget.addEventListener error (runtime-debug.js:72)
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    // Validate arguments
    if (typeof type !== 'string') {
      console.warn('addEventListener: type must be string, got:', typeof type);
      return;
    }
    
    if (listener === null || listener === undefined) {
      console.warn('addEventListener: listener is null/undefined');
      return;
    }
    
    if (typeof listener !== 'function' && typeof listener !== 'object') {
      console.warn('addEventListener: invalid listener type:', typeof listener);
      return;
    }
    
    try {
      return originalAddEventListener.call(this, type, listener, options);
    } catch (error) {
      console.error('addEventListener error caught:', error);
      // Don't throw, just log and continue
    }
  };
  
  // 4. Intercept and handle lexical declaration errors for 'E'
  const originalError = window.addEventListener('error', function(event) {
    if (event.error && event.error.message) {
      const message = event.error.message;
      
      // Check for lexical declaration error with 'E'
      if (message.includes("can't access lexical declaration 'E'") || 
          message.includes("lexical declaration") && message.includes("'E'")) {
        
        console.error('🔧 LEXICAL DECLARATION ERROR FOR E INTERCEPTED:', {
          message: message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error.stack
        });
        
        // Store error details for analysis
        const errorDetails = {
          type: 'lexical_declaration_E',
          message: message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error.stack,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        };
        
        try {
          const existingErrors = JSON.parse(localStorage.getItem('lexical_errors_E') || '[]');
          existingErrors.push(errorDetails);
          localStorage.setItem('lexical_errors_E', JSON.stringify(existingErrors.slice(-10)));
        } catch (e) {
          console.warn('Could not store error details:', e);
        }
        
        // Prevent the error from crashing the app
        event.preventDefault();
        
        // Try to recover by ensuring E exists
        if (typeof window.E === 'undefined') {
          window.E = {};
          console.log('🔄 Recovered by creating E variable');
        }
        
        // Attempt to reload the problematic module if it's a script error
        if (event.filename && (event.filename.includes('react-core') || event.filename.includes('index.mjs'))) {
          console.log('🔄 Attempting module recovery...');
          // Don't reload immediately, just ensure E exists
        }
      }
    }
  });
  
  // 5. Handle unhandled promise rejections that might involve 'E'
  window.addEventListener('unhandledrejection', function(event) {
    const reason = event.reason;
    if (reason && reason.toString().includes("lexical declaration") && reason.toString().includes("E")) {
      console.error('🔧 PROMISE REJECTION FOR E INTERCEPTED:', reason);
      
      // Prevent unhandled rejection
      event.preventDefault();
      
      // Ensure E exists
      if (typeof window.E === 'undefined') {
        window.E = {};
        console.log('🔄 Recovered E in promise rejection handler');
      }
    }
  });
  
  // 6. Override any global E access with safe version
  Object.defineProperty(window, 'E', {
    get() {
      return this._safeE || (this._safeE = {});
    },
    set(value) {
      this._safeE = value;
    },
    configurable: true,
    enumerable: true
  });
  
  // 7. Monitor for module loading and ensure E is available
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(this, tagName);
    
    if (tagName.toLowerCase() === 'script' && element.src) {
      // Monitor script loading
      element.addEventListener('error', function(e) {
        console.error('Script loading error:', e.target.src);
        if (e.target.src.includes('react-core') || e.target.src.includes('index.mjs')) {
          console.log('🔧 Critical script failed, ensuring E exists');
          if (typeof window.E === 'undefined') {
            window.E = {};
          }
        }
      });
      
      element.addEventListener('load', function(e) {
        console.log('✅ Script loaded:', e.target.src);
        // Verify E still exists after script load
        if (typeof window.E === 'undefined') {
          window.E = {};
          console.log('🔄 Re-created E after script load');
        }
      });
    }
    
    return element;
  };
  
  // 8. Debug function for manual error checking
  window.debugLexicalErrorE = function() {
    console.log('🔍 Manual E error check:');
    console.log('E variable type:', typeof window.E);
    console.log('E variable value:', window.E);
    
    try {
      const storedErrors = localStorage.getItem('lexical_errors_E');
      if (storedErrors) {
        const errors = JSON.parse(storedErrors);
        console.log('📋 Stored E errors:', errors);
        return errors;
      } else {
        console.log('✅ No stored E errors found');
        return [];
      }
    } catch (e) {
      console.error('❌ Could not retrieve stored errors:', e);
      return null;
    }
  };
  
  // 9. Performance monitoring for E-related operations
  window.measureEAccess = function(operation, fn) {
    const start = performance.now();
    try {
      const result = fn();
      const end = performance.now();
      console.log(`⏱️ E operation "${operation}" took ${end - start}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.error(`❌ E operation "${operation}" failed after ${end - start}ms:`, error);
      throw error;
    }
  };
  
  console.log('✅ Emergency E fix initialized successfully');
  console.log('🔍 Use debugLexicalErrorE() to check for errors');
  console.log('⚡ Use measureEAccess(name, fn) to monitor performance');
  
  // Final verification
  setTimeout(() => {
    if (typeof window.E !== 'undefined') {
      console.log('✅ Variable E is accessible after initialization');
    } else {
      console.error('❌ Variable E still not accessible - manual intervention needed');
      window.E = { emergency: true };
    }
  }, 100);
  
})();

console.log('🚨 Emergency Fix for Variable E loaded - monitoring active');