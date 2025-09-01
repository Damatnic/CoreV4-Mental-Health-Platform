/**
 * EMERGENCY REACT APP
 * Minimal functional UI if main app fails to load
 */

window.createEmergencyApp = function() {
  console.log('🚨 Creating emergency React app...');
  
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('❌ No root element found for emergency app');
    return;
  }
  
  // Clear any existing content
  rootElement.innerHTML = '';
  
  // Create emergency app HTML
  rootElement.innerHTML = `
    <div style="min-height: 100vh; padding: 20px; font-family: system-ui, -apple-system, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
      <div style="max-width: 800px; margin: 0 auto; text-align: center; padding-top: 50px;">
        <div style="background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px);">
          <h1 style="font-size: 2.5rem; margin-bottom: 20px; color: white;">
            🧠 CoreV4 Mental Health Platform
          </h1>
          
          <p style="font-size: 1.2rem; margin-bottom: 30px; opacity: 0.9;">
            Your mental health support system is running in emergency mode.
          </p>
          
          <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; margin: 20px 0;">
            <h2 style="color: #ffd700; margin-bottom: 15px;">🚨 Emergency Resources</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">
              
              <div style="background: rgba(220,38,38,0.8); padding: 15px; border-radius: 10px;">
                <h3 style="margin-bottom: 10px;">🆘 Crisis Hotline</h3>
                <a href="tel:988" style="color: white; text-decoration: none; font-size: 1.5rem; font-weight: bold;">
                  Call 988
                </a>
                <p style="margin-top: 5px; font-size: 0.9rem;">National Suicide Prevention Lifeline</p>
              </div>
              
              <div style="background: rgba(16,185,129,0.8); padding: 15px; border-radius: 10px;">
                <h3 style="margin-bottom: 10px;">💬 Crisis Text</h3>
                <a href="sms:741741" style="color: white; text-decoration: none; font-size: 1.5rem; font-weight: bold;">
                  Text 741741
                </a>
                <p style="margin-top: 5px; font-size: 0.9rem;">Crisis Text Line</p>
              </div>
              
              <div style="background: rgba(59,130,246,0.8); padding: 15px; border-radius: 10px;">
                <h3 style="margin-bottom: 10px;">🚑 Emergency</h3>
                <a href="tel:911" style="color: white; text-decoration: none; font-size: 1.5rem; font-weight: bold;">
                  Call 911
                </a>
                <p style="margin-top: 5px; font-size: 0.9rem;">Immediate Emergency</p>
              </div>
              
            </div>
          </div>
          
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; margin: 20px 0; text-align: left;">
            <h3 style="color: #ffd700; margin-bottom: 15px;">🔧 Technical Status</h3>
            <p style="margin: 5px 0;">✅ Lexical error protection: Active</p>
            <p style="margin: 5px 0;">⚠️ Main React app: Loading issue detected</p>
            <p style="margin: 5px 0;">🛡️ Emergency mode: Functional</p>
            <p style="margin: 5px 0;">💾 Crisis resources: Available</p>
          </div>
          
          <div style="margin-top: 30px;">
            <button onclick="window.location.reload()" 
              style="background: #10b981; color: white; border: none; padding: 15px 30px; border-radius: 10px; font-size: 1.1rem; cursor: pointer; margin: 10px;">
              🔄 Retry Loading App
            </button>
            
            <button onclick="window.debugAllLexicalErrors && window.debugAllLexicalErrors()" 
              style="background: #6366f1; color: white; border: none; padding: 15px 30px; border-radius: 10px; font-size: 1.1rem; cursor: pointer; margin: 10px;">
              🔍 Debug Info
            </button>
          </div>
          
          <p style="margin-top: 30px; font-size: 0.9rem; opacity: 0.7;">
            This emergency interface ensures you always have access to critical mental health resources,
            even if the main application encounters technical issues.
          </p>
          
        </div>
      </div>
    </div>
  `;
  
  console.log('✅ Emergency React app created');
};

// Auto-create emergency app if main app doesn't load within 10 seconds
setTimeout(() => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const hasContent = rootElement.innerHTML.trim() !== '' && 
                      !rootElement.innerHTML.includes('Loading Mental Health Platform');
    
    if (!hasContent) {
      console.log('🚨 Main app failed to load, creating emergency app...');
      window.createEmergencyApp();
    } else {
      console.log('✅ Main app appears to be loaded');
    }
  }
}, 10000);

console.log('🚨 Emergency app system ready');