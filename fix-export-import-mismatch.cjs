#!/usr/bin/env node

/**
 * Script to fix export/import mismatches caused by incorrect underscore prefixing
 * This will remove underscores from exports that are actually being used
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Map of files and their exports that need fixing (from error messages)
const exportFixes = {
  'src/utils/bundleOptimization/lazyLoading.ts': [
    '_RouteComponents',
    '_EmergencyContactsLazy',
    '_SafetyPlanLazy',
    '_CrisisChatLazy'
  ],
  'src/middleware/securityMiddleware.tsx': [
    '_withSecurity'
  ],
  'src/utils/logger.ts': [
    '_logError'
  ],
  'src/services/accessibility/AdvancedAccessibilityService.ts': [
    '_advancedAccessibilityService'
  ],
  'src/services/community/communityService.ts': [
    '_communityService'
  ],
  'src/services/realtime/websocketService.ts': [
    '_websocketService'
  ],
  'src/hooks/useAnalytics.ts': [
    '_useAnalytics'
  ],
  'src/services/notifications/ComprehensiveNotificationService.ts': [
    '_comprehensiveNotificationService'
  ],
  'src/services/professional/TherapistService.ts': [
    '_therapistService'
  ],
  'src/stores/wellnessStore.ts': [
    '_useWellnessStore'
  ],
  'src/components/ErrorBoundary.tsx': [
    '_setupGlobalErrorHandling'
  ],
  'src/services/security/rateLimiter.ts': [
    '_rateLimiter'
  ],
  'src/services/security/sessionManager.ts': [
    '_sessionManager'
  ],
  'src/services/auth/authService.ts': [
    '_authService'
  ],
  'src/services/security/securityMonitor.ts': [
    '_securityMonitor'
  ],
  'src/services/security/fieldEncryption.ts': [
    '_fieldEncryption'
  ],
  'src/services/security/auditLogger.ts': [
    '_auditLogger'
  ],
  'src/services/security/secureStorage.ts': [
    '_secureStorage'
  ],
  'src/services/security/cryptoService.ts': [
    '_cryptoService'
  ],
  'src/services/privacy/privacyService.ts': [
    '_privacyService'
  ],
  'src/services/api/ApiService.ts': [
    '_apiService'
  ],
  'src/services/websocket/WebSocketService.ts': [
    '_wsService'
  ],
  'src/services/compliance/hipaaService.ts': [
    '_hipaaService'
  ],
  'src/constants/crisis.ts': [
    '_CRISIS_STORAGE_KEYS',
    '_CRISIS_EVENTS'
  ]
};

let totalFixed = 0;

// Process each file
Object.entries(exportFixes).forEach(([filePath, exports]) => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  exports.forEach(exportName => {
    const correctName = exportName.substring(1); // Remove underscore
    
    // Fix export const statements
    const exportPattern = new RegExp(`export const ${exportName}\\b`, 'g');
    if (content.match(exportPattern)) {
      content = content.replace(exportPattern, `export const ${correctName}`);
      modified = true;
      console.log(`Fixed export: ${exportName} → ${correctName} in ${filePath}`);
      totalFixed++;
    }
    
    // Fix export { } statements
    const namedExportPattern = new RegExp(`export \\{ ${exportName}\\b`, 'g');
    if (content.match(namedExportPattern)) {
      content = content.replace(namedExportPattern, `export { ${correctName}`);
      modified = true;
      console.log(`Fixed named export: ${exportName} → ${correctName} in ${filePath}`);
      totalFixed++;
    }
  });
  
  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ Updated ${filePath}`);
  }
});

console.log(`\n✅ Fixed ${totalFixed} export mismatches`);
console.log('Now run: npm run dev to test the application');