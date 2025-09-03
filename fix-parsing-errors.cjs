#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// List of files with known parsing errors from ESLint output
const filesWithParsingErrors = [
  'src/components/ErrorBoundary.tsx',
  'src/components/accessibility/AccessibilityControlPanel.tsx',
  'src/components/accessibility/VoiceNavigation.tsx',
  'src/components/analytics/MentalHealthAnalyticsDashboard.tsx',
  'src/components/community/ModerationDashboard.tsx',
  'src/components/crisis/CrisisButton.tsx',
  'src/components/crisis/CrisisDemonstrationHub.tsx',
  'src/components/crisis/CrisisInterventionSystem.tsx',
  'src/components/crisis/CrisisResources.tsx',
  'src/components/crisis/EmergencyContacts.tsx',
  'src/components/crisis/EmergencyServicesInterface.tsx',
  'src/components/crisis/EnhancedCrisisChat.tsx',
  'src/components/crisis/MobileCrisisInterface.tsx',
  'src/components/crisis/RealTimeCrisisChat.tsx',
  'src/components/crisis/SafetyPlan.tsx',
  'src/components/crisis/SafetyPlanGenerator.tsx',
  'src/components/crisis/UnifiedCrisisButton.tsx',
  'src/components/performance/OptimizedCrisisIntervention.tsx',
  'src/components/performance/PerformanceDashboard.tsx',
  'src/components/professional/RelapsePrevention.tsx',
  'src/components/professional/TelehealthIntegration.tsx',
  'src/components/safety/EmergencyContactManager.tsx',
  'src/components/safety/SafetyResourceHub.tsx',
  'src/components/widgets/LocalCrisisResources.tsx',
  'src/hooks/useFeatureFlag.ts',
  'src/pages/CrisisPage.tsx',
  'src/pages/PricingPage.tsx',
  'src/services/ai/CrisisDetectionService.ts',
  'src/services/ai/WellnessRecommendationService.ts',
  'src/services/api/ApiService.ts',
  'src/services/console/ConsoleSoundSystem.ts',
  'src/services/crisis/emergencyServices.ts',
  'src/services/monitoring/HealthCheckService.ts',
  'src/services/notifications/ComprehensiveNotificationService.ts',
  'src/services/privacy/privacyService.ts',
  'src/services/security/HIPAAComplianceService.ts',
  'src/services/security/secureStorage.ts',
  'src/services/security/securityMonitor.ts',
  'src/services/security/SecureLocalStorage.ts',
  'src/test/crisis/CrisisScenarioTesting.ts',
  'src/test/performance/bundle-optimization.test.ts',
  'src/test/scripts/run-all-tests.ts',
  'src/utils/logger.ts',
  'src/utils/mobile/consoleHapticFeedback.ts',
  'src/utils/mobile/consoleMobilePerformance.ts',
  'src/utils/performance/index.ts',
  'src/utils/performance/performanceMonitor.ts',
  'src/utils/pwa/pwaManager.ts',
  'src/utils/responsiveTest.ts',
  'src/utils/runtimeGuards.ts',
  'src/workers/chartProcessor.worker.ts',
];

function fixParsingErrors(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const originalContent = content;

    // Fix 1: catch without parameter - should be catch (error) or catch (_error)
    content = content.replace(/\bcatch\s*\(\s*\)\s*\{/g, 'catch (error) {');
    
    // Fix 2: catch without parentheses - should be catch (error)
    content = content.replace(/\bcatch\s+\{/g, 'catch (error) {');
    
    // Fix 3: Fix specific patterns found in the codebase
    // Pattern: } catch {  -> } catch (error) {
    content = content.replace(/\}\s*catch\s*\{/g, '} catch (error) {');
    
    // Fix 4: Empty catch block parameters
    content = content.replace(/\bcatch\s*\(\s*\)/g, 'catch (error)');
    
    // Fix 5: Fix for destructuring with incorrect syntax
    // Look for patterns like: const { data, error } = await 
    // This is valid, so we need to look for actual syntax errors
    
    // Fix 6: Fix JSX attribute issues with try-catch
    // Replace incorrect property assignments
    content = content.replace(/(\w+):\s*try\s*{/g, '$1: (() => { try {');
    content = content.replace(/}\s*catch\s*\(([^)]+)\)\s*{([^}]+)}\s*,/g, '} catch ($1) {$2} })(),');
    
    // Fix 7: Fix async function issues in object properties
    const asyncPropPattern = /(\w+):\s*async\s*\(\)\s*=>\s*{[\s\S]*?}\s*catch/g;
    if (asyncPropPattern.test(content)) {
      // This needs more careful handling - skip for now
    }
    
    // Fix 8: Fix window type assertions
    content = content.replace(/\(window as any\)\./g, '(window as unknown).');
    content = content.replace(/\(globalThis as any\)\./g, '(globalThis as unknown).');
    
    // Fix 9: Fix specific error variable names that might be missing
    // If we see patterns like logger.error('message', error) but error is not defined
    const loggerErrorPattern = /logger\.(error|warn)\([^,]+,\s*error\)/g;
    let match;
    while ((match = loggerErrorPattern.exec(content)) !== null) {
      // Check if this is inside a catch block without error parameter
      const beforeMatch = content.substring(0, match.index);
      const lastCatch = beforeMatch.lastIndexOf('catch');
      if (lastCatch > -1) {
        const catchToMatch = beforeMatch.substring(lastCatch, match.index);
        if (catchToMatch.includes('catch ()') || catchToMatch.includes('catch {')) {
          // This error reference needs the catch to have an error parameter
          // Already fixed above
        }
      }
    }

    modified = content !== originalContent;

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed parsing errors in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing parsing errors in TypeScript/React files...\n');
  
  let totalFixed = 0;
  let totalChecked = 0;
  
  filesWithParsingErrors.forEach(file => {
    totalChecked++;
    const fullPath = path.join(process.cwd(), file);
    if (fixParsingErrors(fullPath)) {
      totalFixed++;
    }
  });
  
  console.log(`\n📊 Results:`);
  console.log(`   Checked: ${totalChecked} files`);
  console.log(`   Fixed: ${totalFixed} files`);
  
  // Also check for any other files with similar patterns
  console.log('\n🔍 Scanning for additional files with parsing errors...');
  
  const additionalPatterns = [
    'src/**/*.ts',
    'src/**/*.tsx',
  ];
  
  let additionalFixed = 0;
  
  additionalPatterns.forEach(pattern => {
    const files = glob.sync(pattern);
    files.forEach(file => {
      if (!filesWithParsingErrors.includes(file.replace(/\\/g, '/'))) {
        if (fixParsingErrors(file)) {
          additionalFixed++;
          console.log(`✅ Additionally fixed: ${file}`);
        }
      }
    });
  });
  
  if (additionalFixed > 0) {
    console.log(`\n✨ Fixed ${additionalFixed} additional files`);
  }
  
  console.log('\n✅ Parsing error fixes complete!');
  console.log('Run "npm run lint" to check remaining issues.');
}

// Run the script
main();