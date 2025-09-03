#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix authService.ts
const authServicePath = path.join(__dirname, 'src/services/auth/authService.ts');
if (fs.existsSync(authServicePath)) {
  let content = fs.readFileSync(authServicePath, 'utf8');
  
  // Fix line 207 - remove extra })()
  content = content.replace(
    /details: { error: error instanceof Error \? error\.message : String\(error\), email: [^}]+} }\)\(\),/g,
    'details: { error: error instanceof Error ? error.message : String(error), email: credentials.email },'
  );
  
  // Fix line 143 - similar issue
  content = content.replace(
    /details: { error: error instanceof Error \? error\.message : String\(error\), email: data\.email } }\)\(\),/g,
    'details: { error: error instanceof Error ? error.message : String(error), email: data.email },'
  );
  
  // Fix catch blocks without error parameter
  content = content.replace(/} catch \{/g, '} catch (error) {');
  
  fs.writeFileSync(authServicePath, content);
  console.log('Fixed authService.ts');
}

// Fix mfaService.ts
const mfaServicePath = path.join(__dirname, 'src/services/auth/mfaService.ts');
if (fs.existsSync(mfaServicePath)) {
  let content = fs.readFileSync(mfaServicePath, 'utf8');
  
  // Fix line with extra })()
  content = content.replace(
    /details: { error: error instanceof Error \? error\.message : String\(error\), action: [^}]+} }\)\(\),/g,
    'details: { error: error instanceof Error ? error.message : String(error), action: \'mfa_setup_failed\' },'
  );
  
  // Fix catch blocks
  content = content.replace(/} catch \{/g, '} catch (error) {');
  
  fs.writeFileSync(mfaServicePath, content);
  console.log('Fixed mfaService.ts');
}

// Fix SafetyPlanGenerator.tsx - duplicate declaration
const safetyPlanPath = path.join(__dirname, 'src/components/crisis/SafetyPlanGenerator.tsx');
if (fs.existsSync(safetyPlanPath)) {
  let content = fs.readFileSync(safetyPlanPath, 'utf8');
  
  // Remove duplicate SafetyPlanSection declaration
  const lines = content.split('\n');
  let foundFirst = false;
  const newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('function SafetyPlanSection')) {
      if (!foundFirst) {
        foundFirst = true;
        newLines.push(lines[i]);
      } else {
        // Skip duplicate declaration
        while (i < lines.length && !lines[i].includes('function ') && i < lines.length - 1) {
          i++;
        }
        i--; // Back up one to process the next function properly
      }
    } else {
      newLines.push(lines[i]);
    }
  }
  
  fs.writeFileSync(safetyPlanPath, newLines.join('\n'));
  console.log('Fixed SafetyPlanGenerator.tsx');
}

// Fix no-case-declarations
const files = [
  'src/components/dashboard/widgets/DailyActivityPlanner.tsx',
  'src/hooks/usePerformanceMonitor.ts'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Wrap case blocks with curly braces
    content = content.replace(/case\s+['"][^'"]+['"]:\s*\n\s*(const|let|var)/g, (match, decl) => {
      return match.replace(decl, '{ ' + decl);
    });
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${file}`);
  }
});

// Fix React display name issues
const displayNameFiles = [
  'src/components/dashboard/widgets/ActivityAnalytics.tsx',
  'src/components/ErrorBoundary.tsx',
  'src/components/performance/VirtualizedList.tsx'
];

displayNameFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add display names to memo components
    const regex = /export const (\w+) = (?:React\.)?memo\(/g;
    content = content.replace(regex, (match, componentName) => {
      return match + '\n' + componentName + '.displayName = \'' + componentName + '\';\n';
    });
    
    fs.writeFileSync(filePath, content);
    console.log(`Added display names to ${file}`);
  }
});

console.log('\nAll fixes applied!');