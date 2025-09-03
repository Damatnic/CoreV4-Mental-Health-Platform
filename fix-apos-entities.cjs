const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('Starting to fix &apos; entities in string literals...');

// Get all source files
const patterns = [
  'src/**/*.ts',
  'src/**/*.tsx',
  'src/**/*.js', 
  'src/**/*.jsx',
  'backend/**/*.ts',
  'backend/**/*.js',
  'e2e/**/*.ts',
  '*.ts',
  '*.tsx',
  '*.js'
];

let totalFiles = 0;
let fixedFiles = 0;
let totalFixes = 0;

patterns.forEach(pattern => {
  const files = glob.sync(pattern, { ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'] });
  
  files.forEach(filePath => {
    totalFiles++;
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      // Simple replacement: Replace all &apos; with '
      // This is safe because &apos; should never appear in JavaScript/TypeScript code
      // except as an incorrectly escaped apostrophe
      const occurrences = (content.match(/&apos;/g) || []).length;
      
      if (occurrences > 0) {
        content = content.replace(/&apos;/g, "'");
        totalFixes += occurrences;
        
        fs.writeFileSync(filePath, content, 'utf8');
        fixedFiles++;
        console.log(`Fixed ${occurrences} occurrences in: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  });
});

console.log('\n=== Summary ===');
console.log(`Total files checked: ${totalFiles}`);
console.log(`Files fixed: ${fixedFiles}`);
console.log(`Total &apos; entities replaced: ${totalFixes}`);
console.log('\nFix complete!');