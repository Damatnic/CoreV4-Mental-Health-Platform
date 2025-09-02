/**
 * REACT DIAGNOSTIC SCRIPT
 * Diagnoses why React UI isn't loading
 */

(function() {
  // Wait for DOM to be ready before running diagnostics
  function runDiagnostics() {
    console.log('🔍 REACT DIAGNOSTIC STARTING...');
    
    // Check if root element exists
    const rootElement = document.getElementById('root');
    console.log('📍 Root element found:', !!rootElement);
    if (rootElement) {
      console.log('📍 Root element innerHTML:', rootElement.innerHTML.length, 'characters');
      console.log('📍 Root element content:', rootElement.innerHTML.substring(0, 200));
    } else {
      console.warn('⚠️ Root element #root not found yet - DOM may still be loading');
      return; // Don't proceed if root element is missing
    }
  
  // Check if React is available
  console.log('⚛️ React available:', typeof window.React);
  console.log('⚛️ ReactDOM available:', typeof window.ReactDOM);
  
  // Check for main.tsx script
  const mainScript = document.querySelector('script[src*="main.tsx"], script[src*="main.js"]');
  console.log('📜 Main script found:', !!mainScript);
  if (mainScript) {
    console.log('📜 Main script src:', mainScript.src);
  }
  
  // Check for any React-related scripts
  const allScripts = Array.from(document.querySelectorAll('script[src]'));
  console.log('📜 All scripts:', allScripts.map(s => s.src));
  
  // Check for module loading errors
  const moduleScripts = Array.from(document.querySelectorAll('script[type="module"]'));
  console.log('📦 Module scripts:', moduleScripts.length);
  
  // Try to manually trigger React if possible OR trigger emergency app
  setTimeout(() => {
    console.log('🔄 Checking React state after 3 seconds...');
    console.log('⚛️ React still available:', typeof window.React);
    console.log('📍 Root element content now:', rootElement ? rootElement.innerHTML.length : 'no root');
    
    // If React is available but no UI, try manual initialization
    if (window.React && window.ReactDOM && rootElement && rootElement.innerHTML.trim() === '') {
      console.log('🔧 Attempting manual React initialization...');
      try {
        // Create a simple test component
        const TestComponent = window.React.createElement('div', 
          { style: { padding: '20px', background: '#f0f0f0', margin: '20px' } },
          window.React.createElement('h1', null, '🔧 Emergency UI Test'),
          window.React.createElement('p', null, 'React is working, investigating main app issue...'),
          window.React.createElement('button', 
            { 
              onClick: () => window.location.reload(),
              style: { padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }
            }, 
            'Reload Page'
          )
        );
        
        // Try to render test component
        if (window.ReactDOM.render) {
          window.ReactDOM.render(TestComponent, rootElement);
          console.log('✅ Manual React render successful');
        } else if (window.ReactDOM.createRoot) {
          const root = window.ReactDOM.createRoot(rootElement);
          root.render(TestComponent);
          console.log('✅ Manual React 18 render successful');
        }
      } catch (error) {
        console.error('❌ Manual React render failed:', error);
        console.log('🚨 Triggering emergency app as fallback...');
        if (window.createEmergencyApp) {
          window.createEmergencyApp();
        }
      }
    } else if (!rootElement || rootElement.innerHTML.trim() === '') {
      console.log('🚨 No React or empty root - triggering emergency app...');
      if (window.createEmergencyApp) {
        window.createEmergencyApp();
      }
    }
  }, 3000);
  
  // Monitor for any late-loading scripts
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && node.tagName === 'SCRIPT') {
          console.log('📜 New script added:', node.src || 'inline script');
          
          node.addEventListener('load', () => {
            console.log('✅ Script loaded successfully:', node.src);
            // Re-check React after each script loads
            setTimeout(() => {
              if (window.React && rootElement && rootElement.innerHTML.trim() === '') {
                console.log('🔄 React available but no UI after script load');
              }
            }, 100);
          });
          
          node.addEventListener('error', (e) => {
            console.error('❌ Script failed to load:', node.src, e);
          });
        }
      });
    });
  });
  
  observer.observe(document.head, { childList: true });
  observer.observe(document.body, { childList: true });
  
    console.log('✅ React diagnostic active - monitoring for 60 seconds...');
    
    // Stop monitoring after 60 seconds
    setTimeout(() => {
      observer.disconnect();
      console.log('🔍 React diagnostic monitoring ended');
    }, 60000);
  }
  
  // Run diagnostics when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runDiagnostics);
  } else {
    // DOM is already ready, wait a bit for modules to load
    setTimeout(runDiagnostics, 1000);
  }
})();

console.log('🔍 React diagnostic script loaded');