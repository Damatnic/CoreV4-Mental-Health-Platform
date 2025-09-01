/**
 * Runtime Debug Script - Emergency Lexical Declaration Error Detective
 * Injects debugging code to catch the 'd' variable initialization error
 */

(function() {
  console.log('🔍 EMERGENCY RUNTIME DEBUGGER ACTIVATED');
  
  // Override Object.defineProperty to catch variable 'd' definitions
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj, prop, descriptor) {
    if (prop === 'd' || (typeof descriptor.value === 'function' && descriptor.value.name === 'd')) {
      console.trace('🎯 Variable "d" defined at:', {
        property: prop,
        target: obj,
        descriptor: descriptor,
        stack: new Error().stack
      });
    }
    return originalDefineProperty.call(this, obj, prop, descriptor);
  };
  
  // Monitor for lexical errors specifically
  const originalError = window.addEventListener;
  window.addEventListener('error', function(event) {
    if (event.message && event.message.includes('lexical declaration')) {
      console.error('🚨 LEXICAL DECLARATION ERROR CAUGHT:', {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      // Try to extract more info from the stack
      if (event.error && event.error.stack) {
        const stackLines = event.error.stack.split('\n');
        const relevantLines = stackLines.filter(line => 
          line.includes('react-core') || 
          line.includes('vendor') || 
          line.includes('.js')
        );
        console.error('📍 Relevant stack lines:', relevantLines);
      }
      
      // Store detailed error info
      const errorDetails = {
        type: 'lexical_declaration_error',
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        bundleHash: getBundleHash()
      };
      
      try {
        localStorage.setItem('lexical_error_debug', JSON.stringify(errorDetails));
      } catch (e) {
        console.error('Failed to store error details:', e);
      }
    }
    
    // Call original error handler
    return originalError.apply(this, arguments);
  });
  
  // Monitor unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    console.error('🚨 UNHANDLED PROMISE REJECTION:', {
      reason: event.reason,
      promise: event.promise,
      timestamp: new Date().toISOString()
    });
    
    if (event.reason && event.reason.toString().includes('lexical declaration')) {
      console.error('🎯 LEXICAL ERROR IN PROMISE:', event.reason);
    }
  });
  
  // Try to extract bundle information
  function getBundleHash() {
    const scripts = document.querySelectorAll('script[src*="react-core"]');
    if (scripts.length > 0) {
      const src = scripts[0].src;
      const hashMatch = src.match(/react-core-([^.]+)\.js/);
      return hashMatch ? hashMatch[1] : 'unknown';
    }
    return 'not-found';
  }
  
  // Search for global variable 'd' that might be causing issues
  function searchForProblematicD() {
    console.log('🔍 Searching for variable "d" in global scope...');
    try {
      const globalD = [];
      for (let key in window) {
        if (key === 'd') {
          globalD.push({ key, value: window[key], type: typeof window[key] });
        }
        if (key.toLowerCase().includes('d') && typeof window[key] === 'object') {
          try {
            const obj = window[key];
            for (let prop in obj) {
              if (prop === 'd') {
                globalD.push({ key: `${key}.${prop}`, value: obj[prop], type: typeof obj[prop] });
              }
            }
          } catch (e) {
            // Ignore access errors
          }
        }
      }
      
      if (globalD.length > 0) {
        console.log('🎯 Found potential "d" variables:', globalD);
      } else {
        console.log('✅ No global "d" variables found');
      }
    } catch (e) {
      console.error('❌ Error during global "d" search:', e);
    }
  }
  
  // Monitor DOM for script loading
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1 && node.tagName === 'SCRIPT') {
          const src = node.src;
          if (src && src.includes('react-core')) {
            console.log('📦 React core bundle loading:', src);
            
            node.addEventListener('error', function(e) {
              console.error('❌ React core bundle failed to load:', {
                src: src,
                error: e
              });
            });
            
            node.addEventListener('load', function() {
              console.log('✅ React core bundle loaded successfully:', src);
              // Search for D after bundle loads
              setTimeout(searchForProblematicD, 100);
            });
          }
        }
      });
    });
  });
  
  observer.observe(document, { childList: true, subtree: true });
  
  // Initial search
  setTimeout(searchForProblematicD, 1000);
  
  // Override console methods to catch any mentions of variable 'd'
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes("can't access") && message.includes("before initialization")) {
      console.log('🚨 TEMPORAL DEAD ZONE ERROR DETECTED:', args);
      
      // Try to get more context
      const stack = new Error().stack;
      if (stack) {
        const stackLines = stack.split('\n');
        const relevantLines = stackLines.filter(line => 
          !line.includes('console.error') && 
          !line.includes('runtime-debug')
        );
        console.log('📍 Error context:', relevantLines.slice(0, 5));
      }
    }
    return originalConsoleError.apply(this, args);
  };
  
  console.log('✅ Runtime debugger initialized - monitoring for lexical declaration errors');
})();

// Add a global function to manually check for the error
window.debugLexicalError = function() {
  console.log('🔍 Manual lexical error check initiated');
  
  // Check if error details were stored
  try {
    const storedError = localStorage.getItem('lexical_error_debug');
    if (storedError) {
      const errorData = JSON.parse(storedError);
      console.log('📋 Stored error details:', errorData);
      return errorData;
    } else {
      console.log('ℹ️ No stored lexical errors found');
      return null;
    }
  } catch (e) {
    console.error('❌ Failed to retrieve stored error:', e);
    return null;
  }
};

console.log('🔍 Runtime debug script loaded - use debugLexicalError() to check for stored errors');