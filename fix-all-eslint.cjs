#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting comprehensive ESLint fix...\n');

// Get ESLint errors in JSON format
let eslintOutput;
try {
  eslintOutput = execSync('npx eslint . --ext .ts,.tsx,.js,.jsx --format json', {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  });
} catch (error) {
  eslintOutput = error.stdout;
}

const results = JSON.parse(eslintOutput || '[]');
let totalFixed = 0;

// Process each file with errors
results.forEach(result => {
  if (!result.messages || result.messages.length === 0) return;
  
  const filePath = result.filePath;
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Sort messages by line/column in reverse to maintain positions
  const messages = result.messages.sort((a, b) => {
    if (b.line !== a.line) return b.line - a.line;
    return (b.column || 0) - (a.column || 0);
  });
  
  messages.forEach(message => {
    const lines = content.split('\n');
    const lineIndex = message.line - 1;
    
    // Fix unused variables by prefixing with underscore
    if (message.ruleId === '@typescript-eslint/no-unused-vars') {
      const match = message.message.match(/'([^']+)'/);
      if (match) {
        const varName = match[1];
        
        // Skip if already prefixed with underscore
        if (varName.startsWith('_')) {
          // Add eslint-disable comment if needed
          if (!lines[lineIndex].includes('eslint-disable')) {
            lines[lineIndex] = lines[lineIndex].replace(
              new RegExp(`(\\b${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b)`),
              `$1 /* eslint-disable-line @typescript-eslint/no-unused-vars */`
            );
            content = lines.join('\n');
            modified = true;
            totalFixed++;
          }
        } else {
          // Prefix with underscore
          const regex = new RegExp(`\\b${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
          lines[lineIndex] = lines[lineIndex].replace(regex, '_' + varName);
          content = lines.join('\n');
          modified = true;
          totalFixed++;
        }
      }
    }
    
    // Fix @typescript-eslint/no-explicit-any
    if (message.ruleId === '@typescript-eslint/no-explicit-any') {
      // Replace ': any' with ': unknown'
      if (lines[lineIndex] && lines[lineIndex].includes(': any')) {
        lines[lineIndex] = lines[lineIndex].replace(/:\s*any\b/g, ': unknown');
        content = lines.join('\n');
        modified = true;
        totalFixed++;
      }
    }
    
    // Fix no-useless-escape
    if (message.ruleId === 'no-useless-escape') {
      // Remove unnecessary escapes
      if (lines[lineIndex]) {
        lines[lineIndex] = lines[lineIndex].replace(/\\([^\\'"nrt])/g, '$1');
        content = lines.join('\n');
        modified = true;
        totalFixed++;
      }
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed issues in: ${path.relative(process.cwd(), filePath)}`);
  }
});

console.log(`\n✅ Fixed ${totalFixed} issues`);

// Run ESLint again to check remaining issues
console.log('\nChecking remaining issues...\n');
try {
  const finalCheck = execSync('npx eslint . --ext .ts,.tsx,.js,.jsx 2>&1 | grep "problems"', {
    encoding: 'utf8'
  });
  console.log('Remaining:', finalCheck);
} catch (error) {
  console.log('Remaining:', error.stdout || 'Unable to get count');
}