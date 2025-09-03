const fs = require('fs');
const path = require('path');

// Files with most errors to fix
const filesToFix = [
  'src/services/privacy/privacyService.ts',
  'src/utils/performance/MemoryLeakPrevention.ts',
  'src/stores/activityStore.ts',
  'src/services/websocket/EnhancedWebSocketService.ts',
  'src/hooks/useAITherapist.ts',
  'src/services/security/securityMonitor.ts',
  'src/utils/runtimeGuards.ts',
  'src/services/security/cryptoService.ts',
  'src/test/performance/bundle-optimization.test.ts',
  'src/utils/performance/memoryManagement.ts',
  'src/components/ErrorBoundary.tsx',
  'src/components/accessibility/VoiceNavigation.tsx',
  'src/components/community/ModerationDashboard.tsx',
  'src/services/ai/CrisisDetectionService.ts',
  'src/services/ai/WellnessRecommendationService.ts',
  'src/services/console/ConsoleSoundSystem.ts',
  'src/services/crisis/MockCrisisServer.ts',
  'src/services/crisis/MockWebSocketAdapter.ts',
  'src/services/crisis/OfflineCrisisResources.ts',
  'src/services/realtime/websocketService.ts',
  'src/services/security/HIPAAComplianceService.ts',
  'src/services/security/SecureLocalStorage.ts',
  'src/services/security/fieldEncryption.ts',
  'src/services/security/secureStorage.ts',
  'src/services/websocket/SecureWebSocketClient.ts',
  'src/services/websocket/WebSocketService.ts',
  'src/test/accessibility/accessibility.test.ts',
  'src/test/crisis/CrisisScenarioTesting.ts',
  'src/test/performance/crisis-performance.test.ts',
  'src/utils/logger.ts',
  'src/utils/mobile/consoleMobilePerformance.ts',
  'src/utils/performance/gamingOptimizations.ts',
  'src/utils/performance/performanceMonitor.ts',
  'src/workers/chartProcessor.worker.ts'
];

// Map of undefined variables to fix
const undefReplacements = {
  '_consent': 'consent',
  '_consentId': 'consentId', 
  '_userId': 'userId',
  '_request': 'request',
  '_updates': 'updates',
  '_agreement': 'agreement',
  '_agreementId': 'agreementId',
  '_userData': 'userData',
  '_error': 'error',
  '_lastBoot': 'lastBoot',
  '_link': 'link',
  '_data': 'data',
  '_metrics': 'metrics',
  '_timestamp': 'timestamp',
  '_resource': 'resource',
  '_threshold': 'threshold',
  '_interval': 'interval',
  '_cleanup': 'cleanup',
  '_monitor': 'monitor',
  '_listener': 'listener',
  '_handler': 'handler',
  '_connection': 'connection',
  '_socket': 'socket',
  '_message': 'message',
  '_event': 'event',
  '_callback': 'callback',
  '_timer': 'timer',
  '_timeout': 'timeout',
  '_result': 'result',
  '_response': 'response',
  '_status': 'status',
  '_value': 'value',
  '_key': 'key',
  '_item': 'item',
  '_config': 'config',
  '_options': 'options',
  '_params': 'params'
};

function fixFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return 0;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let fixCount = 0;

  // Fix undefined variables
  Object.entries(undefReplacements).forEach(([wrong, correct]) => {
    const regex = new RegExp(`\\b${wrong}\\b`, 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, correct);
      fixCount += matches.length;
    }
  });

  // Fix catch blocks with unused error variables
  // Pattern 1: } catch (_error) { -> } catch {
  content = content.replace(/\} catch \(\w+\) \{/g, (match) => {
    if (match.includes('_')) {
      return '} catch {';
    }
    return match;
  });

  // Fix unused parameters by adding underscore prefix
  // Pattern: Look for common unused parameters in callbacks
  const unusedParams = [
    'error(?![s:])', // match 'error' but not 'errors' or 'error:'
    'next(?![\\w])',
    'req(?![u])',
    'res(?![p|u|o])',
    'event(?![s])',
    'data(?![b|s|:])',
    'value(?![s])',
    'index(?![O|e])',
    'item(?![s])',
    'key(?![s|b|w])'
  ];

  // This is more complex - we need to identify parameters that are defined but not used
  // For now, let's focus on the simpler fixes

  if (fixCount > 0) {
    fs.writeFileSync(fullPath, content);
    console.log(`✓ Fixed ${fixCount} issues in ${filePath}`);
  }

  return fixCount;
}

console.log('Fixing remaining ESLint errors...\n');
let totalFixes = 0;

filesToFix.forEach(file => {
  totalFixes += fixFile(file);
});

console.log(`\n✓ Total fixes applied: ${totalFixes}`);