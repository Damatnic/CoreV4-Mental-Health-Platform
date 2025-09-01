/**
 * EMERGENCY REACT INITIALIZATION
 * Direct React/ReactDOM loading and app initialization
 */

(function() {
  console.log('🚀 EMERGENCY REACT INITIALIZATION STARTING...');
  
  // Check if we already have a working React app
  setTimeout(() => {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error('❌ Root element not found, cannot initialize React');
      return;
    }
    
    // Check if there's already content (app loaded successfully)
    const hasContent = rootElement.innerHTML.trim() !== '' && 
                      !rootElement.innerHTML.includes('Loading Mental Health Platform');
    
    if (hasContent) {
      console.log('✅ App appears to be loaded, emergency init not needed');
      return;
    }
    
    console.log('🔄 No React app detected, attempting emergency initialization...');
    
    // Check if React modules are available
    if (typeof window.React === 'undefined' || typeof window.ReactDOM === 'undefined') {
      console.log('⚛️ React/ReactDOM not in global scope, attempting dynamic import...');
      
      // Try to import React from the main bundle
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const mainScript = scripts.find(script => 
        script.src.includes('index-') && script.src.includes('.js')
      );
      
      if (mainScript) {
        console.log('📜 Found main script:', mainScript.src);
        console.log('🚨 Main script loaded but React not available - triggering emergency app');
        if (window.createEmergencyApp) {
          window.createEmergencyApp();
        }
        return;
      }
    }
    
    // If React is available, try to create a minimal app
    if (window.React && window.ReactDOM) {
      console.log('⚛️ React available, creating emergency UI...');
      
      try {
        const EmergencyApp = window.React.createElement('div', 
          { 
            style: { 
              minHeight: '100vh', 
              padding: '2rem', 
              fontFamily: 'system-ui, -apple-system, sans-serif',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            } 
          },
          window.React.createElement('div',
            {
              style: {
                maxWidth: '600px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.1)',
                padding: '2rem',
                borderRadius: '1rem',
                backdropFilter: 'blur(10px)'
              }
            },
            window.React.createElement('h1', 
              { style: { fontSize: '2.5rem', marginBottom: '1rem' } },
              '🧠 CoreV4 Mental Health Platform'
            ),
            window.React.createElement('p', 
              { style: { fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 } },
              'Emergency initialization successful. Loading main application...'
            ),
            window.React.createElement('div',
              {
                style: {
                  background: 'rgba(220,38,38,0.8)',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem'
                }
              },
              window.React.createElement('h3', { style: { marginBottom: '0.5rem' } }, '🆘 Crisis Support'),
              window.React.createElement('a',
                {
                  href: 'tel:988',
                  style: { color: 'white', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 'bold' }
                },
                'Call 988'
              ),
              window.React.createElement('p', { style: { marginTop: '0.5rem', fontSize: '0.9rem' } }, 'National Suicide Prevention Lifeline')
            ),
            window.React.createElement('button',
              {
                onClick: () => window.location.reload(),
                style: {
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }
              },
              '🔄 Reload Application'
            )
          )
        );
        
        // Render the emergency app
        if (window.ReactDOM.createRoot) {
          const root = window.ReactDOM.createRoot(rootElement);
          root.render(EmergencyApp);
          console.log('✅ Emergency React 18 app rendered successfully');
        } else if (window.ReactDOM.render) {
          window.ReactDOM.render(EmergencyApp, rootElement);
          console.log('✅ Emergency React app rendered successfully');
        }
        
      } catch (error) {
        console.error('❌ Emergency React initialization failed:', error);
        // Fall back to emergency HTML app
        if (window.createEmergencyApp) {
          window.createEmergencyApp();
        }
      }
    } else {
      console.log('❌ React not available, using emergency HTML app');
      if (window.createEmergencyApp) {
        window.createEmergencyApp();
      }
    }
    
  }, 5000); // Wait 5 seconds for normal app to load
  
  console.log('✅ Emergency React initialization system ready');
  
})();